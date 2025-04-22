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
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('[useAuth] Erro ao verificar autenticação:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [setIsAuthenticated, setIsLoading]);

  // Verificar autenticação ao inicializar o hook
  useEffect(() => {
    checkAuth();
    
    // Configurar listener para mudanças de autenticação
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[useAuth] Evento de autenticação:', event);
      if (event === 'SIGNED_IN' && session) {
        localStorage.setItem("token", session.access_token);
        setIsAuthenticated(true);
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        localStorage.setItem("token", session.access_token);
        setIsAuthenticated(true);
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
      setIsLoading(true);
      await supabase.auth.signOut();
      localStorage.removeItem("token");
      setIsAuthenticated(false);
    } catch (error) {
      console.error('[useAuth] Erro ao fazer logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para realizar login
  const login = useCallback((token: string) => {
    localStorage.setItem("token", token);
    setIsAuthenticated(true);
  }, [setIsAuthenticated]);

  return { 
    isAuthenticated, 
    isLoading,
    login,
    logout
  };
};

export default useAuth; 