import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ChevronRight,
  Users, 
  ClipboardList, 
  Settings, 
  FileText, 
  Bell, 
  LayoutDashboard,
  AlertTriangle,
  ChevronLeft,
  Clipboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { Toaster } from 'sonner';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const { user } = useAuthStore();
  const location = useLocation();

  const adminLinks = [
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
    }
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="admin-background">
      <Toaster position="top-right" />
      <div className="standard-container">
        {/* Cabeçalho com navegação */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="admin-page-title">{title}</h1>
            {subtitle && <p className="admin-page-subtitle">{subtitle}</p>}
          </div>
          
          <div className="mt-4 md:mt-0">
            <Button 
              variant="outline" 
              size="sm"
              asChild
            >
              <Link to="/dashboard">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Voltar para Dashboard
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Navegação administrativa */}
        <div className="flex overflow-x-auto pb-3 mb-6 gap-2">
          {adminLinks.map((link) => (
            <Button
              key={link.path}
              variant={isActive(link.path, link.exact) ? "default" : "outline"}
              size="sm"
              className={isActive(link.path, link.exact) ? "bg-sky-600 hover:bg-sky-700" : ""}
              asChild
            >
              <Link to={link.path}>
                {link.icon}
                {link.name}
              </Link>
            </Button>
          ))}
        </div>
        
        {/* Conteúdo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          {children}
        </div>
      </div>
    </div>
  );
} 