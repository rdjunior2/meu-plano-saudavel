DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'nome'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN nome TEXT;
        
        -- Registrar alteração no log (se a tabela existir)
        BEGIN
            INSERT INTO public.log_agente_automacao (
                evento,
                payload,
                status,
                mensagem
            )
            VALUES (
                'add_nome_to_profiles_manual',
                jsonb_build_object(
                    'table', 'profiles',
                    'action', 'add column',
                    'column', 'nome'
                ),
                'sucesso',
                'Campo nome adicionado manualmente à tabela profiles'
            );
        EXCEPTION WHEN OTHERS THEN
            -- Ignora erro se a tabela de log não existir
            NULL;
        END;
    END IF;
END $$; 