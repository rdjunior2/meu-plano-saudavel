import { useState, useEffect } from 'react';

/**
 * Hook personalizado para verificar autenticação
 * @returns Objeto contendo o estado de autenticação e carregamento
 */
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Verificar autenticação
    const checkAuth = () => {
      // Primeiro definimos como não autenticado por padrão
      setIsAuthenticated(false);
      
      // Depois verificamos se existe um token
      const token = localStorage.getItem("token");
      
      // Só define como autenticado se o token existir
      if (token) {
        setIsAuthenticated(true);
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Função para realizar logout
  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  // Função para realizar login
  const login = (token: string) => {
    localStorage.setItem("token", token);
    setIsAuthenticated(true);
  };

  return { 
    isAuthenticated, 
    isLoading,
    login,
    logout
  };
};

export default useAuth; 