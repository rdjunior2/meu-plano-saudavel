# Estrutura do Banco de Dados

Este documento descreve a estrutura do banco de dados do projeto Lovable, incluindo tabelas, relacionamentos e índices.

## Tabelas

### user_plans_history

Tabela que armazena o histórico dos planos dos usuários.

```sql
CREATE TABLE public.user_plans_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    plan_id UUID NOT NULL,
    plan_name TEXT NOT NULL,
    plan_description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

#### Índices
- Índice na coluna `user_id` para otimizar consultas por usuário
- Índice nas colunas `start_date` e `end_date` para otimizar consultas por período

### user_plans_meals

Tabela que armazena as refeições associadas aos planos dos usuários.

```sql
CREATE TABLE public.user_plans_meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_plans_history_id UUID NOT NULL REFERENCES public.user_plans_history(id) ON DELETE CASCADE,
    meal_id UUID NOT NULL,
    meal_name TEXT NOT NULL,
    meal_description TEXT,
    meal_time TIME NOT NULL,
    weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

#### Índices
- Índice na coluna `user_plans_history_id` para otimizar consultas por plano
- Índice na coluna `weekday` para otimizar consultas por dia da semana

## Triggers

### update_updated_at_column()

Função que atualiza automaticamente o campo `updated_at` sempre que um registro é modificado.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';
```

Esta função é utilizada pelos seguintes triggers:

1. `update_user_plans_history_updated_at`
   - Tabela: `user_plans_history`
   - Evento: BEFORE UPDATE

2. `update_user_plans_meals_updated_at`
   - Tabela: `user_plans_meals`
   - Evento: BEFORE UPDATE

## Relacionamentos

- `user_plans_meals.user_plans_history_id` -> `user_plans_history.id` (ON DELETE CASCADE)
  - Quando um plano é excluído, todas as refeições associadas são automaticamente removidas

## Convenções

1. Todas as tabelas possuem:
   - Chave primária UUID
   - Campos de auditoria (`created_at` e `updated_at`)
   - Triggers para atualização automática do `updated_at`

2. Nomenclatura:
   - Tabelas: snake_case, plural
   - Colunas: snake_case
   - Índices: prefixo `idx_` seguido do nome da tabela e colunas

## Boas Práticas

1. Uso de tipos apropriados:
   - UUID para identificadores
   - TIMESTAMP WITH TIME ZONE para datas/horas
   - TEXT para campos de texto sem limite
   - SMALLINT com CHECK para enumerações

2. Índices estratégicos para otimizar consultas comuns

3. Integridade referencial garantida por foreign keys

4. Validações em nível de banco de dados através de constraints 