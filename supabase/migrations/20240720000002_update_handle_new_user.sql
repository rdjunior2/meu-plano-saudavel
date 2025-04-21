-- Atualizar a função de trigger para incluir first_name e cpf
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Inserir na tabela perfis com dados do user_metadata, incluindo first_name e cpf
  INSERT INTO public.profiles (
    id, 
    email, 
    nome,
    first_name,
    cpf,
    telefone,
    status_geral,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_metadata->>'name',
    NEW.raw_user_metadata->>'first_name',
    NEW.raw_user_metadata->>'cpf',
    NEW.raw_user_metadata->>'phone',
    'pendente',
    NOW()
  );

  -- Registrar no log
  INSERT INTO public.log_agente_automacao (
    evento,
    payload,
    status,
    mensagem
  )
  VALUES (
    'new_user_profile_created',
    jsonb_build_object(
      'user_id', NEW.id,
      'email', NEW.email,
      'name', NEW.raw_user_metadata->>'name',
      'first_name', NEW.raw_user_metadata->>'first_name',
      'cpf', NEW.raw_user_metadata->>'cpf',
      'phone', NEW.raw_user_metadata->>'phone'
    ),
    'sucesso',
    'Perfil criado automaticamente após criação do usuário'
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
    'new_user_profile_error',
    jsonb_build_object(
      'user_id', NEW.id,
      'email', NEW.email,
      'error', SQLERRM
    ),
    'erro',
    SQLERRM
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que a trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Garantir permissões necessárias
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- Registrar atualização no log
INSERT INTO public.log_agente_automacao (
    evento,
    payload,
    status,
    mensagem
)
VALUES (
    'update_handle_new_user',
    jsonb_build_object(
        'function', 'handle_new_user',
        'action', 'update',
        'changes', 'Adicionados campos first_name e cpf'
    ),
    'sucesso',
    'Função handle_new_user atualizada para incluir first_name e cpf'
); 