import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import { useEffect, useState } from "react";
import { checkSession, logout } from "./services/auth";
import { getUserProfile } from "./services/auth";
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
import HistoricoCompras from "./pages/HistoricoCompras";
import UserProfile from "./pages/UserProfile";
import { logEvent, LogSeverity } from "./services/logs";
import ResetPassword from "./pages/ResetPassword";
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';

const queryClient = new QueryClient();

// Wrapper de carregamento para aguardar verificação de sessão
const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('[AuthWrapper] Inicializando autenticação, caminho atual:', location.pathname);
        
        // Garantir que isAuthenticated seja false por padrão durante a inicialização
        setIsAuthenticated(false);
        
        // Verificando se há token no localStorage
        const localToken = localStorage.getItem('token');
        
        // Verificar a sessão no Supabase
        const session = await checkSession();
        
        if (session) {
          console.log('[AuthWrapper] Sessão encontrada, buscando perfil do usuário', { 
            userId: session.user.id,
            expiresAt: new Date(session.expires_at * 1000).toISOString()
          });
          
          // Se não existir token no localStorage mas existir sessão,
          // sincronize os tokens
          if (!localToken && session.access_token) {
            localStorage.setItem('token', session.access_token);
          }
          
          // Sessão existente, buscar perfil do usuário
          const user = await getUserProfile(session.user.id);
          
          if (user) {
            console.log('[AuthWrapper] Perfil encontrado, realizando login automático');
            login(user, session.access_token);
          } else {
            // Não conseguiu buscar o perfil, fazer logout
            console.warn('[AuthWrapper] Perfil não encontrado, realizando logout');
            await logout();
            setIsAuthenticated(false);
            if (!isPublicRoute(location.pathname)) {
              console.log('[AuthWrapper] Redirecionando para /login (perfil não encontrado)');
              navigate('/login');
            }
          }
        } else {
          // Sem sessão, redirecionar se estiver em rota protegida
          console.log('[AuthWrapper] Nenhuma sessão encontrada');
          setIsAuthenticated(false);
          if (!isPublicRoute(location.pathname)) {
            console.log('[AuthWrapper] Redirecionando para /login (sem sessão)');
            navigate('/login');
          }
        }
      } catch (error) {
        console.error('[AuthWrapper] Erro ao inicializar autenticação:', error);
        await logout();
        setIsAuthenticated(false);
        if (!isPublicRoute(location.pathname)) {
          console.log('[AuthWrapper] Redirecionando para /login (erro de autenticação)');
          navigate('/login');
        }
      } finally {
        console.log('[AuthWrapper] Inicialização de autenticação concluída');
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [login, navigate, location.pathname, setIsAuthenticated]);
  
  // Verificação periódica da sessão (a cada 5 minutos)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(async () => {
      try {
        const session = await checkSession();
        
        if (!session) {
          await logout();
          setIsAuthenticated(false);
          navigate('/login');
          
          // Registrar log
          logEvent(
            'session_expired',
            'Sessão expirada automaticamente',
            LogSeverity.INFO
          );
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
      }
    }, 5 * 60 * 1000); // 5 minutos
    
    return () => clearInterval(interval);
  }, [isAuthenticated, navigate, setIsAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
};

// Verifica se a rota é pública (não requer autenticação)
const isPublicRoute = (pathname: string) => {
  // Lista de rotas públicas básicas
  const publicRoutes = ['/', '/login', '/register', '/criar-senha'];
  
  // Verificação direta para rotas básicas
  if (publicRoutes.includes(pathname)) {
    return true;
  }
  
  // Verificação especial para a rota de redefinição de senha
  // Isso garantirá que /reset-password com qualquer parâmetro ou hash seja considerada pública
  if (pathname === '/reset-password' || pathname.startsWith('/reset-password/')) {
    return true;
  }
  
  return false;
};

// Componente para rotas protegidas de admin
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthContext();
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!user?.is_admin) {
    // Registrar tentativa de acesso não autorizado
    logEvent(
      'unauthorized_access',
      'Tentativa de acesso a área de admin por usuário não autorizado',
      LogSeverity.WARNING,
      { userId: user?.id }
    );
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
    }
  }, [setIsAuthenticated]);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthWrapper>
              {isAuthenticated ? <Navbar /> : null}
              <div className="flex-1">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/criar-senha" element={<CriarSenha />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/create-admin" element={<CreateAdmin />} />
                  <Route path="/anamnese" element={
                    <PrivateRoute>
                      <Anamnese />
                    </PrivateRoute>
                  } />
                  <Route path="/dashboard" element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  } />
                  <Route path="/plano/:id" element={
                    <PrivateRoute>
                      <PlanoDetalhes />
                    </PrivateRoute>
                  } />
                  <Route path="/formulario-alimentar" element={
                    <PrivateRoute>
                      <FormularioAlimentar />
                    </PrivateRoute>
                  } />
                  <Route path="/formulario-treino" element={
                    <PrivateRoute>
                      <FormularioTreino />
                    </PrivateRoute>
                  } />
                  <Route path="/perfil" element={
                    <PrivateRoute>
                      <UserProfile />
                    </PrivateRoute>
                  } />
                  <Route path="/historico-compras" element={
                    <PrivateRoute>
                      <HistoricoCompras />
                    </PrivateRoute>
                  } />
                  <Route path="/admin" element={
                    <AdminRoute>
                      <AdminPage />
                    </AdminRoute>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
              {isAuthenticated ? <Footer /> : null}
            </AuthWrapper>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
};

export default App;
