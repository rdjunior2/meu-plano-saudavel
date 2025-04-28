-- Adiciona funções utilitárias para administração do banco de dados

-- Função para verificar se uma tabela existe
CREATE OR REPLACE FUNCTION public.check_table_exists(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    table_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
    ) INTO table_exists;
    
    RETURN table_exists;
END;
$$;

-- Permissões para a função check_table_exists
GRANT EXECUTE ON FUNCTION public.check_table_exists TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_table_exists TO anon;

-- Função para executar tarefas administrativas com SQL diretamente
CREATE OR REPLACE FUNCTION public.execute_system_task(task_name text, sql_command text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    -- Registrar a tarefa que está sendo executada
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
        'iniciado',
        'Iniciando execução da tarefa ' || task_name
    );
    
    -- Tentar executar o comando SQL
    BEGIN
        EXECUTE sql_command;
        
        -- Atualizar o log com sucesso
        UPDATE public.log_agente_automacao
        SET 
            status = 'sucesso',
            mensagem = 'Tarefa concluída com sucesso',
            updated_at = now()
        WHERE evento = task_name
        AND status = 'iniciado'
        ORDER BY created_at DESC
        LIMIT 1;
        
        result := jsonb_build_object(
            'success', true,
            'message', 'Comando executado com sucesso'
        );
    EXCEPTION WHEN OTHERS THEN
        -- Atualizar o log com erro
        UPDATE public.log_agente_automacao
        SET 
            status = 'erro',
            mensagem = 'Erro: ' || SQLERRM,
            updated_at = now()
        WHERE evento = task_name
        AND status = 'iniciado'
        ORDER BY created_at DESC
        LIMIT 1;
        
        result := jsonb_build_object(
            'success', false,
            'message', SQLERRM,
            'code', SQLSTATE
        );
    END;
    
    RETURN result;
END;
$$;

-- Permissões para a função execute_system_task (apenas para usuários autenticados)
GRANT EXECUTE ON FUNCTION public.execute_system_task TO authenticated;

-- Garantir que a tabela de log existe
CREATE TABLE IF NOT EXISTS public.log_agente_automacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evento TEXT NOT NULL,
    payload JSONB,
    status TEXT NOT NULL,
    mensagem TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para melhorar consultas por evento e status
CREATE INDEX IF NOT EXISTS idx_log_agente_evento_status 
ON public.log_agente_automacao(evento, status);

-- Adicionar comentários
COMMENT ON FUNCTION public.check_table_exists IS 'Verifica se uma tabela existe no schema public';
COMMENT ON FUNCTION public.execute_system_task IS 'Executa uma tarefa administrativa via SQL com registro e tratamento de erro';
COMMENT ON TABLE public.log_agente_automacao IS 'Registro de todas as operações automáticas do sistema';

-- Registrar a migração
INSERT INTO public.log_agente_automacao (
    evento,
    payload,
    status,
    mensagem
)
VALUES (
    'create_utility_functions',
    jsonb_build_object(
        'description', 'Criação de funções utilitárias para administração do banco de dados'
    ),
    'sucesso',
    'Funções utilitárias criadas com sucesso'
); 