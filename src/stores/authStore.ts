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
import { supabase } from '../lib/supabaseClient';

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
  loginWithEmail: (email: string, password: string) => Promise<{success: boolean, user?: User, error?: string, session?: any}>;
  registerWithEmail: (email: string, password: string, userData: Partial<User>) => Promise<{success: boolean, user?: User, error?: string, warning?: string, session?: any}>;
  verifySession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      
      login: (userData, token) => {
        // Salvar token no localStorage para consistência
        localStorage.setItem("token", token);
        
        set({
          user: userData,
          isAuthenticated: true,
        });
        
        console.log('[AuthStore] Usuário autenticado e armazenado:', userData.id);
      },
      
      setIsAuthenticated: (value) => {
        // Se estiver desautenticando, também limpar os dados do usuário
        if (!value) {
          set({
            user: null,
            isAuthenticated: false,
          });
          console.log('[AuthStore] Estado de autenticação definido como false, dados de usuário limpos');
        } else {
          set({
            isAuthenticated: true
          });
          console.log('[AuthStore] Estado de autenticação definido como true');
        }
      },
      
      logout: async () => {
        try {
          await serviceLogout();
          // Remover token do localStorage
          localStorage.removeItem("token");
          
          set({
            user: null,
            isAuthenticated: false,
          });
          
          console.log('[AuthStore] Logout realizado com sucesso');
        } catch (error) {
          console.error('[AuthStore] Erro ao fazer logout:', error);
          
          // Mesmo com erro, limpar o estado
          localStorage.removeItem("token");
          set({
            user: null,
            isAuthenticated: false,
          });
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
          // Salvar token no localStorage
          if (result.session?.access_token) {
            localStorage.setItem("token", result.session.access_token);
          }
          
          set({
            user: result.user,
            isAuthenticated: true,
          });
          
          console.log('[AuthStore] Login com email realizado com sucesso');
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
          
          // Salvar token no localStorage se houver uma sessão
          // Obs: Estamos ignorando o erro de tipagem aqui, pois sabemos que o resultado
          // pode conter uma sessão, mesmo que não esteja no tipo
          const session = (result as any).session;
          if (session?.access_token) {
            localStorage.setItem("token", session.access_token);
          }
          
          set({
            user,
            isAuthenticated: true,
          });
          
          console.log('[AuthStore] Registro realizado com sucesso');
          
          return {
            success: true,
            user,
            warning: result.warning,
            session: (result as any).session
          };
        }
        
        return {
          success: false,
          error: result.error
        };
      },
      
      // Verificar se a sessão ainda é válida
      verifySession: async () => {
        try {
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('[AuthStore] Erro ao verificar sessão:', error);
            set({ isAuthenticated: false, user: null });
            return false;
          }
          
          const isValid = !!data.session;
          
          // Se a sessão não for válida, limpar estado
          if (!isValid) {
            console.log('[AuthStore] Sessão inválida, limpando estado de autenticação');
            set({ isAuthenticated: false, user: null });
            localStorage.removeItem("token");
          }
          
          return isValid;
        } catch (error) {
          console.error('[AuthStore] Erro ao verificar sessão:', error);
          set({ isAuthenticated: false, user: null });
          return false;
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      // Antes de hidratar o estado do armazenamento, verificar se o token existe
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            // Se não houver token no localStorage mas o estado persistido diz que está autenticado,
            // significa que o estado está inválido e deve ser limpo
            const token = localStorage.getItem("token");
            if (!token && state.isAuthenticated) {
              console.warn('[AuthStore] Estado inconsistente: não há token, mas o estado está autenticado. Limpando...');
              state.setIsAuthenticated(false);
            } else if (state.isAuthenticated) {
              // Atualizar verificação da sessão
              state.verifySession();
            }
          }
        };
      },
    }
  )
);
