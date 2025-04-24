# Variáveis de Ambiente
Data de backup: 2025-04-22

## Variáveis Necessárias para o Banco de Dados

Conforme identificado no script `src/scripts/backup-db.js`, as seguintes variáveis de ambiente são necessárias para o backup do banco de dados:

```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_KEY=sua_chave_do_supabase
```

## Instruções para Configuração

1. Crie um arquivo `.env` na raiz do projeto
2. Adicione as variáveis acima com seus valores correspondentes
3. Para realizar backup do banco de dados, execute `npm run backup:db`

## Variáveis de Ambiente Adicionais

Dependendo da configuração do projeto, pode ser necessário configurar variáveis adicionais como:

```
VITE_APP_URL=url_da_aplicacao
VITE_API_URL=url_da_api
VITE_ENVIRONMENT=development|production|test
```

## Atenção para Segurança

- Nunca compartilhe seu arquivo `.env` contendo credenciais reais
- Certifique-se de que o arquivo `.env` está listado no `.gitignore`
- Para ambientes de produção, configure as variáveis de ambiente no painel do provedor de hospedagem (Vercel, Netlify, etc.)
- Para restauração de backup, será necessário reconfigurar estas variáveis de ambiente 