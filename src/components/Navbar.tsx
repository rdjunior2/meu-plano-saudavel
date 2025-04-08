
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Apple, Dumbbell, User, LogOut } from "lucide-react";
import { useAuthStore } from '@/stores/authStore';

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
          <nav className="flex items-center gap-4">
            <Link to="/dashboard" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block">
              Dashboard
            </Link>
            <Link to="/anamnese" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block">
              Formulário
            </Link>
            <Link to="/planos" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block">
              Meus Planos
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Sair">
              <LogOut className="h-5 w-5" />
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
