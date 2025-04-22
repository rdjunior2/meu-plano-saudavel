import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Recuperar as variáveis de ambiente com valores padrão seguros
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ykepyxcjsnvesbkuxgmv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZXB5eGNqc252ZXNia3V4Z212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NTAxNDQsImV4cCI6MjA2MDMyNjE0NH0.zAHo1XNQBmvyxhmlxD3BjNRiCrQt8cIzoYI6F5iLbLc';

// Nome consistente para o armazenamento da sessão no localStorage
const AUTH_STORAGE_KEY = 'meu-plano-saude-auth-storage';

// Criar o cliente do Supabase
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: localStorage,
    storageKey: AUTH_STORAGE_KEY
  }
});

// Verifica a validade do JWT durante desenvolvimento
if (import.meta.env.DEV) {
  const jwtParts = supabaseAnonKey.split('.');
  if (jwtParts.length === 3) {
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
} 