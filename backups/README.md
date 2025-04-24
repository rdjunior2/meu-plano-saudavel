# Backups do Projeto

Este diretório contém backups do projeto, incluindo código-fonte, configurações e documentação da estrutura do banco de dados.

## Estrutura de Arquivos

- **Arquivos ZIP**: Backups completos do código-fonte (excluindo node_modules, .git e dist)
  - `backup_YYYY-MM-DD_HH-MM.zip` - Formato padrão dos arquivos de backup

- **Documentação**:
  - `estrutura_projeto_backup.md` - Documentação da estrutura de diretórios e arquivos
  - `dependencias_projeto_backup.md` - Documentação das dependências do projeto
  - `estrutura_banco_dados_backup.md` - Documentação da estrutura do banco de dados
  - `variaveis_ambiente_backup.md` - Documentação das variáveis de ambiente necessárias

- **Diretório database/**: Contém backups específicos do banco de dados (quando disponíveis)

## Como Criar um Backup

### Backup Automático

O projeto possui scripts pré-configurados para realizar backups:

1. **Backup do Código-Fonte**:
   ```
   npm run backup
   ```
   ou diretamente:
   ```
   node src/scripts/backup.js
   ```

2. **Backup do Banco de Dados**:
   ```
   npm run backup:db
   ```
   ou diretamente:
   ```
   node src/scripts/backup-db.js
   ```
   *Nota: Requer arquivo .env configurado com credenciais do Supabase*

3. **Backup Completo** (código-fonte + banco de dados):
   ```
   npm run backup:all
   ```

### Backup Manual

Para criar um backup manual:

1. Copie todos os arquivos relevantes (excluindo node_modules, .git e dist)
2. Compacte em um arquivo ZIP com nome no formato `backup_YYYY-MM-DD_HH-MM.zip`
3. Salve na pasta `backups/`

## Como Restaurar um Backup

### Restauração do Código-Fonte

1. Extraia o conteúdo do arquivo ZIP para uma pasta limpa
2. Execute `npm install` para instalar as dependências
3. Configure as variáveis de ambiente necessárias (ver `variaveis_ambiente_backup.md`)
4. Execute `npm run dev` para verificar se a aplicação está funcionando corretamente

### Restauração do Banco de Dados (Migrações)

Se você precisar restaurar a estrutura do banco de dados:

1. Crie um novo projeto no Supabase (se necessário)
2. Configure as variáveis de ambiente para apontar para o novo projeto
3. Execute as migrações na ordem correta (ver `estrutura_banco_dados_backup.md`)

## Boas Práticas

- Realize backups regulares (recomendado: semanal)
- Mantenha cópias em locais diferentes (não apenas neste diretório)
- Documente quaisquer alterações significativas na estrutura
- Teste a restauração periodicamente para garantir que os backups estão funcionais 