// Design System - Meu Plano 2.0
// Este arquivo contém constantes e funções utilitárias para o sistema de design atualizado

import { cva } from 'class-variance-authority';

// Paleta de cores do sistema
export const colorPalette = {
  // Cores primárias
  primary: {
    50: '#effefa',
    100: '#c8fff0',
    200: '#9afee0',
    300: '#65f5cc',
    400: '#2ce1b1',
    500: '#0dc894',
    600: '#00a07a',
    700: '#027f64',
    800: '#056450',
    900: '#065343',
    950: '#003029',
  },
  
  // Cores secundárias
  secondary: {
    50: '#f0f9ff',
    100: '#e0f1ff',
    200: '#c7e3ff',
    300: '#a1cfff',
    400: '#74b3ff',
    500: '#4793fc',
    600: '#2775f2',
    700: '#1c60e0',
    800: '#1e4fb6',
    900: '#1e448f',
    950: '#16295a',
  },
  
  // Cores de acento
  accent: {
    50: '#fff3ec',
    100: '#ffe5d4',
    200: '#ffc5a8',
    300: '#ff9d71',
    400: '#ff6937',
    500: '#fe4712',
    600: '#ef3009',
    700: '#c42309',
    800: '#9c1e10',
    900: '#7e1c10',
    950: '#440a06',
  },
  
  // Cores neutras
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },
  
  // Cores de estado
  state: {
    success: '#10b981', // Emerald
    warning: '#f59e0b', // Amber
    error: '#ef4444',   // Red
    info: '#3b82f6',    // Blue
  },
};

// Tipografia
export const typography = {
  fontFamily: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
};

// Espaçamento
export const spacing = {
  0: '0',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  32: '8rem',
};

// Sombras
export const shadows = {
  sm: 'rgba(0, 0, 0, 0.05) 0px 1px 2px 0px',
  DEFAULT: 'rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 1px 2px 0px',
  md: 'rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.06) 0px 2px 4px -1px',
  lg: 'rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
  xl: 'rgba(0, 0, 0, 0.1) 0px 20px 25px -5px, rgba(0, 0, 0, 0.04) 0px 10px 10px -5px',
  '2xl': 'rgba(0, 0, 0, 0.25) 0px 25px 50px -12px',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none',
  // Efeitos especiais
  neonPrimary: 'rgba(12, 200, 148, 0.35) 0px 0px 15px',
  neonSecondary: 'rgba(71, 147, 252, 0.35) 0px 0px 15px',
  neonAccent: 'rgba(254, 71, 18, 0.35) 0px 0px 15px',
  glassmorphism: '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
};

// Borda
export const border = {
  radius: {
    none: '0',
    sm: '0.125rem',
    DEFAULT: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  width: {
    DEFAULT: '1px',
    0: '0',
    2: '2px',
    4: '4px',
    8: '8px',
  },
};

// Efeitos de transição
export const transitions = {
  duration: {
    DEFAULT: '150ms',
    fast: '100ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
    slowest: '700ms',
  },
  easing: {
    DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  properties: {
    DEFAULT: 'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter',
    transform: 'transform',
    colors: 'color, background-color, border-color, text-decoration-color, fill, stroke',
    opacity: 'opacity',
    shadow: 'box-shadow',
    spacing: 'margin, padding, width, height',
  },
};

// Efeitos de animação
export const animations = {
  fadeIn: 'animate-fade-in',
  slideInLeft: 'animate-slide-in-left',
  slideInRight: 'animate-slide-in-right',
  slideInTop: 'animate-slide-in-top',
  slideInBottom: 'animate-slide-in-bottom',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  float: 'animate-float',
  pop: 'animate-pop',
  spin: 'animate-spin',
};

// Estilos de cards
export const cardStyles = cva(
  'overflow-hidden transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'bg-white border border-neutral-200 shadow-sm hover:shadow-md',
        primary: 'bg-white border border-primary-100 shadow-sm hover:shadow-md',
        secondary: 'bg-white border border-secondary-100 shadow-sm hover:shadow-md',
        accent: 'bg-white border border-accent-100 shadow-sm hover:shadow-md',
        glass: 'backdrop-blur-md bg-white/80 border border-white/20 shadow-glassmorphism',
      },
      size: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      rounded: {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        full: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      rounded: 'lg',
    },
  }
);

// Estilos de botões
export const buttonStyles = cva(
  'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
        secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500',
        accent: 'bg-accent-600 text-white hover:bg-accent-700 focus:ring-accent-500',
        outline: 'bg-transparent border border-neutral-300 text-neutral-700 hover:bg-neutral-50',
        ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100',
        link: 'bg-transparent text-primary-600 hover:underline p-0 h-auto',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      },
      size: {
        xs: 'text-xs px-2.5 py-1.5 rounded',
        sm: 'text-sm px-3 py-2 rounded-md',
        md: 'text-sm px-4 py-2 rounded-md',
        lg: 'text-base px-4 py-2 rounded-md',
        xl: 'text-lg px-6 py-3 rounded-md',
      },
      fullWidth: {
        true: 'w-full',
      },
      rounded: {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        full: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
      rounded: 'md',
    },
  }
);

// Gradientes
export const gradients = {
  primaryToSecondary: 'bg-gradient-to-r from-primary-500 to-secondary-500',
  secondaryToPrimary: 'bg-gradient-to-r from-secondary-500 to-primary-500',
  primaryToAccent: 'bg-gradient-to-r from-primary-500 to-accent-500',
  accentToPrimary: 'bg-gradient-to-r from-accent-500 to-primary-500',
  primaryFade: 'bg-gradient-to-r from-primary-600 to-primary-500',
  secondaryFade: 'bg-gradient-to-r from-secondary-600 to-secondary-500',
  accentFade: 'bg-gradient-to-r from-accent-600 to-accent-500',
  blueToIndigo: 'bg-gradient-to-r from-blue-500 to-indigo-500',
  indigoToPurple: 'bg-gradient-to-r from-indigo-500 to-purple-500',
  purpleToFuchsia: 'bg-gradient-to-r from-purple-500 to-fuchsia-500',
  cyanToBlue: 'bg-gradient-to-r from-cyan-500 to-blue-500',
  tealToEmerald: 'bg-gradient-to-r from-teal-400 to-emerald-500',
  amberToOrange: 'bg-gradient-to-r from-amber-400 to-orange-500',
};

// Gradientes para texto
export const textGradients = {
  primaryToSecondary: 'bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent',
  secondaryToPrimary: 'bg-gradient-to-r from-secondary-600 to-primary-600 bg-clip-text text-transparent',
  primaryToAccent: 'bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent',
  accentToPrimary: 'bg-gradient-to-r from-accent-600 to-primary-600 bg-clip-text text-transparent',
  blueToIndigo: 'bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent',
  indigoToPurple: 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent',
  purpleToFuchsia: 'bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent',
  cyanToBlue: 'bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent',
};

// Glassmorphism
export const glassmorphism = {
  light: 'bg-white/50 backdrop-blur-md',
  medium: 'bg-white/30 backdrop-blur-md',
  dark: 'bg-neutral-900/30 backdrop-blur-md',
  primary: 'bg-primary-500/10 backdrop-blur-md',
  secondary: 'bg-secondary-500/10 backdrop-blur-md',
  accent: 'bg-accent-500/10 backdrop-blur-md',
};

// Neumorphism
export const neumorphism = {
  raised: 'bg-neutral-100 shadow-[5px_5px_10px_rgba(0,0,0,0.05),-5px_-5px_10px_rgba(255,255,255,0.8)]',
  pressed: 'bg-neutral-100 shadow-[inset_5px_5px_10px_rgba(0,0,0,0.05),inset_-5px_-5px_10px_rgba(255,255,255,0.8)]',
  primary: 'bg-primary-50 shadow-[5px_5px_10px_rgba(0,0,0,0.05),-5px_-5px_10px_rgba(255,255,255,0.8)]',
  secondary: 'bg-secondary-50 shadow-[5px_5px_10px_rgba(0,0,0,0.05),-5px_-5px_10px_rgba(255,255,255,0.8)]',
};

// Layout
export const layout = {
  container: 'mx-auto px-4 sm:px-6 lg:px-8',
  maxWidth: {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
    prose: 'max-w-prose',
    screen: {
      sm: 'max-w-screen-sm',
      md: 'max-w-screen-md',
      lg: 'max-w-screen-lg',
      xl: 'max-w-screen-xl',
      '2xl': 'max-w-screen-2xl',
    },
  },
}; 