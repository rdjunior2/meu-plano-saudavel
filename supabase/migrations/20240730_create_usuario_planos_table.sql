-- Habilitando a extensão UUID caso ainda não esteja habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criação da tabela planos
CREATE TABLE IF NOT EXISTS public.planos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT NOT NULL CHECK (tipo IN ('nutricional', 'treino', 'combo')),
    imagem_url TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criação da tabela usuario_planos
CREATE TABLE IF NOT EXISTS public.usuario_planos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plano_id UUID NOT NULL REFERENCES public.planos(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'ativo', 'expirado', 'cancelado')),
    data_inicio DATE NOT NULL,
    data_termino DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_usuario_planos_usuario_id ON public.usuario_planos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_planos_plano_id ON public.usuario_planos(plano_id);
CREATE INDEX IF NOT EXISTS idx_usuario_planos_status ON public.usuario_planos(status);
CREATE INDEX IF NOT EXISTS idx_usuario_planos_datas ON public.usuario_planos(data_inicio, data_termino);
CREATE INDEX IF NOT EXISTS idx_planos_tipo ON public.planos(tipo);
CREATE INDEX IF NOT EXISTS idx_planos_ativo ON public.planos(ativo);

-- Trigger para atualização do campo updated_at na tabela planos
CREATE OR REPLACE FUNCTION update_planos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_planos_updated_at
BEFORE UPDATE ON public.planos
FOR EACH ROW EXECUTE FUNCTION update_planos_updated_at();

-- Trigger para atualização do campo updated_at na tabela usuario_planos
CREATE OR REPLACE FUNCTION update_usuario_planos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_usuario_planos_updated_at
BEFORE UPDATE ON public.usuario_planos
FOR EACH ROW EXECUTE FUNCTION update_usuario_planos_updated_at();

-- RLS (Row Level Security) para a tabela planos
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem visualizar os planos ativos
CREATE POLICY planos_select_policy ON public.planos 
    FOR SELECT 
    TO authenticated 
    USING (ativo = true OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    ));

-- Apenas administradores podem inserir, atualizar e excluir planos
CREATE POLICY planos_admin_policy ON public.planos 
    FOR ALL 
    TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    ));

-- RLS para a tabela usuario_planos
ALTER TABLE public.usuario_planos ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas seus próprios planos
CREATE POLICY usuario_planos_select_policy ON public.usuario_planos 
    FOR SELECT 
    TO authenticated 
    USING (usuario_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    ));

-- Apenas administradores podem inserir, atualizar e excluir planos de usuários
CREATE POLICY usuario_planos_admin_policy ON public.usuario_planos 
    FOR ALL 
    TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    ));

-- Garantir permissões
GRANT ALL ON public.planos TO anon;
GRANT ALL ON public.planos TO authenticated;
GRANT ALL ON public.usuario_planos TO anon;
GRANT ALL ON public.usuario_planos TO authenticated; 