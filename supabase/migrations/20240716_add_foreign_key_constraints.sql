-- Adiciona constraints de chave estrangeira nas tabelas
-- para garantir integridade referencial entre as tabelas

-- Tabela purchase_items (relaciona compras com produtos)
ALTER TABLE IF EXISTS "public"."purchase_items"
    ADD CONSTRAINT "purchase_items_purchase_id_fkey" 
    FOREIGN KEY ("purchase_id") 
    REFERENCES "public"."purchases"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "public"."purchase_items"
    ADD CONSTRAINT "purchase_items_product_id_fkey" 
    FOREIGN KEY ("product_id") 
    REFERENCES "public"."products"("id") 
    ON DELETE RESTRICT 
    ON UPDATE CASCADE;

-- Tabela form_responses (relaciona respostas de formulário com compras e produtos)
ALTER TABLE IF EXISTS "public"."form_responses"
    ADD CONSTRAINT "form_responses_user_id_fkey" 
    FOREIGN KEY ("user_id") 
    REFERENCES "auth"."users"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "public"."form_responses"
    ADD CONSTRAINT "form_responses_purchase_id_fkey" 
    FOREIGN KEY ("purchase_id") 
    REFERENCES "public"."purchases"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "public"."form_responses"
    ADD CONSTRAINT "form_responses_product_id_fkey" 
    FOREIGN KEY ("product_id") 
    REFERENCES "public"."products"("id") 
    ON DELETE RESTRICT 
    ON UPDATE CASCADE;

-- Tabela purchases (relaciona compras com usuários)
ALTER TABLE IF EXISTS "public"."purchases"
    ADD CONSTRAINT "purchases_user_id_fkey" 
    FOREIGN KEY ("user_id") 
    REFERENCES "auth"."users"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

-- Adiciona campo de status para compras pendentes ou incompletas
ALTER TABLE IF EXISTS "public"."purchases"
    ADD COLUMN IF NOT EXISTS "processing_status" TEXT DEFAULT 'completo' CHECK ("processing_status" IN ('completo', 'incompleto'));

-- Adiciona index para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS "idx_purchases_user_id" ON "public"."purchases" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_purchase_items_purchase_id" ON "public"."purchase_items" ("purchase_id");
CREATE INDEX IF NOT EXISTS "idx_form_responses_user_id" ON "public"."form_responses" ("user_id");

-- Tabela log_agente_automacao para registrar logs importantes
CREATE TABLE IF NOT EXISTS "public"."log_agente_automacao" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "evento" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "severidade" TEXT NOT NULL CHECK ("severidade" IN ('info', 'warning', 'error', 'critical')),
    "metadata" JSONB DEFAULT '{}'::jsonb,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adiciona index para melhorar busca de logs por severidade
CREATE INDEX IF NOT EXISTS "idx_logs_severidade" ON "public"."log_agente_automacao" ("severidade");
CREATE INDEX IF NOT EXISTS "idx_logs_timestamp" ON "public"."log_agente_automacao" ("timestamp" DESC); 