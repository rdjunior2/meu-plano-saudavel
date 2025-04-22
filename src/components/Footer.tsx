import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const Footer = () => {
  const { isAuthenticated } = useAuthStore();

  // Se o usuário não estiver autenticado, não renderize o Footer
  if (!isAuthenticated) {
    return null;
  }

  return (
    <footer className="w-full border-t border-border/40 bg-background py-6">
      <div className="container flex flex-col items-center justify-center gap-4 md:flex-row md:justify-between">
        <div className="flex flex-col items-center gap-2 md:flex-row md:gap-4">
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
