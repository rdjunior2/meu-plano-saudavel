import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { toast } from 'sonner'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ArrowUpDown, Eye, Settings } from 'lucide-react'

interface Plan {
  id: string
  title: string
  status: string
  data_inicio?: string
  data_fim?: string
  days?: number[]
  type: 'meal' | 'workout'
  created_at: string
  user_id: string
  content?: any
}

interface PlanFilters {
  type: 'all' | 'meal' | 'workout'
  sortBy: 'created_at' | 'title'
  sortOrder: 'asc' | 'desc'
}

const ITEMS_PER_PAGE = 5

export default function AdminPanel() {
  const [selectedPlans, setSelectedPlans] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<PlanFilters>({
    type: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  })
  const [previewPlan, setPreviewPlan] = useState<Plan | null>(null)
  const [updateLoading, setUpdateLoading] = useState<string | null>(null)
  const queryClient = useQueryClient()

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
        ])

        const mealPlans = mealPlansResponse?.data?.map(plan => ({
          ...plan,
          type: 'meal' as const
        })) || []

        const workoutPlans = workoutPlansResponse?.data?.map(plan => ({
          ...plan,
          type: 'workout' as const
        })) || []

        return [...mealPlans, ...workoutPlans].sort((a, b) => {
          if (filters.sortBy === 'created_at') {
            return filters.sortOrder === 'asc' 
              ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          }
          return 0
        })
      } catch (error) {
        console.error('Erro ao buscar planos:', error)
        toast.error('Erro ao carregar planos pendentes')
        return []
      }
    },
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  })

  // Histórico de ativações
  const { data: activationHistory = [] } = useQuery({
    queryKey: ['activationHistory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_activations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return data
    }
  })

  // Paginação
  const totalPages = Math.ceil(plans.length / ITEMS_PER_PAGE)
  const paginatedPlans = plans.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  async function updatePlan(plan: Plan | Plan[]) {
    const plansToUpdate = Array.isArray(plan) ? plan : [plan]
    
    if (plansToUpdate.some(p => !p.data_inicio || !p.data_fim)) {
      toast.error('Por favor, defina as datas de início e fim para todos os planos selecionados')
      return
    }

    setUpdateLoading(Array.isArray(plan) ? 'bulk' : plan.id)
    
    try {
      // Atualizar planos
      await Promise.all(plansToUpdate.map(async (p) => {
        const table = p.type === 'meal' ? 'meal_plans' : 'workout_plans'
        const { error } = await supabase
          .from(table)
          .update({
            data_inicio: p.data_inicio,
            data_fim: p.data_fim,
            status: 'ativo'
          })
          .eq('id', p.id)

        if (error) throw error

        // Registrar ativação
        await supabase.from('plan_activations').insert({
          plan_id: p.id,
          plan_type: p.type,
          activated_at: new Date().toISOString()
        })

        // Notificar usuário
        await supabase.from('notifications').insert({
          user_id: p.user_id,
          title: 'Plano Ativado',
          message: `Seu ${p.type === 'meal' ? 'plano alimentar' : 'plano de treino'} foi ativado!`,
          type: 'plan_activation'
        })
      }))

      toast.success(
        Array.isArray(plan)
          ? 'Planos ativados com sucesso!'
          : 'Plano ativado com sucesso!'
      )

      // Invalidar queries para atualizar os dados
      queryClient.invalidateQueries({ queryKey: ['pendingPlans'] })
      queryClient.invalidateQueries({ queryKey: ['activationHistory'] })
      
      setSelectedPlans([])
    } catch (error) {
      console.error('Erro ao atualizar plano(s):', error)
      toast.error('Erro ao ativar plano(s)')
    } finally {
      setUpdateLoading(null)
    }
  }

  async function viewPlanDetails(plan: Plan) {
    try {
      const table = plan.type === 'meal' ? 'meal_plans' : 'workout_plans'
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', plan.id)
        .single()

      if (error) throw error

      setPreviewPlan({ ...plan, content: data })
    } catch (error) {
      console.error('Erro ao carregar detalhes do plano:', error)
      toast.error('Erro ao carregar detalhes do plano')
    }
  }

  function handleSelectPlan(planId: string, checked: boolean) {
    setSelectedPlans(prev =>
      checked
        ? [...prev, planId]
        : prev.filter(id => id !== planId)
    )
  }

  function handleSelectAllInPage(checked: boolean) {
    setSelectedPlans(prev =>
      checked
        ? [...new Set([...prev, ...paginatedPlans.map(p => p.id)])]
        : prev.filter(id => !paginatedPlans.find(p => p.id === id))
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Painel Administrativo</h1>
        <div className="flex items-center gap-4">
          <Select
            value={filters.type}
            onValueChange={(value: PlanFilters['type']) =>
              setFilters(prev => ({ ...prev, type: value }))
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de Plano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Planos</SelectItem>
              <SelectItem value="meal">Planos Alimentares</SelectItem>
              <SelectItem value="workout">Planos de Treino</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setFilters(prev => ({
                ...prev,
                sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
              }))
            }
          >
            Data
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Ações em Lote */}
      {selectedPlans.length > 0 && (
        <div className="bg-muted/30 p-4 rounded-lg flex items-center justify-between">
          <p className="text-sm">
            {selectedPlans.length} plano(s) selecionado(s)
          </p>
          <Button
            onClick={() => updatePlan(plans.filter(p => selectedPlans.includes(p.id)))}
            disabled={updateLoading === 'bulk'}
          >
            {updateLoading === 'bulk' ? 'Ativando...' : 'Ativar Selecionados'}
          </Button>
        </div>
      )}

      {paginatedPlans.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          Não há planos pendentes para aprovação.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-left">
                    <Checkbox
                      checked={paginatedPlans.every(p => selectedPlans.includes(p.id))}
                      onCheckedChange={handleSelectAllInPage}
                    />
                  </th>
                  <th className="p-2 text-left">Título</th>
                  <th className="p-2 text-left">Tipo</th>
                  <th className="p-2 text-left">Data de Criação</th>
                  <th className="p-2 text-left">Período</th>
                  <th className="p-2 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPlans.map((plan) => (
                  <tr key={plan.id} className="border-b">
                    <td className="p-2">
                      <Checkbox
                        checked={selectedPlans.includes(plan.id)}
                        onCheckedChange={(checked) => handleSelectPlan(plan.id, checked as boolean)}
                      />
                    </td>
                    <td className="p-2">{plan.title}</td>
                    <td className="p-2">
                      {plan.type === 'meal' ? 'Alimentar' : 'Treino'}
                    </td>
                    <td className="p-2">
                      {new Date(plan.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={plan.data_inicio || ''}
                          onChange={(e) =>
                            queryClient.setQueryData(['pendingPlans', filters], (old: Plan[]) =>
                              old.map(p =>
                                p.id === plan.id
                                  ? { ...p, data_inicio: e.target.value }
                                  : p
                              )
                            )
                          }
                          className="w-full border rounded-md px-2 py-1 text-sm"
                          min={new Date().toISOString().split('T')[0]}
                        />
                        <input
                          type="date"
                          value={plan.data_fim || ''}
                          onChange={(e) =>
                            queryClient.setQueryData(['pendingPlans', filters], (old: Plan[]) =>
                              old.map(p =>
                                p.id === plan.id
                                  ? { ...p, data_fim: e.target.value }
                                  : p
                              )
                            )
                          }
                          className="w-full border rounded-md px-2 py-1 text-sm"
                          min={plan.data_inicio || new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewPlanDetails(plan)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Detalhes do Plano</DialogTitle>
                              <DialogDescription>
                                {plan.type === 'meal' ? 'Plano Alimentar' : 'Plano de Treino'}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4">
                              {previewPlan && (
                                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                                  {JSON.stringify(previewPlan.content, null, 2)}
                                </pre>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => updatePlan(plan)}
                          disabled={updateLoading === plan.id}
                        >
                          {updateLoading === plan.id ? 'Ativando...' : 'Ativar'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Histórico de Ativações */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Histórico de Ativações</h2>
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-2 text-left">Plano</th>
                <th className="p-2 text-left">Tipo</th>
                <th className="p-2 text-left">Data de Ativação</th>
              </tr>
            </thead>
            <tbody>
              {activationHistory.map((activation) => (
                <tr key={activation.id} className="border-b">
                  <td className="p-2">{activation.plan_id}</td>
                  <td className="p-2">
                    {activation.plan_type === 'meal' ? 'Alimentar' : 'Treino'}
                  </td>
                  <td className="p-2">
                    {new Date(activation.activated_at).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 