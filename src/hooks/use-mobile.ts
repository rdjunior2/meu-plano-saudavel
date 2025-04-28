import { useState, useEffect } from 'react';

// Objeto contendo os breakpoints em pixels que seguem padrões do Tailwind
const breakpoints = {
  xs: 0,    // Extra pequeno (telefones em retrato)
  sm: 640,  // Pequeno (telefones em paisagem)
  md: 768,  // Médio (tablets)
  lg: 1024, // Grande (desktops)
  xl: 1280, // Extra grande (telas grandes)
  '2xl': 1400, // Extra extra grande (telas muito grandes)
};

export type BreakpointKey = keyof typeof breakpoints;

/**
 * Hook para detectar se a tela está em um tamanho específico ou menor
 * @param breakpoint O breakpoint a ser verificado (xs, sm, md, lg, xl, 2xl)
 * @returns true se a tela for menor ou igual ao breakpoint especificado
 */
export function useBreakpoint(breakpoint: BreakpointKey = 'md'): boolean {
  const [isBelow, setIsBelow] = useState(false);

  useEffect(() => {
    // Verificar inicialmente se a tela é menor que o breakpoint
    const checkSize = () => {
      setIsBelow(window.innerWidth <= breakpoints[breakpoint]);
    };

    // Verificar o tamanho atual
    checkSize();

    // Adicionar listener para quando o tamanho da janela mudar
    window.addEventListener('resize', checkSize);

    // Limpar o listener quando o componente for desmontado
    return () => window.removeEventListener('resize', checkSize);
  }, [breakpoint]);

  return isBelow;
}

/**
 * Hook para detectar se o dispositivo é um celular (tela menor que md: 768px)
 * @returns true se o dispositivo for um celular
 */
export function useIsMobile(): boolean {
  return useBreakpoint('md');
}

/**
 * Hook para detectar se o dispositivo é um tablet (tela menor que lg: 1024px e maior que md: 768px)
 * @returns true se o dispositivo for um tablet
 */
export function useIsTablet(): boolean {
  const belowLg = useBreakpoint('lg');
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkIfTablet = () => {
      setIsTablet(
        window.innerWidth > breakpoints.md && 
        window.innerWidth <= breakpoints.lg
      );
    };

    checkIfTablet();
    window.addEventListener('resize', checkIfTablet);
    
    return () => window.removeEventListener('resize', checkIfTablet);
  }, []);

  return isTablet;
}

/**
 * Hook para detectar se a tela está em modo de paisagem
 * @returns true se a tela estiver em modo de paisagem
 */
export function useIsLandscape(): boolean {
  const [isLandscape, setIsLandscape] = useState(
    window.matchMedia('(orientation: landscape)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(orientation: landscape)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsLandscape(e.matches);
    };

    // Adicionar listener se o navegador suportar
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback para navegadores mais antigos
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return isLandscape;
}

/**
 * Hook para obter o breakpoint atual
 * @returns O nome do breakpoint atual (xs, sm, md, lg, xl, 2xl)
 */
export function useCurrentBreakpoint(): BreakpointKey {
  const [breakpoint, setBreakpoint] = useState<BreakpointKey>('xs');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      if (width >= breakpoints['2xl']) {
        setBreakpoint('2xl');
      } else if (width >= breakpoints.xl) {
        setBreakpoint('xl');
      } else if (width >= breakpoints.lg) {
        setBreakpoint('lg');
      } else if (width >= breakpoints.md) {
        setBreakpoint('md');
      } else if (width >= breakpoints.sm) {
        setBreakpoint('sm');
      } else {
        setBreakpoint('xs');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
}

export default useIsMobile; 