-- Adicionar campos first_name e cpf à tabela profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS cpf TEXT;

-- Adicionar restrição de unicidade para o CPF
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_cpf_unique UNIQUE (cpf);

-- Registrar alteração no log
INSERT INTO public.log_agente_automacao (
    evento,
    payload,
    status,
    mensagem
)
VALUES (
    'add_first_name_cpf_to_profiles',
    jsonb_build_object(
        'table', 'profiles',
        'action', 'add columns',
        'columns', array['first_name', 'cpf']
    ),
    'sucesso',
    'Campos first_name e cpf adicionados à tabela profiles com sucesso'
); 