import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode, useEffect, useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useAuthStore } from '../stores/authStore';
import { logEvent, LogSeverity } from '../services/logs';
import { supabase } from '@/lib/supabaseClient';

/**
 * Interface para as propriedades do componente PrivateRoute
 */
interface PrivateRouteProps {
  children: ReactNode;
  redirectPath?: string;
  loadingComponent?: ReactNode;
}

/**
 * Componente para proteger rotas que exigem autenticação
 */
const PrivateRoute = ({ 
  children, 
  redirectPath = "/login",
  loadingComponent = <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  </div>
}: PrivateRouteProps) => {
  const { isAuthenticated: authContextAuthenticated, isLoading: authContextLoading } = useAuthContext();
  const authStoreAuthenticated = useAuthStore(state => state.isAuthenticated);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isTokenVerified, setIsTokenVerified] = useState(false);
  const location = useLocation();

  // Verificação adicional do token e sessão
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // Verificar token no localStorage
        const token = localStorage.getItem("token");
        
        if (token) {
          // Verificar se o token é válido consultando a sessão
          const { data } = await supabase.auth.getSession();
          
          if (data.session) {
            logEvent('auth_check', 'Verificação de autenticação bem-sucedida', LogSeverity.INFO, { 
              path: location.pathname,
              hasValidSession: true
            });
            setIsTokenVerified(true);
          } else {
            logEvent('auth_warning', 'Token encontrado, mas sessão inválida', LogSeverity.WARNING, { 
              path: location.pathname
            });
            setIsTokenVerified(false);
          }
        } else {
          // Sem token no localStorage
          logEvent('auth_check', 'Token não encontrado', LogSeverity.INFO, { 
            path: location.pathname
          });
          setIsTokenVerified(false);
        }
      } catch (error) {
        console.error('[PrivateRoute] Erro ao verificar token:', error);
        logEvent('auth_error', 'Erro ao verificar autenticação', LogSeverity.ERROR, { 
          path: location.pathname,
          error
        });
        setIsTokenVerified(false);
      } finally {
        setIsVerifying(false);
      }
    };
    
    verifyAuth();
  }, [location.pathname]);

  // Combinando os resultados das três fontes de autenticação
  const isAuthenticated = authContextAuthenticated || authStoreAuthenticated || isTokenVerified;
  const isLoading = authContextLoading || isVerifying;

  // Verificação de parâmetros sensíveis na URL (prevenção contra XSS)
  useEffect(() => {
    // Prevenção contra ataques XSS: sanitiza parâmetros da URL
    const params = new URLSearchParams(location.search);
    
    // Lista de parâmetros sensíveis que não devem estar na URL
    const sensitiveParams = ['token', 'key', 'password', 'senha'];
    
    let hasSensitiveParams = false;
    sensitiveParams.forEach(param => {
      if (params.has(param)) {
        hasSensitiveParams = true;
        console.error(`Parâmetro sensível detectado na URL: ${param}`);
        
        // Registrar tentativa suspeita
        logEvent(
          'security_warning',
          `Parâmetro sensível detectado na URL: ${param}`,
          LogSeverity.WARNING,
          { path: location.pathname }
        );
      }
    });
    
    // Se encontrou parâmetros sensíveis, limpa-os da URL
    if (hasSensitiveParams) {
      window.history.replaceState(
        {}, 
        document.title, 
        location.pathname
      );
    }
  }, [location]);

  // Exibe um indicador de carregamento enquanto verifica a autenticação
  if (isLoading) {
    return <>{loadingComponent}</>;
  }

  // Log de diagnóstico
  console.log('[PrivateRoute] Estado de autenticação:', { 
    authContextAuthenticated, 
    authStoreAuthenticated,
    isTokenVerified,
    isAuthenticated,
    path: location.pathname
  });

  // Redireciona para a página de login se não estiver autenticado
  if (!isAuthenticated) {
    logEvent('auth_redirect', 'Redirecionando para página de login', LogSeverity.INFO, { 
      from: location.pathname
    });
    return <Navigate to={redirectPath} replace state={{ from: location }} />;
  }
  
  return <>{children}</>;
};

export default PrivateRoute; 