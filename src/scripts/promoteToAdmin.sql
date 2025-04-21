-- Função para promover usuário a administrador
CREATE OR REPLACE FUNCTION promote_user_to_admin()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_email TEXT := '04junior.silva09@gmail.com';
BEGIN
    -- Verificar se o usuário já existe
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email;

    -- Se o usuário não existir, retornar erro
    IF v_user_id IS NULL THEN
        -- Registrar erro no log
        INSERT INTO public.log_agente_automacao (
            evento,
            payload,
            status,
            mensagem
        )
        VALUES (
            'promote_to_admin_error',
            jsonb_build_object(
                'email', v_email,
                'error', 'Usuário não encontrado'
            ),
            'erro',
            'Usuário não encontrado'
        );
        
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Usuário não encontrado'
        );
    END IF;
    
    -- Atualizar senha do usuário
    UPDATE auth.users
    SET 
        encrypted_password = crypt('33milhoes', gen_salt('bf')),
        updated_at = NOW(),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE id = v_user_id;
    
    -- Atualizar perfil do usuário
    UPDATE public.profiles
    SET 
        is_admin = true,
        status_geral = 'ativo',
        updated_at = NOW()
    WHERE id = v_user_id;
    
    -- Registrar log da promoção
    INSERT INTO public.log_agente_automacao (
        evento,
        payload,
        status,
        mensagem
    )
    VALUES (
        'promote_to_admin',
        jsonb_build_object(
            'user_id', v_user_id,
            'email', v_email
        ),
        'sucesso',
        'Usuário promovido a administrador com sucesso'
    );

    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_user_id,
        'message', 'Usuário existente promovido a administrador'
    );

EXCEPTION WHEN OTHERS THEN
    -- Log do erro
    INSERT INTO public.log_agente_automacao (
        evento,
        payload,
        status,
        mensagem
    )
    VALUES (
        'promote_to_admin_error',
        jsonb_build_object(
            'error', SQLERRM,
            'email', v_email
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

-- Executar a função para promover o usuário
SELECT promote_user_to_admin();

-- Remover a função após a execução (opcional)
-- DROP FUNCTION IF EXISTS promote_user_to_admin(); 