import { createClient } from '@supabase/supabase-js'
import type { Database } from '../integrations/supabase/types'

// Carregando as variáveis de ambiente com valores padrão
// Usando a ANON_KEY válida mais recente configurada no Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ykepyxcjsnvesbkuxgmv.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZXB5eGNqc252ZXNia3V4Z212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxNDI0NjMsImV4cCI6MjA1OTcxODQ2M30.jYLSz1tgS5kuZETCoI0tChc-tvBo30vh0tGKqcjBxBQ'

// Verifica a validade do JWT durante desenvolvimento
if (import.meta.env.DEV) {
  const jwtParts = supabaseAnonKey.split('.');
  if (jwtParts.length !== 3) {
    console.warn('[Supabase] A chave anônima não parece ser um JWT válido (formato incorreto)');
  }
  
  try {
    const payload = JSON.parse(atob(jwtParts[1]));
    const expDate = new Date(payload.exp * 1000);
    const now = new Date();
    
    if (expDate < now) {
      console.error('[Supabase] A chave anônima EXPIROU em', expDate.toLocaleString());
    } else {
      console.info('[Supabase] Chave anônima válida até', expDate.toLocaleString());
    }
  } catch (e) {
    console.warn('[Supabase] Não foi possível verificar a validade da chave anônima:', e);
  }
}

// Implementando um Singleton para o cliente Supabase
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

export const supabase = (() => {
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          storage: localStorage,
          storageKey: 'meu-plano-saude-auth-storage'
        }
      });
    } catch (error) {
      console.error('[Supabase] Erro ao inicializar cliente:', error);
    }
  }
  return supabaseInstance;
})();

export default supabase; 