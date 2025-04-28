import { supabase } from './supabaseClient';

/**
 * Função para executar a migração da tabela de formulários
 */
export const migrateFormularios = async () => {
  try {
    console.log('[Migração] Verificando tabela de formulários...');
    
    // Verificar se a tabela forms existe
    const { data: tableExists, error: checkError } = await supabase
      .from('forms')
      .select('id')
      .limit(1);
    
    // Se não há erro, a tabela já existe
    if (!checkError) {
      console.log('[Migração] Tabela de formulários já existe');
      return {
        success: true,
        message: 'Tabela já existe',
        exists: true
      };
    }
    
    console.log('[Migração] Tabela de formulários não existe, criando...');
    
    // Criar a extensão uuid-ossp se necessário
    await supabase.rpc('extensions_create_uuid_ossp');
    
    // SQL para criar a tabela forms
    const createFormsTableSQL = `
      CREATE TABLE IF NOT EXISTS forms (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL DEFAULT 'anamnese',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        fields JSONB DEFAULT '[]'::jsonb
      );
    `;
    
    // SQL para criar a tabela auxiliar
    const createPlanFormsTableSQL = `
      CREATE TABLE IF NOT EXISTS plan_forms (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        plan_id UUID NOT NULL,
        form_id UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
      );
    `;
    
    // SQL para criar índices
    const createIndicesSQL = `
      CREATE INDEX IF NOT EXISTS idx_forms_type ON forms(type);
      CREATE INDEX IF NOT EXISTS idx_forms_is_active ON forms(is_active);
      CREATE INDEX IF NOT EXISTS idx_plan_forms_plan_id ON plan_forms(plan_id);
      CREATE INDEX IF NOT EXISTS idx_plan_forms_form_id ON plan_forms(form_id);
    `;
    
    // Executar as queries em sequência
    const { error: createFormsError } = await supabase.rpc('pgsql', {
      query: createFormsTableSQL
    });
    
    if (createFormsError) {
      console.error('[Migração] Erro ao criar tabela forms:', createFormsError);
      return {
        success: false,
        message: 'Erro ao criar tabela forms',
        error: createFormsError
      };
    }
    
    const { error: createPlanFormsError } = await supabase.rpc('pgsql', {
      query: createPlanFormsTableSQL
    });
    
    if (createPlanFormsError) {
      console.error('[Migração] Erro ao criar tabela plan_forms:', createPlanFormsError);
      return {
        success: false,
        message: 'Erro ao criar tabela plan_forms',
        error: createPlanFormsError
      };
    }
    
    const { error: createIndicesError } = await supabase.rpc('pgsql', {
      query: createIndicesSQL
    });
    
    if (createIndicesError) {
      console.error('[Migração] Erro ao criar índices:', createIndicesError);
      return {
        success: false,
        message: 'Erro ao criar índices',
        error: createIndicesError
      };
    }
    
    console.log('[Migração] Tabelas de formulários criadas com sucesso!');
    
    return {
      success: true,
      message: 'Tabelas criadas com sucesso',
      exists: false
    };
  } catch (error) {
    console.error('[Migração] Erro ao executar migração:', error);
    return {
      success: false,
      message: 'Erro ao executar migração',
      error
    };
  }
};

// Função para criar uma função utilitária pgsql no banco de dados
// Esta função permite executar queries SQL diretamente
export const createPgSQLFunction = async () => {
  try {
    const { error } = await supabase.rpc('create_pgsql_function');
    
    if (error) {
      console.error('[Migração] Erro ao criar função pgsql:', error);
      
      // Tenta criar a função diretamente
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION pgsql(query text)
        RETURNS json
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE query;
          RETURN json_build_object('success', true);
        EXCEPTION WHEN OTHERS THEN
          RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'hint', SQLSTATE
          );
        END;
        $$;
        
        CREATE OR REPLACE FUNCTION extensions_create_uuid_ossp()
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        END;
        $$;
        
        CREATE OR REPLACE FUNCTION create_pgsql_function()
        RETURNS json
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          RETURN json_build_object('success', true, 'message', 'Função já existe');
        END;
        $$;
      `;
      
      // Execute diretamente através de uma consulta SQL
      // Isso pode precisar de permissões adequadas ou ser feito pelo painel administrativo do Supabase
      console.log('[Migração] É necessário criar as funções utilitárias no painel do Supabase');
      
      return {
        success: false,
        message: 'Erro ao criar função pgsql, requer configuração manual',
        error
      };
    }
    
    return {
      success: true,
      message: 'Função pgsql disponível'
    };
  } catch (error) {
    console.error('[Migração] Erro ao verificar função pgsql:', error);
    return {
      success: false,
      message: 'Erro ao verificar função pgsql',
      error
    };
  }
}; 