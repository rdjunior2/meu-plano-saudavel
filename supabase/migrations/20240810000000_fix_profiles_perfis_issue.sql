-- Garantir que ambas as tabelas existam
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    status_geral TEXT DEFAULT 'pendente',
    formulario_alimentar_preenchido BOOLEAN DEFAULT false,
    formulario_treino_preenchido BOOLEAN DEFAULT false,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    telefone TEXT,
    nome TEXT,
    email TEXT,
    first_name TEXT,
    cpf TEXT,
    avatar_url TEXT
);

CREATE TABLE IF NOT EXISTS public.perfis (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    status_geral TEXT DEFAULT 'pendente',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    telefone TEXT,
    nome TEXT,
    email TEXT,
    first_name TEXT,
    cpf TEXT,
    avatar_url TEXT
);

-- Adicionar uma função que mantém as tabelas sincronizadas
CREATE OR REPLACE FUNCTION sync_profiles_perfis()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'profiles' THEN
        -- Atualizar perfis quando profiles for alterado
        INSERT INTO public.perfis (
            id, nome, telefone, email, first_name, cpf, avatar_url, status_geral
        )
        VALUES (
            NEW.id, NEW.nome, NEW.telefone, NEW.email, NEW.first_name, NEW.cpf, NEW.avatar_url, NEW.status_geral
        )
        ON CONFLICT (id) 
        DO UPDATE SET
            nome = NEW.nome,
            telefone = NEW.telefone,
            email = NEW.email,
            first_name = NEW.first_name,
            cpf = NEW.cpf,
            avatar_url = NEW.avatar_url,
            status_geral = NEW.status_geral;
    ELSE
        -- Atualizar profiles quando perfis for alterado
        UPDATE public.profiles
        SET
            nome = NEW.nome,
            telefone = NEW.telefone,
            email = NEW.email,
            first_name = NEW.first_name,
            cpf = NEW.cpf,
            avatar_url = NEW.avatar_url,
            status_geral = NEW.status_geral
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Registrar erro no log
    INSERT INTO public.log_agente_automacao (
        evento,
        payload,
        status,
        mensagem
    )
    VALUES (
        'sync_profiles_perfis_error',
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'user_id', NEW.id,
            'error', SQLERRM
        ),
        'erro',
        SQLERRM
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar triggers para sincronização
DROP TRIGGER IF EXISTS on_profiles_change ON public.profiles;
CREATE TRIGGER on_profiles_change
    AFTER INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_profiles_perfis();

DROP TRIGGER IF EXISTS on_perfis_change ON public.perfis;
CREATE TRIGGER on_perfis_change
    AFTER INSERT OR UPDATE ON public.perfis
    FOR EACH ROW
    EXECUTE FUNCTION sync_profiles_perfis();

-- Copiar dados existentes de profiles para perfis e vice-versa para garantir sincronização
-- Primeiro de profiles para perfis
INSERT INTO public.perfis (
    id, nome, telefone, email, first_name, cpf, avatar_url, status_geral, created_at
)
SELECT 
    p.id, p.nome, p.telefone, p.email, p.first_name, p.cpf, p.avatar_url, p.status_geral, p.created_at
FROM 
    public.profiles p
ON CONFLICT (id) 
DO UPDATE SET
    nome = EXCLUDED.nome,
    telefone = EXCLUDED.telefone,
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    cpf = EXCLUDED.cpf,
    avatar_url = EXCLUDED.avatar_url,
    status_geral = EXCLUDED.status_geral;

-- Depois de perfis para profiles
INSERT INTO public.profiles (
    id, nome, telefone, email, first_name, cpf, avatar_url, status_geral, created_at
)
SELECT 
    pf.id, pf.nome, pf.telefone, pf.email, pf.first_name, pf.cpf, pf.avatar_url, pf.status_geral, pf.created_at
FROM 
    public.perfis pf
ON CONFLICT (id) 
DO UPDATE SET
    nome = EXCLUDED.nome,
    telefone = EXCLUDED.telefone,
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    cpf = EXCLUDED.cpf,
    avatar_url = EXCLUDED.avatar_url,
    status_geral = EXCLUDED.status_geral;

-- Registrar atualização no log
INSERT INTO public.log_agente_automacao (
    evento,
    payload,
    status,
    mensagem
)
VALUES (
    'fix_profiles_perfis_issue',
    jsonb_build_object(
        'action', 'sync tables',
        'tables', array['profiles', 'perfis']
    ),
    'sucesso',
    'Correção da consistência entre tabelas profiles e perfis'
); 