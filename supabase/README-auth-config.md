# Instruções para Configuração de Autenticação no Supabase

Este documento contém instruções para resolver o problema de "Link de recuperação inválido ou expirado" ao redefinir senhas.

## Passos para Configuração

1. Acesse o [Dashboard do Supabase](https://app.supabase.io/)
2. Selecione o projeto "Meu Plano"
3. No menu lateral, clique em "SQL Editor"
4. Clique em "New Query" (Nova consulta)
5. Cole o conteúdo do arquivo `auth_settings.sql` na janela de consulta
6. Execute a consulta clicando em "Run" (Executar)

## Verificação

Após executar o script, verifique se as alterações foram aplicadas executando estas consultas:

```sql
-- Verificar tempo de expiração do token
SELECT name, value->>'user_recovery_token_time_to_live' AS recovery_token_ttl
FROM auth.config 
WHERE name = 'auth';

-- Verificar URLs de redirecionamento permitidas
SELECT domain, site_url FROM auth.redirect_urls;

-- Verificar template de email de recuperação
SELECT template_type, subject FROM auth.templates WHERE template_type = 'recovery';
```

## Resumo das Alterações

As alterações aplicadas pelo script incluem:

1. **Aumento da validade do token de recuperação**:
   - Alterado de 1 hora (padrão) para 3 horas (10800 segundos)

2. **Simplificação das URLs de redirecionamento**:
   - Removidas URLs desnecessárias
   - Mantidas apenas as URLs essenciais para a funcionalidade de redefinição de senha

3. **Template de email melhorado**:
   - Design mais atraente
   - Instruções mais claras
   - Mensagem mais amigável

4. **Assunto do email atualizado**:
   - "Recuperação de senha - Meu Plano"

## Resolução de Problemas

Se os links de redefinição de senha continuarem apresentando problemas após estas alterações:

1. Verifique se a configuração `SITE_URL` no painel do Supabase (Authentication > URL Configuration) está correta
2. Garanta que todas as URLs de redirecionamento estão corretamente configuradas
3. Teste com um novo usuário para garantir que não há cache de tokens antigos
4. Verifique os logs de autenticação no painel do Supabase para identificar possíveis erros 