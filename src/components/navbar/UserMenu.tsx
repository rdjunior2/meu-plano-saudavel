import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { User, LogOut, Settings, ShoppingBag, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserMenuProps {
  user: any;
  isAdminRoute: boolean;
  handleLogout: () => Promise<void>;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, isAdminRoute, handleLogout }) => {
  const navigate = useNavigate();
  
  // Determinar os estilos com base na rota administrativa
  const primaryColor = isAdminRoute ? 'secondary' : 'primary';
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`rounded-full bg-${primaryColor}-50 hover:bg-${primaryColor}-100 btn-hover-effect`}
          aria-label="Menu do usuário"
        >
          <Avatar className={`h-8 w-8 border-2 border-${primaryColor}-200`}>
            <AvatarImage src={user?.avatar_url || ''} alt={user?.nome || 'Usuário'} />
            <AvatarFallback className={`bg-gradient-to-br from-${primaryColor}-400 to-${primaryColor === 'primary' ? 'green' : 'blue'}-500 text-white`}>
              {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className={`animate-slide-in w-60 overflow-hidden border border-${primaryColor}-100`}
      >
        <DropdownMenuLabel className={`bg-${primaryColor}-50 font-medium text-${primaryColor}-700`}>
          <div className="flex items-center space-x-3 py-1.5">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar_url || ''} alt={user?.nome || 'Usuário'} />
              <AvatarFallback className={`bg-gradient-to-br from-${primaryColor}-400 to-${primaryColor === 'primary' ? 'green' : 'blue'}-500 text-white`}>
                {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-semibold truncate max-w-[160px]">{user?.nome || 'Usuário'}</span>
              <span className={`text-xs text-${primaryColor}-600 truncate max-w-[160px]`}>
                {user?.email || ''}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className={`bg-${primaryColor}-100`} />
        
        <DropdownMenuItem 
          onClick={() => navigate('/perfil')}
          className={`cursor-pointer hover:bg-${primaryColor}-50 focus:bg-${primaryColor}-50 transition-colors duration-200`}
        >
          <User className={`mr-2 h-4 w-4 text-${primaryColor}-600`} />
          <span>Meu Perfil</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => navigate('/perfil?tab=forms')}
          className={`cursor-pointer hover:bg-${primaryColor}-50 focus:bg-${primaryColor}-50 transition-colors duration-200`}
        >
          <FileText className={`mr-2 h-4 w-4 text-${primaryColor}-600`} />
          <span>Meus Formulários</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => navigate('/historico-compras')}
          className={`cursor-pointer hover:bg-${primaryColor}-50 focus:bg-${primaryColor}-50 transition-colors duration-200`}
        >
          <ShoppingBag className={`mr-2 h-4 w-4 text-${primaryColor}-600`} />
          <span>Histórico de Compras</span>
        </DropdownMenuItem>
        
        {/* Opção de Admin apenas para administradores */}
        {user?.is_admin && (
          <>
            <DropdownMenuSeparator className={`bg-${primaryColor}-100`} />
            <DropdownMenuItem 
              onClick={() => navigate('/admin')}
              className="cursor-pointer text-purple-600 hover:text-purple-700 hover:bg-purple-50 focus:bg-purple-50 transition-colors duration-200"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Painel Administrativo</span>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator className={`bg-${primaryColor}-100`} />
        <DropdownMenuItem 
          onClick={handleLogout}
          className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 focus:bg-red-50 transition-colors duration-200"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu; 