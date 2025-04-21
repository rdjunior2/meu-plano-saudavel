-- Função para ativar o plano do usuário
CREATE OR REPLACE FUNCTION activate_user_plan(p_mobile TEXT, p_product_id TEXT, p_data_aprovacao TEXT)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_plan_exists BOOLEAN;
BEGIN
  -- Validar parâmetros de entrada
  IF p_mobile IS NULL OR trim(p_mobile) = '' THEN
    RETURN json_build_object('status', 'error', 'message', 'Telefone não pode ser vazio');
  END IF;

  IF p_product_id IS NULL OR trim(p_product_id) = '' THEN
    RETURN json_build_object('status', 'error', 'message', 'ID do produto não pode ser vazio');
  END IF;

  IF p_data_aprovacao IS NULL OR trim(p_data_aprovacao) = '' THEN
    RETURN json_build_object('status', 'error', 'message', 'Data de aprovação não pode ser vazia');
  END IF;

  -- Buscar usuário
  SELECT id INTO v_user_id 
  FROM usuarios 
  WHERE telefone = p_mobile;

  IF v_user_id IS NULL THEN
    RETURN json_build_object('status', 'error', 'message', 'Usuário não encontrado');
  END IF;

  -- Verificar se a compra já foi registrada
  SELECT EXISTS (
    SELECT 1 
    FROM user_plans_history
    WHERE user_id = v_user_id 
    AND product_id = p_product_id 
    AND start_date = TO_DATE(p_data_aprovacao, 'DD/MM/YYYY')
  ) INTO v_plan_exists;

  IF NOT v_plan_exists THEN
    RETURN json_build_object('status', 'error', 'message', 'Compra não encontrada');
  END IF;

  -- Atualizar plano_status
  UPDATE usuarios 
  SET plano_status = 'aguardando_formulario',
      updated_at = NOW()
  WHERE id = v_user_id;

  -- Registrar log da ativação
  INSERT INTO log_agente_automacao (
    evento,
    payload,
    status,
    mensagem
  ) VALUES (
    'ativacao_plano',
    json_build_object(
      'user_id', v_user_id,
      'product_id', p_product_id,
      'data_aprovacao', p_data_aprovacao
    ),
    'sucesso',
    'Plano ativado com sucesso'
  );

  RETURN json_build_object(
    'status', 'ok',
    'user_id', v_user_id
  );

EXCEPTION WHEN OTHERS THEN
  -- Registrar log de erro
  INSERT INTO log_agente_automacao (
    evento,
    payload,
    status,
    mensagem
  ) VALUES (
    'ativacao_plano',
    json_build_object(
      'mobile', p_mobile,
      'product_id', p_product_id,
      'data_aprovacao', p_data_aprovacao
    ),
    'erro',
    SQLERRM
  );

  RETURN json_build_object('status', 'error', 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 