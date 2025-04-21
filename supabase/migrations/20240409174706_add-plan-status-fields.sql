-- 1. Adicionar campos nas tabelas
ALTER TABLE public.meal_plans
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS data_inicio DATE,
ADD COLUMN IF NOT EXISTS data_fim DATE;

ALTER TABLE public.workout_plans
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS data_inicio DATE,
ADD COLUMN IF NOT EXISTS data_fim DATE;

-- 2. Função para atualizar o status
CREATE OR REPLACE FUNCTION update_plan_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.data_fim IS NOT NULL AND NEW.data_fim < CURRENT_DATE THEN
    NEW.status := 'expirado';
  ELSIF NEW.data_inicio IS NOT NULL AND NEW.data_fim IS NOT NULL THEN
    NEW.status := 'ativo';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Triggers
DROP TRIGGER IF EXISTS trg_update_meal_plan_status ON public.meal_plans;
CREATE TRIGGER trg_update_meal_plan_status
BEFORE UPDATE ON public.meal_plans
FOR EACH ROW EXECUTE FUNCTION update_plan_status();

DROP TRIGGER IF EXISTS trg_update_workout_plan_status ON public.workout_plans;
CREATE TRIGGER trg_update_workout_plan_status
BEFORE UPDATE ON public.workout_plans
FOR EACH ROW EXECUTE FUNCTION update_plan_status();
