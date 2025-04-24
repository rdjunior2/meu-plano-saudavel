-- Adicionar campo avatar_url à tabela profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Registrar alteração no log
INSERT INTO public.log_agente_automacao (
    evento,
    payload,
    status,
    mensagem
)
VALUES (
    'add_avatar_url_to_profiles',
    jsonb_build_object(
        'table', 'profiles',
        'action', 'add column',
        'column', 'avatar_url'
    ),
    'sucesso',
    'Campo avatar_url adicionado à tabela profiles com sucesso'
); 