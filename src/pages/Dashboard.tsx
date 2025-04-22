import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FormStatus as ApiFormStatus
} from '../integrations/supabase/types';
import { IconActivity, IconList, IconClock, IconAlertCircle, IconClipboardCheck, IconHourglass } from '../components/ui/icons';
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Check, Info, Package, ShoppingCart, FileText, FileCheck2, FileX2, CalendarClock } from "lucide-react";

enum ActiveTab {
  Meal = 'meal',
  Workout = 'workout',
}

interface UserStats {
  user_id: string;
  total_purchases: number;
  completed_forms: number;
  pending_forms: number;
  ready_plans: number;
  active_plans: number;
  awaiting_plans: number;
}

interface PurchaseItem {
  purchase_id: string;
  user_id: string;
  user_email: string;
  kiwify_id: string;
  purchase_status: PurchaseStatus;
  purchase_date: string | null;
  item_id: string;
  product_id: string;
  product_name: string;
  product_type: ProductType;
  form_status: ApiFormStatus;
  plan_status: PlanStatus;
  has_form_response: boolean;
  item_created_at: string;
}

interface MealPlan {
  id: string;
  title: string;
  description: string | null;
  meals: any | null;
  created_at: string;
  user_id: string;
}

interface WorkoutPlan {
  id: string;
  title: string;
  description: string | null;
  days: any | null;
  created_at: string;
  user_id: string;
}

interface UserFormStatus {
  alimentar_completed: boolean;
  treino_completed: boolean;
}

interface UserPurchaseStatus {
  user_id: string;
  total_purchases: number;
  completed_forms: number;
  pending_forms: number;
  ready_plans: number;
  active_plans: number;
  awaiting_plans: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.Meal);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [formStatus, setFormStatus] = useState<UserFormStatus>({ alimentar_completed: false, treino_completed: false });
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
        .eq('purchase_status', 'approved');

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
        console.error('Erro ao buscar dados do usuário:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar seus dados. Tente novamente mais tarde.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [
    isAuthenticated, 
    user?.id, 
    navigate, 
    fetchPurchaseItems,
    fetchUserStats,
    fetchPlans,
    fetchFormStatus,
    fetchPurchaseStatus,
    toast
  ]);

  const hasMealProduct = () => {
    return purchaseItems.some(item => 
      item.product_type === 'meal' || item.product_type === 'combo'
    );
  };

  const hasWorkoutProduct = () => {
    return purchaseItems.some(item => 
      item.product_type === 'workout' || item.product_type === 'combo'
    );
  };

  const getFormularioLink = (item: PurchaseItem) => {
    if (item.product_type === 'meal') {
      return `/formulario-alimentar/${item.purchase_id}/${item.product_id}`;
    } else if (item.product_type === 'workout') {
      return `/formulario-treino/${item.purchase_id}/${item.product_id}`;
    } else if (item.product_type === 'combo') {
      // Para produtos do tipo combo, verificamos se já existe resposta
      if (item.form_status === 'pending') {
        return `/formulario-alimentar/${item.purchase_id}/${item.product_id}`;
      }
    }
    return null;
  };

  const renderPendingFormsList = () => {
    const pendingItems = purchaseItems.filter(item => item.form_status === 'pending');
    
    if (pendingItems.length === 0) return null;
    
    return (
      <div className="mt-2">
        <ul className="space-y-2">
          {pendingItems.map(item => {
            const formLink = getFormularioLink(item);
            return formLink ? (
              <li key={item.item_id} className="text-sm">
                <Button 
                  variant="link" 
                  className="p-0 h-auto font-normal"
                  onClick={() => navigate(formLink)}
                >
                  {item.product_name}
                </Button>
              </li>
            ) : null;
          })}
        </ul>
      </div>
    );
  };

  const renderStatusCards = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Formulários Preenchidos
            </CardTitle>
            <IconClipboardCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed_forms}</div>
            <p className="text-xs text-muted-foreground">
              de {stats.completed_forms + stats.pending_forms} formulários
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Formulários Pendentes
            </CardTitle>
            <IconHourglass className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_forms}</div>
            <p className="text-xs text-muted-foreground">
              precisam ser preenchidos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Planos Prontos
            </CardTitle>
            <IconClipboardCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ready_plans}</div>
            <p className="text-xs text-muted-foreground">
              de {stats.ready_plans + stats.awaiting_plans} planos
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderFormStatus = () => {
    if (loading) return null;

    const allCompleted = formStatus.alimentar_completed && formStatus.treino_completed;
    const noneCompleted = !formStatus.alimentar_completed && !formStatus.treino_completed;
    const someCompleted = !noneCompleted && !allCompleted;

    if (allCompleted) {
      return (
        <Alert className="mb-4 border-green-500 bg-green-50">
          <Check className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-600">Formulários completos!</AlertTitle>
          <AlertDescription>
            Você já preencheu todos os formulários necessários. Agora é só aguardar a criação dos seus planos.
          </AlertDescription>
        </Alert>
      );
    }

    if (someCompleted) {
      return (
        <Alert className="mb-4 border-amber-500 bg-amber-50">
          <Info className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-600">Formulários parcialmente preenchidos</AlertTitle>
          <AlertDescription>
            Você já preencheu alguns formulários, mas ainda faltam alguns para completar seu perfil.
            {!formStatus.alimentar_completed && (
              <div className="mt-2">
                <Link to="/formulario-alimentar">
                  <Button variant="outline" size="sm" className="border-amber-600 text-amber-600 hover:bg-amber-100">
                    Preencher formulário alimentar
                  </Button>
                </Link>
              </div>
            )}
            {!formStatus.treino_completed && (
              <div className="mt-2">
                <Link to="/formulario-treino">
                  <Button variant="outline" size="sm" className="border-amber-600 text-amber-600 hover:bg-amber-100">
                    Preencher formulário de treino
                  </Button>
                </Link>
              </div>
            )}
          </AlertDescription>
        </Alert>
      );
    }

    if (noneCompleted) {
      return (
        <Alert className="mb-4">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Formulários pendentes</AlertTitle>
          <AlertDescription>
            Para que possamos criar seus planos personalizados, precisamos que você preencha os formulários.
            <div className="flex gap-2 mt-2">
              <Link to="/formulario-alimentar">
                <Button variant="outline" size="sm">Formulário alimentar</Button>
              </Link>
              <Link to="/formulario-treino">
                <Button variant="outline" size="sm">Formulário de treino</Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  const renderPurchaseStatus = () => {
    if (!purchaseStatus) return null;

    const totalForms = purchaseStatus.completed_forms + purchaseStatus.pending_forms;
    const formCompletionPercentage = totalForms > 0 
      ? Math.round((purchaseStatus.completed_forms / totalForms) * 100) 
      : 0;
    
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Minhas Compras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchaseStatus.total_purchases}</div>
            <p className="text-xs text-muted-foreground">
              Total de compras realizadas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Formulários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{formCompletionPercentage}%</span>
              </div>
              <Progress value={formCompletionPercentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                  <FileCheck2 className="h-3 w-3 text-green-500" />
                  <span>Completos: {purchaseStatus.completed_forms}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileX2 className="h-3 w-3 text-amber-500" />
                  <span>Pendentes: {purchaseStatus.pending_forms}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Planos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-semibold">{purchaseStatus.ready_plans}</div>
                  <p className="text-xs text-muted-foreground">Prontos</p>
                </div>
                <div>
                  <div className="text-lg font-semibold">{purchaseStatus.active_plans}</div>
                  <p className="text-xs text-muted-foreground">Ativos</p>
                </div>
                <div>
                  <div className="text-lg font-semibold">{purchaseStatus.awaiting_plans}</div>
                  <p className="text-xs text-muted-foreground">Aguardando</p>
                </div>
              </div>
              {purchaseStatus.awaiting_plans > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <CalendarClock className="h-3 w-3" />
                  <span>Aguardando preenchimento dos formulários</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderStatusMessage = () => {
    if (loading) return null;

    if (!planos || planos.length === 0) {
      if (formStatus.alimentar_completed || formStatus.treino_completed) {
        return (
          <Alert className="mb-4 border-blue-500 bg-blue-50">
            <Info className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-blue-600">Seus planos estão sendo criados!</AlertTitle>
            <AlertDescription>
              Nossos especialistas já estão trabalhando na criação dos seus planos personalizados.
              Em breve eles estarão disponíveis nesta página.
            </AlertDescription>
          </Alert>
        );
      }
      return null;
    }
    return null;
  };

  const renderAvailablePlans = () => {
    if (!purchaseItems || purchaseItems.length === 0) {
      return (
        <Alert>
          <IconAlertCircle />
          <AlertTitle>Sem planos disponíveis</AlertTitle>
          <AlertDescription>
            Você ainda não possui nenhum plano disponível.
          </AlertDescription>
        </Alert>
      );
    }

    const mealProducts = purchaseItems.filter(item => 
      (item.product_type === 'meal' || item.product_type === 'combo') &&
      item.plan_status !== 'awaiting'
    ).length > 0;
    
    const workoutProducts = purchaseItems.filter(item => 
      (item.product_type === 'workout' || item.product_type === 'combo') &&
      item.plan_status !== 'awaiting'
    ).length > 0;

    if (activeTab === ActiveTab.Meal && !mealProducts) {
      return (
        <Alert>
          <IconClock />
          <AlertTitle>Plano alimentar em desenvolvimento</AlertTitle>
          <AlertDescription>
            Seu plano alimentar está sendo desenvolvido por nossos especialistas e estará disponível em breve.
          </AlertDescription>
        </Alert>
      );
    }

    if (activeTab === ActiveTab.Workout && !workoutProducts) {
      return (
        <Alert>
          <IconClock />
          <AlertTitle>Plano de treino em desenvolvimento</AlertTitle>
          <AlertDescription>
            Seu plano de treino está sendo desenvolvido por nossos especialistas e estará disponível em breve.
          </AlertDescription>
        </Alert>
      );
    }

    if (activeTab === ActiveTab.Meal && mealPlans.length === 0) {
      return (
        <Alert>
          <IconClock />
          <AlertTitle>Sem planos alimentares disponíveis</AlertTitle>
          <AlertDescription>
            Você ainda não possui planos alimentares prontos. Certifique-se de preencher todos os formulários necessários.
          </AlertDescription>
        </Alert>
      );
    }

    if (activeTab === ActiveTab.Workout && workoutPlans.length === 0) {
      return (
        <Alert>
          <IconClock />
          <AlertTitle>Sem planos de treino disponíveis</AlertTitle>
          <AlertDescription>
            Você ainda não possui planos de treino prontos. Certifique-se de preencher todos os formulários necessários.
          </AlertDescription>
        </Alert>
      );
    }

    if (activeTab === ActiveTab.Meal) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mealPlans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle>{plan.title || 'Plano Alimentar'}</CardTitle>
                <CardDescription>
                  {plan.description || 'Plano alimentar personalizado'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {plan.meals && Array.isArray(plan.meals) ? plan.meals.length : 0} refeições planejadas
                </p>
              </CardContent>
              <CardFooter>
                <Button onClick={() => navigate(`/plano-detalhes/${plan.id}`)}>
                  Ver plano completo
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workoutPlans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle>{plan.title || 'Plano de Treino'}</CardTitle>
              <CardDescription>
                {plan.description || 'Plano de treino personalizado'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {plan.days && Array.isArray(plan.days) ? plan.days.length : 0} dias de treino planejados
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate(`/plano-detalhes/${plan.id}`)}>
                Ver plano completo
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col"
    >
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">
            Olá, {user?.nome || 'Cliente'}!
          </h1>
          <p className="text-gray-600">
            Bem-vindo(a) ao seu painel personalizado.
          </p>
        </div>

        {renderPurchaseStatus()}
        {renderFormStatus()}
        {renderStatusMessage()}

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Seus planos personalizados</h2>
          
          <Tabs 
            defaultValue={activeTab} 
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as ActiveTab)}
          >
            <TabsList className="mb-4">
              <TabsTrigger value={ActiveTab.Meal} disabled={!hasMealProduct()}>
                <IconList className="mr-2" />
                Plano Alimentar
              </TabsTrigger>
              <TabsTrigger value={ActiveTab.Workout} disabled={!hasWorkoutProduct()}>
                <IconActivity className="mr-2" />
                Plano de Treino
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={ActiveTab.Meal}>
              {renderAvailablePlans()}
            </TabsContent>
            
            <TabsContent value={ActiveTab.Workout}>
              {renderAvailablePlans()}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </motion.div>
  );
};

export default Dashboard;
