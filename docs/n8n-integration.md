# Integração com n8n

Este documento descreve como utilizar as funcionalidades implementadas para integração com o n8n.

## Estrutura do Banco de Dados

### Tabelas Principais

1. `profiles`: Perfis dos usuários
2. `plan_activations`: Ativações de planos
3. `notifications`: Notificações do sistema
4. `form_responses`: Respostas dos formulários
5. `log_agente_automacao`: Logs de automação

### Funções Auxiliares

1. `create_user_with_profile(user_email TEXT, user_data JSONB)`: Cria um novo usuário com perfil
2. `activate_user_plan(user_id UUID, plan_type TEXT, plan_id UUID, start_date DATE, end_date DATE)`: Ativa um plano para um usuário
3. `handle_kiwify_webhook(payload JSONB)`: Processa webhooks do Kiwify
4. `http_kiwify_webhook(payload JSONB)`: Endpoint HTTP para webhooks do Kiwify

## Configuração do n8n

### 1. Webhook do Kiwify

1. Crie um novo workflow no n8n
2. Adicione um nó "Webhook"
3. Configure o webhook para receber POST requests
4. Use a URL do Supabase Edge Function: `https://[PROJECT_REF].supabase.co/functions/v1/kiwify-webhook`

### 2. Processamento de Formulários

1. Crie um workflow para processar formulários
2. Use o nó "Supabase" para:
   - Inserir respostas na tabela `form_responses`
   - Atualizar status no perfil do usuário
   - Gerar notificações quando necessário

### 3. Automação de Planos

1. Configure triggers para:
   - Ativação de novos planos
   - Expiração de planos
   - Renovação automática

2. Use as funções auxiliares via nó "Supabase":
   ```sql
   SELECT activate_user_plan(
       '{{user_id}}',
       '{{plan_type}}',
       '{{plan_id}}',
       CURRENT_DATE,
       CURRENT_DATE + INTERVAL '30 days'
   );
   ```

## Logs e Monitoramento

### Tabela de Logs

A tabela `log_agente_automacao` registra:
- Evento
- Payload
- Status
- Mensagem
- Data/hora

### Consultas Úteis

1. Verificar logs de erro:
```sql
SELECT * FROM log_agente_automacao
WHERE status = 'erro'
ORDER BY created_at DESC;
```

2. Monitorar ativações de plano:
```sql
SELECT * FROM log_agente_automacao
WHERE evento = 'kiwify_webhook'
AND status = 'recebido'
ORDER BY created_at DESC;
```

## Segurança

1. Todas as tabelas têm RLS (Row Level Security) habilitado
2. Funções críticas são marcadas como SECURITY DEFINER
3. Apenas admins podem ver logs de automação
4. Usuários só podem ver seus próprios dados

## Troubleshooting

### Problemas Comuns

1. Webhook não processado:
   - Verifique os logs em `log_agente_automacao`
   - Confirme se o payload está correto
   - Verifique permissões do usuário

2. Plano não ativado:
   - Verifique se o usuário existe
   - Confirme se o tipo de plano está correto
   - Verifique os logs de erro

### Suporte

Para problemas técnicos:
1. Consulte os logs em `log_agente_automacao`
2. Verifique as políticas de RLS
3. Confirme as permissões do usuário
4. Verifique a configuração do n8n 