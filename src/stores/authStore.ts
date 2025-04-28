import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

// Configuração de cookies consistente com auth.ts
const COOKIE_OPTIONS = {
  secure: import.meta.env.PROD, // Secure em produção
  sameSite: import.meta.env.PROD ? 'none' as const : 'lax' as const, // Alterar para 'none' em produção
  expires: 7, // 7 dias
  domain: import.meta.env.PROD ? window.location.hostname.split('.').slice(-2).join('.') : undefined // Define o domínio em produção
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
        // Limpar qualquer estado anterior
        localStorage.removeItem('token');
        
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
          if (result.session?.access_token) {
            localStorage.setItem("token", result.session.access_token);
          }
          
          set({
            user,
            isAuthenticated: true,
            isLoggedIn: true
          });
          
          return {
            success: true,
            user,
            session: result.session,
            warning: result.warning
          };
        }
        
        return result;
      },
      
      // Verificar a sessão atual
      verifySession: async () => {
        try {
          // Verificar se há um token no localStorage
          const token = localStorage.getItem('token');
          
          // Se não houver token, retornar false
          if (!token) {
            console.log('[AuthStore] Nenhum token encontrado, usuário não autenticado');
            set({
              isAuthenticated: false,
              isLoggedIn: false,
              isLoading: false
            });
            return false;
          }
          
          // Verificar sessão no Supabase
          const { data, error } = await supabase.auth.getSession();
          
          if (error || !data.session) {
            console.error('[AuthStore] Erro ao verificar sessão ou sessão inválida:', error);
            set({
              isAuthenticated: false,
              isLoggedIn: false,
              isLoading: false
            });
            return false;
          }
          
          // Se chegou até aqui, o usuário está autenticado
          console.log('[AuthStore] Sessão válida encontrada');
          set({
            isAuthenticated: true,
            isLoggedIn: true,
            isLoading: false
          });
          
          return true;
        } catch (error) {
          console.error('[AuthStore] Erro ao verificar sessão:', error);
          set({
            isAuthenticated: false,
            isLoggedIn: false,
            isLoading: false
          });
          return false;
        }
      },
      
      // Login com Google
      signInWithGoogle: async () => {
        return await serviceSignInWithGoogle();
      },
      
      // Inicializar o estado de autenticação
      initialize: async () => {
        try {
          console.log('[AuthStore] Inicializando estado de autenticação');
          set({ isLoading: true, isInitialized: true });
          
          // Verificar sessão e definir estado
          await get().verifySession();
          
          // Se autenticado, buscar perfil do usuário
          if (get().isAuthenticated) {
            const { data } = await supabase.auth.getUser();
            if (data?.user) {
              // Buscar perfil do usuário
              const profile = await get().fetchProfile();
              if (profile.success && profile.data) {
                set({ user: profile.data });
              }
            }
          }
          
          set({ isLoading: false });
        } catch (error) {
          console.error('[AuthStore] Erro ao inicializar:', error);
          set({ isLoading: false });
        }
      },
      
      // Setters para testes e depuração
      setUser: (user) => set({ user }),
      setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setProfile: (profile) => set({ profile }),
      
      // Atualizar perfil do usuário
      updateProfile: async (data) => {
        try {
          const userId = get().user?.id;
          if (!userId) {
            return { success: false, error: 'Usuário não autenticado' };
          }
          
          return await updateUserProfile(userId, data);
        } catch (error: any) {
          return { 
            success: false, 
            error: error?.message || 'Erro desconhecido ao atualizar perfil'
          };
        }
      },
      
      // Buscar perfil do usuário
      fetchProfile: async () => {
        try {
          const { data } = await supabase.auth.getUser();
          
          if (!data?.user) {
            return { success: false, error: 'Usuário não autenticado' };
          }
          
          // Buscar perfil do usuário na tabela profiles
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          if (error) {
            console.error('[AuthStore] Erro ao buscar perfil:', error);
            return { success: false, error: error.message };
          }
          
          return { success: true, data: profile };
        } catch (error: any) {
          console.error('[AuthStore] Erro ao buscar perfil:', error);
          return { 
            success: false, 
            error: error?.message || 'Erro desconhecido ao buscar perfil'
          };
        }
      }
    }),
    {
      name: 'auth-storage',
      skipHydration: true // Evitar problemas de hidratação
    }
  )
);
