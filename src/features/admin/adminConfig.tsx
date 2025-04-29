import React from 'react';
import { 
  LayoutDashboard,
  Users, 
  ClipboardList, 
  FileText, 
  Clipboard,
  Bell,
  BarChart,
  Settings,
  ShoppingBag,
  Coffee,
  Image
} from 'lucide-react';
import { ReactNode } from 'react';

// Definição local do tipo AdminNavItem
export interface AdminNavItem {
  path: string;
  name: string;
  icon: ReactNode;
  exact?: boolean;
}

/**
 * Configuração centralizada para a navegação administrativa
 */
export const adminNavItems: AdminNavItem[] = [
  { 
    path: '/admin', 
    name: 'Painel', 
    icon: <LayoutDashboard className="h-4 w-4 mr-2" />,
    exact: true
  },
  { 
    path: '/admin/planos', 
    name: 'Planos', 
    icon: <ClipboardList className="h-4 w-4 mr-2" /> 
  },
  { 
    path: '/admin/produtos', 
    name: 'Produtos', 
    icon: <ShoppingBag className="h-4 w-4 mr-2" /> 
  },
  { 
    path: '/admin/alimentos', 
    name: 'Alimentos', 
    icon: <Coffee className="h-4 w-4 mr-2" /> 
  },
  { 
    path: '/admin/usuarios', 
    name: 'Usuários', 
    icon: <Users className="h-4 w-4 mr-2" /> 
  },
  { 
    path: '/admin/formularios', 
    name: 'Formulários', 
    icon: <FileText className="h-4 w-4 mr-2" /> 
  },
  { 
    path: '/admin/respostas', 
    name: 'Respostas', 
    icon: <Clipboard className="h-4 w-4 mr-2" /> 
  },
  { 
    path: '/admin/notificacoes', 
    name: 'Notificações', 
    icon: <Bell className="h-4 w-4 mr-2" /> 
  },
  { 
    path: '/admin/estatisticas', 
    name: 'Estatísticas', 
    icon: <BarChart className="h-4 w-4 mr-2" /> 
  },
  { 
    path: '/admin/configuracoes', 
    name: 'Configurações', 
    icon: <Settings className="h-4 w-4 mr-2" /> 
  },
  { 
    path: '/admin/imagens', 
    name: 'Banco de Imagens', 
    icon: <Image className="h-4 w-4 mr-2" /> 
  }
];

/**
 * Mapeamento de títulos e subtítulos para rotas administrativas
 */
export const adminRouteMetadata: Record<string, { title: string; subtitle: string }> = {
  '/admin': {
    title: 'Painel Administrativo',
    subtitle: 'Visão geral do sistema'
  },
  '/admin/planos': {
    title: 'Planos',
    subtitle: 'Gerencie os planos disponíveis'
  },
  '/admin/produtos': {
    title: 'Produtos',
    subtitle: 'Gerencie os produtos disponíveis'
  },
  '/admin/alimentos': {
    title: 'Alimentos',
    subtitle: 'Gerencie o catálogo de alimentos'
  },
  '/admin/usuarios': {
    title: 'Usuários',
    subtitle: 'Gerencie os usuários do sistema'
  },
  '/admin/formularios': {
    title: 'Formulários',
    subtitle: 'Gerencie os formulários do sistema'
  },
  '/admin/respostas': {
    title: 'Respostas',
    subtitle: 'Visualize as respostas dos formulários'
  },
  '/admin/notificacoes': {
    title: 'Notificações',
    subtitle: 'Sistema de notificações'
  },
  '/admin/estatisticas': {
    title: 'Estatísticas',
    subtitle: 'Métricas e relatórios'
  },
  '/admin/configuracoes': {
    title: 'Configurações',
    subtitle: 'Ajustes do sistema'
  },
  '/admin/imagens': {
    title: 'Banco de Imagens',
    subtitle: 'Gerenciamento de mídia'
  }
}; 