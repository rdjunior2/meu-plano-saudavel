import React from 'react';
// Importando o logo como caminho de string para imagem
import logoUrl from '@/assets/images/logo.svg';

interface LogoProps {
  size?: number;
  className?: string;
  withShadow?: boolean;
  color?: 'primary' | 'secondary' | 'accent' | 'neutral';
}

/**
 * Componente de Logo reutilizável para a aplicação
 */
const Logo: React.FC<LogoProps> = ({ 
  size = 36, 
  className = '', 
  withShadow = true,
  color = 'primary'
}) => {
  // Definir a classe de sombra com base na cor
  const getShadowClass = () => {
    if (!withShadow) return '';
    
    switch (color) {
      case 'primary':
        return 'shadow-primary-glow transition-all duration-300 hover:shadow-primary-glow-lg';
      case 'secondary':
        return 'shadow-secondary-glow transition-all duration-300 hover:shadow-secondary-glow-lg';
      case 'accent':
        return 'shadow-accent-glow transition-all duration-300 hover:shadow-accent-glow-lg';
      default:
        return 'shadow-sm transition-all duration-300 hover:shadow-md';
    }
  };
  
  return (
    <div 
      className={`
        overflow-hidden rounded-full 
        ${getShadowClass()} 
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