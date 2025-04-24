-- Criar bucket para avatares se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket de avatares
-- Permitir acesso público de leitura para avatares
CREATE POLICY IF NOT EXISTS "Avatares são publicamente acessíveis" 
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Somente usuários autenticados podem fazer upload
CREATE POLICY IF NOT EXISTS "Usuários autenticados podem fazer upload" 
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Usuários só podem atualizar seus próprios avatares
CREATE POLICY IF NOT EXISTS "Usuários podem atualizar seus próprios avatares" 
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Usuários só podem excluir seus próprios avatares
CREATE POLICY IF NOT EXISTS "Usuários podem excluir seus próprios avatares" 
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Registrar alteração no log
INSERT INTO public.log_agente_automacao (
    evento,
    payload,
    status,
    mensagem
)
VALUES (
    'create_avatars_storage_bucket',
    jsonb_build_object(
        'bucket', 'avatars',
        'action', 'create bucket and policies'
    ),
    'sucesso',
    'Bucket de avatares e políticas criadas com sucesso'
); 