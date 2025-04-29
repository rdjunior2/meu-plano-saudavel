import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoadingSpinner from '@/components/LoadingSpinner';
import PrivateRoute from '@/components/PrivateRoute';
import AdminRoute from '@/components/AdminRoute';

// Lazy-loaded components para melhorar performance
const Index = lazy(() => import('@/pages/Index'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const CriarSenha = lazy(() => import('@/pages/CriarSenha'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const CreateAdmin = lazy(() => import('@/pages/CreateAdmin'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Anamnese = lazy(() => import('@/pages/Anamnese'));
const PlanoDetalhes = lazy(() => import('@/pages/PlanoDetalhes'));
const FormularioAlimentar = lazy(() => import('@/pages/FormularioAlimentar'));
const FormularioTreino = lazy(() => import('@/pages/FormularioTreino'));
const HistoricoCompras = lazy(() => import('@/pages/HistoricoCompras'));
const UserProfile = lazy(() => import('@/pages/UserProfile'));
const MeuPlano = lazy(() => import('@/pages/MeuPlano'));
const TarefasDiarias = lazy(() => import('@/pages/TarefasDiarias'));
const Acompanhamento = lazy(() => import('@/pages/Acompanhamento'));
const AgenteNutri = lazy(() => import('@/pages/AgenteNutri'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const DebugLogin = lazy(() => import('@/pages/DebugLogin'));

// Admin pages
const AdminIndex = lazy(() => import('@/pages/admin/index'));
const AdminPage = lazy(() => import('@/pages/admin'));
const FormularioManager = lazy(() => import('@/pages/admin/FormularioManager'));
const FormularioEditor = lazy(() => import('@/pages/admin/FormularioEditor'));
const UsuariosManager = lazy(() => import('@/pages/admin/UsuariosManager'));
const RespostasManager = lazy(() => import('@/pages/admin/RespostasManager'));
const PlanosManager = lazy(() => import('@/pages/admin/PlanosManager'));
const EmDevelopment = lazy(() => import('@/components/EmDevelopment'));

// Componente de fallback usado durante o carregamento lazy
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <LoadingSpinner size="lg" color="emerald" />
  </div>
);

interface AppRoutesProps {
  isDevelopment?: boolean;
}

const AppRoutes: React.FC<AppRoutesProps> = ({ isDevelopment = false }) => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/criar-senha" element={<CriarSenha />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/create-admin" element={<CreateAdmin />} />
        
        {/* Rotas privadas de usuário */}
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
        
        {/* Rotas administrativas */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminIndex />
          </AdminRoute>
        } />
        <Route path="/admin/planos" element={
          <AdminRoute title="Planos" subtitle="Gerencie os planos disponíveis">
            <PlanosManager />
          </AdminRoute>
        } />
        <Route path="/admin/formularios" element={
          <AdminRoute title="Formulários" subtitle="Gerencie os formulários do sistema">
            <FormularioManager />
          </AdminRoute>
        } />
        <Route path="/admin/formularios/novo" element={
          <AdminRoute title="Novo Formulário" subtitle="Crie um novo formulário para o sistema">
            <FormularioEditor />
          </AdminRoute>
        } />
        <Route path="/admin/formularios/editar/:id" element={
          <AdminRoute title="Editar Formulário" subtitle="Altere um formulário existente">
            <FormularioEditor />
          </AdminRoute>
        } />
        <Route path="/admin/usuarios" element={
          <AdminRoute title="Usuários" subtitle="Gerencie os usuários do sistema">
            <UsuariosManager />
          </AdminRoute>
        } />
        <Route path="/admin/respostas" element={
          <AdminRoute title="Respostas" subtitle="Visualize as respostas dos formulários">
            <RespostasManager />
          </AdminRoute>
        } />
        
        {/* Rotas em desenvolvimento */}
        <Route path="/admin/notificacoes" element={
          <AdminRoute title="Notificações" subtitle="Sistema de notificações">
            <EmDevelopment 
              title="Notificações" 
              description="O sistema de gerenciamento de notificações está em desenvolvimento. Em breve você poderá enviar e gerenciar notificações para os usuários da plataforma."
            />
          </AdminRoute>
        } />
        <Route path="/admin/estatisticas" element={
          <AdminRoute title="Estatísticas" subtitle="Métricas e relatórios">
            <EmDevelopment 
              title="Estatísticas" 
              description="O painel de estatísticas está em desenvolvimento. Em breve você poderá visualizar métricas e relatórios detalhados sobre o uso da plataforma."
            />
          </AdminRoute>
        } />
        <Route path="/admin/configuracoes" element={
          <AdminRoute title="Configurações" subtitle="Ajustes do sistema">
            <EmDevelopment 
              title="Configurações" 
              description="As configurações do sistema estão em desenvolvimento. Em breve você poderá personalizar diversos aspectos da plataforma."
            />
          </AdminRoute>
        } />
        <Route path="/admin/database" element={
          <AdminRoute title="Banco de Dados" subtitle="Gerenciamento avançado">
            <EmDevelopment 
              title="Gerenciamento de Banco de Dados" 
              description="O gerenciamento direto do banco de dados está em desenvolvimento. Em breve você terá acesso a ferramentas avançadas para manipulação de dados."
              returnText="Voltar para Área Administrativa"
            />
          </AdminRoute>
        } />
        <Route path="/admin/imagens" element={
          <AdminRoute title="Banco de Imagens" subtitle="Gerenciamento de mídia">
            <EmDevelopment 
              title="Banco de Imagens" 
              description="O gerenciamento de imagens está em desenvolvimento. Em breve você poderá fazer upload, visualizar e organizar imagens utilizadas nos planos e produtos."
              returnText="Voltar para Área Administrativa"
            />
          </AdminRoute>
        } />
        
        {/* Rota modo debug - apenas em desenvolvimento */}
        {isDevelopment && (
          <Route path="/debug-login" element={
            <Suspense fallback={<PageLoader />}>
              <DebugLogin />
            </Suspense>
          } />
        )}
        
        {/* Rota 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes; 