import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { supabase } from '../lib/supabaseClient';
import { 
  PlanStatus, 
  PurchaseStatus, 
  ProductType, 
  FormStatus 
} from '../integrations/supabase/types';
import { IconActivity, IconList, IconClock, IconAlertCircle, IconClipboardCheck, IconHourglass } from '../components/ui/icons';
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { 
  AlertCircle, 
  Check, 
  Info, 
  Package, 
  ShoppingCart, 
  FileText, 
  FileCheck2, 
  FileX2, 
  Clock,
  Salad, 
  Dumbbell,
  List,
  Activity,
  CalendarClock,
  Home
} from "lucide-react";
import { Sparkles, BarChart3 } from 'lucide-react';
import { Zap } from 'lucide-react';
import { Calendar } from 'lucide-react';
import { cn, shadowEffects, gradients, animations } from '@/lib/utils';
import { UserFormStatus } from '@/types/plans';
import { PurchaseItem, UserPurchaseStatus } from '@/types/purchase';

// Componentes do Dashboard
import StatusCards from '@/components/dashboard/StatusCards';
import FormStatusComponent from '@/components/dashboard/FormStatus';
import PlanosDisponiveis from '@/components/dashboard/PlanosDisponiveis';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/PageHeader';
import AppCard from '@/components/AppCard';
import AppTabs from '@/components/AppTabs';

// Importando MealPlan e WorkoutPlan com aliases para evitar conflitos
import { MealPlan as MealPlanType, WorkoutPlan as WorkoutPlanType } from '@/types/plans';

enum ActiveTab {
  Meal = 'meal',
  Workout = 'workout',
}

// Definindo um tipo estendido para ProductType
type ExtendedProductType = ProductType | 'alimentar' | 'treino';

interface PurchaseItemExtended extends Omit<PurchaseItem, 'product_type'> {
  product_type: ExtendedProductType;
}

// Usando os tipos importados
interface MealPlan extends MealPlanType {}
interface WorkoutPlan extends WorkoutPlanType {}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.Meal);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [stats, setStats] = useState<UserPurchaseStatus | null>(null);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [formStatus, setFormStatus] = useState<UserFormStatus>({ 
    alimentar_completed: false, 
    treino_completed: false 
  });
  const [planos, setPlanos] = useState<any[]>([]);
  const [purchaseStatus, setPurchaseStatus] = useState<UserPurchaseStatus | null>(null);

  const fetchUserStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Verificar se a função RPC existe
      const { data, error } = await supabase.rpc(
        'get_user_purchase_status',
        { user_id: user.id }
      );

      if (error) {
        console.error('Erro ao buscar estatísticas do usuário:', error);
        // Criar objeto com valores padrão se a função RPC não existir
        setStats({
          user_id: user.id,
          total_purchases: 0,
          completed_forms: 0,
          pending_forms: 0,
          ready_plans: 0,
          active_plans: 0,
          awaiting_plans: 0
        });
        return;
      }

      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (error) {
      console.error('Erro ao processar estatísticas do usuário:', error);
      // Criar objeto com valores padrão em caso de erro
      setStats({
        user_id: user.id,
        total_purchases: 0,
        completed_forms: 0,
        pending_forms: 0,
        ready_plans: 0,
        active_plans: 0,
        awaiting_plans: 0
      });
    }
  }, [user?.id]);

  const fetchPurchaseItems = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('v_purchase_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('purchase_status', PurchaseStatus.APPROVED);

      if (error) {
        console.error('Erro ao buscar compras:', error);
        return;
      }

      setPurchaseItems(data || []);
    } catch (error) {
      console.error('Erro ao processar compras:', error);
    }
  }, [user?.id]);

  const fetchPlans = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Buscar planos alimentares
      const { data: mealData, error: mealError } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', user.id);

      if (mealError) {
        console.error('Erro ao buscar planos alimentares:', mealError);
      } else {
        setMealPlans(mealData || []);
      }

      // Buscar planos de treino
      const { data: workoutData, error: workoutError } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', user.id);

      if (workoutError) {
        console.error('Erro ao buscar planos de treino:', workoutError);
      } else {
        setWorkoutPlans(workoutData || []);
      }
    } catch (error) {
      console.error('Erro ao processar planos:', error);
    }
  }, [user?.id]);

  const fetchFormStatus = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Verificar se a tabela user_status existe
      const { data, error } = await supabase
        .from('user_status')
        .select('alimentar_completed, treino_completed')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Erro ao buscar status dos formulários:', error);
        // Definir valores padrão se a tabela não existir
        const defaultStatus = { 
          alimentar_completed: false, 
          treino_completed: false 
        };
        setFormStatus(defaultStatus);
        
        // Atualiza o status do usuário na store com tipagem correta
        if (user) {
          updateUser({
            ...user,
            alimentar_completed: false,
            treino_completed: false
          });
        }
        return;
      }

      if (data) {
        setFormStatus(data);
        // Atualiza o status do usuário na store com tipagem correta
        if (user) {
          updateUser({
            ...user,
            alimentar_completed: data.alimentar_completed,
            treino_completed: data.treino_completed
          });
        }
      }
    } catch (error) {
      console.error('Erro ao buscar status dos formulários:', error);
      // Definir valores padrão em caso de erro
      setFormStatus({ 
        alimentar_completed: false, 
        treino_completed: false 
      });
    } finally {
      setLoading(false);
    }
  }, [user, updateUser]);

  const fetchPurchaseStatus = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .rpc('get_user_purchase_status', { 
          p_user_id: user.id 
        });

      if (error) throw error;

      if (data && data.length > 0) {
        setPurchaseStatus(data[0]);
      }
    } catch (error) {
      console.error('Erro ao buscar status de compras:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchPurchaseItems(),
          fetchUserStats(),
          fetchPlans(),
          fetchFormStatus(),
          fetchPurchaseStatus()
        ]);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [
    isAuthenticated, 
    navigate, 
    fetchPurchaseItems, 
    fetchUserStats, 
    fetchPlans, 
    fetchFormStatus, 
    fetchPurchaseStatus
  ]);

  const hasMealProduct = () => {
    return purchaseItems.some(item => item.product_type === ProductType.MEAL_PLAN);
  };

  const hasWorkoutProduct = () => {
    return purchaseItems.some(item => item.product_type === ProductType.WORKOUT_PLAN);
  };

  const getFormularioLink = (item: PurchaseItem) => {
    if (item.product_type === ProductType.MEAL_PLAN) {
      return '/formulario-alimentar';
    } else if (item.product_type === ProductType.WORKOUT_PLAN) {
      return '/formulario-treino';
    } else {
      return '#';
    }
  };

  const renderPendingFormsList = () => {
    const pendingItems = purchaseItems.filter(item => !item.has_form_response);
    
    if (pendingItems.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          <FileCheck2 className="h-10 w-10 mx-auto mb-2 text-emerald-500" />
          <p>Todos os formulários foram preenchidos. Ótimo trabalho!</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {pendingItems.map(item => (
          <Link key={item.item_id} to={getFormularioLink(item)}>
            <Button 
              variant="outline" 
              className="w-full justify-start border-emerald-200 hover:border-emerald-400 text-emerald-800 group"
            >
              <FileText className="h-4 w-4 mr-2 text-emerald-600 group-hover:scale-110 transition-transform" />
              Formulário {item.product_type === ProductType.MEAL_PLAN ? 'Alimentar' : 'de Treino'}
            </Button>
          </Link>
        ))}
      </div>
    );
  };

  const getFormCompletionPercentage = () => {
    if (!stats) return 0;
    
    const total = stats.total_purchases * 2; // 2 forms per purchase (alimentar + treino)
    const completed = stats.completed_forms;
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const renderFormStatus = () => {
    // Verifica se o usuário fez alguma compra
    if (!stats || stats.total_purchases === 0) {
      return (
        <AppCard
          title="Nenhuma compra encontrada"
          icon={<ShoppingCart className="h-5 w-5" />}
          gradient
          footer={
            <Link to="/">
              <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-none shadow-md group">
                Ver planos disponíveis
                <ShoppingCart className="ml-2 h-4 w-4 group-hover:scale-110 transition-all" />
              </Button>
            </Link>
          }
        >
          <p className="text-orange-700 text-sm mb-4">
            Você ainda não possui nenhum plano. Faça a compra para acessar todos os recursos.
          </p>
        </AppCard>
      );
    }

    // Verifica se existem formulários pendentes
    if (stats.pending_forms > 0) {
      const completionPercentage = getFormCompletionPercentage();
      
      return (
        <AppCard
          title="Formulários pendentes"
          subtitle="Complete os formulários para criar seu plano personalizado"
          icon={<FileText className="h-5 w-5" />}
          gradient
        >
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1 text-sm">
              <span className="text-emerald-700">Progresso</span>
              <span className="font-medium text-emerald-800">{completionPercentage}%</span>
            </div>
            <Progress 
              value={completionPercentage} 
              className="h-2 bg-emerald-100"
              indicatorClassName="bg-gradient-to-r from-emerald-500 to-teal-500"
            />
          </div>
          
          {renderPendingFormsList()}
        </AppCard>
      );
    }

    // Se todos os formulários foram preenchidos, mas nenhum plano está pronto
    if (stats.ready_plans === 0 && stats.awaiting_plans > 0) {
      return (
        <AppCard
          title="Planos em preparação"
          subtitle="Nossos especialistas estão trabalhando no seu plano personalizado"
          icon={<Clock className="h-5 w-5" />}
          gradient
        >
          <p className="text-blue-700 mb-4">
            Os formulários foram recebidos e seus planos personalizados serão elaborados em breve.
            Você receberá uma notificação assim que estiverem prontos!
          </p>
          <div className="flex items-center gap-2 text-blue-600 bg-blue-100/70 p-3 rounded-md">
            <Info className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">Tempo médio de entrega: 24-48 horas</p>
          </div>
        </AppCard>
      );
    }

    // Se todos os formulários foram preenchidos e os planos estão prontos
    return (
      <AppCard
        title="Planos prontos"
        subtitle="Seus planos personalizados estão disponíveis"
        icon={<Check className="h-5 w-5" />}
        gradient
      >
        <p className="text-green-700 mb-4">
          Acesse seus planos personalizados na aba abaixo.
        </p>
        <div className="flex items-center gap-2 text-green-600 bg-green-100/70 p-3 rounded-md">
          <Info className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">Você pode alternar entre seu plano alimentar e de treino usando as abas abaixo.</p>
        </div>
      </AppCard>
    );
  };

  const renderStatusCards = () => {
    if (!stats) return null;
    
    return (
      <>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <AppCard className="h-full">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                <Package className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-emerald-800 mb-1">
                {stats.total_purchases}
              </h3>
              <p className="text-emerald-600 text-sm">Planos adquiridos</p>
            </div>
          </AppCard>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <AppCard className="h-full">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center mb-3">
                <FileCheck2 className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-teal-800 mb-1">
                {stats.completed_forms}/{stats.total_purchases * 2}
              </h3>
              <p className="text-teal-600 text-sm">Formulários preenchidos</p>
            </div>
          </AppCard>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <AppCard className="h-full">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-green-800 mb-1">
                {stats.ready_plans}
              </h3>
              <p className="text-green-600 text-sm">Planos ativos</p>
            </div>
          </AppCard>
        </motion.div>
      </>
    );
  };

  const renderStatusMessage = () => {
    if (!stats) return null;
    
    // Caso o usuário não tenha planos
    if (stats.total_purchases === 0) {
      return (
        <Alert className="mb-6 border-blue-200 bg-blue-50 text-blue-800">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertTitle>Comece sua jornada</AlertTitle>
          <AlertDescription>
            Adquira um plano personalizado para começar sua transformação.
          </AlertDescription>
          <div className="mt-3">
            <Button 
              variant="outline" 
              className="border-blue-200 hover:border-blue-300 text-blue-700 hover:bg-blue-100"
              onClick={() => navigate('/')}
            >
              Ver planos disponíveis
            </Button>
          </div>
        </Alert>
      );
    }
    
    // Caso tenha formulários pendentes
    if (stats.pending_forms > 0) {
      return (
        <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertTitle>Formulários pendentes</AlertTitle>
          <AlertDescription>
            Preencha todos os formulários para que nossos especialistas possam criar seus planos personalizados.
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  };

  const renderAvailablePlans = () => {
    if (loading) return null;
    
    const hasMealPlans = mealPlans.length > 0;
    const hasWorkoutPlans = workoutPlans.length > 0;
    
    if (!hasMealPlans && !hasWorkoutPlans) {
      // Não há planos disponíveis ainda
      if (stats && stats.awaiting_plans > 0) {
        return (
          <div className="text-center py-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4"
            >
              <CalendarClock className="h-8 w-8 text-blue-600" />
            </motion.div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">Planos em desenvolvimento</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Seus planos personalizados estão sendo elaborados por nossos especialistas.
              Você receberá uma notificação quando estiverem prontos!
            </p>
          </div>
        );
      } else {
        return (
          <div className="text-center py-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center justify-center p-3 bg-amber-100 rounded-full mb-4"
            >
              <FileX2 className="h-8 w-8 text-amber-600" />
            </motion.div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">Nenhum plano disponível</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Para receber seus planos personalizados, preencha os formulários necessários.
            </p>
          </div>
        );
      }
    }
    
    // Preparar os dados para as tabs
    const tabItems = [
      {
        value: ActiveTab.Meal,
        label: 'Plano Alimentar',
        icon: <Salad className="h-4 w-4" />,
        disabled: !hasMealPlans,
        content: (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hasMealPlans ? (
              mealPlans.map((plan) => (
                <Link 
                  key={plan.id} 
                  to={`/plano/${plan.id}?type=alimentar`} 
                  className="block"
                >
                  <AppCard
                    title={plan.title || "Plano Alimentar"}
                    subtitle={plan.description || "Plano alimentar personalizado"}
                    gradient
                    hover
                    highlight={plan.status === PlanStatus.ACTIVE}
                    rightContent={
                      <Badge variant={plan.status === PlanStatus.ACTIVE ? "default" : "outline"} className={
                        plan.status === PlanStatus.ACTIVE 
                          ? "bg-emerald-500" 
                          : "bg-yellow-50 text-yellow-700 border-yellow-200"
                      }>
                        {plan.status === PlanStatus.ACTIVE ? "Ativo" : "Pendente"}
                      </Badge>
                    }
                    footer={
                      !formStatus.alimentar_completed ? (
                        <Link to="/formulario-alimentar">
                          <Button variant="outline" className="text-emerald-600 border-emerald-200 bg-white hover:bg-emerald-50">
                            <FileText className="h-4 w-4 mr-2" />
                            Preencher Formulário
                          </Button>
                        </Link>
                      ) : (
                        <Link to={`/plano/${plan.id}?type=alimentar`}>
                          <Button className="bg-emerald-600 hover:bg-emerald-700">
                            <FileCheck2 className="h-4 w-4 mr-2" />
                            Ver Plano
                          </Button>
                        </Link>
                      )
                    }
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm text-emerald-700">
                        <FileText className="h-4 w-4 inline-block mr-1" />
                        {formStatus.alimentar_completed ? "Formulário preenchido" : "Formulário pendente"}
                      </div>
                      <div className="text-sm text-emerald-700">
                        <Calendar className="h-4 w-4 inline-block mr-1" />
                        {plan.created_at ? new Date(plan.created_at).toLocaleDateString() : "Data não disponível"}
                      </div>
                    </div>
                    
                    {plan.status === PlanStatus.PENDING && !formStatus.alimentar_completed && (
                      <Alert className="mt-3 bg-amber-50 text-amber-800 border-amber-200">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="text-sm font-medium">Ação necessária</AlertTitle>
                        <AlertDescription className="text-xs">
                          Preencha o formulário alimentar para que possamos preparar seu plano personalizado.
                        </AlertDescription>
                      </Alert>
                    )}
                  </AppCard>
                </Link>
              ))
            ) : (
              <div className="text-center py-6 col-span-full">
                <p className="text-gray-500">Nenhum plano alimentar disponível.</p>
              </div>
            )}
          </div>
        )
      },
      {
        value: ActiveTab.Workout,
        label: 'Plano de Treino',
        icon: <Dumbbell className="h-4 w-4" />,
        disabled: !hasWorkoutPlans,
        content: (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hasWorkoutPlans ? (
              workoutPlans.map((plan) => (
                <Link 
                  key={plan.id} 
                  to={`/plano/${plan.id}?type=treino`} 
                  className="block"
                >
                  <AppCard
                    title={plan.title || "Plano de Treino"}
                    subtitle={plan.description || "Plano de treino personalizado"}
                    gradient
                    hover
                    highlight={plan.status === PlanStatus.ACTIVE}
                    rightContent={
                      <Badge variant={plan.status === PlanStatus.ACTIVE ? "default" : "outline"} className={
                        plan.status === PlanStatus.ACTIVE 
                          ? "bg-emerald-500" 
                          : "bg-yellow-50 text-yellow-700 border-yellow-200"
                      }>
                        {plan.status === PlanStatus.ACTIVE ? "Ativo" : "Pendente"}
                      </Badge>
                    }
                    footer={
                      !formStatus.treino_completed ? (
                        <Link to="/formulario-treino">
                          <Button variant="outline" className="text-emerald-600 border-emerald-200 bg-white hover:bg-emerald-50">
                            <FileText className="h-4 w-4 mr-2" />
                            Preencher Formulário
                          </Button>
                        </Link>
                      ) : (
                        <Link to={`/plano/${plan.id}?type=treino`}>
                          <Button className="bg-emerald-600 hover:bg-emerald-700">
                            <FileCheck2 className="h-4 w-4 mr-2" />
                            Ver Plano
                          </Button>
                        </Link>
                      )
                    }
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm text-emerald-700">
                        <FileText className="h-4 w-4 inline-block mr-1" />
                        {formStatus.treino_completed ? "Formulário preenchido" : "Formulário pendente"}
                      </div>
                      <div className="text-sm text-emerald-700">
                        <Calendar className="h-4 w-4 inline-block mr-1" />
                        {plan.created_at ? new Date(plan.created_at).toLocaleDateString() : "Data não disponível"}
                      </div>
                    </div>
                    
                    {plan.status === PlanStatus.PENDING && !formStatus.treino_completed && (
                      <Alert className="mt-3 bg-amber-50 text-amber-800 border-amber-200">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="text-sm font-medium">Ação necessária</AlertTitle>
                        <AlertDescription className="text-xs">
                          Preencha o formulário de treino para que possamos preparar seu plano personalizado.
                        </AlertDescription>
                      </Alert>
                    )}
                  </AppCard>
                </Link>
              ))
            ) : (
              <div className="text-center py-6 col-span-full">
                <p className="text-gray-500">Nenhum plano de treino disponível.</p>
              </div>
            )}
          </div>
        )
      }
    ];
    
    return (
      <AppTabs 
        defaultValue={activeTab} 
        onValueChange={(value) => setActiveTab(value as ActiveTab)} 
        items={tabItems}
        centered
      />
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500 shadow-neon-blue"></div>
          <div className="absolute inset-0 animate-pulse opacity-70 rounded-full h-16 w-16 border-2 border-indigo-300 shadow-neon-purple"></div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout gradient>
      <div className="space-y-6">
        <PageHeader
          title={`Olá, ${user?.nome ? user.nome.split(' ')[0] : 'Usuário'}!`}
          subtitle="Veja seus planos, formulários e atualizações"
          icon={<Home className="h-6 w-6" />}
          actions={
            stats && (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1 rounded-full">
                <CalendarClock className="h-3.5 w-3.5 mr-1 inline-block" />
                {stats.pending_forms === 0 ? 'Formulários completos' : `${stats.pending_forms} formulário(s) pendente(s)`}
              </Badge>
            )
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderStatusCards()}
        </div>

        <div>
          <h2 className="text-xl font-semibold text-emerald-800 mb-4 px-2">
            Status dos Formulários
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderFormStatus()}
          </div>
        </div>

        {purchaseItems.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-emerald-800 mb-4 px-2">
              Seus Planos
            </h2>
            {renderAvailablePlans()}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
