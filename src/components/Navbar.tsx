import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Apple, Dumbbell, User, LogOut, MenuIcon, Settings, Menu, X, ShoppingCart } from "lucide-react";
import { useAuthStore } from '@/stores/authStore';
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
import { Avatar, AvatarFallback } from './ui/avatar'

const Navbar = () => {
  const { user, logout: logoutFn } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Verificação apenas para páginas de autenticação
  if (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/reset-password' || location.pathname === '/criar-senha') {
    return null;
  }

  const handleLogout = React.useCallback(async () => {
    await logoutFn();
    navigate('/login');
  }, [logoutFn, navigate]);

  return (
    <header className="sticky top-0 z-10 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-full bg-gradient-to-br from-lavender to-mint p-1.5">
            <Apple className="h-5 w-5 text-white" />
          </div>
          <Link to="/" className="flex items-center gap-2 font-heading text-xl font-semibold">
            Meu Plano
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          <Link to="/dashboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Dashboard
          </Link>
          <Link to="/formulario-alimentar" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Formulário Alimentar
          </Link>
          <Link to="/formulario-treino" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Formulário Treino
          </Link>
          <Link to="/historico-compras" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Compras
          </Link>
          {user?.is_admin && (
            <Link to="/admin" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              <Settings className="h-4 w-4 inline-block mr-1" />
              Admin
            </Link>
          )}
          <NotificationBell />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/perfil')}>
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/historico-compras')}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Minhas Compras
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        
        {/* Mobile Navigation */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="pr-0">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="px-7">
              <Link
                to="/"
                className="flex items-center"
                onClick={() => setOpen(false)}
              >
                <span className="font-bold text-lg">Meu Plano 1.0</span>
              </Link>
            </div>

            <div className="flex flex-col gap-4 mt-8">
              <Link
                onClick={() => setOpen(false)}
                className="px-7 py-2 text-base hover:underline"
                to="/dashboard"
              >
                Dashboard
              </Link>
              <Link
                onClick={() => setOpen(false)}
                className="px-7 py-2 text-base hover:underline"
                to="/formulario-alimentar"
              >
                <Apple className="h-4 w-4 inline-block mr-1" />
                Formulário Alimentar
              </Link>
              <Link
                onClick={() => setOpen(false)}
                className="px-7 py-2 text-base hover:underline"
                to="/formulario-treino"
              >
                <Dumbbell className="h-4 w-4 inline-block mr-1" />
                Formulário Treino
              </Link>
              <Link
                onClick={() => setOpen(false)}
                className="px-7 py-2 text-base hover:underline"
                to="/historico-compras"
              >
                <ShoppingCart className="h-4 w-4 inline-block mr-1" />
                Compras
              </Link>
              <Link
                onClick={() => setOpen(false)}
                className="px-7 py-2 text-base hover:underline"
                to="/perfil"
              >
                <User className="h-4 w-4 inline-block mr-1" />
                Perfil
              </Link>
              {user?.is_admin && (
                <Link
                  onClick={() => setOpen(false)}
                  className="px-7 py-2 text-base hover:underline"
                  to="/admin"
                >
                  <Settings className="h-4 w-4 inline-block mr-1" />
                  Admin
                </Link>
              )}
              <NotificationBell />
              <Button
                variant="ghost"
                className="justify-start px-7 text-base font-normal hover:underline"
                onClick={() => {
                  handleLogout();
                  setOpen(false);
                }}
              >
                <LogOut className="h-4 w-4 mr-1" />
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