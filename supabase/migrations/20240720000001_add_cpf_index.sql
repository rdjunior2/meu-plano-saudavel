-- Adicionar índice para o campo CPF
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON public.profiles(cpf);

-- Registrar alteração no log
INSERT INTO public.log_agente_automacao (
    evento,
    payload,
    status,
    mensagem
)
VALUES (
    'add_cpf_index',
    jsonb_build_object(
        'table', 'profiles',
        'action', 'create index',
        'index', 'idx_profiles_cpf'
    ),
    'sucesso',
    'Índice para o campo CPF criado com sucesso'
); 