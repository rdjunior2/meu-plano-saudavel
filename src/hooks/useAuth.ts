import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Hook personalizado para verificar autenticação
 * @returns Objeto contendo o estado de autenticação e carregamento
 */
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Função para verificar autenticação de forma consistente
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Primeiro definimos como não autenticado por padrão
      setIsAuthenticated(false);
      
      // Verificar token no localStorage (método rápido)
      const token = localStorage.getItem("token");
      
      // Verificar sessão no Supabase (método mais confiável, mas async)
      const { data } = await supabase.auth.getSession();
      const hasValidSession = !!data.session;
      
      // Usuário está autenticado se tiver token OU sessão válida
      if (token || hasValidSession) {
        setIsAuthenticated(true);
        
        // Se tiver sessão mas não token, sincronizar
        if (hasValidSession && !token) {
          localStorage.setItem("token", data.session.access_token);
        }
      }
    } catch (error) {
      console.error('[useAuth] Erro ao verificar autenticação:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Verificar autenticação ao inicializar o hook
  useEffect(() => {
    checkAuth();
    
    // Configurar listener para mudanças de autenticação
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
      }
    });
    
    // Cleanup do listener
    return () => {
      data.subscription.unsubscribe();
    };
  }, [checkAuth]);

  // Função para realizar logout
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("token");
      setIsAuthenticated(false);
    } catch (error) {
      console.error('[useAuth] Erro ao fazer logout:', error);
    }
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