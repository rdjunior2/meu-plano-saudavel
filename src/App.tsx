import { Toaster } from "@/components/ui/toaster";
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
import AdminIndex from "./pages/admin/index";
import CreateAdmin from "./pages/CreateAdmin";
import HistoricoCompras from "./pages/HistoricoCompras";
import UserProfile from "./pages/UserProfile";
import { logEvent, LogSeverity } from "./services/logs";
import ResetPassword from "./pages/ResetPassword";
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import DashboardLayout from './components/DashboardLayout';
import LoginDebugger from '@/components/dev/LoginDebugger';
import DebugLogin from './pages/DebugLogin';
import EmDevelopment from './components/EmDevelopment';
import AppLayout from './components/AppLayout';

// Novas páginas
import MeuPlano from "./pages/MeuPlano";
import TarefasDiarias from "./pages/TarefasDiarias";
import Acompanhamento from "./pages/Acompanhamento";
import AgenteNutri from "./pages/AgenteNutri";
import FormularioManager from "./pages/admin/FormularioManager";
import FormularioEditor from "./pages/admin/FormularioEditor";
import UsuariosManager from "./pages/admin/UsuariosManager";
import RespostasManager from "./pages/admin/RespostasManager";

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
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <AuthWrapper>
              <AppContent isDevelopment={isDevelopment} />
            </AuthWrapper>
          </BrowserRouter>
          
          {/* O LoginDebugger está importado mas não é renderizado na interface */}
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
};

const AppContent = ({ isDevelopment }: { isDevelopment: boolean }) => {
  const { isAuthenticated } = useAuthStore();
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

  // Status de autenticação
  const userAuthenticated = isAuthenticated;
  
  console.log('[AppContent] Estado de renderização:', {
    userAuthenticated,
    isCurrentRoutePublic,
    path: location.pathname
  });

  // Só mostra a Navbar quando estiver autenticado OU quando estiver em uma rota pública
  // E nunca mostra nas rotas de login e registro ou debug
  const showNavbar = (userAuthenticated || isCurrentRoutePublic) && 
                    !['/login', '/register', '/criar-senha', '/reset-password', '/debug-login'].includes(location.pathname);

  // Verificar se estamos em uma rota administrativa
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {showNavbar && <Navbar />}
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
          <PrivateRoute noPadding>
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
        
        {/* Área administrativa com rotas aninhadas */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminIndex />
          </AdminRoute>
        } />
        <Route path="/admin/planos" element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        } />
        <Route path="/admin/formularios" element={
          <AdminRoute>
            <FormularioManager />
          </AdminRoute>
        } />
        <Route path="/admin/formularios/novo" element={
          <AdminRoute>
            <FormularioEditor />
          </AdminRoute>
        } />
        <Route path="/admin/formularios/editar/:id" element={
          <AdminRoute>
            <FormularioEditor />
          </AdminRoute>
        } />
        <Route path="/admin/usuarios" element={
          <AdminRoute>
            <UsuariosManager />
          </AdminRoute>
        } />
        <Route path="/admin/respostas" element={
          <AdminRoute>
            <RespostasManager />
          </AdminRoute>
        } />
        
        {/* Rotas em desenvolvimento */}
        <Route path="/admin/notificacoes" element={
          <AdminRoute>
            <EmDevelopment 
              title="Notificações" 
              description="O sistema de gerenciamento de notificações está em desenvolvimento. Em breve você poderá enviar e gerenciar notificações para os usuários da plataforma."
            />
          </AdminRoute>
        } />
        <Route path="/admin/estatisticas" element={
          <AdminRoute>
            <EmDevelopment 
              title="Estatísticas" 
              description="O painel de estatísticas está em desenvolvimento. Em breve você poderá visualizar métricas e relatórios detalhados sobre o uso da plataforma."
            />
          </AdminRoute>
        } />
        <Route path="/admin/configuracoes" element={
          <AdminRoute>
            <EmDevelopment 
              title="Configurações" 
              description="As configurações do sistema estão em desenvolvimento. Em breve você poderá personalizar diversos aspectos da plataforma."
            />
          </AdminRoute>
        } />
        <Route path="/admin/database" element={
          <AdminRoute>
            <EmDevelopment 
              title="Gerenciamento de Banco de Dados" 
              description="O gerenciamento direto do banco de dados está em desenvolvimento. Em breve você terá acesso a ferramentas avançadas para manipulação de dados."
              returnText="Voltar para Área Administrativa"
            />
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
        {isDevelopment && (
          <Route path="/debug-login" element={<DebugLogin />} />
        )}
        
        {/* Novas rotas */}
        <Route path="/meu-plano" element={
          <PrivateRoute>
            <MeuPlano />
          </PrivateRoute>
        } />
        <Route path="/tarefas-diarias" element={
          <PrivateRoute>
            <TarefasDiarias />
          </PrivateRoute>
        } />
        <Route path="/acompanhamento" element={
          <PrivateRoute>
            <Acompanhamento />
          </PrivateRoute>
        } />
        <Route path="/agente-nutri" element={
          <PrivateRoute>
            <AgenteNutri />
          </PrivateRoute>
        } />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showNavbar && <Footer />}
    </>
  );
};

export default App;
