-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create missing tables
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    status_geral TEXT DEFAULT 'pendente',
    formulario_alimentar_preenchido BOOLEAN DEFAULT false,
    formulario_treino_preenchido BOOLEAN DEFAULT false,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_status_geral CHECK (status_geral IN ('pendente', 'completo', 'bloqueado'))
);

CREATE TABLE IF NOT EXISTS public.plan_activations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL,
    plan_id UUID NOT NULL,
    status TEXT DEFAULT 'pendente',
    activated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.form_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    form_type TEXT NOT NULL,
    version INTEGER NOT NULL,
    responses JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.log_agente_automacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evento TEXT NOT NULL,
    payload JSONB,
    status TEXT NOT NULL,
    mensagem TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_form_responses_user_type ON public.form_responses(user_id, form_type);
CREATE INDEX IF NOT EXISTS idx_form_responses_version ON public.form_responses(version);
CREATE INDEX IF NOT EXISTS idx_logs_evento ON public.log_agente_automacao(evento);
CREATE INDEX IF NOT EXISTS idx_logs_status ON public.log_agente_automacao(status);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON public.log_agente_automacao(created_at);

-- 3. Create or replace functions and triggers
CREATE OR REPLACE FUNCTION update_profile_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.formulario_alimentar_preenchido AND NEW.formulario_treino_preenchido THEN
        NEW.status_geral := 'completo';
    ELSE
        NEW.status_geral := 'pendente';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_profile_status ON public.profiles;
CREATE TRIGGER trg_update_profile_status
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_profile_status();

-- 4. Add constraints to existing tables
DO $$ 
BEGIN
    ALTER TABLE public.meal_plans
    ADD CONSTRAINT valid_status CHECK (status IN ('pendente', 'ativo', 'expirado', 'cancelado'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 5. Create RLS policies
ALTER TABLE public.plan_activations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_access ON public.plan_activations;
CREATE POLICY admin_access ON public.plan_activations
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
));

-- 6. Create helper functions for n8n integration
CREATE OR REPLACE FUNCTION create_user_with_profile(
    user_email TEXT,
    user_data JSONB
) RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Mock implementation - to be replaced with actual auth integration
    new_user_id := gen_random_uuid();
    INSERT INTO public.profiles (id) VALUES (new_user_id);
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION activate_user_plan(
    user_id UUID,
    plan_type TEXT,
    plan_id UUID,
    start_date DATE,
    end_date DATE
) RETURNS UUID AS $$
DECLARE
    activation_id UUID := uuid_generate_v4();
BEGIN
    INSERT INTO public.plan_activations (
        id, user_id, plan_type, plan_id, status, activated_at, expires_at
    ) VALUES (
        activation_id, user_id, plan_type, plan_id, 'ativo', start_date, end_date
    );
    RETURN activation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Add additional RLS policies for security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_agente_automacao ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY profiles_access ON public.profiles FOR ALL
TO authenticated
USING (id = auth.uid());

-- Users can only see their own notifications
CREATE POLICY notifications_access ON public.notifications FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- Users can only see their own form responses
CREATE POLICY form_responses_access ON public.form_responses FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- Only admins can see automation logs
CREATE POLICY logs_admin_access ON public.log_agente_automacao FOR ALL
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
)); 