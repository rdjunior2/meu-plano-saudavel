import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import Logo from './Logo';

const Footer = () => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  
  // Verificação dupla para garantir que componente não renderize em páginas de autenticação
  if (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/reset-password') {
    return null;
  }

  // Se o usuário não estiver autenticado, não renderize o Footer
  if (!isAuthenticated) {
    return null;
  }

  return (
    <footer className="w-full border-t border-border/40 bg-background py-6">
      <div className="container flex flex-col items-center justify-center gap-4 md:flex-row md:justify-between">
        <div className="flex flex-col items-center gap-2 md:flex-row md:gap-4">
          <div className="flex items-center gap-2 mb-2 md:mb-0">
            <Logo size={24} />
            <span className="text-sm font-semibold text-emerald-700">Meu Plano</span>
          </div>
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Início
          </Link>
          <Link to="/termos" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Termos
          </Link>
          <Link to="/privacidade" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Privacidade
          </Link>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>Feito com</span>
          <Heart className="h-4 w-4 fill-lavender text-lavender" />
          <span>por Meu Plano Saudável</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
