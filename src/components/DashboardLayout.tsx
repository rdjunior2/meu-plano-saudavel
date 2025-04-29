import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import AppLayout from './AppLayout';
import PageHeader from './PageHeader';

/**
 * Interface de propriedades para o componente DashboardLayout
 * 
 * @property {ReactNode} children - Conteúdo a ser renderizado dentro do layout
 * @property {string} [className] - Classes CSS adicionais para customização
 * @property {boolean} [fullWidth=false] - Se verdadeiro, o layout ocupará toda a largura disponível
 * @property {'default' | 'subtle' | 'glass' | 'solid' | 'none'} [gradient='default'] - Tipo de gradiente a ser aplicado no fundo
 * @property {boolean} [noPadding=false] - Se verdadeiro, remove o padding padrão do conteúdo
 * @property {boolean} [isAdmin=false] - Define se o layout é para área administrativa (altera o esquema de cores)
 * @property {string} [title] - Título principal a ser exibido no cabeçalho
 * @property {string} [subtitle] - Subtítulo ou descrição a ser exibido no cabeçalho
 * @property {ReactNode} [actions] - Botões ou ações a serem exibidos no cabeçalho
 * @property {ReactNode} [icon] - Ícone a ser exibido no cabeçalho
 */
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

/**
 * Componente de layout principal para o dashboard, utilizado tanto para usuários quanto para administradores
 * 
 * Este componente é a base para todas as páginas pós-login do sistema, proporcionando uma experiência
 * visual consistente. Ele se adapta para exibir diferentes estilos visuais baseados no contexto
 * (usuário ou administrador) através da propriedade isAdmin.
 * 
 * Uso:
 * - Para páginas de usuário: <DashboardLayout title="Meu Dashboard">conteúdo</DashboardLayout>
 * - Para páginas administrativas: <DashboardLayout title="Admin" isAdmin={true}>conteúdo</DashboardLayout>
 * 
 * Este componente substitui o antigo AdminLayout, que foi removido para evitar duplicação de código.
 */
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