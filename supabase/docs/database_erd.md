# Diagrama ERD do Banco de Dados

Este documento apresenta o Diagrama de Entidade-Relacionamento (ERD) detalhado do banco de dados do sistema Meu Plano Saúde.

## Diagrama Conceitual

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "possui"
    PROFILES ||--o{ PURCHASES : "realiza"
    PURCHASES ||--o{ PURCHASE_ITEMS : "contém"
    PURCHASE_ITEMS }o--|| PRODUCTS : "referencia"
    PURCHASE_ITEMS }o--o{ FORM_RESPONSES : "associado_a"
    PROFILES ||--o{ MEAL_PLANS : "possui"
    PROFILES ||--o{ WORKOUT_PLANS : "possui"
    PROFILES ||--o{ PLAN_ACTIVATIONS : "possui"
    PLAN_ACTIVATIONS |o--o| MEAL_PLANS : "ativa"
    PLAN_ACTIVATIONS |o--o| WORKOUT_PLANS : "ativa"
    PROFILES ||--o{ NOTIFICATIONS : "recebe"
    PROFILES ||--o{ FORM_RESPONSES : "preenche"
    FORM_RESPONSES }o--|| PURCHASES : "associado_a"

    AUTH_USERS {
        UUID id PK
        string email "Email de autenticação"
        string encrypted_password
        timestamp email_confirmed_at
        jsonb raw_user_meta_data "Armazena nome e telefone"
        timestamp created_at
        timestamp updated_at
        string role "authenticated, etc"
    }

    PROFILES {
        UUID id PK,FK "Referencia auth.users.id"
        string status_geral "pendente, completo, bloqueado"
        boolean formulario_alimentar_preenchido
        boolean formulario_treino_preenchido
        boolean is_admin "Acesso administrativo"
        string telefone
        string nome
        string email "Duplica auth.users.email"
        timestamp created_at
        timestamp updated_at
    }

    PURCHASES {
        UUID id PK
        UUID user_id FK "Referencia auth.users.id"
        string kiwify_id "ID da transação no Kiwify"
        date purchase_date "Data da compra"
        string status "approved, refunded, pending, cancelled"
        timestamp created_at
        timestamp updated_at
    }

    PURCHASE_ITEMS {
        UUID id PK
        UUID purchase_id FK "Referencia purchases.id"
        UUID product_id FK "Referencia products.id"
        string form_status "pending, completed, not_started"
        string plan_status "ready, active, awaiting"
        timestamp created_at
    }

    PRODUCTS {
        UUID id PK
        string name "Nome do produto"
        string type "meal, workout, combo"
        boolean active "Produto ativo ou não"
        timestamp created_at
    }

    PLAN_ACTIVATIONS {
        UUID id PK
        UUID user_id FK "Referencia auth.users.id"
        string plan_type "Tipo de plano"
        UUID plan_id "ID do plano específico"
        string status "pendente, ativo, etc"
        timestamp activated_at "Data de ativação"
        timestamp expires_at "Data de expiração"
        timestamp created_at
    }

    MEAL_PLANS {
        UUID id PK
        string title "Título do plano"
        string description "Descrição"
        jsonb meals "Dados das refeições"
        UUID user_id FK "Referencia auth.users.id"
        string status "pendente, ativo, expirado, cancelado"
        date data_inicio "Data de início"
        date data_fim "Data de fim"
        timestamp created_at
        timestamp updated_at
    }

    WORKOUT_PLANS {
        UUID id PK
        string title "Título do plano"
        string description "Descrição"
        jsonb days "Dados dos treinos por dia"
        UUID user_id FK "Referencia auth.users.id"
        string status "pendente, ativo, expirado, cancelado"
        date data_inicio "Data de início"
        date data_fim "Data de fim"
        timestamp created_at
        timestamp updated_at
    }

    FORM_RESPONSES {
        UUID id PK
        UUID user_id FK "Referencia auth.users.id"
        string form_type "Tipo de formulário"
        int version "Versão do formulário"
        jsonb responses "Respostas do formulário"
        UUID purchase_id FK "Referencia purchases.id"
        UUID product_id FK "Referencia products.id"
        timestamp created_at
    }

    NOTIFICATIONS {
        UUID id PK
        UUID user_id FK "Referencia auth.users.id"
        string title "Título da notificação"
        string message "Mensagem"
        string type "Tipo da notificação"
        boolean read "Status de leitura"
        timestamp created_at
    }
```

## Visões (Views)

```mermaid
erDiagram
    V_PURCHASE_ITEMS {
        UUID purchase_id "ID da compra"
        UUID user_id "ID do usuário"
        string user_email "Email do usuário"
        string kiwify_id "ID da compra no Kiwify"
        string purchase_status "Status da compra"
        date purchase_date "Data da compra"
        UUID item_id "ID do item"
        UUID product_id "ID do produto"
        string product_name "Nome do produto"
        string product_type "Tipo do produto"
        string form_status "Status do formulário"
        string plan_status "Status do plano"
        boolean has_form_response "Tem resposta do formulário"
        timestamp item_created_at "Data de criação do item"
    }
```

## Constraints e Políticas

1. **Chaves Estrangeiras**:
   - profiles.id → auth.users.id (1:1)
   - purchases.user_id → auth.users.id (N:1)
   - purchase_items.purchase_id → purchases.id (N:1)
   - purchase_items.product_id → products.id (N:1)
   - form_responses.user_id → auth.users.id (N:1)
   - form_responses.purchase_id → purchases.id (N:1)
   - form_responses.product_id → products.id (N:1)
   - plan_activations.user_id → auth.users.id (N:1)
   - notifications.user_id → auth.users.id (N:1)
   - meal_plans.user_id → auth.users.id (N:1)
   - workout_plans.user_id → auth.users.id (N:1)

2. **Row Level Security (RLS)**:
   - profiles: Usuários só podem acessar seu próprio perfil
   - notifications: Usuários só podem ver suas próprias notificações
   - form_responses: Usuários só podem ver suas próprias respostas
   - log_agente_automacao: Apenas usuários admin podem ver logs
   - plan_activations: Apenas admin pode acessar

3. **Triggers**:
   - on_auth_user_created: Cria perfil automaticamente após inserção em auth.users
   - trg_update_profile_status: Atualiza status do perfil baseado em flags

## Fluxo de Dados Principal

1. Usuário é criado em `auth.users` (através do Supabase Auth)
2. Trigger cria automaticamente um registro em `profiles`
3. Quando uma compra é realizada:
   - Registro na tabela `purchases`
   - Itens individuais em `purchase_items`
   - Usuário preenche formulários registrados em `form_responses`
   - Profissionais criam planos em `meal_plans` e/ou `workout_plans`
   - Planos são ativados através de `plan_activations`

## Notas Importantes

- O identificador único principal é o `id` (UUID) de `auth.users`
- O email é armazenado em `auth.users.email` e duplicado em `profiles.email`
- As compras são identificadas externamente pelo `kiwify_id`
- Todas as tabelas usam UUID como chave primária
- A maioria das tabelas possui campos de auditoria (created_at, updated_at)
- Dados complexos são armazenados como JSONB (ex: meals, days, responses) 