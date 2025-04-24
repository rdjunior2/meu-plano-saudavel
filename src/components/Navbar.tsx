import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  Dumbbell, 
  User, 
  LogOut, 
  Settings, 
  Menu, 
  X, 
  ShoppingCart, 
  Home, 
  Bookmark,
  Bell,
  UserCircle,
  ChevronRight
} from "lucide-react";
import { useAuthStore } from '@/stores/authStore';
import { useAuthContext } from '@/contexts/AuthContext';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTrigger,
  SheetClose,
  SheetFooter
} from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu"
import NotificationBell from "./NotificationBell";
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import Logo from './Logo';

const Navbar = () => {
  const { user, logout: logoutFn, isAuthenticated: isAuthStore } = useAuthStore();
  const { isAuthenticated: isAuthContext } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Verificação de autenticação combinada
  const isAuthenticated = isAuthStore || isAuthContext;
  
  // Rotas públicas onde o Navbar nunca deve aparecer
  const hiddenRoutes = ['/login', '/register', '/reset-password', '/criar-senha'];

  // Verificar se estamos em uma rota onde o Navbar nunca deve aparecer
  if (hiddenRoutes.includes(location.pathname)) {
    return null;
  }
  
  // Na página inicial, só mostrar a navbar se o usuário estiver autenticado
  if (location.pathname === '/' && !isAuthenticated) {
    return null;
  }

  const handleLogout = React.useCallback(async () => {
    await logoutFn();
    navigate('/login');
  }, [logoutFn, navigate]);

  // Classes para animação de hover dos links
  const navLinkClass = "text-sm font-medium text-emerald-700 transition-all duration-300 hover:text-emerald-500 hover:scale-105 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-500 after:transition-all after:duration-300 hover:after:w-full";

  // Classes para links mobile
  const mobileLinkClass = "w-full px-5 py-3.5 text-base text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100 transition-colors duration-200 flex items-center";
  
  // Classes para cabeçalhos de seção mobile
  const mobileSectionTitle = "px-5 py-2 text-xs uppercase font-semibold text-emerald-900/70 tracking-wider";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm animate-fade-in">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 animate-slide-in-left">
          <Logo size={isMobile ? 32 : 36} />
          <Link to="/" className="flex items-center gap-2 font-heading text-xl font-semibold text-emerald-700 truncate">
            Meu Plano
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 animate-slide-in-right">
          <Link to="/dashboard" className={navLinkClass}>
            Dashboard
          </Link>
          <Link to="/historico-compras" className={navLinkClass}>
            Compras
          </Link>
          {user?.is_admin && (
            <Link to="/admin" className={navLinkClass}>
              <Settings className="h-4 w-4 inline-block mr-1" />
              Admin
            </Link>
          )}
          <NotificationBell />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full bg-emerald-50 hover:bg-emerald-100 btn-hover-effect">
                <Avatar className="h-8 w-8 border-2 border-emerald-200">
                  <AvatarImage src={user?.avatar_url || ''} alt={user?.nome || 'Usuário'} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-green-500 text-white">
                    {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="animate-slide-in w-56 overflow-hidden border border-emerald-100">
              <DropdownMenuLabel className="bg-emerald-50 font-medium text-emerald-700">
                <div className="flex items-center space-x-2 py-1">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar_url || ''} alt={user?.nome || 'Usuário'} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-green-500 text-white">
                      {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user?.nome || 'Usuário'}</span>
                    <span className="text-xs text-emerald-600 truncate max-w-[160px]">
                      {user?.email || ''}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-emerald-100" />
              <DropdownMenuItem 
                onClick={() => navigate('/perfil')}
                className="cursor-pointer hover:bg-emerald-50 focus:bg-emerald-50 transition-colors duration-200"
              >
                <User className="mr-2 h-4 w-4 text-emerald-600" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/historico-compras')}
                className="cursor-pointer hover:bg-emerald-50 focus:bg-emerald-50 transition-colors duration-200"
              >
                <ShoppingCart className="mr-2 h-4 w-4 text-emerald-600" />
                <span>Minhas Compras</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-emerald-100" />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="cursor-pointer hover:bg-red-50 focus:bg-red-50 transition-colors duration-200"
              >
                <LogOut className="mr-2 h-4 w-4 text-red-500" />
                <span className="text-red-500">Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        
        {/* Mobile Navigation - Botão com notificações integradas */}
        <div className="flex items-center gap-3 md:hidden">
          <NotificationBell /> 
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-full h-10 w-10 flex items-center justify-center">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 border-l border-emerald-100 bg-white w-[90vw] sm:w-[320px] max-w-md overflow-y-auto">
              <SheetHeader className="px-5 py-4 border-b border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Logo size={32} />
                    <span className="font-heading font-bold text-xl text-emerald-700">Meu Plano</span>
                  </div>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 hover:bg-emerald-100">
                      <X className="h-5 w-5 text-emerald-700" />
                    </Button>
                  </SheetClose>
                </div>
              </SheetHeader>
              
              {/* Perfil do usuário no menu mobile */}
              <div className="p-5 border-b border-emerald-100 bg-white">
                <Link to="/perfil" onClick={() => setOpen(false)} className="flex items-center gap-3 group">
                  <Avatar className="h-14 w-14 border-2 border-emerald-200 group-hover:border-emerald-300 transition-all duration-200">
                    <AvatarImage src={user?.avatar_url || ''} alt={user?.nome || 'Usuário'} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-green-500 text-white text-lg">
                      {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium text-base text-emerald-800">{user?.nome || 'Usuário'}</span>
                      <ChevronRight className="h-4 w-4 text-emerald-400 group-hover:text-emerald-600 opacity-70 group-hover:opacity-100 transition-all" />
                    </div>
                    <span className="text-xs text-emerald-600 truncate max-w-[220px]">
                      {user?.email || ''}
                    </span>
                    <span className="text-xs mt-1 text-emerald-500 font-medium">
                      Ver perfil
                    </span>
                  </div>
                </Link>
              </div>

              {/* Links de navegação mobile - organizados por seções */}
              <div className="py-2 flex flex-col">
                <div className={mobileSectionTitle}>Principal</div>
                <nav className="flex flex-col">
                  <Link
                    onClick={() => setOpen(false)}
                    className={`${mobileLinkClass} border-l-4 border-transparent ${location.pathname === '/' ? 'border-l-emerald-500 bg-emerald-50' : ''}`}
                    to="/"
                  >
                    <Home className="h-5 w-5 mr-3 text-emerald-600" />
                    <span>Início</span>
                  </Link>
                  <Link
                    onClick={() => setOpen(false)}
                    className={`${mobileLinkClass} border-l-4 border-transparent ${location.pathname === '/dashboard' ? 'border-l-emerald-500 bg-emerald-50' : ''}`}
                    to="/dashboard"
                  >
                    <Dumbbell className="h-5 w-5 mr-3 text-emerald-600" />
                    <span>Dashboard</span>
                  </Link>
                </nav>
                
                <div className={`${mobileSectionTitle} mt-3`}>Minha Conta</div>
                <nav className="flex flex-col">
                  <Link
                    onClick={() => setOpen(false)}
                    className={`${mobileLinkClass} border-l-4 border-transparent ${location.pathname === '/historico-compras' ? 'border-l-emerald-500 bg-emerald-50' : ''}`}
                    to="/historico-compras"
                  >
                    <ShoppingCart className="h-5 w-5 mr-3 text-emerald-600" />
                    <span>Minhas Compras</span>
                  </Link>
                  <Link
                    onClick={() => setOpen(false)}
                    className={`${mobileLinkClass} border-l-4 border-transparent ${location.pathname === '/perfil' ? 'border-l-emerald-500 bg-emerald-50' : ''}`}
                    to="/perfil"
                  >
                    <UserCircle className="h-5 w-5 mr-3 text-emerald-600" />
                    <span>Meu Perfil</span>
                  </Link>
                </nav>
                
                {user?.is_admin && (
                  <>
                    <div className={`${mobileSectionTitle} mt-3`}>Administração</div>
                    <nav className="flex flex-col">
                      <Link
                        onClick={() => setOpen(false)}
                        className={`${mobileLinkClass} border-l-4 border-transparent ${location.pathname === '/admin' ? 'border-l-emerald-500 bg-emerald-50' : ''}`}
                        to="/admin"
                      >
                        <Settings className="h-5 w-5 mr-3 text-emerald-600" />
                        <span>Painel Admin</span>
                      </Link>
                    </nav>
                  </>
                )}
              </div>
              
              {/* Rodapé do menu mobile */}
              <div className="mt-auto">
                <div className="p-5 border-t border-b border-emerald-100 bg-gray-50">
                  <Link to="/" className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-md hover:bg-white group transition-all duration-200">
                    <Bookmark className="h-5 w-5 mr-1 text-emerald-600" />
                    <span className="text-emerald-700 text-sm">Termos de uso</span>
                  </Link>
                </div>
                <SheetFooter className="p-5 bg-white">
                  <Button
                    variant="outline"
                    className="w-full h-11 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                    onClick={() => {
                      handleLogout();
                      setOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair da conta
                  </Button>
                </SheetFooter>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default React.memo(Navbar);