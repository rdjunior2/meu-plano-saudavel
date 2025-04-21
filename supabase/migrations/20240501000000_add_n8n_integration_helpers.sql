-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função para verificar se um usuário existe pelo email
CREATE OR REPLACE FUNCTION public.check_user_exists(
  p_email TEXT
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar usuário pelo email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar novo usuário com perfil completo
CREATE OR REPLACE FUNCTION public.create_new_user_flow(
  p_email TEXT,
  p_nome TEXT,
  p_telefone TEXT,
  p_password TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_password TEXT;
BEGIN
  -- Verificar se usuário já existe
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = p_email;
  
  IF v_user_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Usuário já existe',
      'user_id', v_user_id
    );
  END IF;

  -- Definir senha padrão se não for fornecida
  v_password := COALESCE(p_password, gen_random_uuid()::text);
  
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
    p_email,
    crypt(v_password, gen_salt('bf')),
    NOW(),
    jsonb_build_object(
      'phone', p_telefone,
      'name', p_nome
    ),
    NOW(),
    NOW(),
    'authenticated'
  )
  RETURNING id INTO v_user_id;
  
  -- O trigger handle_new_user já cuidará da criação do perfil
  -- mas vamos garantir que os dados estejam corretos
  UPDATE public.profiles
  SET 
    nome = p_nome,
    telefone = p_telefone,
    email = p_email,
    updated_at = NOW()
  WHERE id = v_user_id;
  
  -- Registrar log de criação
  INSERT INTO public.log_agente_automacao (
    evento,
    payload,
    status,
    mensagem
  )
  VALUES (
    'create_user_via_n8n',
    jsonb_build_object(
      'user_id', v_user_id,
      'email', p_email,
      'name', p_nome,
      'phone', p_telefone
    ),
    'sucesso',
    'Usuário criado via integração n8n'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'message', 'Usuário criado com sucesso'
  );

EXCEPTION WHEN OTHERS THEN
  -- Log de erro
  INSERT INTO public.log_agente_automacao (
    evento,
    payload,
    status,
    mensagem
  )
  VALUES (
    'create_user_error_n8n',
    jsonb_build_object(
      'email', p_email,
      'name', p_nome,
      'phone', p_telefone,
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar compra com itens em uma única transação
CREATE OR REPLACE FUNCTION public.create_purchase_flow(
  p_user_id UUID,
  p_kiwify_id TEXT,
  p_products JSONB,
  p_purchase_date TIMESTAMPTZ DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_purchase_id UUID := uuid_generate_v4();
  v_product_id UUID;
  v_purchase_date TIMESTAMPTZ := COALESCE(p_purchase_date, NOW());
  v_item_id UUID;
  v_product_item JSONB;
BEGIN
  -- Verificar se a compra já existe para este kiwify_id
  IF EXISTS (SELECT 1 FROM public.purchases WHERE kiwify_id = p_kiwify_id) THEN
    SELECT id INTO v_purchase_id FROM public.purchases WHERE kiwify_id = p_kiwify_id;
    
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Compra já existe',
      'purchase_id', v_purchase_id
    );
  END IF;

  -- Iniciar transação
  BEGIN
    -- Inserir compra
    INSERT INTO public.purchases (
      id, 
      user_id, 
      kiwify_id, 
      purchase_date, 
      status, 
      created_at
    )
    VALUES (
      v_purchase_id, 
      p_user_id, 
      p_kiwify_id, 
      v_purchase_date, 
      'approved', 
      NOW()
    );
    
    -- Inserir itens da compra
    FOR v_product_item IN SELECT * FROM jsonb_array_elements(p_products)
    LOOP
      v_product_id := (v_product_item->>'product_id')::UUID;
      
      INSERT INTO public.purchase_items (
        id,
        purchase_id, 
        product_id, 
        form_status, 
        plan_status, 
        created_at
      )
      VALUES (
        uuid_generate_v4(),
        v_purchase_id, 
        v_product_id, 
        'pending', 
        'awaiting', 
        NOW()
      )
      RETURNING id INTO v_item_id;
    END LOOP;
    
    -- Registrar log de sucesso
    INSERT INTO public.log_agente_automacao (
      evento,
      payload,
      status,
      mensagem
    )
    VALUES (
      'create_purchase_via_n8n',
      jsonb_build_object(
        'purchase_id', v_purchase_id,
        'user_id', p_user_id,
        'kiwify_id', p_kiwify_id,
        'products', p_products
      ),
      'sucesso',
      'Compra criada via integração n8n'
    );
    
    -- Commit implícito ao final do bloco
  EXCEPTION WHEN OTHERS THEN
    -- Rollback implícito em caso de erro
    
    -- Log de erro
    INSERT INTO public.log_agente_automacao (
      evento,
      payload,
      status,
      mensagem
    )
    VALUES (
      'create_purchase_error_n8n',
      jsonb_build_object(
        'user_id', p_user_id,
        'kiwify_id', p_kiwify_id,
        'products', p_products,
        'error', SQLERRM
      ),
      'erro',
      SQLERRM
    );
    
    RAISE EXCEPTION '%', SQLERRM;
  END;
  
  RETURN jsonb_build_object(
    'success', true,
    'purchase_id', v_purchase_id,
    'message', 'Compra criada com sucesso'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar status de compra
CREATE OR REPLACE FUNCTION public.update_purchase_status(
  p_kiwify_id TEXT,
  p_status TEXT
) RETURNS JSONB AS $$
DECLARE
  v_purchase_id UUID;
BEGIN
  -- Verificar se a compra existe
  SELECT id INTO v_purchase_id 
  FROM public.purchases 
  WHERE kiwify_id = p_kiwify_id;
  
  IF v_purchase_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Compra não encontrada',
      'kiwify_id', p_kiwify_id
    );
  END IF;
  
  -- Atualizar status da compra
  UPDATE public.purchases
  SET 
    status = p_status,
    updated_at = NOW()
  WHERE id = v_purchase_id;
  
  -- Registrar log da atualização
  INSERT INTO public.log_agente_automacao (
    evento,
    payload,
    status,
    mensagem
  )
  VALUES (
    'update_purchase_status_n8n',
    jsonb_build_object(
      'purchase_id', v_purchase_id,
      'kiwify_id', p_kiwify_id,
      'status', p_status
    ),
    'sucesso',
    'Status da compra atualizado via n8n'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'purchase_id', v_purchase_id,
    'message', 'Status da compra atualizado com sucesso'
  );

EXCEPTION WHEN OTHERS THEN
  -- Log de erro
  INSERT INTO public.log_agente_automacao (
    evento,
    payload,
    status,
    mensagem
  )
  VALUES (
    'update_purchase_status_error_n8n',
    jsonb_build_object(
      'kiwify_id', p_kiwify_id,
      'status', p_status,
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para processar fluxo completo de nova compra (integração completa)
CREATE OR REPLACE FUNCTION public.process_new_purchase(
  p_email TEXT,
  p_nome TEXT,
  p_telefone TEXT,
  p_kiwify_id TEXT,
  p_products JSONB,
  p_purchase_date TIMESTAMPTZ DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
  v_purchase_id UUID;
BEGIN
  -- Verificar se usuário existe
  v_user_id := public.check_user_exists(p_email);
  
  -- Se usuário não existe, criar
  IF v_user_id IS NULL THEN
    v_result := public.create_new_user_flow(p_email, p_nome, p_telefone);
    
    IF (v_result->>'success')::BOOLEAN = false THEN
      RETURN v_result;
    END IF;
    
    v_user_id := (v_result->>'user_id')::UUID;
  END IF;
  
  -- Verificar se já existe compra com este kiwify_id
  IF EXISTS (SELECT 1 FROM public.purchases WHERE kiwify_id = p_kiwify_id) THEN
    SELECT id INTO v_purchase_id FROM public.purchases WHERE kiwify_id = p_kiwify_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Compra já processada anteriormente',
      'purchase_id', v_purchase_id,
      'user_id', v_user_id,
      'is_new', false
    );
  END IF;
  
  -- Criar compra
  v_result := public.create_purchase_flow(v_user_id, p_kiwify_id, p_products, p_purchase_date);
  
  IF (v_result->>'success')::BOOLEAN = false THEN
    RETURN v_result;
  END IF;
  
  v_purchase_id := (v_result->>'purchase_id')::UUID;
  
  -- Retornar resultado completo
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Processamento completo realizado com sucesso',
    'purchase_id', v_purchase_id,
    'user_id', v_user_id,
    'is_new', true
  );

EXCEPTION WHEN OTHERS THEN
  -- Log de erro geral
  INSERT INTO public.log_agente_automacao (
    evento,
    payload,
    status,
    mensagem
  )
  VALUES (
    'process_new_purchase_error',
    jsonb_build_object(
      'email', p_email,
      'kiwify_id', p_kiwify_id,
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Configurar permissões para acesso via API - importante para n8n
GRANT EXECUTE ON FUNCTION public.check_user_exists TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_new_user_flow TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_purchase_flow TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_purchase_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_new_purchase TO authenticated;

-- Também permitir acesso anônimo para webhooks
GRANT EXECUTE ON FUNCTION public.process_new_purchase TO anon;
GRANT EXECUTE ON FUNCTION public.update_purchase_status TO anon;

-- Garantir que purchases possui coluna updated_at
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'purchases' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.purchases ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Silenciar erros
END $$; 