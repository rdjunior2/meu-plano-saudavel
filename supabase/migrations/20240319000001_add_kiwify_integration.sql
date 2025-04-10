-- Function to handle Kiwify webhook
CREATE OR REPLACE FUNCTION handle_kiwify_webhook(
    payload JSONB
) RETURNS JSONB AS $$
DECLARE
    user_email TEXT;
    user_id UUID;
    plan_id UUID;
    activation_id UUID;
BEGIN
    -- Extract email from payload
    user_email := payload->>'customer_email';
    
    -- Log the webhook
    INSERT INTO public.log_agente_automacao (
        evento,
        payload,
        status,
        mensagem
    ) VALUES (
        'kiwify_webhook',
        payload,
        'recebido',
        'Webhook do Kiwify recebido para ' || user_email
    );

    -- Check if user exists
    SELECT id INTO user_id
    FROM auth.users
    WHERE email = user_email;

    -- If user doesn't exist, create new user and profile
    IF user_id IS NULL THEN
        user_id := create_user_with_profile(
            user_email,
            jsonb_build_object(
                'source', 'kiwify',
                'product_id', payload->>'product_id',
                'subscription_id', payload->>'subscription_id'
            )
        );
    END IF;

    -- Create plan activation
    activation_id := activate_user_plan(
        user_id,
        CASE 
            WHEN payload->>'product_id' LIKE '%nutricao%' THEN 'meal_plan'
            WHEN payload->>'product_id' LIKE '%treino%' THEN 'workout_plan'
            ELSE 'unknown'
        END,
        gen_random_uuid(), -- temporary plan_id, should be mapped to actual plan
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days'
    );

    -- Create notification for admin
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type
    ) SELECT 
        id,
        'Nova Ativação de Plano',
        'Novo usuário ' || user_email || ' ativou um plano via Kiwify',
        'new_activation'
    FROM public.profiles
    WHERE is_admin = true;

    -- Return success response
    RETURN jsonb_build_object(
        'success', true,
        'user_id', user_id,
        'activation_id', activation_id,
        'message', 'Webhook processado com sucesso'
    );

EXCEPTION WHEN OTHERS THEN
    -- Log error
    INSERT INTO public.log_agente_automacao (
        evento,
        payload,
        status,
        mensagem
    ) VALUES (
        'kiwify_webhook_error',
        payload,
        'erro',
        SQLERRM
    );

    -- Return error response
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create webhook endpoint function
CREATE OR REPLACE FUNCTION http_kiwify_webhook(
    "payload" JSONB
) RETURNS JSONB AS $$
BEGIN
    RETURN handle_kiwify_webhook(payload);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 