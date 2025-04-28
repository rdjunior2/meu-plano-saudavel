import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Subcomponentes 
import PlanFilters, { PlanFilters as PlanFiltersType } from './PlanFilters';
import StatisticsCards, { Stats } from './StatisticsCards';
import PlanTable, { Plan } from './PlanTable';
import Pagination from './Pagination';
import PlanPreviewDialog from './PlanPreviewDialog';
import ActivationHistory from './ActivationHistory';
import BulkActions from './BulkActions';

// Constantes
const ITEMS_PER_PAGE = 8;

export const AdminPanelContent: React.FC = () => {
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<PlanFiltersType>({
    type: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc',
    search: ''
  });
  const [previewPlan, setPreviewPlan] = useState<Plan | null>(null);
  const [updateLoading, setUpdateLoading] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalPending: 0,
    mealPlans: 0,
    workoutPlans: 0,
    activatedToday: 0
  });
  const queryClient = useQueryClient();

  // Buscar planos com React Query
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['pendingPlans', filters],
    queryFn: async () => {
      try {
        const [mealPlansResponse, workoutPlansResponse] = await Promise.all([
          filters.type !== 'workout' ? supabase
            .from('meal_plans')
            .select('*, profiles(nome)')
            .eq('status', 'pendente')
            .order(filters.sortBy, { ascending: filters.sortOrder === 'asc' }) : null,
          filters.type !== 'meal' ? supabase
            .from('workout_plans')
            .select('*, profiles(nome)')
            .eq('status', 'pendente')
            .order(filters.sortBy, { ascending: filters.sortOrder === 'asc' }) : null
        ]);

        const mealPlans = mealPlansResponse?.data?.map(plan => ({
          ...plan,
          type: 'meal' as const
        })) || [];

        const workoutPlans = workoutPlansResponse?.data?.map(plan => ({
          ...plan,
          type: 'workout' as const
        })) || [];

        const allPlans = [...mealPlans, ...workoutPlans].sort((a, b) => {
          if (filters.sortBy === 'created_at') {
            return filters.sortOrder === 'asc' 
              ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          return 0;
        });

        // Aplicar filtro de pesquisa
        const filteredPlans = filters.search
          ? allPlans.filter(plan => 
              plan.title.toLowerCase().includes(filters.search.toLowerCase()) ||
              plan.profiles?.nome?.toLowerCase().includes(filters.search.toLowerCase())
            )
          : allPlans;

        // Atualizar estatísticas
        setStats({
          totalPending: filteredPlans.length,
          mealPlans: mealPlans.length,
          workoutPlans: workoutPlans.length,
          activatedToday: 0 // Será atualizado na próxima query
        });

        return filteredPlans;
      } catch (error) {
        console.error('Erro ao buscar planos:', error);
        toast.error('Erro ao carregar planos pendentes');
        return [];
      }
    },
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  });

  // Histórico de ativações
  const { data: activationHistory = [] } = useQuery({
    queryKey: ['activationHistory'],
    queryFn: async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data, error } = await supabase
          .from('plan_activations')
          .select('*')
          .order('activated_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        // Contar ativações de hoje
        const activatedToday = data.filter(activation => {
          const activationDate = new Date(activation.activated_at);
          activationDate.setHours(0, 0, 0, 0);
          return activationDate.getTime() === today.getTime();
        }).length;

        setStats(prev => ({ ...prev, activatedToday }));
        
        return data;
      } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        return [];
      }
    }
  });

  // Paginação
  const totalPages = Math.ceil(plans.length / ITEMS_PER_PAGE);
  const paginatedPlans = plans.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Funções para manipular planos
  async function updatePlan(plan: Plan | Plan[]) {
    const plansToUpdate = Array.isArray(plan) ? plan : [plan];
    
    if (plansToUpdate.some(p => !p.data_inicio || !p.data_fim)) {
      toast.error('Por favor, defina as datas de início e fim para todos os planos selecionados');
      return;
    }

    setUpdateLoading(Array.isArray(plan) ? 'bulk' : plan.id);
    
    try {
      // Atualizar planos
      await Promise.all(plansToUpdate.map(async (p) => {
        const table = p.type === 'meal' ? 'meal_plans' : 'workout_plans';
        const { error } = await supabase
          .from(table)
          .update({
            data_inicio: p.data_inicio,
            data_fim: p.data_fim,
            status: 'ativo'
          })
          .eq('id', p.id);

        if (error) throw error;

        // Registrar ativação
        await supabase.from('plan_activations').insert({
          plan_id: p.id,
          plan_type: p.type,
          activated_at: new Date().toISOString()
        });

        // Notificar usuário (implementação futura)
      }));

      // Fechar diálogo de preview se estiver aberto
      if (!Array.isArray(plan)) {
        setPreviewPlan(null);
      }

      // Desmarcar planos selecionados
      setSelectedPlans([]);
      
      // Atualizar os dados
      await queryClient.invalidateQueries(['pendingPlans']);
      await queryClient.invalidateQueries(['activationHistory']);
      
      toast.success(`${plansToUpdate.length} plano(s) ativado(s) com sucesso!`);
    } catch (error) {
      console.error('Erro ao ativar plano(s):', error);
      toast.error('Erro ao ativar plano(s)');
    } finally {
      setUpdateLoading(null);
    }
  }

  function viewPlanDetails(plan: Plan) {
    setPreviewPlan(plan);
  }

  function handleSelectPlan(planId: string, checked: boolean) {
    if (checked) {
      setSelectedPlans(prev => [...prev, planId]);
    } else {
      setSelectedPlans(prev => prev.filter(id => id !== planId));
    }
  }

  function handleSelectAllInPage(checked: boolean) {
    if (checked) {
      setSelectedPlans(prev => [...new Set([...prev, ...paginatedPlans.map(p => p.id)])]);
    } else {
      setSelectedPlans(prev => prev.filter(id => !paginatedPlans.find(p => p.id === id)));
    }
  }

  function formatDate(dateString?: string) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  }

  return (
    <div className="space-y-6">
      <StatisticsCards stats={stats} />
      
      <Tabs defaultValue="planos-pendentes" className="w-full space-y-6">
        <TabsList className="w-full bg-gray-50 p-1 rounded-lg border border-gray-100">
          <TabsTrigger value="planos-pendentes" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm">Planos Pendentes</TabsTrigger>
          <TabsTrigger value="historico" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm">Histórico</TabsTrigger>
        </TabsList>
        
        <TabsContent value="planos-pendentes" className="relative space-y-4">
          <PlanFilters filters={filters} setFilters={setFilters} />
          
          <Card className="border border-gray-200 rounded-lg overflow-hidden">
            <CardContent className="p-0 relative">
              {isLoading ? (
                <div className="p-6 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-r-transparent"></div>
                  <p className="mt-2 text-sm text-slate-600">Carregando planos...</p>
                </div>
              ) : (
                <>
                  <PlanTable
                    plans={paginatedPlans}
                    selectedPlans={selectedPlans}
                    handleSelectPlan={handleSelectPlan}
                    handleSelectAllInPage={handleSelectAllInPage}
                    viewPlanDetails={viewPlanDetails}
                    updatePlan={updatePlan}
                    updateLoading={updateLoading}
                    formatDate={formatDate}
                  />
                  
                  {/* Paginação */}
                  {plans.length > 0 && (
                    <div className="py-4 px-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                      <p className="text-sm text-slate-600">
                        Mostrando {paginatedPlans.length} de {plans.length} planos
                      </p>
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onChange={setCurrentPage}
                      />
                    </div>
                  )}
                  
                  {/* Mensagem de nenhum plano */}
                  {plans.length === 0 && (
                    <div className="p-8 text-center">
                      <p className="text-slate-600">Nenhum plano pendente encontrado.</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Ações em lote */}
          {selectedPlans.length > 0 && (
            <BulkActions
              selectedCount={selectedPlans.length}
              selectedPlans={selectedPlans.map(id => plans.find(p => p.id === id)!).filter(Boolean)}
              updatePlans={updatePlan}
              loading={updateLoading === 'bulk'}
              onClear={() => setSelectedPlans([])}
            />
          )}
          
          {/* Diálogo de Preview */}
          {previewPlan && (
            <PlanPreviewDialog
              plan={previewPlan}
              onClose={() => setPreviewPlan(null)}
              onUpdate={updatePlan}
              loading={updateLoading === previewPlan.id}
              formatDate={formatDate}
            />
          )}
        </TabsContent>
        
        <TabsContent value="historico">
          <Card className="border border-gray-200 rounded-lg overflow-hidden">
            <CardContent className="p-0">
              <ActivationHistory history={activationHistory} formatDate={formatDate} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanelContent; 