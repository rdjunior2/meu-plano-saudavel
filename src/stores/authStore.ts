import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { User } from '../types/user';
import Cookies from 'js-cookie';
import { 
  loginWithEmail as serviceLoginWithEmail,
  logout as serviceLogout,
  registerUser,
  updateUserProfile,
  checkPhoneExists
} from '../services/auth';

// Configuração de cookies consistente com auth.ts
const COOKIE_OPTIONS = {
  secure: import.meta.env.PROD, // Secure em produção
  sameSite: import.meta.env.PROD ? 'none' as const : 'lax' as const, // Alterar para 'none' em produção
  expires: 7, // 7 dias
  domain: import.meta.env.PROD ? window.location.hostname.split('.').slice(-2).join('.') : undefined // Define o domínio em produção
};

// Armazenamento seguro baseado em localStorage (em vez de cookies)
const secureStorage = {
  getItem: () => {
    try {
      const userStr = localStorage.getItem('user_data');
      return userStr ? Promise.resolve(userStr) : Promise.resolve(null);
    } catch (error) {
      console.error('Erro ao ler dados do usuário:', error);
      return Promise.resolve(null);
    }
  },
  setItem: (_name: string, value: string) => {
    try {
      localStorage.setItem('user_data', value);
      return Promise.resolve();
    } catch (error) {
      console.error('Erro ao salvar dados do usuário:', error);
      return Promise.resolve();
    }
  },
  removeItem: () => {
    try {
      localStorage.removeItem('user_data');
      return Promise.resolve();
    } catch (error) {
      console.error('Erro ao remover dados do usuário:', error);
      return Promise.resolve();
    }
  }
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User, token: string) => void;
  logout: () => Promise<void>;
  setIsAuthenticated: (value: boolean) => void;
  updateUser: (data: Partial<User>) => Promise<{success: boolean, error?: string}>;
  checkUserByPhone: (phone: string) => Promise<{exists: boolean, status: string | null, userId: string | null}>;
  loginWithEmail: (email: string, password: string) => Promise<{success: boolean, user?: User, error?: string}>;
  registerWithEmail: (email: string, password: string, userData: Partial<User>) => Promise<{success: boolean, user?: User, error?: string, warning?: string}>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      
      login: (userData, token) => set({
        user: userData,
        isAuthenticated: true,
      }),
      
      setIsAuthenticated: (value) => set({
        isAuthenticated: value
      }),
      
      logout: async () => {
        try {
          await serviceLogout();
          set({
            user: null,
            isAuthenticated: false,
          });
        } catch (error) {
          console.error('Erro ao fazer logout:', error);
        }
      },
      
      updateUser: async (data) => {
        if (!get().user?.id) {
          return { success: false, error: 'Usuário não autenticado' };
        }
        
        const result = await updateUserProfile(get().user.id, data);
        
        if (result.success) {
          set((state) => ({
            user: state.user ? { ...state.user, ...data } : null,
          }));
        }
        
        return result;
      },
      
      // Verificar se o usuário existe por telefone
      checkUserByPhone: async (phone) => {
        const result = await checkPhoneExists(phone);
        return {
          exists: result.exists,
          status: result.status,
          userId: result.userId
        };
      },
      
      // Login com email e senha
      loginWithEmail: async (email, password) => {
        const result = await serviceLoginWithEmail(email, password);
        
        if (result.success && result.user) {
          set({
            user: result.user,
            isAuthenticated: true,
          });
        }
        
        return result;
      },
      
      // Registrar novo usuário
      registerWithEmail: async (email, password, userData) => {
        const result = await registerUser(email, password, userData);
        
        if (result.success && result.user) {
          // O tipo User do Supabase Auth não corresponde ao nosso User
          // Então criamos um objeto User baseado nas informações disponíveis
          const user: User = {
            id: result.user.id,
            nome: userData.nome || 'Usuário',
            telefone: userData.telefone || '',
            email: email,
            status: 'ativo'
          };
          
          set({
            user,
            isAuthenticated: true,
          });
          
          return {
            success: true,
            user,
            warning: result.warning
          };
        }
        
        return {
          success: false,
          error: result.error
        };
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
