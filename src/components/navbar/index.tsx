import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useAuthContext } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import NavLinks from './NavLinks';
import MobileMenu from './MobileMenu';
import UserMenu from './UserMenu';
import NotificationBell from '../NotificationBell';
import Logo from '../Logo';
import { motion } from 'framer-motion';
import { glassmorphism } from '@/lib/design-system';

export const NavbarComponent = () => {
  const { user, logout: logoutFn, isAuthenticated: isAuthStore } = useAuthStore();
  const { isAuthenticated: isAuthContext } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Verificação de autenticação combinada
  const isAuthenticated = isAuthStore || isAuthContext;
  
  // Rotas públicas onde o Navbar nunca deve aparecer
  const hiddenRoutes = ['/login', '/register', '/reset-password', '/criar-senha'];

  // Verificar se estamos em uma rota administrativa
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Mover o hook useCallback para antes de qualquer retorno condicional
  const handleLogout = React.useCallback(async () => {
    await logoutFn();
    navigate('/login');
  }, [logoutFn, navigate]);

  // Verificar se estamos em uma rota onde o Navbar nunca deve aparecer
  if (hiddenRoutes.includes(location.pathname)) {
    return null;
  }
  
  // Na página inicial, só mostrar a navbar se o usuário estiver autenticado
  if (location.pathname === '/' && !isAuthenticated) {
    return null;
  }

  // Conteúdo da navbar com animações e glassmorphism
  return (
    <motion.header 
      className={`sticky top-0 z-40 w-full border-b ${
        isAdminRoute 
          ? 'border-secondary-100 backdrop-blur-md bg-white/90 supports-[backdrop-filter]:bg-white/75' 
          : 'border-primary-100 backdrop-blur-md bg-white/90 supports-[backdrop-filter]:bg-white/75'
      } shadow-sm`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container flex h-16 items-center justify-between">
        <motion.div 
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Logo 
            size={isMobile ? 32 : 36} 
            color={isAdminRoute ? 'secondary' : 'primary'} 
          />
          <Link 
            to="/" 
            className={`flex items-center gap-2 font-heading text-xl font-semibold ${
              isAdminRoute ? 'text-secondary-700' : 'text-primary-700'
            } truncate hover:opacity-90 transition-opacity`}
          >
            Meu Plano
          </Link>
        </motion.div>
        
        {/* Componente do Menu Mobile */}
        <div className="md:hidden">
          <MobileMenu 
            isAdmin={!!user?.is_admin}
            isAdminRoute={isAdminRoute}
            handleLogout={handleLogout}
          />
        </div>
        
        {/* Desktop Navigation */}
        <motion.nav 
          className="hidden md:flex items-center gap-5"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <NavLinks 
            isAdmin={!!user?.is_admin}
            isAdminRoute={isAdminRoute}
          />
          <NotificationBell />
          
          <UserMenu 
            user={user}
            isAdminRoute={isAdminRoute}
            handleLogout={handleLogout}
          />
        </motion.nav>
      </div>
    </motion.header>
  );
};

export { NavbarComponent as Navbar };

export default NavbarComponent; 