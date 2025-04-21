import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ykepyxcjsnvesbkuxgmv.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZXB5eGNqc252ZXNia3V4Z212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk2NzY5NzAsImV4cCI6MjAyNTI1Mjk3MH0.Yx_QXKHf_ED_WTVkw2pGPQE5UgJhHCQF_-dkTBxvEbY'

// Criando uma única instância do cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage,
    storageKey: 'meu-plano-saude-storage-key' // Chave única para evitar conflitos
  }
})

// Log de inicialização para depuração
console.log('Cliente Supabase alternativo inicializado', { 
  url: supabaseUrl.substring(0, 20) + '...',
  usingLocalStorage: true
});

export type Admin = {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  criado_em?: string;
}; 