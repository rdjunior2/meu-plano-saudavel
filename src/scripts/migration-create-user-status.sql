-- Criar tabela user_status se não existir
CREATE TABLE IF NOT EXISTS public.user_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    alimentar_completed BOOLEAN DEFAULT FALSE,
    treino_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Adicionar comentários à tabela
COMMENT ON TABLE public.user_status IS 'Status dos formulários preenchidos pelo usuário';
COMMENT ON COLUMN public.user_status.alimentar_completed IS 'Indica se o formulário alimentar foi preenchido';
COMMENT ON COLUMN public.user_status.treino_completed IS 'Indica se o formulário de treino foi preenchido';

-- Adicionar triggers para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_status_updated_at ON public.user_status;
CREATE TRIGGER update_user_status_updated_at
BEFORE UPDATE ON public.user_status
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Criar função para obter estatísticas de compra do usuário
CREATE OR REPLACE FUNCTION public.get_user_purchase_status(user_id UUID)
RETURNS TABLE (
    user_id UUID,
    total_purchases INTEGER,
    completed_forms INTEGER,
    pending_forms INTEGER,
    ready_plans INTEGER,
    active_plans INTEGER,
    awaiting_plans INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH purchase_counts AS (
        SELECT
            p.user_id,
            COUNT(p.id) AS total_purchases,
            SUM(CASE WHEN pi.form_status = 'completed' THEN 1 ELSE 0 END) AS completed_forms,
            SUM(CASE WHEN pi.form_status = 'pending' OR pi.form_status = 'not_started' THEN 1 ELSE 0 END) AS pending_forms,
            SUM(CASE WHEN pi.plan_status = 'ready' THEN 1 ELSE 0 END) AS ready_plans,
            SUM(CASE WHEN pi.plan_status = 'active' THEN 1 ELSE 0 END) AS active_plans,
            SUM(CASE WHEN pi.plan_status = 'pending' OR pi.plan_status = 'in_progress' THEN 1 ELSE 0 END) AS awaiting_plans
        FROM 
            purchases p
        LEFT JOIN 
            purchase_items pi ON p.id = pi.purchase_id
        WHERE 
            p.user_id = get_user_purchase_status.user_id
            AND p.status = 'approved'
        GROUP BY 
            p.user_id
    )
    SELECT
        get_user_purchase_status.user_id,
        COALESCE(pc.total_purchases, 0) AS total_purchases,
        COALESCE(pc.completed_forms, 0) AS completed_forms,
        COALESCE(pc.pending_forms, 0) AS pending_forms,
        COALESCE(pc.ready_plans, 0) AS ready_plans,
        COALESCE(pc.active_plans, 0) AS active_plans,
        COALESCE(pc.awaiting_plans, 0) AS awaiting_plans
    FROM 
        (SELECT get_user_purchase_status.user_id) u
    LEFT JOIN 
        purchase_counts pc ON pc.user_id = u.user_id;
END;
$$; 