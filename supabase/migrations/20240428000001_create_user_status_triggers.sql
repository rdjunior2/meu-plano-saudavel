-- Criar função para inserir registros em user_status quando um novo usuário é criado
CREATE OR REPLACE FUNCTION handle_new_user_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir na tabela user_status para o novo usuário
  INSERT INTO public.user_status (
    user_id,
    alimentar_completed,
    treino_completed
  )
  VALUES (
    NEW.id,
    FALSE,
    FALSE
  );

  -- Registrar no log
  INSERT INTO public.log_agente_automacao (
    evento,
    payload,
    status,
    mensagem
  )
  VALUES (
    'new_user_status_created',
    jsonb_build_object(
      'user_id', NEW.id
    ),
    'sucesso',
    'Status do usuário criado automaticamente após criação do usuário'
  );

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
    'new_user_status_error',
    jsonb_build_object(
      'user_id', NEW.id,
      'error', SQLERRM
    ),
    'erro',
    SQLERRM
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para novos usuários
CREATE TRIGGER on_auth_user_created_add_status
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_status();

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.handle_new_user_status() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user_status() TO authenticated;

-- Popular tabela user_status para usuários existentes
INSERT INTO public.user_status (user_id, alimentar_completed, treino_completed)
SELECT id, FALSE, FALSE 
FROM auth.users 
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_status WHERE user_id = auth.users.id
);

-- Registrar no log
INSERT INTO public.log_agente_automacao (
  evento,
  payload,
  status,
  mensagem
)
VALUES (
  'populate_existing_users_status',
  jsonb_build_object(
    'description', 'População da tabela user_status para usuários existentes'
  ),
  'sucesso',
  'Registros de status criados para usuários existentes'
); 