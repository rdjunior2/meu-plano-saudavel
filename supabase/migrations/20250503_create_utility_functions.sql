-- Criar a função para verificar se uma tabela existe
CREATE OR REPLACE FUNCTION public.check_table_exists(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  exists_bool boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = $1
  ) INTO exists_bool;
  
  RETURN exists_bool;
END;
$$;

-- Conceder permissões para a função check_table_exists
GRANT EXECUTE ON FUNCTION public.check_table_exists TO anon;
GRANT EXECUTE ON FUNCTION public.check_table_exists TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_table_exists TO service_role;

-- Criar função para executar tarefas do sistema
CREATE OR REPLACE FUNCTION public.execute_system_task(task_name text, sql_command text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Executar o comando SQL
  EXECUTE sql_command;
  
  -- Registrar execução da tarefa
  INSERT INTO public.log_agente_automacao (
    evento,
    payload,
    status,
    mensagem
  )
  VALUES (
    task_name,
    jsonb_build_object(
      'sql_command', sql_command
    ),
    'sucesso',
    'Tarefa do sistema executada com sucesso'
  );
  
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  -- Registrar falha
  INSERT INTO public.log_agente_automacao (
    evento,
    payload,
    status,
    mensagem
  )
  VALUES (
    task_name,
    jsonb_build_object(
      'sql_command', sql_command,
      'error', SQLERRM
    ),
    'erro',
    'Falha ao executar tarefa do sistema: ' || SQLERRM
  );
  
  RETURN false;
END;
$$;

-- Conceder permissões para a função execute_system_task
GRANT EXECUTE ON FUNCTION public.execute_system_task TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_system_task TO service_role;

-- Verificar se a tabela log_agente_automacao existe; se não, criá-la
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'log_agente_automacao'
  ) THEN
    CREATE TABLE public.log_agente_automacao (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      evento TEXT NOT NULL,
      payload JSONB,
      status TEXT,
      mensagem TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Conceder permissões para a tabela
    GRANT ALL ON public.log_agente_automacao TO authenticated;
    GRANT ALL ON public.log_agente_automacao TO service_role;
  END IF;
END
$$; 