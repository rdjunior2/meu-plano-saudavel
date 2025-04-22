# Migração para Adicionar Tabela user_status

Este documento contém instruções para resolver o problema do dashboard em branco após o login, que ocorre porque a aplicação tenta acessar uma tabela `user_status` que não existe no banco de dados.

## Problema Encontrado

Nos logs do navegador, foi identificado o seguinte erro:

```
ykepyxcjsnvesbkuxgmv.supabase.co/rest/v1/user_status?select=alimentar_completed%2Ctreino_completed&user_id=eq.7d329dfb-4e50-40d9-947c-13ff9306755f:1 
Failed to load resource: the server responded with a status of 404 ()
```

Este erro ocorre porque a tabela `user_status` referenciada no código não existe no banco de dados Supabase.

## Solução Implementada

Foram criados dois arquivos de migração:

1. `20240428000000_create_user_status_table.sql`: Cria a tabela `user_status` com os campos necessários.
2. `20240428000001_create_user_status_triggers.sql`: Cria triggers para:
   - Adicionar registros para novos usuários automaticamente
   - Popular a tabela com usuários existentes

## Campos da Tabela

A tabela `user_status` contém os seguintes campos:

- `id`: UUID, chave primária
- `user_id`: UUID, referência para `auth.users(id)`
- `alimentar_completed`: Boolean, indica se o formulário alimentar foi preenchido
- `treino_completed`: Boolean, indica se o formulário de treino foi preenchido
- `created_at`: Timestamp com timezone, data de criação
- `updated_at`: Timestamp com timezone, data de atualização

## Como Executar a Migração

### Opção 1: Via CLI do Supabase (Recomendado)

1. Certifique-se de ter a CLI do Supabase instalada:
   ```bash
   npm install -g supabase
   ```

2. Faça login na CLI:
   ```bash
   supabase login
   ```

3. Execute as migrações:
   ```bash
   supabase db push
   ```

### Opção 2: Via SQL Editor no Dashboard do Supabase

1. Acesse o Dashboard do Supabase e selecione seu projeto
2. Navegue até a seção "SQL Editor"
3. Crie uma nova consulta
4. Copie e cole o conteúdo dos dois arquivos de migração
5. Execute a consulta

## Verificação

Após executar as migrações, você pode verificar se a tabela foi criada corretamente:

1. No Dashboard do Supabase, navegue até "Table Editor"
2. Procure pela tabela `user_status`
3. Verifique se há registros para os usuários existentes

## Impacto nas Funcionalidades

Após esta migração:

1. A página do dashboard deve carregar corretamente após o login
2. O status dos formulários será rastreado corretamente
3. A aplicação poderá exibir informações sobre o preenchimento dos formulários

## Observações

- A migração é idempotente e pode ser executada várias vezes sem causar problemas
- Os triggers garantem que novos usuários terão automaticamente um registro na tabela `user_status`
- Todos os eventos são registrados na tabela `log_agente_automacao` para auditoria 