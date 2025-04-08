import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CriarSenha from "./pages/CriarSenha";
import Dashboard from "./pages/Dashboard";
import Anamnese from "./pages/Anamnese";
import PlanoDetalhes from "./pages/PlanoDetalhes";
import NotFound from "./pages/NotFound";
import FormularioAlimentar from "./pages/FormularioAlimentar";
import FormularioTreino from "./pages/FormularioTreino";

const queryClient = new QueryClient();

// Componente para rotas protegidas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const updateUser = useAuthStore((state) => state.updateUser);

  // Setup Supabase auth state listener
  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Create user object
        const userData = {
          id: session.user.id,
          nome: session.user.user_metadata.name || "",
          telefone: session.user.user_metadata.phone || "",
          status: "senha_criada" // Status padrão
        };
        
        // Login
        login(userData, session.access_token);
        
        try {
          // Verificar se formulários estão preenchidos
          const { data: formAlimentar } = await supabase
            .from('formularios_alimentacao')
            .select('id')
            .eq('id_usuario', session.user.id)
            .single();
            
          const { data: formTreino } = await supabase
            .from('formularios_treino')
            .select('id')
            .eq('id_usuario', session.user.id)
            .single();
          
          // Atualizar status do usuário no store
          updateUser({
            formulario_alimentar_preenchido: !!formAlimentar,
            formulario_treino_preenchido: !!formTreino
          });
        } catch (error) {
          console.error('Erro ao verificar formulários:', error);
        }
      }
    };
    
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Create user object
          const userData = {
            id: session.user.id,
            nome: session.user.user_metadata.name || "",
            telefone: session.user.user_metadata.phone || "",
            status: "senha_criada" // Status padrão
          };
          
          // Login
          login(userData, session.access_token);
          
          try {
            // Verificar se formulários estão preenchidos
            const { data: formAlimentar } = await supabase
              .from('formularios_alimentacao')
              .select('id')
              .eq('id_usuario', session.user.id)
              .single();
              
            const { data: formTreino } = await supabase
              .from('formularios_treino')
              .select('id')
              .eq('id_usuario', session.user.id)
              .single();
            
            // Atualizar status do usuário no store
            updateUser({
              formulario_alimentar_preenchido: !!formAlimentar,
              formulario_treino_preenchido: !!formTreino
            });
          } catch (error) {
            console.error('Erro ao verificar formulários:', error);
          }
        } else if (event === 'SIGNED_OUT') {
          logout();
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [login, logout, updateUser]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navbar />
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/criar-senha" element={<CriarSenha />} />
              <Route path="/anamnese" element={
                <ProtectedRoute>
                  <Anamnese />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/plano/:id" element={
                <ProtectedRoute>
                  <PlanoDetalhes />
                </ProtectedRoute>
              } />
              <Route path="/formulario-alimentar" element={
                <ProtectedRoute>
                  <FormularioAlimentar />
                </ProtectedRoute>
              } />
              <Route path="/formulario-treino" element={
                <ProtectedRoute>
                  <FormularioTreino />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <Footer />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
