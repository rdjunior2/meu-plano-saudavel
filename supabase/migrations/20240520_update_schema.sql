-- Criação da tabela de usuários
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  telefone TEXT UNIQUE NOT NULL,
  email TEXT,
  senha_hash TEXT,
  status TEXT NOT NULL DEFAULT 'aguardando_formulario',
  data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Criar índices para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS usuarios_telefone_idx ON public.usuarios (telefone);
CREATE INDEX IF NOT EXISTS usuarios_status_idx ON public.usuarios (status);

-- Criação da tabela de formulários de alimentação
CREATE TABLE IF NOT EXISTS public.formularios_alimentacao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  idade INTEGER NOT NULL,
  altura INTEGER NOT NULL,
  peso NUMERIC(5, 2) NOT NULL,
  sexo TEXT NOT NULL,
  objetivo TEXT NOT NULL,
  restricao TEXT,
  preferencias TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Criação da tabela de formulários de treino
CREATE TABLE IF NOT EXISTS public.formularios_treino (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  ja_treina BOOLEAN NOT NULL,
  frequencia INTEGER,
  equipamentos TEXT,
  foco TEXT,
  limitacoes TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Criação da tabela de planos
CREATE TABLE IF NOT EXISTS public.planos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  plano_alimentar JSONB,
  plano_treino JSONB,
  data_geracao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Adicionar função para verificar senha com bcrypt
CREATE OR REPLACE FUNCTION public.verificar_senha(telefone_param TEXT, senha_param TEXT)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  telefone TEXT,
  status TEXT,
  senha_valida BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id, 
    u.nome, 
    u.telefone, 
    u.status,
    (u.senha_hash = crypt(senha_param, u.senha_hash)) AS senha_valida
  FROM 
    public.usuarios u
  WHERE 
    u.telefone = telefone_param;
END;
$$;

-- Trigger para atualizar status do usuário após preenchimento dos formulários
CREATE OR REPLACE FUNCTION update_usuario_status() RETURNS TRIGGER AS $$
DECLARE
  tem_form_alimentacao BOOLEAN;
  tem_form_treino BOOLEAN;
BEGIN
  -- Verificar se o usuário tem formulário de alimentação
  SELECT EXISTS(
    SELECT 1 FROM public.formularios_alimentacao WHERE id_usuario = NEW.id_usuario
  ) INTO tem_form_alimentacao;
  
  -- Verificar se o usuário tem formulário de treino
  SELECT EXISTS(
    SELECT 1 FROM public.formularios_treino WHERE id_usuario = NEW.id_usuario
  ) INTO tem_form_treino;
  
  -- Se ambos os formulários estão preenchidos, atualizar status
  IF tem_form_alimentacao AND tem_form_treino THEN
    UPDATE public.usuarios 
    SET status = 'formulario_preenchido'
    WHERE id = NEW.id_usuario;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para cada tipo de formulário
CREATE TRIGGER trigger_formulario_alimentacao_insert
AFTER INSERT ON public.formularios_alimentacao
FOR EACH ROW
EXECUTE FUNCTION update_usuario_status();

CREATE TRIGGER trigger_formulario_treino_insert
AFTER INSERT ON public.formularios_treino
FOR EACH ROW
EXECUTE FUNCTION update_usuario_status();

-- Criar extensão para bcrypt se ainda não existir
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Permissões RLS (Row Level Security)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formularios_alimentacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formularios_treino ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para usuários
CREATE POLICY "Usuários podem ver seus próprios dados" 
  ON public.usuarios 
  FOR SELECT 
  USING (auth.uid() = id::text);

-- Políticas para formulários de alimentação
CREATE POLICY "Usuários podem inserir seus próprios formulários de alimentação" 
  ON public.formularios_alimentacao 
  FOR INSERT 
  WITH CHECK (auth.uid() = id_usuario::text);

CREATE POLICY "Usuários podem ver seus próprios formulários de alimentação" 
  ON public.formularios_alimentacao 
  FOR SELECT 
  USING (auth.uid() = id_usuario::text);

-- Políticas para formulários de treino
CREATE POLICY "Usuários podem inserir seus próprios formulários de treino" 
  ON public.formularios_treino 
  FOR INSERT 
  WITH CHECK (auth.uid() = id_usuario::text);

CREATE POLICY "Usuários podem ver seus próprios formulários de treino" 
  ON public.formularios_treino 
  FOR SELECT 
  USING (auth.uid() = id_usuario::text);

-- Políticas para planos
CREATE POLICY "Usuários podem ver seus próprios planos" 
  ON public.planos 
  FOR SELECT 
  USING (auth.uid() = id_usuario::text); 