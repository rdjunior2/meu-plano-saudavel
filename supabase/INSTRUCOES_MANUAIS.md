# Instruções para Configuração Manual do Supabase

Este documento contém instruções para configurar manualmente o Supabase quando o CLI não funciona corretamente.

## 1. Configurações de Autenticação

Acesse o [Dashboard do Supabase](https://supabase.com/dashboard/project/_) e navegue até:

**Configurações > Autenticação > URL Settings**

Configure os seguintes valores:

1. **Site URL**: `https://meu-plano-saudavel.vercel.app`

2. **Redirect URLs**: Adicione as seguintes URLs:
   ```
   http://localhost:3000/reset-password
   http://localhost:5173/reset-password
   https://meu-plano-saudavel.vercel.app/reset-password
   ```

3. Em **Email Templates**, configure o template de **Reset Password** com uma mensagem amigável.

4. Em **Authentication > Email Auth**, verifique se **Secure email change** e **Secure password recovery** estão habilitados.

## 2. Configurações de CORS

Em **Configurações > API**, na seção **CORS (Cross-Origin Resource Sharing)**, configure:

1. **Allowed Origins**:
   ```
   http://localhost:3000
   http://localhost:5173
   https://meu-plano-saudavel.vercel.app
   ```

2. **Allowed Methods**: Selecione todos os métodos:
   ```
   GET, POST, PUT, DELETE, OPTIONS, PATCH
   ```

3. **Allowed Headers**: Adicione estes cabeçalhos:
   ```
   Authorization, Content-Type, Accept, X-Client-Info, apikey
   ```

4. Marque a opção **Allowed Credentials**
5. Defina **Max Age** para 3600 (1 hora)

## 3. Configurações via SQL

Se você tiver acesso ao **SQL Editor** do Supabase, execute o seguinte SQL para configurar os tempos de expiração dos tokens:

```sql
-- Configura tempo de expiração para tokens de acesso (24 horas)
UPDATE auth.config
SET access_token_lifetime = 86400;

-- Configura tempo de expiração para tokens de recuperação de senha (1 hora)
UPDATE auth.config
SET invite_expires_in = 3600;

-- Habilita a confirmação de emails
UPDATE auth.config
SET enable_signup_email_otp = true;

-- Habilita a recuperação de senha
UPDATE auth.config
SET enable_reset_password_email_otp = true;

-- Permite que confirmações de email sejam usadas para redefinição de senha
UPDATE auth.config
SET double_confirm_changes = true;

-- Configura cabeçalho de email para recuperação de senha
UPDATE auth.config
SET reset_password_email_subject = 'Meu Plano Saudável - Recuperação de Senha';
```

## 4. Verificação

Após aplicar as configurações, teste o fluxo de redefinição de senha:

1. Acesse a página de login
2. Clique em "Esqueceu a senha?"
3. Digite um email válido e solicite o link
4. Verifique o email (incluindo pasta de spam)
5. Clique no link de redefinição
6. Configure a nova senha
7. Verifique se consegue fazer login com a nova senha

## 5. Solução de Problemas

Se ocorrerem problemas:

1. **Erros de CORS**: Verifique no console do navegador (F12) se há erros de CORS. Certifique-se de que todas as origens estão configuradas corretamente.

2. **Token Expirado**: Os tokens de redefinição de senha expiram após o tempo configurado. Use o botão "Solicitar novo link" na página de redefinição se necessário.

3. **Redirecionamento Incorreto**: Verifique se a URL no email de redefinição está apontando para o domínio correto.

4. **Logs**: Verifique os logs do Supabase em **Configurações > Logs** para identificar possíveis erros no fluxo de autenticação. 