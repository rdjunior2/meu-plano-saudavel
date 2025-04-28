-- Migração para configurar políticas de acesso para usuários admin
-- Esta migração reforça as regras de acesso para garantir que apenas usuários admin
-- possam acessar determinadas tabelas e executar operações específicas

-- Função auxiliar para verificar se um usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id
    AND is_admin = true
  );
$$;

-- Políticas para tabelas que só devem ser acessadas por admins

-- 1. Proteger tabela de registros de usuários (profiles)
DROP POLICY IF EXISTS "Administradores podem visualizar todos os perfis" ON public.profiles;
CREATE POLICY "Administradores podem visualizar todos os perfis" 
ON public.profiles FOR SELECT 
TO authenticated
USING (
  auth.uid() = id OR 
  is_admin_user(auth.uid())
);

-- 2. Políticas para proteger operações em meal_plans que requerem admin
DROP POLICY IF EXISTS "Apenas admin pode ativar planos alimentares" ON public.meal_plans;
CREATE POLICY "Apenas admin pode ativar planos alimentares" 
ON public.meal_plans FOR UPDATE 
TO authenticated
USING (
  auth.uid() = user_id OR 
  is_admin_user(auth.uid())
)
WITH CHECK (
  (status = 'pendente' AND is_admin_user(auth.uid())) OR 
  auth.uid() = user_id
);

-- 3. Políticas para proteger operações em workout_plans que requerem admin
DROP POLICY IF EXISTS "Apenas admin pode ativar planos de treino" ON public.workout_plans;
CREATE POLICY "Apenas admin pode ativar planos de treino" 
ON public.workout_plans FOR UPDATE 
TO authenticated
USING (
  auth.uid() = user_id OR 
  is_admin_user(auth.uid())
)
WITH CHECK (
  (status = 'pendente' AND is_admin_user(auth.uid())) OR 
  auth.uid() = user_id
);

-- 4. Configurar política para registros de ativação de planos
DROP POLICY IF EXISTS "Apenas admin pode inserir ativações de planos" ON public.plan_activations;
CREATE POLICY "Apenas admin pode inserir ativações de planos" 
ON public.plan_activations FOR INSERT 
TO authenticated
WITH CHECK (
  is_admin_user(auth.uid())
);

-- 5. Configurar política para tabela de log de automação
DROP POLICY IF EXISTS "Apenas admin pode visualizar logs de automação" ON public.log_agente_automacao;
CREATE POLICY "Apenas admin pode visualizar logs de automação" 
ON public.log_agente_automacao FOR SELECT 
TO authenticated
USING (
  is_admin_user(auth.uid())
);

-- Função para facilitar a criação de novos usuários administradores
CREATE OR REPLACE FUNCTION public.promote_to_admin(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    -- Verificar se o usuário que está fazendo a chamada é admin
    IF NOT is_admin_user(auth.uid()) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Apenas administradores podem promover outros usuários'
        );
    END IF;

    -- Atualizar o perfil do usuário alvo para admin
    UPDATE public.profiles
    SET 
        is_admin = true,
        updated_at = NOW()
    WHERE id = target_user_id;

    -- Registrar na tabela de log
    INSERT INTO public.log_agente_automacao (
        evento,
        payload,
        status,
        mensagem
    )
    VALUES (
        'promote_to_admin',
        jsonb_build_object(
            'target_user_id', target_user_id,
            'admin_user_id', auth.uid()
        ),
        'sucesso',
        'Usuário promovido a administrador'
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Usuário promovido a administrador com sucesso'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$; 