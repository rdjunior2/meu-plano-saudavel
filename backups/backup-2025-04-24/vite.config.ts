import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Aumentando o limite de aviso para chunks grandes
    chunkSizeWarningLimit: 1000,
    // Configuração para melhorar compatibilidade
    minify: 'terser',
    terserOptions: {
      compress: {
        // Evitar problemas com nomes de referências
        keep_fnames: true,
        keep_classnames: true
      }
    },
    // Configuração de saída para melhorar o code splitting
    rollupOptions: {
      output: {
        // Estratégia simples de chunking
        manualChunks: {
          vendor: [
            'react', 
            'react-dom',
            'react-router-dom'
          ],
          // Inclua todos os componentes radix em um único chunk
          radix: Object.keys(require('./package.json').dependencies)
            .filter(pkg => pkg.startsWith('@radix-ui/')),
        }
      },
    },
  },
  // Desativa a minimização com esbuild para evitar problemas
  esbuild: {
    minifyIdentifiers: false
  },
  // Configuração para arquivos estáticos
  assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.webp'],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    css: false
  }
}));
