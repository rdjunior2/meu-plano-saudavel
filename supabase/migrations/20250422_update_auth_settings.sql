-- Atualiza as configurações de autenticação para permitir redefinição de senha
-- e garantir redirecionamentos seguros

-- Define os URLs de redirecionamento permitidos para redefinição de senha
UPDATE auth.config
SET redirect_urls = ARRAY[
  'http://localhost:3000/reset-password',
  'http://localhost:5173/reset-password',
  'https://meu-plano-saudavel.vercel.app/reset-password'
];

-- Configura tempo de expiração para tokens de acesso (24 horas)
UPDATE auth.config
SET access_token_lifetime = 86400; -- 24 horas em segundos

-- Configura tempo de expiração para tokens de recuperação de senha (1 hora)
UPDATE auth.config
SET invite_expires_in = 3600; -- 1 hora em segundos

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

-- Configura provedor de email padrão para o serviço
UPDATE auth.config
SET email_provider = 'default';

-- Verificar e atualizar as URLs de redirecionamento permitidas
INSERT INTO auth.redirect_urls (domain, site_url, created_at, updated_at)
VALUES
  ('meu-plano-saudavel.vercel.app', true, now(), now()),
  ('localhost:3000', false, now(), now()),
  ('meu-plano-saudavel.vercel.app/reset-password', false, now(), now()),
  ('localhost:3000/reset-password', false, now(), now())
ON CONFLICT (domain) DO NOTHING;

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