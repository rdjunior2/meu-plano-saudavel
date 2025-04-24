# Dependências do Projeto
Data de backup: 2025-04-22

## Informações Gerais
- Nome do Projeto: vite_react_shadcn_ts
- Versão: 0.0.0
- Tipo: module

## Scripts

```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "build:dev": "vite build --mode development",
  "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
  "preview": "vite preview",
  "backup": "node src/scripts/backup.js",
  "backup:db": "node src/scripts/backup-db.js",
  "backup:all": "npm run backup && npm run backup:db",
  "test": "vitest",
  "test:run": "vitest run"
}
```

## Dependências Principais

```json
{
  "@hookform/resolvers": "^3.9.0",
  "@radix-ui/react-*": "vários componentes Radix UI",
  "@supabase/supabase-js": "^2.49.4",
  "@tanstack/react-query": "^5.56.2",
  "bcryptjs": "^3.0.2",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "date-fns": "^3.6.0",
  "dotenv": "^16.5.0",
  "embla-carousel-react": "^8.3.0",
  "framer-motion": "^12.7.3",
  "js-cookie": "^3.0.5",
  "lucide-react": "^0.462.0",
  "nanoid": "^5.1.5",
  "next-themes": "^0.3.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-hook-form": "^7.53.0",
  "react-router-dom": "^6.26.2",
  "recharts": "^2.12.7",
  "tailwind-merge": "^2.5.2",
  "tailwindcss-animate": "^1.0.7",
  "uuid": "^11.1.0",
  "zod": "^3.23.8",
  "zustand": "^5.0.3"
}
```

## Dependências de Desenvolvimento

```json
{
  "@eslint/js": "^9.9.0",
  "@tailwindcss/typography": "^0.5.15",
  "@testing-library/jest-dom": "^6.6.3",
  "@testing-library/react": "^16.3.0",
  "@types/node": "^22.5.5",
  "@types/react": "^18.3.3",
  "@types/react-dom": "^18.3.0",
  "@vitejs/plugin-react-swc": "^3.5.0",
  "@vitest/mocker": "^3.1.2",
  "archiver": "^7.0.1",
  "autoprefixer": "^10.4.20",
  "eslint": "^9.9.0",
  "jsdom": "^26.1.0",
  "postcss": "^8.4.47",
  "tailwindcss": "^3.4.11",
  "typescript": "^5.5.3",
  "vite": "^5.4.18",
  "vitest": "^3.1.2"
}
```

## Tecnologias Principais
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Shadcn UI (via componentes Radix UI)
- Supabase
- React Router
- React Query
- Zustand (gerenciamento de estado)
- Zod (validação)
- React Hook Form
- Vitest (testes)

## Observações
- O projeto utiliza o ecossistema Radix UI para componentes acessíveis
- Usa Tailwind CSS para estilização
- Integra com Supabase para backend
- Implementa testes com Vitest
- Utiliza React Router para navegação
- Implementa validação com Zod 