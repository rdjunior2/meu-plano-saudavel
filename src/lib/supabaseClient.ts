import { createClient } from '@supabase/supabase-js'
import type { Database } from '../integrations/supabase/types'

// Carregando as variáveis de ambiente com valores padrão
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ykepyxcjsnvesbkuxgmv.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZXB5eGNqc252ZXNia3V4Z212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk2NzY5NzAsImV4cCI6MjAyNTI1Mjk3MH0.Yx_QXKHf_ED_WTVkw2pGPQE5UgJhHCQF_-dkTBxvEbY'

// Log de verificação do carregamento de variáveis de ambiente
console.log('[Supabase] Configuração:', { 
  supabaseUrl, 
  hasAnonKey: !!supabaseAnonKey,
  anonKeyLength: supabaseAnonKey ? supabaseAnonKey.length : 0
});

// Implementando um Singleton para o cliente Supabase
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

// Criação do cliente Supabase com tipagem
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
      
      // Log de inicialização para depuração
      console.log('[Supabase] Cliente inicializado com sucesso', { 
        url: supabaseUrl.substring(0, 20) + '...',
        usingLocalStorage: true
      });
    } catch (error) {
      console.error('[Supabase] Erro ao inicializar cliente:', error);
    }
  }
  return supabaseInstance;
})(); 