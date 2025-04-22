import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuthContext } from '../contexts/AuthContext';

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
  loadingComponent = <div>Carregando...</div>
}: PrivateRouteProps) => {
  const { isAuthenticated, isLoading } = useAuthContext();

  // Exibe um indicador de carregamento enquanto verifica a autenticação
  if (isLoading) {
    return <>{loadingComponent}</>;
  }

  // Redireciona para a página de login se não estiver autenticado
  return isAuthenticated ? <>{children}</> : <Navigate to={redirectPath} />;
};

export default PrivateRoute; 