import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardLayoutProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  gradient?: boolean;
  noPadding?: boolean;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  className,
  fullWidth = false,
  gradient = false,
  noPadding = false,
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={cn(
      "min-h-screen flex flex-col bg-gray-50",
      gradient && "bg-gradient-to-br from-emerald-50 via-gray-50 to-green-50",
      className
    )}>
      <main className="flex-grow">
        {/* Header decorativo */}
        <div className="h-12 md:h-16 bg-gradient-to-r from-emerald-600 to-green-600 w-full relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),transparent_50%)]"></div>
        </div>
        
        {/* Conteúdo principal */}
        <div className={cn(
          "relative -mt-8 md:-mt-10 z-10",
          fullWidth ? "w-full px-0 md:px-0" : "w-[95%] md:w-[90%] max-w-7xl mx-auto"
        )}>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={cn(
              "bg-white rounded-lg shadow-sm border border-emerald-100 overflow-hidden",
              !noPadding && (isMobile ? "p-4 sm:p-5" : "p-6")
            )}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout; 