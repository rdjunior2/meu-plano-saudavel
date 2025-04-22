// Este arquivo garante que o React seja importado corretamente
import * as React from 'react';

// Exporta o React para que outros componentes possam importá-lo
export default React;

// Exporta especificamente o forwardRef para evitar problemas com referências indefinidas
export const forwardRef = React.forwardRef;

// Exporta outros hooks e utilidades React comumente usados
export const { 
  useState, 
  useEffect, 
  useContext, 
  useRef, 
  createContext, 
  useCallback, 
  useMemo,
  Fragment,
  createElement,
  cloneElement,
  Children,
  isValidElement
} = React; 