-- Função para criar usuário admin
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_phone TEXT := '81989758872';
    v_email TEXT := v_phone || '@meuplanosaude.app';
BEGIN
    -- Verificar se o usuário já existe
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email;

    -- Se o usuário não existir, criar
    IF v_user_id IS NULL THEN
        -- Criar usuário no auth.users
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_user_meta_data,
            created_at,
            updated_at,
            role
        )
        VALUES (
            uuid_generate_v4(),
            v_email,
            crypt('33milhoes', gen_salt('bf')),
            NOW(),
            jsonb_build_object(
                'phone', v_phone,
                'name', 'Administrador'
            ),
            NOW(),
            NOW(),
            'authenticated'
        )
        RETURNING id INTO v_user_id;

        -- Criar perfil como admin
        INSERT INTO public.profiles (
            id,
            telefone,
            nome,
            email,
            status_geral,
            is_admin,
            created_at
        )
        VALUES (
            v_user_id,
            v_phone,
            'Administrador',
            v_email,
            'ativo',
            true,
            NOW()
        );

        -- Registrar log da criação
        INSERT INTO public.log_agente_automacao (
            evento,
            payload,
            status,
            mensagem
        )
        VALUES (
            'create_admin_user',
            jsonb_build_object(
                'user_id', v_user_id,
                'email', v_email,
                'phone', v_phone
            ),
            'sucesso',
            'Usuário admin criado com sucesso'
        );

        RETURN jsonb_build_object(
            'success', true,
            'user_id', v_user_id,
            'message', 'Usuário admin criado com sucesso'
        );
    ELSE
        -- Se já existir, atualizar como admin
        UPDATE public.profiles
        SET 
            is_admin = true,
            status_geral = 'ativo',
            updated_at = NOW()
        WHERE id = v_user_id;

        RETURN jsonb_build_object(
            'success', true,
            'user_id', v_user_id,
            'message', 'Usuário existente atualizado como admin'
        );
    END IF;

EXCEPTION WHEN OTHERS THEN
    -- Log do erro
    INSERT INTO public.log_agente_automacao (
        evento,
        payload,
        status,
        mensagem
    )
    VALUES (
        'create_admin_user_error',
        jsonb_build_object(
            'error', SQLERRM,
            'email', v_email,
            'phone', v_phone
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

-- Executar a função para criar o admin
SELECT create_admin_user();

-- Remover a função após a execução
DROP FUNCTION IF EXISTS create_admin_user(); 