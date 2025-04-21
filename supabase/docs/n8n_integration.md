# Guia de Integração com n8n

Este documento descreve como integrar o n8n com a plataforma do Meu Plano Saúde usando as funções disponibilizadas no banco de dados Supabase.

## Diagrama ERD Simplificado

```
auth.users (PK: id)
 ↓ 1:1
profiles (PK: id = user_id)
 ↓ 1:n
purchases (PK: id, FK: user_id)
 ↓ 1:n
purchase_items (PK: id, FK: purchase_id, FK: product_id)
 ↑ n:1
products (PK: id)

form_responses (PK: id, FK: user_id, purchase_id, product_id)

plan_activations (PK: id, FK: user_id)
```

## Funções de Integração Disponíveis

### 1. Verificar se um usuário existe

Função: `check_user_exists(email)`

```sql
SELECT * FROM public.check_user_exists('cliente@email.com');
```

**Retorno**: UUID do usuário se existir, NULL caso contrário

### 2. Criar novo usuário

Função: `create_new_user_flow(email, nome, telefone, [password])`

```sql
SELECT * FROM public.create_new_user_flow(
  'cliente@email.com',
  'Nome do Cliente',
  '81999999999'
);
```

**Retorno**: Objeto JSON com status da operação e ID do usuário criado

### 3. Criar compra com itens

Função: `create_purchase_flow(user_id, kiwify_id, products, [purchase_date])`

```sql
SELECT * FROM public.create_purchase_flow(
  '123e4567-e89b-12d3-a456-426614174000', -- user_id
  'kiwify_123456',                        -- kiwify_id
  '[                                      -- products (array JSON)
    {"product_id": "123e4567-e89b-12d3-a456-426614174111"}, 
    {"product_id": "123e4567-e89b-12d3-a456-426614174222"}
  ]'::jsonb
);
```

**Retorno**: Objeto JSON com status da operação e ID da compra criada

### 4. Atualizar status de compra

Função: `update_purchase_status(kiwify_id, status)`

```sql
SELECT * FROM public.update_purchase_status(
  'kiwify_123456',                        -- kiwify_id
  'refunded'                              -- status
);
```

**Retorno**: Objeto JSON com status da operação

### 5. Fluxo completo (recomendado)

Função: `process_new_purchase(email, nome, telefone, kiwify_id, products, [purchase_date])`

```sql
SELECT * FROM public.process_new_purchase(
  'cliente@email.com',                    -- email
  'Nome do Cliente',                      -- nome
  '81999999999',                          -- telefone
  'kiwify_123456',                        -- kiwify_id
  '[                                      -- products (array JSON)
    {"product_id": "123e4567-e89b-12d3-a456-426614174111"}, 
    {"product_id": "123e4567-e89b-12d3-a456-426614174222"}
  ]'::jsonb
);
```

**Retorno**: Objeto JSON com status completo da operação, incluindo ID do usuário e da compra

## Configuração no n8n

### Fluxo Recomendado (Webhook Kiwify -> Meu Plano)

1. Criar um nó **Webhook** para receber notificações do Kiwify
2. Extrair dados relevantes do payload:
   - Email do cliente
   - Nome do cliente
   - Telefone do cliente
   - ID da transação no Kiwify
   - Data da compra
   - Produtos comprados

3. Usar o nó **Supabase** para chamar a função `process_new_purchase`:
   - **Operation**: Execute Function
   - **Function Name**: process_new_purchase
   - **Parameters**:
     ```json
     {
       "p_email": "{{$json.customer.email}}",
       "p_nome": "{{$json.customer.name}}",
       "p_telefone": "{{$json.customer.phone}}",
       "p_kiwify_id": "{{$json.transaction_id}}",
       "p_products": "[{\"product_id\": \"UUID-DO-PRODUTO\"}]",
       "p_purchase_date": "{{$json.created_at}}"
     }
     ```

4. Acrescentar um nó condicional para verificar o resultado:
   - Se `{{$json.success}} == true`, enviar email de confirmação
   - Se `{{$json.success}} == false`, notificar administrador sobre erro

### Atualizações de Status

1. Criar um nó **Webhook** para receber atualizações de status (ex: reembolsos)
2. Usar o nó **Supabase** para chamar a função `update_purchase_status`:
   - **Operation**: Execute Function
   - **Function Name**: update_purchase_status
   - **Parameters**:
     ```json
     {
       "p_kiwify_id": "{{$json.transaction_id}}",
       "p_status": "{{$json.status}}"
     }
     ```

## Monitoramento e Logs

Todas as operações são registradas na tabela `log_agente_automacao`. Para consultar os logs:

```sql
SELECT * FROM public.log_agente_automacao 
WHERE evento LIKE '%n8n%' 
ORDER BY created_at DESC 
LIMIT 100;
```

## Tratamento de Erros

Todas as funções:
1. Incluem validações para evitar operações duplicadas
2. Retornam objetos JSON com informações detalhadas de sucesso/erro
3. Registram automaticamente erros na tabela de logs
4. Utilizam transações quando apropriado para garantir atomicidade

## Notas Importantes

1. **Idempotência**: Todas as funções são idempotentes e seguras para executar múltiplas vezes com os mesmos parâmetros
2. **Segurança**: As funções são do tipo SECURITY DEFINER, o que significa que executam com privilégios elevados
3. **Permissões**: As funções estão configuradas para serem acessíveis via API Supabase para usuários autenticados e anônimos (no caso de webhooks)
4. **Fluxo de dados**: O email é o identificador principal utilizado para buscar/criar usuários

---

Em caso de dúvidas ou problemas, consulte os logs na tabela `log_agente_automacao` ou entre em contato com o administrador do sistema. 