import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  nome: string;
  telefone: string;
  status: string;
  formulario_alimentar_preenchido?: boolean;
  formulario_treino_preenchido?: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User, token: string) => void;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  checkUserByPhone: (phone: string) => Promise<{exists: boolean, status: string | null}>;
  loginWithPassword: (phone: string, password: string) => Promise<{success: boolean, user?: User, error?: string}>;
  createPassword: (phone: string, password: string) => Promise<{success: boolean, error?: string}>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (userData, token) => set({
        token,
        user: userData,
        isAuthenticated: true,
      }),
      logout: async () => {
        await supabase.auth.signOut();
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },
      updateUser: (data) => set((state) => ({
        user: state.user ? { ...state.user, ...data } : null,
      })),
      
      // Verificar se o usuário existe por telefone
      checkUserByPhone: async (phone) => {
        try {
          const { data, error } = await supabase
            .from('usuarios')
            .select('status')
            .eq('telefone', phone)
            .single();
            
          if (error) {
            console.error('Erro ao verificar usuário:', error);
            return { exists: false, status: null };
          }
          
          return { exists: !!data, status: data?.status || null };
        } catch (error) {
          console.error('Erro ao verificar usuário:', error);
          return { exists: false, status: null };
        }
      },
      
      // Login com telefone e senha
      loginWithPassword: async (phone, password) => {
        try {
          // Usar a função rpc do Supabase para verificar a senha
          const { data, error } = await supabase.rpc('verificar_senha', {
            telefone_param: phone,
            senha_param: password
          });
          
          if (error) {
            console.error('Erro ao fazer login:', error);
            return { success: false, error: 'Erro ao autenticar. Tente novamente.' };
          }
          
          if (data.length === 0 || !data[0].senha_valida) {
            return { success: false, error: 'Telefone ou senha incorretos.' };
          }
          
          const user = {
            id: data[0].id,
            nome: data[0].nome,
            telefone: data[0].telefone,
            status: data[0].status
          };
          
          // Gerar token JWT customizado para autenticação
          const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
            email: `${phone}@placeholderemail.com`,
            password
          });
          
          if (sessionError) {
            console.error('Erro ao gerar token:', sessionError);
            return { success: false, error: 'Erro ao gerar token de autenticação.' };
          }
          
          // Login do usuário
          get().login(user, sessionData.session.access_token);
          
          return { success: true, user };
        } catch (error) {
          console.error('Erro ao fazer login:', error);
          return { success: false, error: 'Ocorreu um erro inesperado.' };
        }
      },
      
      // Criar senha para o usuário
      createPassword: async (phone, password) => {
        try {
          // Gerar hash da senha
          const saltRounds = 10;
          const passwordHash = await bcrypt.hash(password, saltRounds);
          
          // Atualizar o usuário com a senha
          const { error } = await supabase
            .from('usuarios')
            .update({ 
              senha_hash: passwordHash,
              status: 'senha_criada'
            })
            .eq('telefone', phone);
            
          if (error) {
            console.error('Erro ao criar senha:', error);
            return { success: false, error: 'Erro ao salvar senha. Tente novamente.' };
          }
          
          return { success: true };
        } catch (error) {
          console.error('Erro ao criar senha:', error);
          return { success: false, error: 'Ocorreu um erro inesperado.' };
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
