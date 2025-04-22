# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/a9a0413f-0572-4957-b1d0-ffc3a9240dc1

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/a9a0413f-0572-4957-b1d0-ffc3a9240dc1) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/a9a0413f-0572-4957-b1d0-ffc3a9240dc1) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes it is!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Como fazer backup do projeto

Para realizar backups do projeto, você tem as seguintes opções:

### Backup dos arquivos do projeto

```sh
npm run backup
```

Este comando criará um arquivo zip contendo todos os arquivos do projeto (exceto node_modules, dist, .git e outros diretórios temporários) no diretório `backups` na raiz do projeto. O nome do arquivo seguirá o formato `backup_AAAA-MM-DD_HH-MM.zip`.

### Backup do banco de dados Supabase

```sh
npm run backup:db
```

Este comando fará um backup das migrações do Supabase e tentará exportar os metadados do banco de dados (requer Supabase CLI). Os arquivos serão salvos no diretório `backups/database`.

### Backup completo (arquivos + banco de dados)

```sh
npm run backup:all
```

Este comando executará tanto o backup dos arquivos quanto o backup do banco de dados em sequência.

O backup é uma boa prática para preservar o estado atual do projeto e pode ser usado para restaurar o projeto em caso de problemas ou para transferir o projeto para outro ambiente.

Para restaurar um backup de arquivos, basta descompactar o arquivo zip em um diretório vazio e executar `npm install` para reinstalar as dependências.
