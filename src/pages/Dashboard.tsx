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
  CalendarClock
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
      const { data, error } = await supabase.rpc(
        'get_user_purchase_status',
        { user_id: user.id }
      );

      if (error) {
        console.error('Erro ao buscar estatísticas do usuário:', error);
        return;
      }

      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (error) {
      console.error('Erro ao processar estatísticas do usuário:', error);
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
      const { data, error } = await supabase
        .from('user_status')
        .select('alimentar_completed, treino_completed')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormStatus(data);
        // Atualiza o status do usuário na store com tipagem correta
        updateUser({
          ...user,
          alimentar_completed: data.alimentar_completed,
          treino_completed: data.treino_completed
        });
      }
    } catch (error) {
      console.error('Erro ao buscar status dos formulários:', error);
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
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2 text-orange-800">
              <ShoppingCart className="h-5 w-5 text-orange-600" />
              Nenhuma compra encontrada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 text-sm mb-4">
              Você ainda não possui nenhum plano. Faça a compra para acessar todos os recursos.
            </p>
            <Link to="/">
              <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-none shadow-md group">
                Ver planos disponíveis
                <ShoppingCart className="ml-2 h-4 w-4 group-hover:scale-110 transition-all" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      );
    }

    // Verifica se existem formulários pendentes
    if (stats.pending_forms > 0) {
      const completionPercentage = getFormCompletionPercentage();
      
      return (
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 overflow-hidden relative">
          <div className="absolute right-0 top-0 h-28 w-24 opacity-10">
            <FileText className="h-full w-full text-emerald-800" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2 text-emerald-800">
              <FileText className="h-5 w-5 text-emerald-600" />
              Formulários pendentes
            </CardTitle>
            <CardDescription className="text-emerald-700">
              Complete os formulários para criar seu plano personalizado
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      );
    }

    // Se todos os formulários foram preenchidos, mas nenhum plano está pronto
    if (stats.ready_plans === 0 && stats.awaiting_plans > 0) {
      return (
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 overflow-hidden relative">
          <div className="absolute right-0 top-0 h-28 w-24 opacity-10">
            <Clock className="h-full w-full text-blue-800" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2 text-blue-800">
              <Clock className="h-5 w-5 text-blue-600" />
              Planos em preparação
            </CardTitle>
            <CardDescription className="text-blue-700">
              Nossos especialistas estão trabalhando no seu plano personalizado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700 mb-4">
              Os formulários foram recebidos e seus planos personalizados serão elaborados em breve.
              Você receberá uma notificação assim que estiverem prontos!
            </p>
            <div className="flex items-center gap-2 text-blue-600 bg-blue-100/70 p-3 rounded-md">
              <Info className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">Tempo médio de entrega: 24-48 horas</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Se todos os formulários foram preenchidos e os planos estão prontos
    return (
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden relative">
        <div className="absolute right-0 top-0 h-28 w-24 opacity-10">
          <Check className="h-full w-full text-green-800" />
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2 text-green-800">
            <Check className="h-5 w-5 text-green-600" />
            Planos prontos
          </CardTitle>
          <CardDescription className="text-green-700">
            Seus planos personalizados estão disponíveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-green-700 mb-4">
            Acesse seus planos personalizados na aba abaixo.
          </p>
          <div className="flex items-center gap-2 text-green-600 bg-green-100/70 p-3 rounded-md">
            <Info className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">Você pode alternar entre seu plano alimentar e de treino usando as abas abaixo.</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderStatusCards = () => {
    if (!stats) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="border border-emerald-100 hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                  <Package className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-emerald-800 mb-1">
                  {stats.total_purchases}
                </h3>
                <p className="text-emerald-600 text-sm">Planos adquiridos</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="border border-emerald-100 hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center mb-3">
                  <FileCheck2 className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold text-teal-800 mb-1">
                  {stats.completed_forms}/{stats.total_purchases * 2}
                </h3>
                <p className="text-teal-600 text-sm">Formulários preenchidos</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="border border-emerald-100 hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-green-800 mb-1">
                  {stats.ready_plans}
                </h3>
                <p className="text-green-600 text-sm">Planos ativos</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
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
    
    return (
      <Tabs
        defaultValue={activeTab}
        onValueChange={(value) => setActiveTab(value as ActiveTab)}
        className="w-full"
      >
        <TabsList className="mb-6 bg-gray-50 p-1 grid grid-cols-2 max-w-md mx-auto">
          <TabsTrigger 
            value={ActiveTab.Meal} 
            disabled={!hasMealPlans}
            className={cn(
              "rounded-lg transition-all data-[state=active]:text-white",
              "data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500"
            )}
          >
            <Salad className="h-4 w-4 mr-2" />
            Plano Alimentar
          </TabsTrigger>
          <TabsTrigger 
            value={ActiveTab.Workout} 
            disabled={!hasWorkoutPlans}
            className={cn(
              "rounded-lg transition-all data-[state=active]:text-white",
              "data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500"
            )}
          >
            <Dumbbell className="h-4 w-4 mr-2" />
            Plano de Treino
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={ActiveTab.Meal}>
          {hasMealPlans ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mealPlans.map((plan) => (
                <Link 
                  key={plan.id} 
                  to={`/plano/${plan.id}`} 
                  className="block transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <Card className="h-full border-emerald-100 hover:border-emerald-300 bg-gradient-to-br from-white to-emerald-50 shadow-sm transition-colors group">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-medium text-emerald-800 group-hover:text-emerald-700">
                        {plan.title}
                      </CardTitle>
                      <CardDescription className="text-emerald-600">
                        Plano Alimentar
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {plan.description || "Plano alimentar personalizado para seus objetivos."}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-0 flex justify-end">
                      <div className="flex items-center text-emerald-600 text-sm font-medium gap-1 group-hover:text-emerald-700">
                        Ver detalhes 
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className="ml-1 transition-transform group-hover:translate-x-1"
                        >
                          <path d="M9 6l6 6-6 6"/>
                        </svg>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">Nenhum plano alimentar disponível.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value={ActiveTab.Workout}>
          {hasWorkoutPlans ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {workoutPlans.map((plan) => (
                <Link 
                  key={plan.id} 
                  to={`/plano/${plan.id}`} 
                  className="block transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <Card className="h-full border-blue-100 hover:border-blue-300 bg-gradient-to-br from-white to-blue-50 shadow-sm transition-colors group">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-medium text-blue-800 group-hover:text-blue-700">
                        {plan.title}
                      </CardTitle>
                      <CardDescription className="text-blue-600">
                        Plano de Treino
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {plan.description || "Plano de treino personalizado para seus objetivos."}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-0 flex justify-end">
                      <div className="flex items-center text-blue-600 text-sm font-medium gap-1 group-hover:text-blue-700">
                        Ver detalhes 
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className="ml-1 transition-transform group-hover:translate-x-1"
                        >
                          <path d="M9 6l6 6-6 6"/>
                        </svg>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">Nenhum plano de treino disponível.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    );
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    })
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
      <div className="mobile-spacing">
        {/* Cabeçalho de boas-vindas */}
        <div className="p-4 md:p-6 bg-gradient-to-br from-emerald-50 to-white rounded-lg border border-emerald-100 mb-6 mobile-container">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-emerald-800 mb-1">
                Olá, {user?.nome ? user.nome.split(' ')[0] : 'Usuário'}!
              </h1>
              <p className="text-emerald-600 mobile-text">
                Veja seus planos, formulários e atualizações
              </p>
            </div>
            <div className="flex items-center gap-3">
              {stats && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1 rounded-full">
                  <CalendarClock className="h-3.5 w-3.5 mr-1 inline-block" />
                  {stats.pending_forms === 0 ? 'Formulários completos' : `${stats.pending_forms} formulário(s) pendente(s)`}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Grid de status cards */}
        <div className="mobile-grid mb-6">
          {renderStatusCards()}
        </div>

        {/* Status dos formulários */}
        <div className="mb-6 space-y-4">
          <h2 className="text-xl font-semibold text-emerald-800 px-1 mb-2">
            Status dos Formulários
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderFormStatus()}
          </div>
        </div>

        {/* Planos disponíveis */}
        {purchaseItems.length > 0 && (
          <div className="mb-4 space-y-4">
            <h2 className="text-xl font-semibold text-emerald-800 px-1 mb-2">
              Seus Planos
            </h2>
            
            {/* Filtro de tipo de plano */}
            <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as ActiveTab)} className="w-full">
              <TabsList className="mb-4 bg-emerald-50 p-1">
                <TabsTrigger value={ActiveTab.Meal} className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 flex items-center">
                  <Salad className="h-4 w-4 mr-2" />
                  Alimentação
                </TabsTrigger>
                <TabsTrigger value={ActiveTab.Workout} className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 flex items-center">
                  <Dumbbell className="h-4 w-4 mr-2" />
                  Treino
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value={ActiveTab.Meal} className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mealPlans.length > 0 ? (
                    mealPlans.map((plan) => (
                      <Card key={plan.id} className={cn(
                        "card-hover-effect border-emerald-100 overflow-hidden",
                        plan.status === PlanStatus.ACTIVE && "border-l-4 border-l-emerald-500"
                      )}>
                        <CardHeader className="bg-gradient-to-r from-emerald-50 to-transparent pb-3">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg font-semibold text-emerald-800">
                              {plan.title || "Plano Alimentar"}
                            </CardTitle>
                            <Badge variant={plan.status === PlanStatus.ACTIVE ? "default" : "outline"} className={
                              plan.status === PlanStatus.ACTIVE 
                                ? "bg-emerald-500" 
                                : "bg-yellow-50 text-yellow-700 border-yellow-200"
                            }>
                              {plan.status === PlanStatus.ACTIVE ? "Ativo" : "Pendente"}
                            </Badge>
                          </div>
                          <CardDescription className="text-emerald-600">
                            {plan.description || "Plano alimentar personalizado"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-3">
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
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 pt-2 pb-3 bg-gray-50 border-t border-gray-100">
                          {!formStatus.alimentar_completed ? (
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
                          )}
                        </CardFooter>
                      </Card>
                    ))
                  ) : (
                    <Card className="col-span-full">
                      <CardHeader>
                        <CardTitle>Nenhum plano alimentar disponível</CardTitle>
                        <CardDescription>
                          Você ainda não possui planos alimentares. Adquira um plano para começar.
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value={ActiveTab.Workout} className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {workoutPlans.length > 0 ? (
                    workoutPlans.map((plan) => (
                      <Card key={plan.id} className={cn(
                        "card-hover-effect border-emerald-100 overflow-hidden",
                        plan.status === PlanStatus.ACTIVE && "border-l-4 border-l-emerald-500"
                      )}>
                        <CardHeader className="bg-gradient-to-r from-emerald-50 to-transparent pb-3">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg font-semibold text-emerald-800">
                              {plan.title || "Plano de Treino"}
                            </CardTitle>
                            <Badge variant={plan.status === PlanStatus.ACTIVE ? "default" : "outline"} className={
                              plan.status === PlanStatus.ACTIVE 
                                ? "bg-emerald-500" 
                                : "bg-yellow-50 text-yellow-700 border-yellow-200"
                            }>
                              {plan.status === PlanStatus.ACTIVE ? "Ativo" : "Pendente"}
                            </Badge>
                          </div>
                          <CardDescription className="text-emerald-600">
                            {plan.description || "Plano de treino personalizado"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-3">
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
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 pt-2 pb-3 bg-gray-50 border-t border-gray-100">
                          {!formStatus.treino_completed ? (
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
                          )}
                        </CardFooter>
                      </Card>
                    ))
                  ) : (
                    <Card className="col-span-full">
                      <CardHeader>
                        <CardTitle>Nenhum plano de treino disponível</CardTitle>
                        <CardDescription>
                          Você ainda não possui planos de treino. Adquira um plano para começar.
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Planos Disponíveis para Compra */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-emerald-800 px-1 mb-4">
            Planos Disponíveis
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {renderAvailablePlans()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
