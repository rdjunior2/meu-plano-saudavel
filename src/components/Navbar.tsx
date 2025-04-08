
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Apple, Dumbbell, User, LogOut, MenuIcon } from "lucide-react";
import { useAuthStore } from '@/stores/authStore';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";

const Navbar = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Não mostrar a navbar nas páginas de autenticação
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

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
        
        {isAuthenticated && (
          <>
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
              <Link to="/planos" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Meus Planos
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Sair">
                <LogOut className="h-5 w-5" />
              </Button>
            </nav>
            
            {/* Mobile Navigation */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <MenuIcon className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-6">
                  <Link 
                    to="/dashboard" 
                    className="flex items-center gap-2 px-2 py-2 text-sm font-medium rounded-md hover:bg-accent"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/formulario-alimentar" 
                    className="flex items-center gap-2 px-2 py-2 text-sm font-medium rounded-md hover:bg-accent"
                  >
                    <Apple className="h-4 w-4" />
                    Formulário Alimentar
                  </Link>
                  <Link 
                    to="/formulario-treino" 
                    className="flex items-center gap-2 px-2 py-2 text-sm font-medium rounded-md hover:bg-accent"
                  >
                    <Dumbbell className="h-4 w-4" />
                    Formulário Treino
                  </Link>
                  <Link 
                    to="/planos" 
                    className="flex items-center gap-2 px-2 py-2 text-sm font-medium rounded-md hover:bg-accent"
                  >
                    Meus Planos
                  </Link>
                  <Button 
                    variant="ghost" 
                    className="flex items-center justify-start gap-2 px-2 py-2 text-sm font-medium rounded-md hover:bg-accent w-full" 
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
