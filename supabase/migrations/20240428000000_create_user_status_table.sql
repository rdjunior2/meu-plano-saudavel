-- Criar a tabela user_status (que está faltando no banco de dados)
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

-- Registrar a migração no log
INSERT INTO public.log_agente_automacao (
    evento,
    payload,
    status,
    mensagem
)
VALUES (
    'create_user_status_table',
    jsonb_build_object(
        'description', 'Criação da tabela user_status que estava faltando'
    ),
    'sucesso',
    'Tabela user_status criada com sucesso'
); 