# Funcionalidades Integradas ao Supabase

Este documento mapeia todas as funcionalidades do sistema que utilizam o banco de dados Supabase, servindo como referência para desenvolvedores.

## Estrutura de Integração

O projeto utiliza uma arquitetura centralizada para acesso ao Supabase, com as seguintes características:

- **Cliente centralizado**: `src/lib/supabaseClient.ts` é o ponto único de criação do cliente Supabase
- **Serviços especializados**: Na pasta `src/services/` existem módulos que encapsulam chamadas específicas à API
- **Tipos fortemente tipados**: Utilizamos tipos gerados a partir do schema do banco em `src/integrations/supabase/types.ts`

## Funcionalidades Principais

### 1. Autenticação e Autorização

**Arquivos principais:**
- `src/services/auth.ts` - Serviços de autenticação
- `src/stores/authStore.ts` - Store Zustand para gerenciamento de estado de autenticação
- `src/components/PrivateRoute.tsx` - Proteção de rotas para usuários autenticados
- `src/components/AdminRoute.tsx` - Proteção de rotas para administradores

**Funcionalidades:**
- Login/logout de usuários
- Recuperação de senha
- Verificação de sessão
- Verificação de permissões de administrador
- Proteção de rotas baseada em permissões

### 2. Gestão de Usuários

**Arquivos principais:**
- `src/services/users.ts` - Serviços para gerenciamento de usuários
- `src/pages/admin/UsuariosManager.tsx` - Interface de administração de usuários

**Funcionalidades:**
- Listagem de usuários
- Edição de perfis
- Promoção/rebaixamento de administradores
- Desativação de contas

### 3. Planos Alimentares

**Arquivos principais:**
- `src/services/purchases.ts` - Gerenciamento de compras e planos
- `src/pages/admin/PlanosManager.tsx` - Interface de administração de planos
- `src/pages/PlanoDetalhe.tsx` - Visualização detalhada de planos para usuários

**Funcionalidades:**
- Criação e edição de planos alimentares
- Atribuição de planos a usuários
- Ativação/desativação de planos
- Visualização de detalhes de planos

### 4. Formulários

**Arquivos principais:**
- `src/services/forms.ts` - Serviços para gerenciamento de formulários
- `src/pages/admin/FormularioManager.tsx` - Gestão de formulários
- `src/pages/admin/FormularioEditor.tsx` - Editor de formulários
- `src/pages/admin/RespostasManager.tsx` - Visualização de respostas

**Funcionalidades:**
- Criação e edição de formulários personalizados
- Resposta a formulários por usuários
- Visualização e exportação de respostas
- Análise de dados de formulários

### 5. Produtos

**Arquivos principais:**
- `src/services/products.ts` - Serviços para gerenciamento de produtos
- `app/routes/admin.produtos.*.tsx` - Rotas Remix para gestão de produtos

**Funcionalidades:**
- Cadastro e edição de produtos
- Precificação
- Upload e gerenciamento de imagens
- Vinculação de produtos a planos

### 6. Agente Nutri AI

**Arquivos principais:**
- `src/services/nutriAi.ts` - Serviços para o assistente nutricional
- `src/pages/AgenteNutri.tsx` - Interface de chat com o assistente

**Funcionalidades:**
- Chat com assistente nutricional
- Armazenamento de histórico de conversas
- Sugestões personalizadas

### 7. Tarefas Diárias

**Arquivos principais:**
- `src/pages/TarefasDiarias.tsx` - Interface de tarefas diárias

**Funcionalidades:**
- Checklist de tarefas nutricionais e de treino
- Registro de progresso diário
- Estatísticas de cumprimento

### 8. Acompanhamento

**Arquivos principais:**
- `src/pages/Acompanhamento.tsx` - Interface de acompanhamento de progresso

**Funcionalidades:**
- Gráficos de evolução corporal
- Registro de medidas
- Histórico de atividades

## Tabelas Principais do Supabase

- `profiles` - Perfis de usuários
- `products` - Produtos disponíveis para compra
- `purchases` - Registro de compras
- `purchase_items` - Itens de compra
- `meal_plans` - Planos alimentares
- `plan_activations` - Ativações de planos
- `forms` - Formulários personalizados
- `form_responses` - Respostas de formulários
- `form_fields` - Campos de formulários
- `user_status` - Status geral do usuário
- `notifications` - Notificações do sistema
- `log_agente_automacao` - Logs de automação

## Integração entre Implementações

O projeto está em processo de migração do React (Vite) para Remix, com as seguintes características:

1. **React (meu-plano)**: Implementação atual, completa e funcional
2. **Remix (app)**: Nova implementação em desenvolvimento, com foco inicial nas rotas administrativas

A migração está sendo feita gradualmente, mantendo a compatibilidade com o banco de dados Supabase e reutilizando a lógica de negócios existente. 