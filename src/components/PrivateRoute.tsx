import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode, useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { logEvent, LogSeverity } from '../services/logs';
import { supabase } from '@/lib/supabaseClient';
import DashboardLayout from './DashboardLayout';
import LoadingSpinner from './LoadingSpinner';

/**
 * Interface para as propriedades do componente PrivateRoute
 */
interface PrivateRouteProps {
  children: ReactNode;
  redirectPath?: string;
  loadingComponent?: ReactNode;
  useLayout?: boolean;
  gradient?: boolean;
}

/**
 * Componente para proteger rotas que exigem autenticação
 */
const PrivateRoute = ({ 
  children, 
  redirectPath = "/login",
  loadingComponent = <LoadingSpinner />,
  useLayout = true,
  gradient = true
}: PrivateRouteProps) => {
  const { isAuthenticated: authStoreAuthenticated, isLoading: authStoreLoading, login } = useAuthStore();
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
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('[PrivateRoute] Erro ao verificar sessão:', error);
            logEvent('auth_error', 'Erro ao verificar sessão', LogSeverity.ERROR, { 
              path: location.pathname,
              error: error.message
            });
            setIsTokenVerified(false);
            setIsVerifying(false);
            return;
          }
          
          if (data.session) {
            logEvent('auth_check', 'Verificação de autenticação bem-sucedida', LogSeverity.INFO, { 
              path: location.pathname,
              hasValidSession: true
            });
            
            // Buscar perfil do usuário e armazenar no authStore para garantir sincronia
            try {
              // Usamos getUserProfile da API comum para buscar dados completos
              const response = await fetch(`/api/users/${data.session.user.id}/profile`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (response.ok) {
                try {
                  const userProfile = await response.json();
                  if (userProfile) {
                    // Atualizar authStore com o perfil atualizado
                    login(userProfile, token);
                  }
                } catch (jsonError) {
                  console.error('[PrivateRoute] Erro ao analisar JSON do perfil:', jsonError);
                  // Não bloqueia o fluxo, apenas registra o erro
                }
              }
            } catch (e) {
              console.error('[PrivateRoute] Erro ao buscar perfil:', e);
            }
            
            setIsTokenVerified(true);
          } else {
            logEvent('auth_warning', 'Token encontrado, mas sessão inválida', LogSeverity.WARNING, { 
              path: location.pathname
            });
            // Sessão inválida, remover token
            localStorage.removeItem("token");
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
  }, [location.pathname, login]);

  // Combinando os resultados para determinar a autenticação
  const isAuthenticated = authStoreAuthenticated || isTokenVerified;
  const isLoading = authStoreLoading || isVerifying;

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
  
  // Se estiver autenticado, renderiza o conteúdo protegido usando o layout
  if (useLayout) {
    return (
      <DashboardLayout gradient={gradient}>
        <div className="p-6 md:p-8">
          {children}
        </div>
      </DashboardLayout>
    );
  }
  
  // Caso não queira usar o layout
  return <>{children}</>;
};

export default PrivateRoute; 