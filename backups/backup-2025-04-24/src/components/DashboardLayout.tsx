import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  gradient?: boolean;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  className,
  fullWidth = false,
  gradient = false,
}) => {
  return (
    <div className={cn(
      "min-h-screen flex flex-col bg-gray-50",
      gradient && "bg-gradient-to-br from-emerald-50 via-gray-50 to-green-50",
      className
    )}>
      <main className="flex-grow">
        {/* Header decorativo */}
        <div className="h-16 bg-gradient-to-r from-emerald-600 to-green-600 w-full relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),transparent_50%)]"></div>
        </div>
        
        {/* Conteúdo principal */}
        <div className={cn(
          "mx-auto py-6 px-4 sm:px-6 lg:px-8 relative -mt-10 z-10",
          fullWidth ? "w-full" : "max-w-7xl"
        )}>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-lg shadow-sm border border-emerald-100 overflow-hidden"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout; 