-- Adicionar campos faltantes na tabela perfis
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS telefone TEXT,
ADD COLUMN IF NOT EXISTS nome TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Registrar alteração no log
INSERT INTO public.log_agente_automacao (
    evento,
    payload,
    status,
    mensagem
)
VALUES (
    'add_missing_profile_fields',
    jsonb_build_object(
        'table', 'perfis',
        'action', 'add columns',
        'columns', array['telefone', 'nome', 'email']
    ),
    'sucesso',
    'Campos adicionados à tabela perfis com sucesso'
); 