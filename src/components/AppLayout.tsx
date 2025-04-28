import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import Navbar from './Navbar';
import Footer from './Footer';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { gradients } from '@/lib/design-system';

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  noPadding?: boolean;
  gradient?: 'default' | 'subtle' | 'glass' | 'solid' | 'none';
  isAdmin?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  className,
  fullWidth = false,
  noPadding = false,
  gradient = 'default',
  isAdmin = false,
}) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  
  // Verificar se estamos em uma rota administrativa
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // Determinar se é admin com base na propriedade ou na rota
  const isAdminPage = isAdmin || isAdminRoute;

  // Determinar o estilo de fundo com base no tipo de gradiente e na página
  const getBackgroundStyle = () => {
    if (gradient === 'none') return 'bg-background';
    
    if (gradient === 'glass') {
      return 'bg-white/30 backdrop-blur-md';
    }
    
    if (isAdminPage) {
      switch (gradient) {
        case 'default':
          return 'bg-gradient-to-b from-secondary-50 via-white to-secondary-50';
        case 'subtle':
          return 'bg-gradient-to-br from-secondary-50/80 to-white';
        case 'solid':
          return 'bg-secondary-50';
        default:
          return 'bg-background';
      }
    } else {
      switch (gradient) {
        case 'default':
          return 'bg-gradient-to-b from-primary-50 via-white to-primary-50';
        case 'subtle':
          return 'bg-gradient-to-br from-primary-50/80 to-white';
        case 'solid':
          return 'bg-primary-50';
        default:
          return 'bg-background';
      }
    }
  };

  // Configuração de animação para o contêiner principal
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.4,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.div 
      className={cn(
        getBackgroundStyle(),
        "transition-all duration-300 min-h-screen flex flex-col",
        className
      )}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className={cn(
        "flex-1 w-full",
        !noPadding && (isMobile ? "p-4 sm:p-6" : "p-6 sm:p-8"),
        fullWidth && "px-0 md:px-0"
      )}>
        <div className={cn(
          "mx-auto h-full",
          !fullWidth && "container"
        )}>
          {children}
        </div>
      </div>
    </motion.div>
  );
};

export default AppLayout; 