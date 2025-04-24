import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Home, FileText, Shield } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useIsMobile } from '@/hooks/use-mobile';
import Logo from './Logo';

const Footer = () => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Verificação dupla para garantir que componente não renderize em páginas de autenticação
  if (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/reset-password') {
    return null;
  }

  // Se o usuário não estiver autenticado, não renderize o Footer
  if (!isAuthenticated) {
    return null;
  }

  return (
    <footer className="w-full border-t border-border/40 bg-background py-4 md:py-6">
      <div className="container px-4">
        {/* Versão mobile - layout simplificado em coluna */}
        {isMobile ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center gap-2">
              <Logo size={24} />
              <span className="text-sm font-semibold text-emerald-700">Meu Plano</span>
            </div>
            
            <div className="flex justify-center space-x-5">
              <Link to="/" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex flex-col items-center">
                <Home className="h-4 w-4 mb-1" />
                <span>Início</span>
              </Link>
              <Link to="/termos" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex flex-col items-center">
                <FileText className="h-4 w-4 mb-1" />
                <span>Termos</span>
              </Link>
              <Link to="/privacidade" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex flex-col items-center">
                <Shield className="h-4 w-4 mb-1" />
                <span>Privacidade</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 pb-1">
              <span>Feito com</span>
              <Heart className="h-3 w-3 fill-lavender text-lavender" />
              <span>por Meu Plano Saudável</span>
            </div>
          </div>
        ) : (
          /* Versão desktop - layout original em linha */
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:justify-between">
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
        )}
      </div>
    </footer>
  );
};

export default Footer;
