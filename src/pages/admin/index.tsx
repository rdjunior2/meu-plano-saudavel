import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  Users, 
  ClipboardList, 
  Settings, 
  FileText, 
  ChartBar, 
  Bell, 
  Clipboard,
  Image,
  Utensils,
  ShoppingBasket
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';

interface AdminStats {
  totalUsers: number;
  pendingPlans: number;
  activeUsers: number;
  totalNotifications: number;
  activatedToday: number;
}

export default function AdminIndex() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    pendingPlans: 0,
    activeUsers: 0,
    totalNotifications: 0,
    activatedToday: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Buscar estatísticas
        const [
          { count: totalUsers, error: userError },
          { count: pendingPlans, error: planError },
          { count: activeUsers, error: activeError },
          { count: totalNotifications, error: notifError },
          { data: activations, error: activationsError }
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('meal_plans').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status_geral', 'ativo'),
          supabase.from('notifications').select('*', { count: 'exact', head: true }),
          supabase.from('plan_activations').select('*')
            .gte('activated_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
        ]);

        if (userError || planError || activeError || notifError || activationsError) {
          throw new Error('Erro ao buscar estatísticas');
        }

        setStats({
          totalUsers: totalUsers || 0,
          pendingPlans: pendingPlans || 0,
          activeUsers: activeUsers || 0,
          totalNotifications: totalNotifications || 0,
          activatedToday: activations?.length || 0
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  const handleModuleClick = (path: string, isImplemented: boolean = true) => {
    if (isImplemented) {
      navigate(path);
    } else {
      toast.info("Esta funcionalidade está em desenvolvimento", {
        description: "Este módulo estará disponível em breve."
      });
    }
  };

  const adminModules = [
    {
      title: 'Gestão de Usuários',
      description: 'Gerenciar usuários, permissões e status de contas',
      icon: <Users className="h-8 w-8 text-blue-500" />,
      path: '/admin/usuarios',
      badge: stats.totalUsers > 0 ? `${stats.totalUsers} usuários` : undefined,
      badgeColor: 'bg-blue-100 text-blue-800',
      implemented: true
    },
    {
      title: 'Planos Alimentares',
      description: 'Criar e gerenciar modelos de planos alimentares',
      icon: <Utensils className="h-8 w-8 text-green-500" />,
      path: '/admin/planos',
      implemented: true
    },
    {
      title: 'Produtos',
      description: 'Cadastrar e gerenciar produtos e serviços',
      icon: <ShoppingBasket className="h-8 w-8 text-orange-500" />,
      path: '/admin/produtos',
      implemented: true
    },
    {
      title: 'Planos Pendentes',
      description: 'Ativar e gerenciar planos alimentares e de treino',
      icon: <ClipboardList className="h-8 w-8 text-emerald-500" />,
      path: '/admin/planos',
      badge: stats.pendingPlans > 0 ? `${stats.pendingPlans} pendentes` : 'Nenhum pendente',
      badgeColor: stats.pendingPlans > 0 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800',
      implemented: true
    },
    {
      title: 'Formulários',
      description: 'Gerenciar formulários alimentares e de treino',
      icon: <FileText className="h-8 w-8 text-violet-500" />,
      path: '/admin/formularios',
      implemented: true
    },
    {
      title: 'Respostas de Formulários',
      description: 'Visualizar e exportar respostas enviadas pelos usuários',
      icon: <Clipboard className="h-8 w-8 text-indigo-500" />,
      path: '/admin/respostas',
      badge: 'Novo',
      badgeColor: 'bg-indigo-100 text-indigo-800',
      implemented: true
    },
    {
      title: 'Banco de Imagens',
      description: 'Gerencie as imagens utilizadas nos produtos e planos',
      icon: <Image className="h-8 w-8 text-sky-500" />,
      path: '/admin/imagens',
      implemented: false
    },
    {
      title: 'Notificações',
      description: 'Gerenciar e enviar notificações para usuários',
      icon: <Bell className="h-8 w-8 text-amber-500" />,
      path: '/admin/notificacoes',
      badge: stats.totalNotifications > 0 ? `${stats.totalNotifications}` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
      implemented: false
    },
    {
      title: 'Estatísticas',
      description: 'Visualizar métricas e relatórios do sistema',
      icon: <ChartBar className="h-8 w-8 text-purple-500" />,
      path: '/admin/estatisticas',
      badge: 'Novo',
      badgeColor: 'bg-purple-100 text-purple-800',
      implemented: false
    },
    {
      title: 'Configurações',
      description: 'Configurações do sistema e da aplicação',
      icon: <Settings className="h-8 w-8 text-gray-700" />,
      path: '/admin/configuracoes',
      implemented: false
    }
  ];

  if (isLoading) {
    return (
      <DashboardLayout 
        title="Painel Administrativo" 
        isAdmin={true}
        gradient="subtle"
        icon={<Settings className="h-5 w-5 text-slate-600" />}
      >
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600" />
          <p className="mt-4 text-sky-800 font-medium">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Painel Administrativo"
      subtitle={`Bem-vindo, ${user?.nome || 'Administrador'}. Selecione um módulo para gerenciar.`}
      isAdmin={true}
      gradient="subtle"
      icon={<Settings className="h-5 w-5 text-slate-600" />}
    >
      {/* Cards com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-blue-700">Total de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-600">{stats.totalUsers}</p>
            <p className="text-sm text-blue-600 mt-1">
              {stats.activeUsers} ativos ({Math.round((stats.activeUsers / stats.totalUsers) * 100) || 0}%)
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-emerald-700">Planos Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-emerald-600">{stats.pendingPlans}</p>
            <p className="text-sm text-emerald-600 mt-1">Aguardando ativação</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-purple-700">Notificações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-purple-600">{stats.totalNotifications}</p>
            <p className="text-sm text-purple-600 mt-1">Enviadas no total</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-amber-700">Taxa de Ativação</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-amber-600">
              {stats.pendingPlans > 0 
                ? `${Math.round((stats.activatedToday / stats.pendingPlans) * 100)}%` 
                : '0%'}
            </p>
            <p className="text-sm text-amber-600 mt-1">Planos ativados hoje</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Módulos administrativos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminModules.map((module, index) => (
          <Card 
            key={index}
            className={`cursor-pointer hover:shadow-md transition-all duration-200 overflow-hidden border-gray-200 ${module.implemented ? '' : 'opacity-70'}`}
            onClick={() => handleModuleClick(module.path, module.implemented)}
          >
            <CardHeader className="flex flex-row items-start space-y-0 pb-2">
              <div className="flex-1">
                <CardTitle className="text-xl font-semibold">{module.title}</CardTitle>
                <CardDescription className="mt-1 text-slate-600">
                  {module.description}
                </CardDescription>
              </div>
              <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                {module.icon}
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              {module.badge && (
                <Badge className={`${module.badgeColor}`}>
                  {module.badge}
                </Badge>
              )}
            </CardContent>
            <CardFooter className="pt-0 pb-3 flex justify-end">
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
} 