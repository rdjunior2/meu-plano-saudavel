import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

/**
 * Hook personalizado para verificar autenticação
 */
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar autenticação
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      setIsAuthenticated(!!token);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  return { isAuthenticated, isLoading };
};

/**
 * Componente para proteger rotas que exigem autenticação
 */
const PrivateRoute = ({ children, redirectPath = "/login" }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Exibe um indicador de carregamento enquanto verifica a autenticação
  if (isLoading) {
    return <div>Carregando...</div>;
  }

  // Redireciona para a página de login se não estiver autenticado
  return isAuthenticated ? children : <Navigate to={redirectPath} />;
};

export default PrivateRoute; 