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
    // Configuração de saída para melhorar o code splitting
    rollupOptions: {
      output: {
        // Estratégia de chunking para dividir o código em partes menores
        manualChunks: (id) => {
          // Separa React e React DOM
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor';
          }
          
          // Separa React Router
          if (id.includes('react-router')) {
            return 'react-router';
          }
          
          // Bibliotecas de formulários
          if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform/resolvers')) {
            return 'forms';
          }
          
          // Supabase
          if (id.includes('@supabase/')) {
            return 'supabase';
          }
          
          // TanStack Query
          if (id.includes('@tanstack/')) {
            return 'tanstack';
          }
          
          // Bibliotecas de utilidades
          if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge')) {
            return 'utils';
          }
          
          // Componentes e páginas da aplicação ficam em chunks separados
          if (id.includes('/src/components/') && !id.includes('index')) {
            return 'components';
          }
          
          if (id.includes('/src/pages/') && !id.includes('index')) {
            return 'pages';
          }
        }
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    css: false
  }
}));
