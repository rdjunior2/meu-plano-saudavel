
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";

// Tipagem para o usuário
interface User {
  id: string;
  phone: string;
  name?: string;
}

// Tipagem para o estado de autenticação
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  authToken: string | null;
  formCompleted: boolean;
  login: (phone: string, token: string, user: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  setFormCompleted: (completed: boolean) => void;
}

// Criação da store com persistência
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      authToken: null,
      formCompleted: false,

      login: (phone, token, user) => set({ 
        isAuthenticated: true, 
        authToken: token,
        user: {
          ...user,
          phone
        }
      }),

      logout: async () => {
        // Sign out from Supabase
        await supabase.auth.signOut();
        
        // Clear local state
        set({ 
          isAuthenticated: false, 
          authToken: null, 
          user: null,
          formCompleted: false
        });
      },

      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      })),

      setFormCompleted: (completed) => set({ formCompleted: completed })
    }),
    {
      name: "meu-plano-auth",
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        authToken: state.authToken,
        formCompleted: state.formCompleted
      }),
    }
  )
);
