import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { logEvent, LogSeverity } from '../services/logs';
import { useAuthStore } from '@/stores/authStore';

/**
 * Hook personalizado para verificar autenticação
 * @returns Objeto contendo o estado de autenticação e carregamento
 */
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const setIsAuthenticatedStore = useAuthStore(state => state.setIsAuthenticated);
  const checkInProgress = useRef(false);

  // Função para verificar autenticação de forma consistente
  const checkAuth = useCallback(async () => {
    // Evita múltiplas verificações simultâneas
    if (checkInProgress.current) {
      return;
    }
    
    checkInProgress.current = true;
    
    try {
      setIsLoading(true);
      
      // Verificar token no localStorage (método rápido)
      const token = localStorage.getItem("token");
      const tokenExists = !!token;
      
      // Verificar sessão no Supabase (método mais confiável, mas async)
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[useAuth] Erro ao obter sessão:', error);
        logEvent('auth_error', 'Erro ao verificar sessão', LogSeverity.ERROR, { error: error.message });
        setIsAuthenticated(false);
        setIsAuthenticatedStore(false);
        checkInProgress.current = false;
        return;
      }
      
      const hasValidSession = !!data.session;
      
      // Log detalhado do estado de autenticação
      console.log('[useAuth] Verificação de autenticação:', { 
        tokenExists, 
        hasValidSession, 
        sessionExpires: data.session?.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : null
      });
      
      // Usuário está autenticado se tiver token OU sessão válida
      if (hasValidSession) {
        setIsAuthenticated(true);
        setIsAuthenticatedStore(true);
        
        // Se tiver sessão mas não token, sincronizar
        if (!tokenExists) {
          console.log('[useAuth] Sincronizando token do localStorage com a sessão');
          localStorage.setItem("token", data.session.access_token);
          logEvent('auth_sync', 'Token sincronizado com sessão', LogSeverity.INFO);
        }
        
        // Se o token expirar em menos de 1 hora, renovar
        if (data.session.expires_at) {
          const expiresAt = new Date(data.session.expires_at * 1000);
          const now = new Date();
          const oneHour = 60 * 60 * 1000;
          
          if (expiresAt.getTime() - now.getTime() < oneHour) {
            console.log('[useAuth] Token próximo da expiração, tentando renovar');
            try {
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
              
              if (refreshError) {
                console.error('[useAuth] Erro ao renovar sessão:', refreshError);
              } else if (refreshData.session) {
                console.log('[useAuth] Sessão renovada com sucesso');
                localStorage.setItem("token", refreshData.session.access_token);
              }
            } catch (refreshError) {
              console.error('[useAuth] Erro ao renovar token:', refreshError);
            }
          }
        }
      } else {
        // Não temos uma sessão válida
        setIsAuthenticated(false);
        setIsAuthenticatedStore(false);
        
        // Limpar token inválido se houver
        if (tokenExists) {
          console.warn('[useAuth] Token encontrado, mas sessão inválida. Removendo token.');
          localStorage.removeItem("token");
          logEvent('auth_cleanup', 'Token inválido removido', LogSeverity.WARNING);
        }
      }
    } catch (error) {
      console.error('[useAuth] Erro ao verificar autenticação:', error);
      logEvent('auth_error', 'Erro ao verificar autenticação', LogSeverity.ERROR, { error });
      setIsAuthenticated(false);
      setIsAuthenticatedStore(false);
    } finally {
      setIsLoading(false);
      checkInProgress.current = false;
    }
  }, [setIsAuthenticatedStore]);

  // Verificar autenticação ao inicializar o hook
  useEffect(() => {
    checkAuth();
    
    // Configurar listener para mudanças de autenticação
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[useAuth] Evento de autenticação:', event);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('[useAuth] Usuário autenticado, atualizando token');
        localStorage.setItem("token", session.access_token);
        setIsAuthenticated(true);
        setIsAuthenticatedStore(true);
        logEvent('auth_event', 'Usuário autenticado', LogSeverity.INFO, { event });
      } else if (event === 'SIGNED_OUT') {
        console.log('[useAuth] Usuário desconectado');
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        setIsAuthenticatedStore(false);
        logEvent('auth_event', 'Usuário desconectado', LogSeverity.INFO, { event });
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('[useAuth] Token atualizado');
        localStorage.setItem("token", session.access_token);
        setIsAuthenticated(true);
        setIsAuthenticatedStore(true);
        logEvent('auth_event', 'Token atualizado', LogSeverity.INFO, { event });
      } else if (event === 'USER_UPDATED' && session) {
        console.log('[useAuth] Usuário atualizado');
        localStorage.setItem("token", session.access_token);
        setIsAuthenticated(true);
        setIsAuthenticatedStore(true);
        logEvent('auth_event', 'Usuário atualizado', LogSeverity.INFO, { event });
      }
    });
    
    // Verificação periódica (a cada 5 minutos)
    const interval = setInterval(() => {
      console.log('[useAuth] Executando verificação periódica de autenticação');
      checkAuth();
    }, 5 * 60 * 1000);
    
    // Cleanup do listener e do intervalo
    return () => {
      data.subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [checkAuth, setIsAuthenticatedStore]);

  // Função para realizar logout
  const logout = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      localStorage.removeItem("token");
      setIsAuthenticated(false);
      setIsAuthenticatedStore(false);
      logEvent('auth_logout', 'Logout realizado', LogSeverity.INFO);
    } catch (error) {
      console.error('[useAuth] Erro ao fazer logout:', error);
      logEvent('auth_error', 'Erro ao fazer logout', LogSeverity.ERROR, { error });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para realizar login
  const login = useCallback((token: string) => {
    console.log('[useAuth] Login manual com token');
    localStorage.setItem("token", token);
    setIsAuthenticated(true);
    setIsAuthenticatedStore(true);
    logEvent('auth_login', 'Login manual realizado', LogSeverity.INFO);
  }, [setIsAuthenticatedStore]);

  return { 
    isAuthenticated, 
    isLoading,
    login,
    logout
  };
};

export default useAuth; 