import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { 
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Menu, X, LogOut, User, FileText, ShoppingBag, 
  Home, Settings, Users, FileEdit, ChevronRight, 
  BarChart2, Bell, Calendar, ListChecks, BookOpen,
  MessageSquare
} from 'lucide-react';

interface MobileMenuProps {
  isAdmin: boolean;
  isAdminRoute: boolean;
  handleLogout: () => Promise<void>;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ 
  isAdmin, 
  isAdminRoute,
  handleLogout
}) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  
  const userInitial = user?.nome ? user.nome.charAt(0).toUpperCase() : 'U';
  
  // Navegar e fechar o menu ao mesmo tempo
  const navigateTo = (path: string) => {
    navigate(path);
    setOpen(false);
  };
  
  // Verificar rota atual
  const isCurrentRoute = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          className="px-2" 
          aria-label="Menu de navegação"
        >
          <Menu className={`h-5 w-5 ${isAdminRoute ? 'text-secondary-600' : 'text-primary-600'}`} />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col w-[280px] sm:w-[350px] p-0">
        <SheetHeader className={`px-6 py-5 ${isAdminRoute ? 'bg-secondary-50' : 'bg-primary-50'}`}>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-gray-200">
              <AvatarImage src={user?.avatar_url || ''} alt={user?.nome || 'Usuário'} />
              <AvatarFallback className={`${
                isAdminRoute 
                  ? 'bg-secondary-100 text-secondary-700' 
                  : 'bg-primary-100 text-primary-700'
              } font-medium`}>
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <SheetTitle className={`text-left ${
                isAdminRoute ? 'text-secondary-800' : 'text-primary-800'
              }`}>
                {user?.nome || 'Usuário'}
              </SheetTitle>
              <SheetDescription className="text-left text-gray-500 text-xs truncate max-w-[200px]">
                {user?.email || ''}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-auto py-2">
          <div className="space-y-1 px-3">
            {/* Links comuns para todos os usuários */}
            <Button 
              variant={isCurrentRoute('/dashboard') ? "secondary" : "ghost"}
              className={`w-full justify-start text-left h-11 font-normal ${
                isCurrentRoute('/dashboard') 
                  ? 'bg-primary-50 text-primary-700' 
                  : 'text-gray-700'
              }`}
              onClick={() => navigateTo('/dashboard')}
            >
              <Home className="h-4 w-4 mr-3" />
              Dashboard
            </Button>
            
            <Button 
              variant="ghost"
              className={`w-full justify-start text-left h-11 font-normal ${
                isCurrentRoute('/meu-plano') 
                  ? 'bg-primary-50 text-primary-700' 
                  : 'text-gray-700'
              }`}
              onClick={() => navigateTo('/meu-plano')}
            >
              <BookOpen className="h-4 w-4 mr-3" />
              Meu Plano
            </Button>
            
            <Button 
              variant="ghost"
              className={`w-full justify-start text-left h-11 font-normal ${
                isCurrentRoute('/tarefas-diarias') 
                  ? 'bg-primary-50 text-primary-700' 
                  : 'text-gray-700'
              }`}
              onClick={() => navigateTo('/tarefas-diarias')}
            >
              <ListChecks className="h-4 w-4 mr-3" />
              Tarefas Diárias
            </Button>
            
            <Button 
              variant="ghost"
              className={`w-full justify-start text-left h-11 font-normal ${
                isCurrentRoute('/acompanhamento') 
                  ? 'bg-primary-50 text-primary-700' 
                  : 'text-gray-700'
              }`}
              onClick={() => navigateTo('/acompanhamento')}
            >
              <Calendar className="h-4 w-4 mr-3" />
              Acompanhamento
            </Button>
            
            <Button 
              variant="ghost"
              className={`w-full justify-start text-left h-11 font-normal ${
                isCurrentRoute('/agente-nutri') 
                  ? 'bg-primary-50 text-primary-700' 
                  : 'text-gray-700'
              }`}
              onClick={() => navigateTo('/agente-nutri')}
            >
              <MessageSquare className="h-4 w-4 mr-3" />
              Agente Nutricional
            </Button>
          </div>
          
          <Separator className="my-3" />
          
          <div className="space-y-1 px-3">
            <Button 
              variant="ghost"
              className={`w-full justify-start text-left h-11 font-normal ${
                isCurrentRoute('/perfil') 
                  ? 'bg-primary-50 text-primary-700' 
                  : 'text-gray-700'
              }`}
              onClick={() => navigateTo('/perfil')}
            >
              <User className="h-4 w-4 mr-3" />
              Meu Perfil
            </Button>
            
            <Button 
              variant="ghost"
              className={`w-full justify-start text-left h-11 font-normal ${
                isCurrentRoute('/formulario-alimentar') || isCurrentRoute('/formulario-treino') 
                  ? 'bg-primary-50 text-primary-700' 
                  : 'text-gray-700'
              }`}
              onClick={() => navigateTo('/perfil?tab=forms')}
            >
              <FileText className="h-4 w-4 mr-3" />
              Formulários
            </Button>
            
            <Button 
              variant="ghost"
              className={`w-full justify-start text-left h-11 font-normal ${
                isCurrentRoute('/historico-compras') 
                  ? 'bg-primary-50 text-primary-700' 
                  : 'text-gray-700'
              }`}
              onClick={() => navigateTo('/historico-compras')}
            >
              <ShoppingBag className="h-4 w-4 mr-3" />
              Histórico de Compras
            </Button>
          </div>
          
          {/* Links administrativos apenas para administradores */}
          {isAdmin && (
            <>
              <Separator className="my-3" />
              <div className="px-3 mb-1">
                <p className="text-xs text-gray-500 font-medium mb-2 px-4">
                  ÁREA ADMINISTRATIVA
                </p>
                
                <Button 
                  variant="ghost"
                  className={`w-full justify-start text-left h-11 font-normal ${
                    isCurrentRoute('/admin') && location.pathname === '/admin'
                      ? 'bg-secondary-50 text-secondary-700' 
                      : 'text-gray-700'
                  }`}
                  onClick={() => navigateTo('/admin')}
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Painel Admin
                </Button>
                
                <Button 
                  variant="ghost"
                  className={`w-full justify-start text-left h-11 font-normal ${
                    isCurrentRoute('/admin/planos') 
                      ? 'bg-secondary-50 text-secondary-700' 
                      : 'text-gray-700'
                  }`}
                  onClick={() => navigateTo('/admin/planos')}
                >
                  <BarChart2 className="h-4 w-4 mr-3" />
                  Gerenciar Planos
                </Button>
                
                <Button 
                  variant="ghost"
                  className={`w-full justify-start text-left h-11 font-normal ${
                    isCurrentRoute('/admin/usuarios') 
                      ? 'bg-secondary-50 text-secondary-700' 
                      : 'text-gray-700'
                  }`}
                  onClick={() => navigateTo('/admin/usuarios')}
                >
                  <Users className="h-4 w-4 mr-3" />
                  Gerenciar Usuários
                </Button>
                
                <Button 
                  variant="ghost"
                  className={`w-full justify-start text-left h-11 font-normal ${
                    isCurrentRoute('/admin/formularios') 
                      ? 'bg-secondary-50 text-secondary-700' 
                      : 'text-gray-700'
                  }`}
                  onClick={() => navigateTo('/admin/formularios')}
                >
                  <FileEdit className="h-4 w-4 mr-3" />
                  Formulários
                </Button>
                
                <Button 
                  variant="ghost"
                  className={`w-full justify-start text-left h-11 font-normal ${
                    isCurrentRoute('/admin/notificacoes') 
                      ? 'bg-secondary-50 text-secondary-700' 
                      : 'text-gray-700'
                  }`}
                  onClick={() => navigateTo('/admin/notificacoes')}
                >
                  <Bell className="h-4 w-4 mr-3" />
                  Notificações
                </Button>
              </div>
            </>
          )}
        </div>
        
        <div className="border-t p-4">
          <Button 
            variant="outline" 
            className="w-full justify-start border-gray-200 text-gray-700"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sair
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu; 