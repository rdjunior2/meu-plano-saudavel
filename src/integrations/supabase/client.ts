// Este arquivo agora importa a instância centralizada de @/lib/supabaseClient
import supabase from '@/lib/supabaseClient';
import type { Database } from './types';

// Exportando a mesma instância do cliente que está em @/lib/supabaseClient
export { supabase };

// Tipo para o cliente Supabase
export type SupabaseClient = typeof supabase;