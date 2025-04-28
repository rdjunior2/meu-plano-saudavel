import { supabase } from '../lib/supabaseClient';

/**
 * Script para adicionar a coluna avatar_url à tabela profiles
 * Este script pode ser executado manualmente quando necessário
 */
async function addAvatarUrlColumn() {
  console.log('Iniciando verificação da coluna avatar_url na tabela profiles...');
  
  // Verificar se a tabela profiles existe
  const { data: tables, error: tablesError } = await supabase
    .from('pg_tables')
    .select('tablename')
    .eq('schemaname', 'public')
    .eq('tablename', 'profiles');
    
  if (tablesError) {
    console.error('Erro ao verificar tabelas:', tablesError.message);
    return;
  }
  
  if (!tables || tables.length === 0) {
    console.error('Tabela profiles não encontrada!');
    return;
  }
  
  console.log('Tabela profiles encontrada. Verificando se a coluna avatar_url existe...');
  
  try {
    // Executar SQL personalizado para adicionar a coluna
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;'
    });
    
    if (error) {
      // Se o procedimento acima falhar, tentamos um método alternativo
      console.log('Método RPC falhou, tentando método alternativo...');
      
      // Executar SQL diretamente (isso pode exigir permissões especiais)
      const { error: directError } = await supabase.from('_exec_sql').select('*').eq('query', 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;');
      
      if (directError) {
        console.error('Erro ao adicionar coluna (método alternativo):', directError.message);
        return;
      }
    }
    
    console.log('Coluna avatar_url adicionada com sucesso ou já existia!');
    
    // Atualize o log para registrar a alteração
    const { error: logError } = await supabase
      .from('log_agente_automacao')
      .insert({
        evento: 'add_avatar_url_to_profiles_script',
        payload: {
          table: 'profiles',
          action: 'add column',
          column: 'avatar_url'
        },
        status: 'sucesso',
        mensagem: 'Coluna avatar_url adicionada à tabela profiles via script'
      });
      
    if (logError) {
      console.error('Erro ao registrar log:', logError.message);
    }
    
    // Atualizar ou recarregar o cache de esquema do Supabase
    await supabase.auth.refreshSession();
    
    console.log('Operação concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao executar operação:', error);
  }
}

// Executar a função
addAvatarUrlColumn(); 