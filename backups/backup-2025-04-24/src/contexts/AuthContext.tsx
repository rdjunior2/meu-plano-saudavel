import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';

// Interface para o contexto de autenticação
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Criação do contexto com valor padrão
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props para o provedor do contexto
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provedor do contexto de autenticação (mantido para compatibilidade)
 * @deprecated Use useAuthStore diretamente
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Usar o store Zustand diretamente
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  
  // Memorizando o valor do contexto para evitar recriações desnecessárias
  const value = useMemo(() => ({
    isAuthenticated,
    isLoading
  }), [
    isAuthenticated,
    isLoading
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para acessar o contexto de autenticação
 * @deprecated Use useAuthStore diretamente
 */
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext deve ser usado dentro de um AuthProvider');
  }
  
  return context;
}; 