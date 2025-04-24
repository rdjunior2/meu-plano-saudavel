import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { toast } from 'sonner'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowUpDown, Eye, Calendar, Search, ChevronRight, ChevronLeft, ClipboardList, Utensils, Dumbbell, AlertTriangle, CheckCircle2 } from 'lucide-react'

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
  profiles?: { nome: string }
  content?: any
}

interface PlanFilters {
  type: 'all' | 'meal' | 'workout'
  sortBy: 'created_at' | 'title'
  sortOrder: 'asc' | 'desc'
  search: string
}

interface Stats {
  totalPending: number
  mealPlans: number
  workoutPlans: number
  activatedToday: number
}

const ITEMS_PER_PAGE = 8

export default function AdminPanel() {
  const [selectedPlans, setSelectedPlans] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<PlanFilters>({
    type: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc',
    search: ''
  })
  const [previewPlan, setPreviewPlan] = useState<Plan | null>(null)
  const [updateLoading, setUpdateLoading] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats>({
    totalPending: 0,
    mealPlans: 0,
    workoutPlans: 0,
    activatedToday: 0
  })
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

        const allPlans = [...mealPlans, ...workoutPlans].sort((a, b) => {
          if (filters.sortBy === 'created_at') {
            return filters.sortOrder === 'asc' 
              ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          }
          return 0
        })

        // Aplicar filtro de pesquisa
        const filteredPlans = filters.search
          ? allPlans.filter(plan => 
              plan.title.toLowerCase().includes(filters.search.toLowerCase()) ||
              plan.profiles?.nome?.toLowerCase().includes(filters.search.toLowerCase())
            )
          : allPlans

        // Atualizar estatísticas
        setStats({
          totalPending: filteredPlans.length,
          mealPlans: mealPlans.length,
          workoutPlans: workoutPlans.length,
          activatedToday: 0 // Será atualizado na próxima query
        })

        return filteredPlans
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
      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const { data, error } = await supabase
          .from('plan_activations')
          .select('*')
          .order('activated_at', { ascending: false })
          .limit(10)

        if (error) throw error

        // Contar ativações de hoje
        const activatedToday = data.filter(activation => {
          const activationDate = new Date(activation.activated_at)
          activationDate.setHours(0, 0, 0, 0)
          return activationDate.getTime() === today.getTime()
        }).length

        setStats(prev => ({ ...prev, activatedToday }))
        
        return data
      } catch (error) {
        console.error('Erro ao buscar histórico:', error)
        return []
      }
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

  function formatDate(dateString?: string) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar planos..."
              className="pl-8"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          
          <Select
            value={filters.type}
            onValueChange={(value: PlanFilters['type']) =>
              setFilters(prev => ({ ...prev, type: value }))
            }
          >
            <SelectTrigger className="w-full md:w-[180px]">
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

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Planos Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
              <div className="text-2xl font-bold">{stats.totalPending}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Planos Alimentares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Utensils className="h-5 w-5 text-green-500 mr-2" />
              <div className="text-2xl font-bold">{stats.mealPlans}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Planos de Treino
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Dumbbell className="h-5 w-5 text-blue-500 mr-2" />
              <div className="text-2xl font-bold">{stats.workoutPlans}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ativados Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
              <div className="text-2xl font-bold">{stats.activatedToday}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações em Lote */}
      {selectedPlans.length > 0 && (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="pt-6 flex items-center justify-between">
            <p className="text-sm font-medium">
              {selectedPlans.length} plano(s) selecionado(s)
            </p>
            <Button
              onClick={() => updatePlan(plans.filter(p => selectedPlans.includes(p.id)))}
              disabled={updateLoading === 'bulk'}
            >
              {updateLoading === 'bulk' ? 'Ativando...' : 'Ativar Selecionados'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="pending">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pending">Planos Pendentes</TabsTrigger>
          <TabsTrigger value="history">Histórico de Ativações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-4 mt-6">
          {paginatedPlans.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-10 pb-10 flex flex-col items-center justify-center text-center">
                <ClipboardList className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Não há planos pendentes para aprovação.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginatedPlans.map((plan) => (
                  <Card key={plan.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant={plan.type === 'meal' ? 'default' : 'secondary'} className="mb-2">
                          {plan.type === 'meal' ? 'Alimentar' : 'Treino'}
                        </Badge>
                        <Checkbox
                          checked={selectedPlans.includes(plan.id)}
                          onCheckedChange={(checked) => handleSelectPlan(plan.id, checked as boolean)}
                        />
                      </div>
                      <CardTitle className="text-base truncate">{plan.title}</CardTitle>
                      <CardDescription className="truncate">
                        Cliente: {plan.profiles?.nome || 'Sem nome'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Data inicial</p>
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
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Data final</p>
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
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>Criado em: {formatDate(plan.created_at)}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-1 pb-3 gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => viewPlanDetails(plan)}
                          >
                            <Eye className="h-4 w-4 mr-2" /> Visualizar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-xl">{plan.title}</DialogTitle>
                            <DialogDescription>
                              {plan.type === 'meal' ? 'Plano Alimentar' : 'Plano de Treino'} • {formatDate(plan.created_at)}
                            </DialogDescription>
                          </DialogHeader>
                          {previewPlan && (
                            <div className="mt-4 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="font-medium mb-1">Cliente</p>
                                  <p>{previewPlan.profiles?.nome || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="font-medium mb-1">Período</p>
                                  <p>{formatDate(previewPlan.data_inicio)} - {formatDate(previewPlan.data_fim)}</p>
                                </div>
                              </div>
                              
                              <div>
                                <p className="font-medium mb-1">Detalhes</p>
                                <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                                  {typeof previewPlan.content === 'object' ? (
                                    <pre className="text-sm">
                                      {JSON.stringify(previewPlan.content, null, 2)}
                                    </pre>
                                  ) : (
                                    <p>Dados não disponíveis</p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex justify-end">
                                <Button onClick={() => updatePlan(previewPlan)}>
                                  Ativar Plano
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="default"
                        size="sm"
                        className="w-full"
                        onClick={() => updatePlan(plan)}
                        disabled={updateLoading === plan.id}
                      >
                        {updateLoading === plan.id ? 'Ativando...' : 'Ativar'}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {/* Paginação */}
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages} • {plans.length} resultado(s)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Ativações</CardTitle>
              <CardDescription>
                Últimas {activationHistory.length} ativações realizadas na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activationHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <ClipboardList className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Nenhuma ativação registrada.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-2 text-left">ID do Plano</th>
                        <th className="p-2 text-left">Tipo</th>
                        <th className="p-2 text-left">Data de Ativação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activationHistory.map((activation) => (
                        <tr key={activation.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="p-2 font-mono text-xs">{activation.plan_id}</td>
                          <td className="p-2">
                            <Badge variant={activation.plan_type === 'meal' ? 'default' : 'secondary'}>
                              {activation.plan_type === 'meal' ? 'Alimentar' : 'Treino'}
                            </Badge>
                          </td>
                          <td className="p-2">
                            {new Date(activation.activated_at).toLocaleString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 