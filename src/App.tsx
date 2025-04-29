import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import { useEffect } from "react";
import { getUserProfile } from "./services/auth";
import { supabase } from './lib/supabaseClient';
import { AuthProvider } from './contexts/AuthContext';
import RootLayout from "./layouts/RootLayout";
import AppRoutes from "./routes/index";
import FeedbackProvider from "./contexts/FeedbackContext";
import GlobalLoading from "./components/feedback/GlobalLoading";

// Criando o cliente de React Query
const queryClient = new QueryClient();

// Wrapper de carregamento para aguardar verificação de sessão
const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, setIsAuthenticated, login, isInitialized, initialize } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      console.log('[AuthWrapper] Inicializando autenticação...');
      
      // Inicializar o authStore que verifica a sessão no Supabase
      if (!isInitialized) {
        await initialize();
        console.log('[AuthWrapper] Inicialização do authStore concluída');
      }
      
      // Verificar após a inicialização se o usuário está autenticado
      const token = localStorage.getItem("token");
      console.log('[AuthWrapper] Token no localStorage:', !!token);
      
      if (token) {
        try {
          // Verificar a sessão no Supabase
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('[AuthWrapper] Erro ao obter sessão:', error);
            localStorage.removeItem("token");
            setIsAuthenticated(false);
            return;
          }
          
          if (data?.session) {
            console.log('[AuthWrapper] Sessão válida encontrada, usuário autenticado');
            
            // Garantir que o estado reflete a autenticação
            if (!isAuthenticated) {
              setIsAuthenticated(true);
            }
            
            // Buscar perfil do usuário
            try {
              const userProfile = await getUserProfile(data.session.user.id);
              if (userProfile) {
                // Atualizar store com dados do usuário usando o login
                login(userProfile, data.session.access_token);
                console.log('[AuthWrapper] Perfil de usuário carregado');
              }
            } catch (profileError) {
              console.error('[AuthWrapper] Erro ao carregar perfil:', profileError);
            }
            
            // Se está na página de login/registro e já está autenticado, redirecionar para dashboard
            // Apenas redireciona a partir da página de login ou register, não da página inicial (/)
            if (['/login', '/register'].includes(location.pathname)) {
              console.log('[AuthWrapper] Usuário já autenticado, redirecionando para dashboard');
              navigate('/dashboard');
            }
          } else {
            // Sessão inválida, remover token
            console.warn('[AuthWrapper] Token encontrado, mas sessão inválida, removendo token');
            localStorage.removeItem("token");
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('[AuthWrapper] Erro ao verificar autenticação:', error);
          setIsAuthenticated(false);
        }
      } else {
        // Sem token no localStorage
        setIsAuthenticated(false);
      }
    };

    initAuth();
  }, [setIsAuthenticated, login, location.pathname, navigate, isInitialized, initialize]);

  console.log('[AuthWrapper] Estado de autenticação:', { 
    isAuthenticated, 
    path: location.pathname
  });

  return <>{children}</>;
};

const App = () => {
  // Verificar se estamos em ambiente de desenvolvimento
  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';
  
  return (
    <AuthProvider>
      <FeedbackProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <AuthWrapper>
                <GlobalLoading />
                <RootLayout>
                  <AppRoutes isDevelopment={isDevelopment} />
                </RootLayout>
              </AuthWrapper>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </FeedbackProvider>
    </AuthProvider>
  );
};

export default App;
