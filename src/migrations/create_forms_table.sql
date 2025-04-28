-- Criação da tabela Forms para gerenciar formulários personalizados
CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'anamnese',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fields JSONB DEFAULT '[]'::jsonb
);

-- Criação da tabela auxiliar para vincular formulários a planos
CREATE TABLE IF NOT EXISTS plan_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL,
    form_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);

-- Criar índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_forms_type ON forms(type);
CREATE INDEX IF NOT EXISTS idx_forms_is_active ON forms(is_active);
CREATE INDEX IF NOT EXISTS idx_plan_forms_plan_id ON plan_forms(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_forms_form_id ON plan_forms(form_id); 