-- Script para adicionar a coluna avatar_url à tabela profiles
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna avatar_url se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
        
        -- Registrar alteração no log
        INSERT INTO public.log_agente_automacao (
            evento,
            payload,
            status,
            mensagem
        )
        VALUES (
            'add_avatar_url_to_profiles_manual',
            jsonb_build_object(
                'table', 'profiles',
                'action', 'add column',
                'column', 'avatar_url'
            ),
            'sucesso',
            'Campo avatar_url adicionado manualmente à tabela profiles'
        );
    END IF;
END $$; 