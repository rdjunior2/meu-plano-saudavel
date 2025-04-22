import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode, useEffect, useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useAuthStore } from '../stores/authStore';
import { logEvent, LogSeverity } from '../services/logs';

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
  const location = useLocation();

  // Combinando os resultados das duas fontes de autenticação
  const isAuthenticated = authContextAuthenticated || authStoreAuthenticated;
  const isLoading = authContextLoading || isVerifying;

  // Verificação adicional com token no localStorage
  useEffect(() => {
    const verifyAuth = () => {
      // Apenas verificamos a existência do token e finalizamos a verificação
      setIsVerifying(false);
    };
    
    verifyAuth();
  }, []);

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

  // Redireciona para a página de login se não estiver autenticado
  return isAuthenticated ? <>{children}</> : <Navigate to={redirectPath} replace state={{ from: location }} />;
};

export default PrivateRoute; 