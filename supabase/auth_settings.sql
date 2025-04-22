-- Atualiza as configurações de autenticação do Supabase para redefinição de senha
-- Aumentar a validade do token de recuperação de senha para 3 horas (10800 segundos)
UPDATE auth.config 
SET value = jsonb_set(
  value, 
  '{user_recovery_token_time_to_live}', 
  '10800'::jsonb
) 
WHERE name = 'auth';

-- Verificar e atualizar as URLs de redirecionamento permitidas
-- Limpa as configurações existentes
DELETE FROM auth.redirect_urls;

-- Adiciona apenas as URLs necessárias
INSERT INTO auth.redirect_urls (domain, site_url, created_at, updated_at)
VALUES
  ('meu-plano-saudavel.vercel.app', true, now(), now()),
  ('localhost:3000', false, now(), now());

-- Adiciona URLs específicas para reset de senha
INSERT INTO auth.redirect_urls (domain, site_url, created_at, updated_at)
VALUES
  ('meu-plano-saudavel.vercel.app/reset-password', false, now(), now()),
  ('localhost:3000/reset-password', false, now(), now());

-- Configurar as mensagens de email para redefinição de senha
UPDATE auth.templates
SET template = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redefinição de Senha - Meu Plano</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 20px; }
    .button { 
      display: inline-block; 
      background-color: #a794f7; 
      color: white; 
      padding: 12px 24px; 
      text-decoration: none; 
      border-radius: 4px; 
      margin: 20px 0;
    }
    .footer { font-size: 12px; color: #666; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Redefinição de Senha - Meu Plano</h2>
    </div>
    <p>Olá,</p>
    <p>Recebemos uma solicitação para redefinição de senha da sua conta. Se você não solicitou esta alteração, pode ignorar este email.</p>
    <p>Para redefinir sua senha, clique no botão abaixo:</p>
    <div style="text-align: center;">
      <a href="{{ .ConfirmationURL }}" class="button">Redefinir minha senha</a>
    </div>
    <p>Ou copie e cole o link abaixo no seu navegador:</p>
    <p>{{ .ConfirmationURL }}</p>
    <p>Este link é válido por 3 horas e pode ser usado apenas uma vez.</p>
    <div class="footer">
      <p>Atenciosamente,</p>
      <p>Equipe Meu Plano</p>
    </div>
  </div>
</body>
</html>'
WHERE template_type = 'recovery';

-- Atualizar a subject line do email de recuperação
UPDATE auth.templates
SET subject = 'Recuperação de senha - Meu Plano'
WHERE template_type = 'recovery';

-- Configurações adicionais para garantir redirecionamentos funcionando corretamente
UPDATE auth.config
SET value = jsonb_set(
  value,
  '{external_email_enabled}',
  'true'::jsonb
)
WHERE name = 'auth';

-- Verificar se as alterações foram aplicadas
SELECT name, value->>'user_recovery_token_time_to_live' AS recovery_token_ttl
FROM auth.config 
WHERE name = 'auth';

SELECT domain, site_url FROM auth.redirect_urls;

SELECT template_type, subject FROM auth.templates WHERE template_type = 'recovery'; 