import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import AppLayout from './AppLayout';
import PageHeader from './PageHeader';

interface DashboardLayoutProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  gradient?: 'default' | 'subtle' | 'glass' | 'solid' | 'none';
  noPadding?: boolean;
  isAdmin?: boolean;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  className,
  fullWidth = false,
  gradient = 'default',
  noPadding = false,
  isAdmin = false,
  title,
  subtitle,
  actions,
  icon,
}) => {
  const isMobile = useIsMobile();

  return (
    <AppLayout
      className={className}
      fullWidth={fullWidth}
      noPadding={noPadding}
      gradient={gradient}
      isAdmin={isAdmin}
    >
      {/* Renderizar o cabeçalho apenas se houver título */}
      {title && (
        <PageHeader
          title={title}
          subtitle={subtitle}
          actions={actions}
          icon={icon}
          isAdmin={isAdmin}
          gradient={true}
          className="mb-6"
        />
      )}
      
      {children}
    </AppLayout>
  );
};

export default DashboardLayout; 