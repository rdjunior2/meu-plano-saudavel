import { createContext, useContext, ReactNode, useMemo } from 'react';
import useAuth from '../hooks/useAuth';

// Interface para o contexto de autenticação
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => Promise<void>;
}

// Criação do contexto com valor padrão
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props para o provedor do contexto
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provedor do contexto de autenticação
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Usar o hook useAuth para gestão de autenticação
  const auth = useAuth();
  
  // Memorizando o valor do contexto para evitar recriações desnecessárias
  const value = useMemo(() => ({
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    login: auth.login,
    logout: auth.logout
  }), [
    auth.isAuthenticated,
    auth.isLoading,
    auth.login,
    auth.logout
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para acessar o contexto de autenticação
 */
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext deve ser usado dentro de um AuthProvider');
  }
  
  return context;
}; 