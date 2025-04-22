# Configuração do Supabase

Este documento descreve as configurações do Supabase para o projeto Meu Plano Saudável.

## Estrutura de Arquivos

- `supabase/migrations/`: Contém scripts SQL para migrações do banco de dados
- `supabase/cors.toml`: Configuração de CORS para o Supabase
- `supabase/config.toml`: Configuração geral do Supabase

## Migrações

### Autenticação

A migração `20250422_update_auth_settings.sql` atualiza as configurações de autenticação para:

- Definir URLs de redirecionamento permitidos para recuperação de senha
- Configurar tempos de expiração para tokens
- Habilitar confirmação de emails e recuperação de senha
- Configurar cabeçalhos de email personalizados

## Configuração CORS

O arquivo `cors.toml` configura:

- Origens permitidas (localhost, vercel)
- Métodos HTTP permitidos
- Cabeçalhos HTTP permitidos
- Suporte a credenciais
- Tempo de cache para respostas pré-voo

## Como Aplicar as Configurações

### Localmente

```bash
# Iniciar o Supabase localmente
supabase start

# Aplicar migrações
supabase db reset

# Verificar status
supabase status
```

### Ambiente de Produção

Para aplicar em produção:

1. Fazer login no Supabase CLI:
   ```bash
   supabase login
   ```

2. Vincular ao projeto:
   ```bash
   supabase link --project-ref <SUPABASE_PROJECT_ID>
   ```

3. Aplicar migrações:
   ```bash
   supabase db push
   ```

4. Aplicar configurações CORS:
   ```bash
   supabase functions deploy --config-file ./supabase/cors.toml
   ```

## Sincronização com GitHub

O fluxo recomendado para sincronização:

1. Desenvolver localmente com o Supabase local
2. Criar migrações para alterações no banco de dados
3. Testar localmente
4. Fazer commit das alterações no Git
5. Aplicar migrações no ambiente de produção após aprovação via PR

## Solução de Problemas

Se ocorrerem problemas com a autenticação:

1. Verifique se as URLs de redirecionamento estão configuradas corretamente
2. Verifique se a sincronização de tokens está funcionando no frontend
3. Verifique os logs do Supabase para identificar possíveis erros 