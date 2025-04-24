import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { User } from '../types/user';
import Cookies from 'js-cookie';
import { 
  loginWithEmail,
  logout,
  registerUser,
  updateUserProfile,
  checkPhoneExists,
  signInWithGoogle as serviceSignInWithGoogle,
  setAuthCookies,
  clearAuthCookies
} from '../services/auth';
import { supabase } from '../lib/supabaseClient';
import { logEvent, LogSeverity } from '../services/logs';
import { api } from '../services/api';

// Implementação básica de funções de criptografia para substituir cryptoUtils
const encryptData = (data: string): string => {
  // Implementação simples, apenas para manter a compatibilidade
  return btoa(data);
};

const decryptData = (data: string): string => {
  // Implementação simples, apenas para manter a compatibilidade
  try {
    return atob(data);
  } catch (error) {
    console.error('Erro ao descriptografar dados:', error);
    return '';
  }
};

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
  signInWithGoogle: () => Promise<{success: boolean, url?: string, error?: string}>;
  isLoggedIn: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  profile: any | null;
  initialize: () => Promise<void>;
  setUser: (user: any | null) => void;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setProfile: (profile: any | null) => void;
  updateProfile: (data: any) => Promise<{success: boolean, error?: string}>;
  fetchProfile: () => Promise<{success: boolean, error?: string, data?: any}>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoggedIn: false,
      isLoading: true,
      isInitialized: false,
      profile: null,
      
      login: (userData, token) => {
        // Salvar token no localStorage para consistência
        localStorage.setItem("token", token);
        
        set({
          user: userData,
          isAuthenticated: true,
          isLoggedIn: true,
        });
        
        console.log('[AuthStore] Usuário autenticado e armazenado:', userData.id);
      },
      
      setIsAuthenticated: (value) => {
        // Se estiver desautenticando, também limpar os dados do usuário
        if (!value) {
          set({
            user: null,
            isAuthenticated: false,
            isLoggedIn: false,
          });
          console.log('[AuthStore] Estado de autenticação definido como false, dados de usuário limpos');
        } else {
          set({
            isAuthenticated: true,
            isLoggedIn: true
          });
          console.log('[AuthStore] Estado de autenticação definido como true');
        }
      },
      
      logout: async () => {
        try {
          await logout();
          // Remover token do localStorage
          localStorage.removeItem("token");
          
          set({
            user: null,
            isAuthenticated: false,
            isLoggedIn: false,
          });
          
          console.log('[AuthStore] Logout realizado com sucesso');
        } catch (error) {
          console.error('[AuthStore] Erro ao fazer logout:', error);
          
          // Mesmo com erro, limpar o estado
          localStorage.removeItem("token");
          set({
            user: null,
            isAuthenticated: false,
            isLoggedIn: false,
          });
        }
      },
      
      updateUser: async (data) => {
        try {
          if (!get().user?.id) {
            console.error('[AuthStore] Tentativa de atualizar usuário sem ID');
            return { success: false, error: 'Usuário não autenticado' };
          }
          
          console.log('[AuthStore] Atualizando dados do usuário:', data);
          
          // Enviar atualizações para o serviço
          const result = await updateUserProfile(get().user.id, data);
          
          if (result.success) {
            // Atualizar estado local apenas se o serviço for bem-sucedido
            set((state) => ({
              user: state.user ? { ...state.user, ...data } : null,
            }));
            
            console.log('[AuthStore] Dados do usuário atualizados com sucesso');
          } else {
            console.error('[AuthStore] Erro ao atualizar dados do usuário:', result.error);
          }
          
          return result;
        } catch (error: any) {
          console.error('[AuthStore] Erro crítico ao atualizar usuário:', error);
          return { 
            success: false, 
            error: error?.message || 'Erro desconhecido ao atualizar perfil'
          };
        }
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
        const result = await loginWithEmail(email, password);
        
        if (result.success && result.user) {
          // Salvar token no localStorage
          if (result.session?.access_token) {
            localStorage.setItem("token", result.session.access_token);
          }
          
          set({
            user: result.user,
            isAuthenticated: true,
            isLoggedIn: true,
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
            status: 'ativo',
            is_admin: false
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
            isLoggedIn: true,
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
            set({ isAuthenticated: false, user: null, isLoggedIn: false });
            return false;
          }
          
          const isValid = !!data.session;
          
          // Se a sessão não for válida, limpar estado
          if (!isValid) {
            console.log('[AuthStore] Sessão inválida, limpando estado de autenticação');
            set({ isAuthenticated: false, user: null, isLoggedIn: false });
            localStorage.removeItem("token");
          }
          
          return isValid;
        } catch (error) {
          console.error('[AuthStore] Erro ao verificar sessão:', error);
          set({ isAuthenticated: false, user: null, isLoggedIn: false });
          return false;
        }
      },
      
      // Login com Google
      signInWithGoogle: async () => {
        try {
          console.log('[AuthStore] Iniciando login com Google');
          const result = await serviceSignInWithGoogle();
          
          if (!result.success) {
            console.error('[AuthStore] Erro ao iniciar login com Google:', result.error);
          } else {
            console.log('[AuthStore] Redirecionando para autenticação com Google');
          }
          
          return result;
        } catch (error: any) {
          console.error('[AuthStore] Erro ao iniciar login com Google:', error);
          return { 
            success: false, 
            error: error?.message || 'Erro desconhecido ao iniciar login com Google'
          };
        }
      },
      
      // Inicialização da autenticação, verificando token no localStorage
      initialize: async () => {
        try {
          console.log('[AuthStore] Inicializando autenticação...');
          set({ isLoading: true });
          
          // Verificar se há uma sessão ativa
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('[AuthStore] Erro ao obter sessão:', error.message);
            clearAuthCookies();
            set({ user: null, isLoggedIn: false, isLoading: false, isInitialized: true });
            return;
          }
          
          // Se houver sessão, definir o usuário
          if (data?.session) {
            console.log('[AuthStore] Sessão existente encontrada');
            
            // Token para API e cookies
            const token = data.session.access_token;
            setAuthCookies(data.session);
            
            // Configurar estado da autenticação
            set({ 
              user: data.session.user, 
              isLoggedIn: true, 
              isLoading: false,
              isInitialized: true 
            });
            
            // Buscar perfil do usuário
            await get().fetchProfile();
          } else {
            console.log('[AuthStore] Nenhuma sessão válida encontrada');
            set({ user: null, isLoggedIn: false, isLoading: false, isInitialized: true });
          }
        } catch (error: any) {
          console.error('[AuthStore] Erro na inicialização:', error.message);
          logEvent('auth_init_error', 'Erro na inicialização da autenticação', LogSeverity.ERROR, { error: error.message });
          set({ user: null, isLoggedIn: false, isLoading: false, isInitialized: true });
        }
      },
      
      // Getters e Setters
      setUser: (user) => set({ user }),
      setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setProfile: (profile) => set({ profile }),

      // Buscar perfil do usuário
      fetchProfile: async () => {
        const state = get();
        
        // Verificar se há um usuário autenticado
        if (!state.user?.id) {
          console.log('[AuthStore] Tentativa de buscar perfil sem usuário');
          return { success: false, error: 'Usuário não autenticado' };
        }
        
        try {
          console.log('[AuthStore] Buscando perfil do usuário');
          
          // Buscar perfil via API
          const response = await api.get(`/users/profile`);
          
          if (response.status === 200 && response.data) {
            console.log('[AuthStore] Perfil obtido com sucesso');
            set({ profile: response.data });
            return { success: true, data: response.data };
          }
          
          console.warn('[AuthStore] Resposta inesperada ao buscar perfil:', response);
          return { success: false, error: 'Falha ao obter perfil' };
        } catch (error: any) {
          console.error('[AuthStore] Erro ao buscar perfil:', error.message);
          logEvent('profile_fetch_error', 'Erro ao buscar perfil do usuário', LogSeverity.WARNING, { error: error.message });
          return { success: false, error: error.message };
        }
      },
      
      // Atualizar perfil do usuário
      updateProfile: async (data) => {
        const state = get();
        
        // Verificar se há um usuário autenticado
        if (!state.user?.id) {
          console.log('[AuthStore] Tentativa de atualizar perfil sem usuário');
          return { success: false, error: 'Usuário não autenticado' };
        }
        
        try {
          console.log('[AuthStore] Atualizando perfil do usuário');
          
          // Atualizar perfil via API
          const response = await api.patch(`/users/profile`, data);
          
          if (response.status === 200 && response.data) {
            console.log('[AuthStore] Perfil atualizado com sucesso');
            set({ profile: response.data });
            return { success: true };
          }
          
          console.warn('[AuthStore] Resposta inesperada ao atualizar perfil:', response);
          return { success: false, error: 'Falha ao atualizar perfil' };
        } catch (error: any) {
          console.error('[AuthStore] Erro ao atualizar perfil:', error.message);
          logEvent('profile_update_error', 'Erro ao atualizar perfil do usuário', LogSeverity.WARNING, { error: error.message });
          return { success: false, error: error.message };
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isLoggedIn: state.isLoggedIn,
      }),
      // Antes de hidratar o estado do armazenamento, verificar se o token existe
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            // Se não houver token no localStorage mas o estado persistido diz que está autenticado,
            // significa que o estado está inválido e deve ser limpo
            const token = localStorage.getItem("token");
            if (!token && state.isLoggedIn) {
              console.warn('[AuthStore] Estado inconsistente: não há token, mas o estado está autenticado. Limpando...');
              state.setIsAuthenticated(false);
              state.setIsLoggedIn(false);
            } else if (state.isLoggedIn) {
              // Atualizar verificação da sessão
              state.verifySession();
            }
          }
        };
      },
    }
  )
);
