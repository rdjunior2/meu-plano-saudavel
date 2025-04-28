import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { cardStyles } from '@/lib/design-system';

interface AppCardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
  isAdmin?: boolean;
  variant?: 'default' | 'gradient' | 'glass' | 'subtle';
  hover?: boolean;
  highlight?: boolean | 'primary' | 'secondary' | 'accent' | 'warning' | 'error' | 'info';
  icon?: ReactNode;
  rightContent?: ReactNode;
  animate?: boolean;
}

const AppCard: React.FC<AppCardProps> = ({
  title,
  subtitle,
  children,
  className,
  footer,
  isAdmin = false,
  variant = 'default',
  hover = false,
  highlight = false,
  icon,
  rightContent,
  animate = true
}) => {
  // Determinar as classes do card com base em suas propriedades
  const getCardBaseClasses = () => {
    let baseClasses = [];
    
    // Estilo base do card
    switch (variant) {
      case 'gradient':
        baseClasses.push(isAdmin 
          ? 'bg-gradient-to-br from-secondary-50/80 to-white border border-secondary-100' 
          : 'bg-gradient-to-br from-primary-50/80 to-white border border-primary-100');
        break;
      case 'glass':
        baseClasses.push('glassmorphism');
        break;
      case 'subtle':
        baseClasses.push(isAdmin 
          ? 'bg-secondary-50/50 border border-secondary-100/80' 
          : 'bg-primary-50/50 border border-primary-100/80');
        break;
      default:
        baseClasses.push(isAdmin 
          ? 'bg-white border border-secondary-100' 
          : 'bg-white border border-primary-100');
        break;
    }
    
    // Adicionar efeitos de hover
    if (hover) {
      baseClasses.push(isAdmin 
        ? 'hover:shadow-secondary-glow hover:-translate-y-1 transition-all duration-300' 
        : 'hover:shadow-primary-glow hover:-translate-y-1 transition-all duration-300');
    }
    
    // Adicionar destaque de borda lateral
    if (highlight) {
      if (highlight === true) {
        baseClasses.push(isAdmin 
          ? 'border-l-4 border-l-secondary-500' 
          : 'border-l-4 border-l-primary-500');
      } else {
        switch (highlight) {
          case 'primary':
            baseClasses.push('border-l-4 border-l-primary-500');
            break;
          case 'secondary':
            baseClasses.push('border-l-4 border-l-secondary-500');
            break;
          case 'accent':
            baseClasses.push('border-l-4 border-l-accent-500');
            break;
          case 'warning':
            baseClasses.push('border-l-4 border-l-amber-500');
            break;
          case 'error':
            baseClasses.push('border-l-4 border-l-red-500');
            break;
          case 'info':
            baseClasses.push('border-l-4 border-l-blue-500');
            break;
        }
      }
    }
    
    return baseClasses.join(' ');
  };
  
  // Estilo do cabeçalho
  const getHeaderStyle = () => {
    if (variant === 'gradient') {
      return isAdmin 
        ? "bg-gradient-to-r from-secondary-50/70 to-transparent" 
        : "bg-gradient-to-r from-primary-50/70 to-transparent";
    }
    return '';
  };
  
  // Estilo do ícone
  const getIconStyle = () => {
    return isAdmin 
      ? "bg-secondary-100/50 text-secondary-600" 
      : "bg-primary-100/50 text-primary-600";
  };
  
  // Estilo do rodapé
  const getFooterStyle = () => {
    return isAdmin 
      ? "bg-secondary-50/40 border-secondary-100" 
      : "bg-primary-50/40 border-primary-100";
  };
  
  // Animações
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };
  
  // Componente wrapper que pode ser animado ou não
  const CardWrapper = ({ children }: { children: ReactNode }) => {
    if (animate) {
      return (
        <motion.div 
          variants={cardVariants} 
          initial="hidden" 
          animate="visible"
          className={cn(
            "rounded-xl shadow-sm overflow-hidden",
            getCardBaseClasses(),
            className
          )}
        >
          {children}
        </motion.div>
      );
    }
    
    return (
      <div className={cn(
        "rounded-xl shadow-sm overflow-hidden",
        getCardBaseClasses(),
        className
      )}>
        {children}
      </div>
    );
  };

  return (
    <CardWrapper>
      {(title || subtitle || icon || rightContent) && (
        <div className={cn(
          "p-5 flex justify-between items-start",
          getHeaderStyle(),
          "pb-3"
        )}>
          <div className="flex items-start gap-3">
            {icon && (
              <div className={cn(
                "flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center",
                getIconStyle()
              )}>
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h3 className={cn(
                  "text-lg font-semibold",
                  isAdmin ? "text-secondary-800" : "text-primary-800"
                )}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className={isAdmin ? "text-secondary-600" : "text-primary-600"}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          {rightContent && (
            <div className="ml-auto">
              {rightContent}
            </div>
          )}
        </div>
      )}
      
      <div className="p-5 pt-3">
        {children}
      </div>
      
      {footer && (
        <div className={cn(
          "p-5 pt-3 border-t",
          getFooterStyle()
        )}>
          {footer}
        </div>
      )}
    </CardWrapper>
  );
};

export default AppCard; 