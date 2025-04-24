import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Dumbbell, User, LogOut, MenuIcon, Settings, Menu, X, ShoppingCart } from "lucide-react";
import { useAuthStore } from '@/stores/authStore';
import { useAuthContext } from '@/contexts/AuthContext';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
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

  return (
    <header className="sticky top-0 z-10 w-full border-b border-emerald-100 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm animate-fade-in">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 animate-slide-in-left">
          <Logo size={36} />
          <Link to="/" className="flex items-center gap-2 font-heading text-xl font-semibold text-emerald-700">
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
        
        {/* Mobile Navigation */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden bg-emerald-50 hover:bg-emerald-100 text-emerald-700">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="pr-0 border-l border-emerald-100 bg-white">
            <SheetHeader>
              <SheetTitle className="text-emerald-700">Menu</SheetTitle>
            </SheetHeader>
            <div className="px-7">
              <Link
                to="/"
                className="flex items-center"
                onClick={() => setOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <Logo size={28} />
                  <span className="font-bold text-lg text-emerald-700">Meu Plano</span>
                </div>
              </Link>
            </div>
            
            <div className="px-7 mt-4 flex items-center space-x-2">
              <Avatar className="h-10 w-10">
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

            <div className="flex flex-col gap-4 mt-8">
              <Link
                onClick={() => setOpen(false)}
                className="px-7 py-2 text-base text-emerald-700 hover:bg-emerald-50 transition-colors duration-200 rounded-lg flex items-center"
                to="/dashboard"
              >
                Dashboard
              </Link>
              <Link
                onClick={() => setOpen(false)}
                className="px-7 py-2 text-base text-emerald-700 hover:bg-emerald-50 transition-colors duration-200 rounded-lg flex items-center"
                to="/historico-compras"
              >
                <ShoppingCart className="h-4 w-4 inline-block mr-2 text-emerald-600" />
                Compras
              </Link>
              <Link
                onClick={() => setOpen(false)}
                className="px-7 py-2 text-base text-emerald-700 hover:bg-emerald-50 transition-colors duration-200 rounded-lg flex items-center"
                to="/perfil"
              >
                <User className="h-4 w-4 inline-block mr-2 text-emerald-600" />
                Perfil
              </Link>
              {user?.is_admin && (
                <Link
                  onClick={() => setOpen(false)}
                  className="px-7 py-2 text-base text-emerald-700 hover:bg-emerald-50 transition-colors duration-200 rounded-lg flex items-center"
                  to="/admin"
                >
                  <Settings className="h-4 w-4 inline-block mr-2 text-emerald-600" />
                  Admin
                </Link>
              )}
              <div className="px-7 py-2">
                <NotificationBell />
              </div>
              <Button
                variant="ghost"
                className="justify-start px-7 text-base font-normal text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 rounded-lg"
                onClick={() => {
                  handleLogout();
                  setOpen(false);
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default React.memo(Navbar);