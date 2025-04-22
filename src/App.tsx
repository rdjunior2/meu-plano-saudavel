import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import { useEffect, useState, useMemo } from "react";
import { checkSession, logout, getUserProfile } from "./services/auth";
import { supabase } from './lib/supabaseClient';
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
import AuthDebugHelper from './components/AuthDebugHelper';

// Criando o cliente de React Query
const queryClient = new QueryClient();

// Wrapper de carregamento para aguardar verificação de sessão
const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthContext();
  const isAuthenticatedStore = useAuthStore((state) => state.isAuthenticated);
  const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar se existe um token no localStorage
        const token = localStorage.getItem("token");
        
        if (token) {
          // Se existe um token, verificar a sessão no Supabase
          const { data } = await supabase.auth.getSession();
          
          if (data.session) {
            // Se a sessão é válida, atualizar estado de autenticação
            setIsAuthenticated(true);
            console.log('[AuthWrapper] Sessão válida encontrada, usuário autenticado');

            // Buscar perfil do usuário
            try {
              const userProfile = await getUserProfile(data.session.user.id);
              if (userProfile) {
                // Atualizar store com dados do usuário
                useAuthStore.getState().login(userProfile, data.session.access_token);
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
        } else {
          // Sem token no localStorage
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('[AuthWrapper] Erro ao verificar autenticação:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [setIsAuthenticated, location.pathname, navigate]);

  console.log('[AuthWrapper] Estado de autenticação:', { 
    isAuthenticated, 
    isAuthenticatedStore,
    path: location.pathname
  });

  return <>{children}</>;
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
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthWrapper>
              <AppContent />
            </AuthWrapper>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
};

const AppContent = () => {
  const { isAuthenticated } = useAuthContext();
  const isAuthStore = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();
  
  // Lista de rotas públicas que não exigem autenticação
  const publicRoutes = useMemo(() => [
    '/',
    '/login',
    '/register',
    '/criar-senha',
    '/reset-password',
    '/create-admin'
  ], []);

  // Verificação se a rota atual é pública
  const isCurrentRoutePublic = useMemo(() => {
    return publicRoutes.some(route => 
      location.pathname === route || 
      (route === '/reset-password' && location.pathname.startsWith('/reset-password'))
    );
  }, [location.pathname, publicRoutes]);

  // Status de autenticação combinado
  const userAuthenticated = isAuthenticated || isAuthStore;
  
  console.log('[AppContent] Estado de renderização:', {
    userAuthenticated,
    isCurrentRoutePublic,
    path: location.pathname
  });

  // Só mostra a Navbar quando estiver autenticado OU quando estiver em uma rota pública
  // E nunca mostra nas rotas de login e registro
  const showNavbar = (userAuthenticated || isCurrentRoutePublic) && 
                    !['/login', '/register', '/criar-senha', '/reset-password'].includes(location.pathname);

  return (
    <>
      {showNavbar && <Navbar />}
      <div className="min-h-screen flex flex-col">
        {import.meta.env.DEV && <AuthDebugHelper />}
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
          <Route path="/admin" element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          } />
          <Route path="/historico-compras" element={
            <PrivateRoute>
              <HistoricoCompras />
            </PrivateRoute>
          } />
          <Route path="/perfil" element={
            <PrivateRoute>
              <UserProfile />
            </PrivateRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      {showNavbar && <Footer />}
    </>
  );
};

export default App;
