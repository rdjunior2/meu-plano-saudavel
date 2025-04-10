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
import AdminPage from "./pages/admin";
import CreateAdmin from "./pages/CreateAdmin";

const queryClient = new QueryClient();

// Componente para rotas protegidas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Componente para rotas protegidas de admin
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.is_admin) {
    return <Navigate to="/" replace />;
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
        try {
          // Buscar dados completos do usuário
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userError) throw userError;

          // Login com dados completos do usuário
          login({
            id: session.user.id,
            nome: userData.nome || session.user.user_metadata.name || "",
            telefone: userData.telefone || session.user.user_metadata.phone || "",
            status: userData.status || "senha_criada",
            is_admin: userData.is_admin || false,
            formulario_alimentar_preenchido: userData.formulario_alimentar_preenchido || false,
            formulario_treino_preenchido: userData.formulario_treino_preenchido || false
          }, session.access_token);
        } catch (error) {
          console.error('Erro ao carregar dados do usuário:', error);
          logout();
        }
      }
    };
    
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          try {
            // Buscar dados completos do usuário
            const { data: userData, error: userError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (userError) throw userError;

            // Login com dados completos do usuário
            login({
              id: session.user.id,
              nome: userData.nome || session.user.user_metadata.name || "",
              telefone: userData.telefone || session.user.user_metadata.phone || "",
              status: userData.status || "senha_criada",
              is_admin: userData.is_admin || false,
              formulario_alimentar_preenchido: userData.formulario_alimentar_preenchido || false,
              formulario_treino_preenchido: userData.formulario_treino_preenchido || false
            }, session.access_token);
          } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
            logout();
          }
        } else if (event === 'SIGNED_OUT') {
          logout();
        }
      }
    );

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
              <Route path="/create-admin" element={<CreateAdmin />} />
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
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
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
