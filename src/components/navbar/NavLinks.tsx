import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Home, 
  FileText, 
  ListChecks, 
  Calendar, 
  MessageSquare, 
  BookOpen,
  Settings
} from 'lucide-react';

interface NavLinksProps {
  isAdmin: boolean;
  isAdminRoute: boolean;
}

const NavLinks: React.FC<NavLinksProps> = ({ isAdmin, isAdminRoute }) => {
  const location = useLocation();
  
  // Verificar se a rota atual corresponde ao link
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };
  
  // Classes de estilo para links
  const getLinkClasses = (path: string) => {
    const baseClasses = "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors";
    
    if (isAdminRoute) {
      return cn(baseClasses, isActive(path)
        ? "bg-secondary-50 text-secondary-800" 
        : "text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50/50");
    }
    
    return cn(baseClasses, isActive(path)
      ? "bg-primary-50 text-primary-800" 
      : "text-primary-600 hover:text-primary-900 hover:bg-primary-50/50");
  };
  
  return (
    <div className="hidden md:flex items-center space-x-1">
      {/* Links comuns visíveis em desktop */}
      <Link to="/dashboard" className={getLinkClasses('/dashboard')}>
        <Home className="h-4 w-4" />
        <span className="hidden lg:inline">Dashboard</span>
      </Link>
      
      <Link to="/meu-plano" className={getLinkClasses('/meu-plano')}>
        <BookOpen className="h-4 w-4" />
        <span className="hidden lg:inline">Meu Plano</span>
      </Link>
      
      <Link to="/tarefas-diarias" className={getLinkClasses('/tarefas-diarias')}>
        <ListChecks className="h-4 w-4" />
        <span className="hidden lg:inline">Tarefas</span>
      </Link>
      
      <Link to="/acompanhamento" className={getLinkClasses('/acompanhamento')}>
        <Calendar className="h-4 w-4" />
        <span className="hidden lg:inline">Acompanhamento</span>
      </Link>
      
      <Link to="/agente-nutri" className={getLinkClasses('/agente-nutri')}>
        <MessageSquare className="h-4 w-4" />
        <span className="hidden lg:inline">Agente Nutri</span>
      </Link>
      
      {/* Links administrativos - visíveis apenas para admins */}
      {isAdmin && !isAdminRoute && (
        <Link to="/admin" className={getLinkClasses('/admin')}>
          <Settings className="h-4 w-4" />
          <span className="hidden lg:inline">Admin</span>
        </Link>
      )}
    </div>
  );
};

export default NavLinks; 