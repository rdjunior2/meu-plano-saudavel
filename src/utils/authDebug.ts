/**
 * Utilitário para depuração de problemas de autenticação
 */
import { supabase } from '@/lib/supabaseClient';
import { logEvent, LogSeverity } from '@/services/logs';
import { useAuthStore } from '@/stores/authStore';

/**
 * Analisa o estado de autenticação atual e retorna um diagnóstico
 */
export const debugAuthState = async () => {
  const diagnostics: Record<string, any> = {};
  
  try {
    // 1. Verificar token no localStorage
    const localToken = localStorage.getItem('token');
    diagnostics.hasLocalToken = !!localToken;
    
    // 2. Verificar cookies
    const accessTokenCookie = document.cookie.includes('access_token');
    const refreshTokenCookie = document.cookie.includes('refresh_token');
    diagnostics.hasAccessTokenCookie = accessTokenCookie;
    diagnostics.hasRefreshTokenCookie = refreshTokenCookie;
    
    // 3. Verificar sessão no Supabase
    const { data, error } = await supabase.auth.getSession();
    diagnostics.hasValidSession = !!data.session;
    diagnostics.sessionError = error ? error.message : null;
    
    if (data.session) {
      const now = new Date();
      const expiresAt = new Date(data.session.expires_at * 1000);
      const minutesUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (60 * 1000));
      
      diagnostics.sessionDetails = {
        expiresAt: expiresAt.toISOString(),
        minutesUntilExpiry,
        isExpired: expiresAt < now,
        userId: data.session.user.id,
        email: data.session.user.email,
        role: data.session.user.role
      };
    }
    
    // 4. Verificar user no Supabase
    const { data: userData, error: userError } = await supabase.auth.getUser();
    diagnostics.hasValidUser = !!userData.user;
    diagnostics.userError = userError ? userError.message : null;
    
    if (userData.user) {
      diagnostics.userDetails = {
        id: userData.user.id,
        email: userData.user.email,
        lastSignIn: userData.user.last_sign_in_at,
        createdAt: userData.user.created_at
      };
    }
    
    // 5. Verificar estado do AuthStore
    const authStore = useAuthStore.getState();
    diagnostics.authStoreState = {
      isAuthenticated: authStore.isAuthenticated,
      hasUser: !!authStore.user,
      userId: authStore.user?.id,
      userEmail: authStore.user?.email
    };
    
    // 6. Verificar coerência entre os diferentes estados
    diagnostics.stateConsistency = {
      tokenMatchesSession: diagnostics.hasLocalToken === diagnostics.hasValidSession,
      userMatchesSession: diagnostics.hasValidUser === diagnostics.hasValidSession,
      storeMatchesSession: diagnostics.authStoreState.isAuthenticated === diagnostics.hasValidSession,
      userIdMatches: diagnostics.hasValidSession && diagnostics.authStoreState.hasUser ? 
        diagnostics.sessionDetails?.userId === diagnostics.authStoreState.userId : 
        'N/A'
    };
    
    // 7. Registrar diagnóstico
    logEvent(
      'auth_diagnostics',
      'Diagnóstico completo de autenticação',
      LogSeverity.INFO,
      diagnostics
    );
    
    // 8. Exibir no console
    console.group('📊 Diagnóstico de Autenticação');
    console.log('Estado do token e sessão:', {
      hasLocalToken: diagnostics.hasLocalToken,
      hasValidSession: diagnostics.hasValidSession,
      hasValidUser: diagnostics.hasValidUser,
      storeIsAuthenticated: diagnostics.authStoreState.isAuthenticated
    });
    
    console.log('Consistência de estado:', diagnostics.stateConsistency);
    
    if (diagnostics.sessionDetails) {
      console.log('Detalhes da sessão:', diagnostics.sessionDetails);
    }
    
    if (diagnostics.userDetails) {
      console.log('Detalhes do usuário:', diagnostics.userDetails);
    }
    
    console.log('Estado detalhado do AuthStore:', diagnostics.authStoreState);
    console.groupEnd();
    
    return diagnostics;
  } catch (error) {
    console.error('Erro durante diagnóstico de autenticação:', error);
    logEvent(
      'auth_diagnostics_error',
      'Erro durante diagnóstico de autenticação',
      LogSeverity.ERROR,
      { error: error instanceof Error ? error.message : 'Erro desconhecido' }
    );
    return {
      error: true,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      diagnostics
    };
  }
};

/**
 * Corrige problemas comuns de autenticação
 */
export const fixAuthIssues = async () => {
  try {
    const diagnostics = await debugAuthState();
    const authStore = useAuthStore.getState();
    
    // Se não tem token local mas tem sessão, sincronizar
    if (!diagnostics.hasLocalToken && diagnostics.hasValidSession && diagnostics.sessionDetails) {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        localStorage.setItem('token', data.session.access_token);
        console.log('🔄 Token sincronizado do servidor para localStorage');
        logEvent('auth_fix', 'Token sincronizado', LogSeverity.INFO);
        
        // Atualizar estado do store também
        if (!diagnostics.authStoreState.isAuthenticated) {
          authStore.setIsAuthenticated(true);
        }
        
        return { success: true, action: 'token_sync' };
      }
    }
    
    // Se tem token local mas não tem sessão, limpar o token e o store
    if (diagnostics.hasLocalToken && !diagnostics.hasValidSession) {
      localStorage.removeItem('token');
      console.log('🧹 Token local inválido removido');
      logEvent('auth_fix', 'Token inválido removido', LogSeverity.WARNING);
      
      // Garantir que o store também reflita o estado deslogado
      if (diagnostics.authStoreState.isAuthenticated) {
        authStore.setIsAuthenticated(false);
      }
      
      return { success: true, action: 'token_removed' };
    }
    
    // Se a sessão vai expirar em menos de 10 minutos, renovar
    if (diagnostics.sessionDetails && diagnostics.sessionDetails.minutesUntilExpiry < 10 && diagnostics.sessionDetails.minutesUntilExpiry > 0) {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Erro ao renovar sessão:', error);
        return { success: false, error: error.message };
      }
      
      if (data.session) {
        localStorage.setItem('token', data.session.access_token);
        console.log('🔄 Sessão renovada com sucesso');
        logEvent('auth_fix', 'Sessão renovada', LogSeverity.INFO);
        return { success: true, action: 'session_renewed' };
      }
    }
    
    // Se a sessão já expirou, fazer logout
    if (diagnostics.sessionDetails?.isExpired) {
      await supabase.auth.signOut();
      localStorage.removeItem('token');
      authStore.setIsAuthenticated(false);
      console.log('⏱️ Sessão expirada, usuário desconectado');
      logEvent('auth_fix', 'Sessão expirada, logout forçado', LogSeverity.WARNING);
      return { success: true, action: 'expired_session_logout' };
    }
    
    // Se o store diz que está autenticado mas não tem sessão válida
    if (diagnostics.authStoreState.isAuthenticated && !diagnostics.hasValidSession) {
      authStore.setIsAuthenticated(false);
      console.log('🔄 Estado do store corrigido (false)');
      logEvent('auth_fix', 'Store incorreto corrigido', LogSeverity.WARNING);
      return { success: true, action: 'store_fixed' };
    }
    
    // Se o store diz que não está autenticado mas tem sessão válida
    if (!diagnostics.authStoreState.isAuthenticated && diagnostics.hasValidSession) {
      authStore.setIsAuthenticated(true);
      console.log('🔄 Estado do store corrigido (true)');
      logEvent('auth_fix', 'Store incorreto corrigido', LogSeverity.WARNING);
      return { success: true, action: 'store_fixed' };
    }
    
    // Se está tudo ok
    if (diagnostics.stateConsistency.tokenMatchesSession && 
        diagnostics.stateConsistency.storeMatchesSession && 
        !diagnostics.sessionDetails?.isExpired) {
      console.log('✅ Estado de autenticação está correto');
      return { success: true, action: 'none_needed' };
    }
    
    return { success: false, action: 'no_fix_available' };
  } catch (error) {
    console.error('Erro ao tentar corrigir problemas de autenticação:', error);
    logEvent(
      'auth_fix_error',
      'Erro ao tentar corrigir problemas de autenticação',
      LogSeverity.ERROR,
      { error: error instanceof Error ? error.message : 'Erro desconhecido' }
    );
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}; 