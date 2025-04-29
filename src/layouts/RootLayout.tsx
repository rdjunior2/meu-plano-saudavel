import { ReactNode } from 'react';
import { Toaster } from 'sonner';
import Footer from '@/components/Footer';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface RootLayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

/**
 * Layout raiz para toda a aplicação
 * Gerencia elementos comuns como Footer e provedores globais
 */
export default function RootLayout({ 
  children, 
  showFooter = true 
}: RootLayoutProps) {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  
  // Lista de rotas onde não exibimos footer
  const noLayoutRoutes = ['/login', '/register', '/criar-senha', '/reset-password', '/debug-login'];
  
  // Verificar se estamos em uma rota administrativa
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // Se estiver em uma rota sem layout, renderiza diretamente o conteúdo
  if (noLayoutRoutes.includes(location.pathname)) {
    return (
      <>
        <Toaster position="top-right" />
        {children}
      </>
    );
  }
  
  // Determinar se deve mostrar footer com base na rota e autenticação
  const shouldShowFooter = showFooter && !noLayoutRoutes.includes(location.pathname);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Toaster position="top-right" />
      
      <main className="flex-grow">
        {children}
      </main>
      
      {shouldShowFooter && <Footer />}
    </div>
  );
} 