import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'emerald' | 'sky';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md',
  className,
  color = 'emerald'
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-16 w-16',
    lg: 'h-24 w-24'
  };
  
  // Classes de cor para o spinner
  const borderClasses = color === 'emerald' 
    ? 'border-t-emerald-500 border-emerald-100' 
    : 'border-t-sky-500 border-sky-100';
    
  const bgClasses = color === 'emerald' 
    ? 'bg-emerald-100/20' 
    : 'bg-sky-100/20';
    
  const textClasses = color === 'emerald' 
    ? 'text-emerald-700' 
    : 'text-sky-700';

  return (
    <div className={cn('flex flex-col items-center justify-center min-h-[70vh]', className)}>
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "linear"
          }}
          className={cn(
            'rounded-full border-4',
            borderClasses,
            sizeClasses[size]
          )}
        />
        <motion.div 
          initial={{ scale: 0.8, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            duration: 1, 
            repeat: Infinity, 
            repeatType: "reverse",
            ease: "easeInOut"
          }}
          className={cn("absolute inset-0 rounded-full", bgClasses)}
        />
      </div>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className={cn("mt-4 font-medium", textClasses)}
      >
        Carregando...
      </motion.p>
    </div>
  );
};

export default LoadingSpinner; 