# Meu Plano - Aplicação de Gerenciamento de Planos Nutricionais e de Treino

## Informações do Projeto

**URL**: https://lovable.dev/projects/a9a0413f-0572-4957-b1d0-ffc3a9240dc1

## Índice
1. [Tecnologias Utilizadas](#tecnologias-utilizadas)
2. [Configuração do Ambiente](#configuração-do-ambiente)
3. [Desenvolvimento](#desenvolvimento)
4. [Produção](#produção)
5. [Sistema de Backup](#sistema-de-backup)
6. [Correções e Migrações](#correções-e-migrações)
7. [Estrutura do Projeto](#estrutura-do-projeto)
8. [Domínio Personalizado](#domínio-personalizado)
9. [Funcionalidade de Assinatura e Status do Usuário](#funcionalidade-de-assinatura-e-status-do-usuário)

## Tecnologias Utilizadas

- **Frontend**: React, TypeScript, Vite
- **Estilização**: Tailwind CSS, shadcn-ui
- **Backend/API**: Supabase (Auth, Database, Storage, Functions)
- **Gerenciamento de Estado**: Zustand
- **Roteamento**: React Router

## Configuração do Ambiente

### Instalação Local

```sh
# Clonar o repositório
git clone <URL_DO_REPOSITÓRIO>

# Navegar até o diretório do projeto
cd meu-plano

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

### Edição no GitHub

- Navegue até o arquivo desejado
- Clique no botão "Edit" (ícone de lápis)
- Faça suas alterações e confirme as mudanças

### GitHub Codespaces

- Navegue até a página principal do repositório
- Clique no botão "Code" (botão verde)
- Selecione a guia "Codespaces"
- Clique em "New codespace" para iniciar um novo ambiente

## Desenvolvimento

```sh
# Iniciar servidor de desenvolvimento
npm run dev

# Executar testes
npm test

# Verificar linting
npm run lint
```

## Produção

```sh
# Compilar para produção
npm run build

# Visualizar build de produção localmente
npm run preview

# Deploy via Lovable
# Acesse https://lovable.dev/projects/a9a0413f-0572-4957-b1d0-ffc3a9240dc1
# e clique em Share -> Publish
```

## Sistema de Backup

### Backup do Código-Fonte
```sh
npm run backup
```
Este comando cria um arquivo ZIP contendo todo o código-fonte (exceto node_modules, dist, etc) na pasta `backups/`.

### Backup do Banco de Dados
```sh
npm run backup:db
```
Este comando exporta migrações e metadados do Supabase para `backups/database/`.

### Backup Completo
```sh
npm run backup:all
```
Executa tanto o backup do código quanto do banco de dados.

### Restauração de Backup

1. Extraia o conteúdo do arquivo ZIP para uma pasta limpa
2. Execute `npm install` para instalar as dependências
3. Configure as variáveis de ambiente necessárias
4. Execute as migrações do banco de dados, se necessário

## Correções e Migrações

### Correção de Erro 404 em Endpoints do Supabase

Para corrigir problemas com a tabela `user_status` e a função RPC `get_user_purchase_status`:

1. Acesse o painel de administração do Supabase
2. Navegue até SQL Editor
3. Cole o conteúdo do arquivo `src/scripts/migration-create-user-status.sql`
4. Execute o script

## Estrutura do Projeto

O projeto segue uma estrutura organizada por funcionalidades:

- `/src/components` - Componentes reutilizáveis
- `/src/pages` - Páginas da aplicação
- `/src/services` - Serviços para comunicação com APIs
- `/src/stores` - Gerenciamento de estado com Zustand
- `/src/hooks` - Hooks personalizados
- `/src/utils` - Funções utilitárias
- `/src/types` - Definições de tipos TypeScript
- `/src/assets` - Recursos estáticos (imagens, etc.)

## Domínio Personalizado

Para conectar um domínio personalizado:
1. Navegue até Project > Settings > Domains
2. Clique em Connect Domain
3. Siga as instruções em [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Funcionalidade de Assinatura e Status do Usuário

O sistema inclui recursos para gerenciar o status de assinatura e progresso do usuário:

### Estrutura do Banco de Dados

- **Tabela `user_status`**: Armazena dados sobre o status de compra e preenchimento de formulários
- **Visão `user_full_status`**: Fornece uma visão completa combinando dados de perfil, status e acesso
- **Funções RPC**:
  - `get_user_purchase_status`: Obtém informações de compra do usuário
  - `update_user_purchase_status`: Atualiza status de compra
  - `update_dietary_form_status`: Atualiza status do formulário alimentar
  - `update_training_form_status`: Atualiza status do formulário de treino
  - `check_user_access`: Verifica se o usuário tem acesso aos recursos
  - `process_payment_webhook`: Processa webhooks de pagamento

### Integração de Pagamento

O sistema está preparado para receber webhooks de plataformas de pagamento:

1. Edge Function `payment-webhook`: Processa notificações de pagamento
2. Atualização automática do status de assinatura dos usuários
3. Verificação de expiração de assinaturas

### Uso no Frontend

```typescript
// Verificar status completo do usuário
const { data } = await supabase.from('user_full_status')
  .select('*')
  .eq('user_id', userId)
  .single();

// Verificar acesso
const { data } = await supabase.rpc('check_user_access', {
  p_user_id: userId
});

// Atualizar status de formulário
const { data } = await supabase.rpc('update_dietary_form_status', {
  p_user_id: userId,
  p_completed: true
});
```

### Sincronização de Status

O sistema mantém automaticamente a sincronização entre:
- Status de compra e acesso do usuário
- Status de preenchimento de formulários
- Progressão do usuário no sistema
