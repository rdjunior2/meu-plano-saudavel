import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { textGradients } from '@/lib/design-system';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  isAdmin?: boolean;
  className?: string;
  icon?: ReactNode;
  gradient?: boolean;
  large?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  isAdmin = false,
  className,
  icon,
  gradient = false,
  large = false
}) => {
  // Animações
  const containerAnimation = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        when: "beforeChildren",
      }
    }
  };
  
  const itemAnimation = {
    hidden: { y: -20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };
  
  const headerStyle = isAdmin ? 'border-b border-secondary-100 pb-4 mb-6' : 'border-b border-primary-100 pb-4 mb-6';
  const iconStyle = isAdmin 
    ? "bg-secondary-50 text-secondary-600 border border-secondary-100" 
    : "bg-primary-50 text-primary-600 border border-primary-100";
  
  const titleStyle = cn(
    large ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl',
    'font-bold',
    {
      [isAdmin 
        ? (gradient ? 'admin-title-gradient' : 'text-secondary-800') 
        : (gradient ? 'app-title-gradient' : 'text-primary-800')
      ]: true
    },
    'mb-1'
  );
  
  const subtitleStyle = isAdmin ? 'text-secondary-600' : 'text-primary-600';
  
  return (
    <motion.div 
      className={cn(
        headerStyle,
        "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3",
        className
      )}
      variants={containerAnimation}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="flex items-center gap-3"
        variants={itemAnimation}
      >
        {icon && (
          <motion.div 
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm",
              iconStyle
            )}
            whileHover={{ 
              scale: 1.05, 
              boxShadow: `0 0 15px ${isAdmin ? 'rgba(71, 147, 252, 0.25)' : 'rgba(12, 200, 148, 0.25)'}`
            }}
          >
            {icon}
          </motion.div>
        )}
        <div>
          <motion.h1 
            className={titleStyle}
            variants={itemAnimation}
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p 
              className={subtitleStyle}
              variants={itemAnimation}
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      </motion.div>
      
      {actions && (
        <motion.div 
          className="flex items-center gap-2 ml-auto mt-3 sm:mt-0"
          variants={itemAnimation}
        >
          {actions}
        </motion.div>
      )}
    </motion.div>
  );
};

export default PageHeader; 