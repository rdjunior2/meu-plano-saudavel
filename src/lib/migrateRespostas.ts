import { supabase } from './supabaseClient';

/**
 * Função para executar a migração da tabela de respostas de formulários
 */
export const migrateRespostas = async () => {
  try {
    console.log('[Migração] Verificando tabela de respostas de formulários...');
    
    // Verificar se a tabela form_responses existe
    const { data: tableExists, error: checkError } = await supabase
      .from('form_responses')
      .select('id')
      .limit(1);
    
    // Se não há erro, a tabela já existe
    if (!checkError) {
      console.log('[Migração] Tabela de respostas já existe');
      return {
        success: true,
        message: 'Tabela já existe',
        exists: true
      };
    }
    
    console.log('[Migração] Tabela de respostas não existe, criando...');
    
    // Verificar se a função de extensão UUID existe
    await supabase.rpc('extensions_create_uuid_ossp');
    
    // Verificar primeiro se a tabela forms existe, pois é dependência
    const { data: formsExists, error: formsCheckError } = await supabase
      .from('forms')
      .select('id')
      .limit(1);
      
    if (formsCheckError) {
      console.log('[Migração] A tabela forms não existe, criando-a primeiro...');
      
      // Importar e executar a migração de formulários
      const { migrateFormularios } = await import('./migrateFormularios');
      const formsResult = await migrateFormularios();
      
      if (!formsResult.success) {
        console.error('[Migração] Erro ao criar tabela de formulários:', formsResult.error);
        return {
          success: false,
          message: 'Erro ao criar tabela de formulários dependente',
          error: formsResult.error
        };
      }
    }
    
    // SQL para criar a tabela form_responses
    const createResponsesTableSQL = `
      CREATE TABLE IF NOT EXISTS form_responses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
        form_type VARCHAR(50) NOT NULL,
        version INTEGER DEFAULT 1,
        responses JSONB DEFAULT '{}'::jsonb,
        purchase_id UUID,
        product_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    // SQL para criar índices
    const createIndicesSQL = `
      CREATE INDEX IF NOT EXISTS idx_form_responses_user_id ON form_responses(user_id);
      CREATE INDEX IF NOT EXISTS idx_form_responses_form_id ON form_responses(form_id);
      CREATE INDEX IF NOT EXISTS idx_form_responses_form_type ON form_responses(form_type);
      CREATE INDEX IF NOT EXISTS idx_form_responses_purchase_id ON form_responses(purchase_id);
      CREATE INDEX IF NOT EXISTS idx_form_responses_product_id ON form_responses(product_id);
    `;
    
    // Executar as queries em sequência
    const { error: createResponsesError } = await supabase.rpc('pgsql', {
      query: createResponsesTableSQL
    });
    
    if (createResponsesError) {
      console.error('[Migração] Erro ao criar tabela form_responses:', createResponsesError);
      return {
        success: false,
        message: 'Erro ao criar tabela form_responses',
        error: createResponsesError
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
    
    console.log('[Migração] Tabela de respostas criada com sucesso!');
    
    return {
      success: true,
      message: 'Tabela criada com sucesso',
      exists: false
    };
  } catch (error) {
    console.error('[Migração] Erro ao executar migração das respostas:', error);
    return {
      success: false,
      message: 'Erro ao executar migração',
      error
    };
  }
}; 