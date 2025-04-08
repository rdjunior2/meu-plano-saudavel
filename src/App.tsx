
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
        const userData = {
          id: session.user.id,
          phone: session.user.user_metadata.phone || "",
          name: session.user.user_metadata.name || "",
        };
        login(userData.phone, session.access_token, userData);
        
        try {
          // Fetch profile data
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('formulario_alimentar_preenchido, formulario_treino_preenchido, plano_status')
            .eq('id', session.user.id)
            .single();
            
          if (error) {
            console.error('Error fetching profile:', error);
          } else if (profileData) {
            updateUser({
              formulario_alimentar_preenchido: profileData.formulario_alimentar_preenchido,
              formulario_treino_preenchido: profileData.formulario_treino_preenchido,
              plano_status: profileData.plano_status
            });
          }
        } catch (error) {
          console.error('Error during profile fetch:', error);
        }
      }
    };
    
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const userData = {
            id: session.user.id,
            phone: session.user.user_metadata.phone || "",
            name: session.user.user_metadata.name || "",
          };
          login(userData.phone, session.access_token, userData);
          
          try {
            // Fetch profile data
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('formulario_alimentar_preenchido, formulario_treino_preenchido, plano_status')
              .eq('id', session.user.id)
              .single();
              
            if (error) {
              console.error('Error fetching profile:', error);
            } else if (profileData) {
              updateUser({
                formulario_alimentar_preenchido: profileData.formulario_alimentar_preenchido,
                formulario_treino_preenchido: profileData.formulario_treino_preenchido,
                plano_status: profileData.plano_status
              });
            }
          } catch (error) {
            console.error('Error during profile fetch:', error);
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
          <main className="min-h-[calc(100vh-8rem)] bg-background">
            <Routes>
              {/* Rotas públicas */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Rotas protegidas */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/anamnese" element={
                <ProtectedRoute>
                  <Anamnese />
                </ProtectedRoute>
              } />
              <Route path="/planos" element={
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
              
              {/* Rota 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
