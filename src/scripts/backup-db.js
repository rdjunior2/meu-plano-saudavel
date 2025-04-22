import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Para obter o __dirname em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config();

// Data atual para o nome do arquivo de backup
const date = new Date();
const timestamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}`;

// Diretório onde o backup será salvo
const backupDir = path.join(__dirname, '../../backups/database');

// Cria o diretório de backup se não existir
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Variáveis de ambiente do Supabase (substitua pelos valores corretos se necessário)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Erro: As variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_KEY são necessárias.');
  console.log('Por favor, verifique seu arquivo .env e tente novamente.');
  process.exit(1);
}

// Função para realizar o backup das migrações
async function backupMigrations() {
  try {
    console.log('🔄 Realizando backup das migrações do Supabase...');
    
    // Copiar todas as migrações para o diretório de backup
    const migrationsDir = path.join(__dirname, '../../supabase/migrations');
    const backupMigrationsDir = path.join(backupDir, 'migrations');
    
    if (fs.existsSync(migrationsDir)) {
      if (!fs.existsSync(backupMigrationsDir)) {
        fs.mkdirSync(backupMigrationsDir, { recursive: true });
      }
      
      // Copiar todas as migrações
      fs.readdirSync(migrationsDir).forEach(file => {
        const srcPath = path.join(migrationsDir, file);
        const destPath = path.join(backupMigrationsDir, file);
        
        // Verificar se é um arquivo
        if (fs.statSync(srcPath).isFile()) {
          fs.copyFileSync(srcPath, destPath);
        }
      });
      
      console.log(`✅ Migrações copiadas para: ${backupMigrationsDir}`);
    } else {
      console.log('⚠️ Aviso: Diretório de migrações não encontrado.');
    }
    
    // Exportar metadados do projeto (se estiver usando CLI do Supabase)
    try {
      console.log('🔄 Tentando exportar metadados do Supabase (requer Supabase CLI)...');
      const metadataOutput = path.join(backupDir, `metadata_${timestamp}.json`);
      execSync(`npx supabase db dump -f ${metadataOutput}`, { stdio: 'inherit' });
      console.log(`✅ Metadados exportados para: ${metadataOutput}`);
    } catch (err) {
      console.log('⚠️ Aviso: Não foi possível exportar metadados. Supabase CLI pode não estar instalado ou configurado.');
      console.log('Para instalar o Supabase CLI, execute: npm install -g supabase');
    }
    
    console.log('✅ Backup das migrações concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao realizar backup das migrações:', error);
  }
}

// Executar o backup
backupMigrations(); 