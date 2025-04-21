# Migração: Adição dos campos first_name e cpf à tabela profiles

Esta migração adiciona dois novos campos à tabela `profiles` do banco de dados:

- `first_name`: Campo de texto para armazenar o primeiro nome do usuário, útil para personalização de mensagens
- `cpf`: Campo de texto para armazenar o CPF do usuário, com restrição de unicidade

## Alterações Realizadas

### 1. Tabela `profiles`

Foram adicionados à tabela `profiles`:
- Coluna `first_name` (TEXT, permite NULL)
- Coluna `cpf` (TEXT, permite NULL)
- Restrição de unicidade (`profiles_cpf_unique`) para o campo `cpf`
- Índice (`idx_profiles_cpf`) para otimizar consultas pelo campo `cpf`

### 2. Tipos TypeScript

Os tipos TypeScript foram atualizados para incluir os novos campos:

```typescript
profiles: {
  Row: {
    // ... campos existentes
    first_name: string | null
    cpf: string | null
  }
  // ... Insert e Update types
}
```

### 3. Função `handle_new_user`

A função de trigger `handle_new_user` foi atualizada para:
- Obter os campos `first_name` e `cpf` do `raw_user_metadata`
- Inserir esses dados na tabela `profiles` ao criar um novo usuário
- Registrar os novos campos no log de automação

### 4. Webhook da Kiwify

O webhook de integração com a Kiwify foi atualizado para:
- Capturar os campos `first_name` e `cpf` do payload do webhook
- Processar e formatar os dados recebidos
- Inserir ou atualizar esses dados na tabela `profiles`
- Verificar se o CPF já está em uso por outro usuário (para evitar conflitos)
- Registrar logs detalhados sobre o processamento

## Comportamento em Caso de Conflito de CPF

Se o CPF informado já estiver em uso por outro usuário:
1. Um erro é registrado no log `log_agente_automacao`
2. O processamento do webhook continua normalmente
3. O CPF não é atualizado no perfil do usuário atual

## Logs Adicionados

Novos eventos de log foram adicionados:
- `kiwify_customer_data`: Registra os dados do cliente recebidos do webhook
- `webhook_kiwify_cpf_conflict`: Registra conflitos de CPF
- `webhook_kiwify_profile_update_error`: Registra erros na atualização do perfil

## Próximos Passos

- Verificar se a migração foi aplicada corretamente
- Monitorar os logs para identificar possíveis conflitos de CPF
- Atualizar a interface administrativa (se existente) para exibir os novos campos 