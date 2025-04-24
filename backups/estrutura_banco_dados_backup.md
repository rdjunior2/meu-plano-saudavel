# Estrutura do Banco de Dados
Data de backup: 2025-04-22

## Visão Geral

Este projeto utiliza o Supabase como plataforma de banco de dados, que é construído sobre PostgreSQL. A estrutura do banco de dados é gerenciada através de migrações SQL localizadas em `supabase/migrations/`.

## Migrações Principais

A seguir, as principais migrações e suas funcionalidades:

### Tabelas de Usuários e Perfis
- `20240428000000_create_user_status_table.sql` - Criação da tabela de status de usuário
- `20240428000001_create_user_status_triggers.sql` - Triggers para gerenciamento de status de usuário
- `20240720000000_add_first_name_cpf_to_profiles.sql` - Adiciona campos nome e CPF aos perfis
- `20240720000001_add_cpf_index.sql` - Cria índice para melhorar performance em buscas por CPF
- `20240720000002_update_handle_new_user.sql` - Atualiza função para manipular novos usuários
- `20240416000005_add_missing_profile_fields.sql` - Adiciona campos adicionais aos perfis

### Planos e Assinaturas
- `20240409174706_add-plan-status-fields.sql` - Adiciona campos de status para planos
- `20240410000000_create_activate_user_plan_function.sql` - Cria função para ativação de planos de usuários

### Integrações e Automações
- `20240319000000_setup_automation_structure.sql` - Configura estrutura para automações
- `20240319000001_add_kiwify_integration.sql` - Adiciona integração com Kiwify
- `20240415000000_create_log_agente_automacao_and_update_function.sql` - Cria tabelas e funções para logging de automações
- `20240501000000_add_n8n_integration_helpers.sql` - Adiciona helpers para integração com n8n

### Administração
- `20240416000001_create_admin_user.sql` - Cria usuário administrador
- `20250422_update_auth_settings.sql` - Atualiza configurações de autenticação

### Alterações de Estrutura
- `20240716_add_foreign_key_constraints.sql` - Adiciona constraints de chave estrangeira

## Arquivos de Configuração

O Supabase possui vários arquivos de configuração importantes:
- `auth_settings.sql` - Configurações de autenticação
- `config.toml` - Configuração geral do Supabase
- `cors.toml` e `cors-config.toml` - Configurações de CORS para API
- `README-config.md` - Documentação sobre configuração do Supabase
- `README-auth-config.md` - Documentação específica para autenticação

## Funções e Triggers Importantes

As seguintes funções e triggers foram identificadas:
- Function `handle_new_user` - Gerencia a criação de perfis quando usuários são registrados
- Trigger para status de usuário - Atualiza automaticamente o status dos usuários
- Function `activate_user_plan` - Ativa planos para usuários
- Helpers para integração com n8n - Facilita a automação de workflows

## Estrutura de Tabelas Principais

Com base nas migrações, as principais tabelas parecem ser:

1. `auth.users` - Tabela padrão de usuários do Supabase Auth
2. `public.profiles` - Perfis dos usuários com campos personalizados
3. `public.user_status` - Status dos usuários
4. `public.plans` (inferido) - Informações sobre planos disponíveis
5. `public.user_plans` (inferido) - Relação entre usuários e planos
6. `public.log_agente_automacao` - Logs de automações
7. `public.kiwify_integration` - Integração com plataforma Kiwify

## Integrações

O sistema parece integrar com:
- Kiwify - Provavelmente para processamento de pagamentos
- n8n - Para automação de workflows 