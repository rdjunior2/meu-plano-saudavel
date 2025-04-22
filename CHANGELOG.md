# Changelog

## [1.0.2] - 2025-04-28

### Correções
- **Tabela user_status adicionada:** 
  - Criada a tabela `user_status` que estava faltando no banco de dados.
  - Adicionados triggers para gerenciar automaticamente a criação de registros para novos usuários.
  - Implementada migração para criar registros para usuários existentes.
  - Corrigido o problema da página de dashboard em branco após o login.

### Melhorias
- **Índices e permissões:**
  - Adicionado índice para melhorar a performance em consultas à tabela `user_status`.
  - Configuradas permissões apropriadas para usuários anônimos e autenticados.

## [1.0.1] - 2025-04-22

### Refatoração
- **Centralização do cliente Supabase:** Removidas instâncias duplicadas do cliente Supabase, mantendo apenas um ponto de acesso em `@/lib/supabaseClient.ts`.
- **ANON_KEY atualizada:** Substituída a ANON_KEY por uma versão mais recente e válida (com data de expiração em 2025).
- **Padronização de imports:** Todos os arquivos agora usam o path alias `@/` para importar o cliente Supabase.

### Correções
- **Fluxo de recuperação de senha:** 
  - Corrigido o processo de recuperação de senha na página `ResetPassword.tsx` para processar corretamente os tokens da URL.
  - Implementada validação da sessão com `supabase.auth.getUser()` antes de permitir a redefinição de senha.
  - Adicionada limpeza do hash da URL após atualização bem-sucedida da senha.

### Remoções
- Removido arquivo `src/lib/supabase.ts` que continha uma instância duplicada do cliente.
- Removida criação manual de cliente na página `Login.tsx` para recuperação de senha.

### Segurança
- Implementada verificação da validade do JWT durante desenvolvimento.
- Melhorada a verificação de autenticação antes de permitir operações sensíveis. 