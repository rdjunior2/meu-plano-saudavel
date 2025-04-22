-- MIGRAÇÃO COMBINADA PARA ADICIONAR A TABELA USER_STATUS
-- Executar este script no SQL Editor do Supabase

-- PARTE 1: Criar a tabela user_status
CREATE TABLE IF NOT EXISTS public.user_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    alimentar_completed BOOLEAN DEFAULT false,
    treino_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índice para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_user_status_user_id ON public.user_status(user_id);

-- Trigger para atualizar o campo updated_at
CREATE OR REPLACE FUNCTION update_user_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_user_status_updated_at
BEFORE UPDATE ON public.user_status
FOR EACH ROW EXECUTE FUNCTION update_user_status_updated_at();

-- Garantir permissões para a tabela
GRANT ALL ON public.user_status TO anon;
GRANT ALL ON public.user_status TO authenticated;

-- PARTE 2: Criar função e trigger para novos usuários
CREATE OR REPLACE FUNCTION handle_new_user_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir na tabela user_status para o novo usuário
  INSERT INTO public.user_status (
    user_id,
    alimentar_completed,
    treino_completed
  )
  VALUES (
    NEW.id,
    FALSE,
    FALSE
  );

  -- Registrar no log (se a tabela existir)
  BEGIN
    INSERT INTO public.log_agente_automacao (
      evento,
      payload,
      status,
      mensagem
    )
    VALUES (
      'new_user_status_created',
      jsonb_build_object(
        'user_id', NEW.id
      ),
      'sucesso',
      'Status do usuário criado automaticamente após criação do usuário'
    );
  EXCEPTION WHEN undefined_table THEN
    -- Ignora se a tabela de log não existir
    NULL;
  END;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Tenta registrar erro no log (se a tabela existir)
  BEGIN
    INSERT INTO public.log_agente_automacao (
      evento,
      payload,
      status,
      mensagem
    )
    VALUES (
      'new_user_status_error',
      jsonb_build_object(
        'user_id', NEW.id,
        'error', SQLERRM
      ),
      'erro',
      SQLERRM
    );
  EXCEPTION WHEN undefined_table THEN
    -- Ignora se a tabela de log não existir
    NULL;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created_add_status ON auth.users;
CREATE TRIGGER on_auth_user_created_add_status
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_status();

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.handle_new_user_status() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user_status() TO authenticated;

-- Popular tabela user_status para usuários existentes
INSERT INTO public.user_status (user_id, alimentar_completed, treino_completed)
SELECT id, FALSE, FALSE 
FROM auth.users 
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_status WHERE user_id = auth.users.id
);

-- Tenta registrar no log (se a tabela existir)
DO $$
BEGIN
  BEGIN
    INSERT INTO public.log_agente_automacao (
      evento,
      payload,
      status,
      mensagem
    )
    VALUES (
      'user_status_migration_applied',
      jsonb_build_object(
        'description', 'Migração completa da tabela user_status'
      ),
      'sucesso',
      'Migração da tabela user_status aplicada com sucesso'
    );
  EXCEPTION WHEN undefined_table THEN
    -- Ignora se a tabela de log não existir
    RAISE NOTICE 'A tabela log_agente_automacao não existe, continuando sem registrar log';
  END;
END $$; 