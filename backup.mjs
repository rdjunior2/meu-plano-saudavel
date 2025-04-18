import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar o diretório de backup se não existir
const backupDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Nome do arquivo de backup baseado na data atual
const date = new Date();
const timestamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;
const backupFileName = `projeto_backup_${timestamp}.zip`;
const backupPath = path.join(backupDir, backupFileName);

console.log(`Criando backup em: ${backupPath}`);

// Criar um arquivo de saída
const output = fs.createWriteStream(backupPath);
const archive = archiver('zip', {
  zlib: { level: 9 } // Nível máximo de compressão
});

// Ouvir por erros e finalização
output.on('close', function() {
  console.log(`Backup concluído com sucesso: ${backupPath}`);
  console.log(`Tamanho total: ${archive.pointer()} bytes`);
});

archive.on('error', function(err) {
  throw err;
});

// Pipe arquivos de saída
archive.pipe(output);

// Adicionar todos os arquivos exceto node_modules e .git
archive.glob('**/*', {
  cwd: __dirname,
  ignore: ['node_modules/**', '.git/**', backupDir + '/**', 'backup.mjs']
});

// Finalizar o arquivo
archive.finalize();
