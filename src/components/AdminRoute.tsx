import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode, useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { logEvent, LogSeverity } from '@/services/logs';
import { supabase } from '@/lib/supabaseClient';
import LoadingSpinner from './LoadingSpinner';
import { AlertCircle } from 'lucide-react';
import AppLayout from './AppLayout';

/**
 * Interface para as propriedades do componente AdminRoute
 */
interface AdminRouteProps {
  children: ReactNode;
  redirectPath?: string;
  noPermissionPath?: string;
  gradient?: boolean;
  noPadding?: boolean;
}

/**
 * Componente para proteger rotas que exigem permissões de administrador
 */
const AdminRoute = ({
  children,
  redirectPath = "/login",
  noPermissionPath = "/",
  gradient = true,
  noPadding = false
}: AdminRouteProps) => {
  const { user, isAuthenticated, isLoading: authStoreLoading } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const location = useLocation();

  // Verificação de permissões de administrador
  useEffect(() => {
    const verifyAdminPermission = async () => {
      try {
        // Primeiro verificar se o usuário já tem permissões no store
        if (user?.is_admin) {
          setIsAdmin(true);
          setIsVerifying(false);
          return;
        }

        // Verificar autenticação primeiro
        if (!isAuthenticated) {
          setIsVerifying(false);
          return;
        }

        // Verificar permissões no Supabase
        const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser();

        if (userError || !supabaseUser) {
          logEvent('admin_auth_error', 'Erro ao verificar usuário para permissões admin', LogSeverity.ERROR, {
            error: userError?.message
          });
          setAuthError('Erro ao verificar permissões. Por favor, faça login novamente.');
          setIsVerifying(false);
          return;
        }

        // Verificar se o usuário é admin
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', supabaseUser.id)
          .single();

        if (profileError) {
          logEvent('admin_auth_error', 'Erro ao verificar perfil para permissões admin', LogSeverity.ERROR, {
            error: profileError.message
          });
          setAuthError('Erro ao verificar permissões de administrador.');
          setIsVerifying(false);
          return;
        }

        if (!profile?.is_admin) {
          logEvent('admin_access_denied', 'Tentativa de acesso a área administrativa sem permissões', LogSeverity.WARNING, {
            userId: supabaseUser.id,
            path: location.pathname
          });
          setAuthError('Você não possui permissões de administrador para acessar esta área.');
          setIsVerifying(false);
          return;
        }

        // Usuário é admin
        setIsAdmin(true);
        logEvent('admin_access', 'Acesso à área administrativa', LogSeverity.INFO, {
          userId: supabaseUser.id,
          path: location.pathname
        });
      } catch (error) {
        console.error('[AdminRoute] Erro ao verificar permissões de administrador:', error);
        logEvent('admin_auth_error', 'Erro ao verificar permissões', LogSeverity.ERROR, {
          path: location.pathname,
          error
        });
        setAuthError('Ocorreu um erro ao verificar suas permissões.');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAdminPermission();
  }, [user, isAuthenticated, location.pathname]);

  // Exibe um indicador de carregamento enquanto verifica a autenticação
  if (authStoreLoading || isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-sky-50 to-white p-4">
        <LoadingSpinner size="lg" color="sky" />
        <p className="mt-4 text-sky-800 font-medium">Verificando permissões de administrador...</p>
      </div>
    );
  }

  // Redirecionar para login se não estiver autenticado
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace state={{ from: location, message: 'Faça login para acessar a área administrativa' }} />;
  }

  // Mostra erro de permissão e redireciona se não for admin
  if (authError || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-red-50 to-white p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full border border-red-100">
          <div className="flex items-center justify-center text-red-500 mb-4">
            <AlertCircle className="h-16 w-16" />
          </div>
          <h1 className="text-xl font-semibold text-red-700 text-center mb-2">Acesso Negado</h1>
          <p className="text-slate-600 text-center">{authError || 'Você não possui permissões de administrador.'}</p>
          <p className="text-slate-500 text-center text-sm mt-4">Redirecionando...</p>
        </div>
        <Navigate to={noPermissionPath} replace />
      </div>
    );
  }

  // Se for admin, renderiza o conteúdo protegido dentro do layout para admin
  return (
    <AppLayout
      isAdmin={true}
      gradient={gradient}
      noPadding={noPadding}
    >
      {children}
    </AppLayout>
  );
};

export default AdminRoute; 