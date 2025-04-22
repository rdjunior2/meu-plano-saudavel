/**
 * Utilitário para depuração de problemas de autenticação
 */
import { supabase } from '@/lib/supabaseClient';
import { logEvent, LogSeverity } from '@/services/logs';

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
        userId: data.session.user.id
      };
    }
    
    // 4. Verificar user no Supabase
    const { data: userData, error: userError } = await supabase.auth.getUser();
    diagnostics.hasValidUser = !!userData.user;
    diagnostics.userError = userError ? userError.message : null;
    
    // 5. Registrar diagnóstico
    logEvent(
      'auth_diagnostics',
      'Diagnóstico de autenticação',
      LogSeverity.INFO,
      diagnostics
    );
    
    // 6. Exibir no console
    console.table(diagnostics);
    if (diagnostics.sessionDetails) {
      console.table(diagnostics.sessionDetails);
    }
    
    return diagnostics;
  } catch (error) {
    console.error('Erro durante diagnóstico de autenticação:', error);
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
    
    // Se não tem token local mas tem sessão, sincronizar
    if (!diagnostics.hasLocalToken && diagnostics.hasValidSession && diagnostics.sessionDetails) {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        localStorage.setItem('token', data.session.access_token);
        console.log('🔄 Token sincronizado do servidor para localStorage');
        logEvent('auth_fix', 'Token sincronizado', LogSeverity.INFO);
        return { success: true, action: 'token_sync' };
      }
    }
    
    // Se tem token local mas não tem sessão, limpar o token
    if (diagnostics.hasLocalToken && !diagnostics.hasValidSession) {
      localStorage.removeItem('token');
      console.log('🧹 Token local inválido removido');
      logEvent('auth_fix', 'Token inválido removido', LogSeverity.WARNING);
      return { success: true, action: 'token_removed' };
    }
    
    // Se a sessão vai expirar em menos de 10 minutos, renovar
    if (diagnostics.sessionDetails && diagnostics.sessionDetails.minutesUntilExpiry < 10) {
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
    
    // Se está tudo ok
    if (diagnostics.hasLocalToken && diagnostics.hasValidSession && !diagnostics.sessionDetails?.isExpired) {
      console.log('✅ Estado de autenticação está correto');
      return { success: true, action: 'none_needed' };
    }
    
    return { success: false, action: 'no_fix_available' };
  } catch (error) {
    console.error('Erro ao tentar corrigir problemas de autenticação:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}; 