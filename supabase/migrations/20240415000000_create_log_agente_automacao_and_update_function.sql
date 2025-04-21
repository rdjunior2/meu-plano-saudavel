-- Criar a tabela log_agente_automacao, se não existir
CREATE TABLE IF NOT EXISTS public.log_agente_automacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evento TEXT NOT NULL,
    payload JSONB,
    status TEXT NOT NULL,
    mensagem TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garantir permissões para a tabela de log
GRANT ALL ON public.log_agente_automacao TO anon;
GRANT ALL ON public.log_agente_automacao TO authenticated;

-- Atualizar a função create_user_with_profile
CREATE OR REPLACE FUNCTION public.create_user_with_profile(
    p_mobile TEXT,
    p_full_name TEXT,
    p_email TEXT,
    p_product_id UUID,
    p_product_name TEXT,
    p_approved_date TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Validar parâmetros de entrada
    IF p_mobile IS NULL OR TRIM(p_mobile) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Telefone não pode ser vazio');
    END IF;

    IF p_email IS NULL OR TRIM(p_email) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Email não pode ser vazio');
    END IF;

    -- Validar formato da data
    IF p_approved_date IS NULL OR NOT p_approved_date ~ '^\d{2}/\d{2}/\d{4}$' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Data de aprovação inválida. Formato esperado: DD/MM/YYYY');
    END IF;

    -- Verificar se o usuário já existe pelo email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE auth.users.email = p_email;

    IF v_user_id IS NULL THEN
        -- Gerar um UUID para o novo usuário
        v_user_id := uuid_generate_v4();

        -- Criar novo usuário no auth.users com um ID gerado
        INSERT INTO auth.users (
            id,
            email,
            raw_user_meta_data,
            created_at
        ) VALUES (
            v_user_id,
            p_email,
            jsonb_build_object(
                'phone', p_mobile,
                'name', p_full_name
            ),
            NOW()
        );

        -- Criar perfil do usuário
        INSERT INTO public.profiles (
            id,
            status_geral,
            created_at
        ) VALUES (
            v_user_id,
            'pendente',
            NOW()
        );
    END IF;

    -- Criar ativação do plano
    INSERT INTO public.plan_activations (
        user_id,
        plan_type,
        plan_id,
        status,
        activated_at
    ) VALUES (
        v_user_id,
        'subscription',
        p_product_id,
        'pendente',
        TO_TIMESTAMP(p_approved_date, 'DD/MM/YYYY')
    );

    -- Registrar log da operação
    INSERT INTO public.log_agente_automacao (
        evento,
        payload,
        status,
        mensagem
    ) VALUES (
        'create_user_with_profile',
        jsonb_build_object(
            'mobile', p_mobile,
            'full_name', p_full_name,
            'email', p_email,
            'product_id', p_product_id,
            'product_name', p_product_name,
            'approved_date', p_approved_date
        ),
        'sucesso',
        'Usuário e perfil criados com sucesso'
    );

    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_user_id
    );

EXCEPTION WHEN OTHERS THEN
    -- Log do erro
    INSERT INTO public.log_agente_automacao (
        evento,
        payload,
        status,
        mensagem
    ) VALUES (
        'create_user_with_profile_error',
        jsonb_build_object(
            'mobile', p_mobile,
            'email', p_email,
            'error', SQLERRM
        ),
        'erro',
        SQLERRM
    );

    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- Conceder permissões necessárias
GRANT EXECUTE ON FUNCTION public.create_user_with_profile(TEXT, TEXT, TEXT, UUID, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.create_user_with_profile(TEXT, TEXT, TEXT, UUID, TEXT, TEXT) TO authenticated;

-- Garantir permissões nas tabelas
GRANT SELECT, INSERT ON public.profiles TO anon;
GRANT SELECT, INSERT ON public.plan_activations TO anon;
GRANT SELECT, INSERT ON auth.users TO anon; 