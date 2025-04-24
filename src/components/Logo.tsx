import React from 'react';
// Importando o logo como caminho de string para imagem
import logoUrl from '@/assets/images/logo.svg';

interface LogoProps {
  size?: number;
  className?: string;
  withShadow?: boolean;
}

/**
 * Componente de Logo reutilizável para a aplicação
 */
const Logo: React.FC<LogoProps> = ({ 
  size = 36, 
  className = '', 
  withShadow = true 
}) => {
  return (
    <div 
      className={`
        overflow-hidden rounded-full 
        ${withShadow ? 'shadow-green-glow transition-all duration-300 hover:shadow-green-glow-lg' : ''} 
        ${className}
      `}
      style={{ width: size, height: size }}
    >
      <img 
        src={logoUrl} 
        alt="Meu Plano Logo" 
        className="h-full w-full object-cover"
      />
    </div>
  );
};

export default Logo; 