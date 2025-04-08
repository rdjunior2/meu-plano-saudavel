
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  phone: string;
  name?: string;
  formulario_alimentar_preenchido?: boolean;
  formulario_treino_preenchido?: boolean;
  plano_status?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (phone: string, token: string, userData: User) => void;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (phone, token, userData) => set({
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
