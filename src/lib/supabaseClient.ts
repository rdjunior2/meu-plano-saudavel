import { createClient } from '@supabase/supabase-js'
import type { Database } from '../integrations/supabase/types'

// Carregando as variáveis de ambiente com valores padrão
// Usando a ANON_KEY válida mais recente configurada no Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ykepyxcjsnvesbkuxgmv.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZXB5eGNqc252ZXNia3V4Z212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NTAxNDQsImV4cCI6MjA2MDMyNjE0NH0.zAHo1XNQBmvyxhmlxD3BjNRiCrQt8cIzoYI6F5iLbLc'

// Nome consistente para o armazenamento da sessão no localStorage
const AUTH_STORAGE_KEY = 'meu-plano-saude-auth-storage';

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

// Função auxiliar para sincronizar tokens entre localStorage e componentes
export const syncAuthToken = () => {
  try {
    // Verifica se há uma sessão no localStorage do Supabase
    const supabaseSession = localStorage.getItem(AUTH_STORAGE_KEY);
    if (supabaseSession) {
      try {
        const session = JSON.parse(supabaseSession);
        // Se tiver uma sessão ativa, garante que o token também esteja disponível
        if (session?.session?.access_token) {
          localStorage.setItem('token', session.session.access_token);
        }
      } catch (e) {
        console.error('[Supabase] Erro ao analisar sessão:', e);
      }
    }
  } catch (error) {
    console.error('[Supabase] Erro ao sincronizar tokens:', error);
  }
};

// Listener para alterações na sessão
export const setupAuthListener = () => {
  window.addEventListener('storage', (event) => {
    if (event.key === AUTH_STORAGE_KEY) {
      syncAuthToken();
    }
  });
};

// Implementando um Singleton para o cliente Supabase
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

export const supabase = (() => {
  if (!supabaseInstance) {
    try {
      // Criar o cliente Supabase
      supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          storage: localStorage,
          storageKey: AUTH_STORAGE_KEY
        }
      });
      
      // Configurar event listener para mudanças na autenticação
      supabaseInstance.auth.onAuthStateChange((event, session) => {
        if (session) {
          localStorage.setItem('token', session.access_token);
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('token');
        }
      });
      
      // Inicializa a sincronização de tokens
      syncAuthToken();
      setupAuthListener();
    } catch (error) {
      console.error('[Supabase] Erro ao inicializar cliente:', error);
    }
  }
  return supabaseInstance;
})();

export default supabase; 