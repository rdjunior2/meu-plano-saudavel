import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Recuperar as variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificar se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('As variáveis de ambiente do Supabase não estão configuradas corretamente.');
}

// Criar o cliente do Supabase
export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Verificar se temos as credenciais necessárias
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase URL e/ou chave anônima não configurados. As funções de autenticação e banco de dados podem não funcionar corretamente.');
} 