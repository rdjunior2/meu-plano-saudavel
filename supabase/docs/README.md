# Documentação de Integração do Banco de Dados

Este diretório contém a documentação técnica resultante da auditoria e implementação de melhorias no banco de dados do sistema Meu Plano Saúde, com foco específico na integração com automações externas via n8n.

## Conteúdo

1. **[Diagrama ERD do Banco de Dados](database_erd.md)** - Diagrama completo da estrutura atual do banco 
2. **[Guia de Integração com n8n](n8n_integration.md)** - Instruções detalhadas para integração
3. **[Recomendações para Melhorias Futuras](recomendacoes_futuras.md)** - Sugestões para evolução do sistema

## O que foi implementado

1. **Funções para Integração com n8n**:
   - Um conjunto de funções SQL que facilitam a integração com automações externas
   - Implementadas no arquivo de migração `20240501000000_add_n8n_integration_helpers.sql`
   - Todas as funções são idempotentes, seguras e registram logs detalhados

2. **Documentação Técnica**:
   - Diagrama ERD atualizado do banco de dados
   - Guia detalhado para uso das funções com exemplos
   - Recomendações para futuras melhorias

## Como usar

### Para Integração com n8n

1. Configure o nó Supabase no n8n apontando para sua instância do Supabase
2. Utilize a função `process_new_purchase` para processar compras de forma completa
3. Consulte o [Guia de Integração com n8n](n8n_integration.md) para exemplos detalhados

### Para Desenvolvedores

1. Consulte o [Diagrama ERD](database_erd.md) para entender a estrutura completa do banco
2. Verifique as [Recomendações Futuras](recomendacoes_futuras.md) antes de fazer alterações estruturais
3. Mantenha esta documentação atualizada ao fazer mudanças no esquema

## Principais Descobertas da Auditoria

1. O sistema utiliza `auth.users` para autenticação e `profiles` para dados de perfil
2. O fluxo de compras segue `purchases` → `purchase_items` → produtos e formulários
3. Existem políticas RLS ativas que controlam o acesso às tabelas
4. A view `v_purchase_items` é utilizada para consolidar dados de compras

## Próximos Passos

1. Implementar as melhorias sugeridas no documento de recomendações
2. Realizar testes completos da integração com n8n
3. Atualizar esta documentação conforme necessário

---

Para dúvidas ou problemas, consulte os logs na tabela `log_agente_automacao` ou entre em contato com o administrador do sistema. 