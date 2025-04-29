import React from 'react';
import { Button, ButtonProps } from './button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
}

/**
 * Componente de botão com estado de carregamento integrado
 * Estende o componente Button padrão com funcionalidades para exibir
 * um indicador de carregamento e texto alternativo
 */
const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ children, className, variant, isLoading, loadingText, disabled, ...props }, ref) => {
    // Determina se o botão deve estar desabilitado
    const isDisabled = disabled || isLoading;
    
    return (
      <Button
        className={cn(
          isLoading && 'opacity-80 cursor-not-allowed',
          className
        )}
        variant={variant}
        disabled={isDisabled}
        ref={ref}
        {...props}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {isLoading && loadingText ? loadingText : children}
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';

export { LoadingButton }; 