import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabaseClient';
import { format, isToday, parseISO, startOfToday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  CheckCircle2, 
  Utensils, 
  Dumbbell, 
  Clock,
  Bell,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  CalendarHeart
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';

// Interfaces
interface Tarefa {
  id: string;
  usuario_id: string;
  plano_id: string;
  tipo: 'alimentacao' | 'treino';
  titulo: string;
  descricao: string;
  horario: string;
  concluida: boolean;
  data: string;
  notificacao: boolean;
}

interface ProgressoStats {
  progresso: number;
  totalTarefas: number;
  tarefasConcluidas: number;
}

// Componente principal
const TarefasDiarias = () => {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<{alimentacao: ProgressoStats, treino: ProgressoStats}>({
    alimentacao: { progresso: 0, totalTarefas: 0, tarefasConcluidas: 0 },
    treino: { progresso: 0, totalTarefas: 0, tarefasConcluidas: 0 }
  });
  
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  // Buscar tarefas do usuário
  useEffect(() => {
    const fetchTarefas = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        
        // Formatar a data para consulta (YYYY-MM-DD)
        const dataFormatada = format(dataSelecionada, 'yyyy-MM-dd');
        
        // Buscar tarefas para a data selecionada
        const { data, error } = await supabase
          .from('tarefas_diarias')
          .select('*')
          .eq('usuario_id', user.id)
          .eq('data', dataFormatada)
          .order('horario', { ascending: true });
          
        if (error) {
          throw error;
        }
        
        // Atualizar estado
        setTarefas(data || []);
        
        // Calcular estatísticas por tipo
        const tarefasAlimentacao = data?.filter(t => t.tipo === 'alimentacao') || [];
        const tarefasTreino = data?.filter(t => t.tipo === 'treino') || [];
        
        setStats({
          alimentacao: {
            totalTarefas: tarefasAlimentacao.length,
            tarefasConcluidas: tarefasAlimentacao.filter(t => t.concluida).length,
            progresso: tarefasAlimentacao.length 
              ? Math.round((tarefasAlimentacao.filter(t => t.concluida).length / tarefasAlimentacao.length) * 100) 
              : 0
          },
          treino: {
            totalTarefas: tarefasTreino.length,
            tarefasConcluidas: tarefasTreino.filter(t => t.concluida).length,
            progresso: tarefasTreino.length 
              ? Math.round((tarefasTreino.filter(t => t.concluida).length / tarefasTreino.length) * 100) 
              : 0
          }
        });
        
      } catch (error) {
        console.error('Erro ao buscar tarefas:', error);
        toast({
          title: 'Erro ao carregar tarefas',
          description: 'Não foi possível carregar suas tarefas. Tente novamente mais tarde.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTarefas();
  }, [user?.id, dataSelecionada]);
  
  // Atualizar status de conclusão da tarefa
  const handleToggleTarefa = async (id: string, concluida: boolean) => {
    try {
      // Otimistic UI update
      setTarefas(tarefasAtuais => 
        tarefasAtuais.map(tarefa => 
          tarefa.id === id ? { ...tarefa, concluida } : tarefa
        )
      );
      
      // Atualizar no backend
      const { error } = await supabase
        .from('tarefas_diarias')
        .update({ concluida })
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      // Atualizar estatísticas
      const tarefaAtualizada = tarefas.find(t => t.id === id);
      if (tarefaAtualizada) {
        const tipo = tarefaAtualizada.tipo;
        
        setStats(statsAtuais => {
          const novoStats = { ...statsAtuais };
          const tipoStats = { ...novoStats[tipo] };
          
          tipoStats.tarefasConcluidas = concluida 
            ? tipoStats.tarefasConcluidas + 1 
            : tipoStats.tarefasConcluidas - 1;
            
          tipoStats.progresso = tipoStats.totalTarefas 
            ? Math.round((tipoStats.tarefasConcluidas / tipoStats.totalTarefas) * 100) 
            : 0;
          
          novoStats[tipo] = tipoStats;
          return novoStats;
        });
      }
      
      // Mostrar feedback
      toast({
        title: concluida ? 'Tarefa concluída!' : 'Tarefa desmarcada',
        description: concluida ? 'Parabéns por manter sua disciplina!' : 'Você pode concluir esta tarefa mais tarde.',
        variant: concluida ? 'default' : 'outline',
      });
      
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      
      // Reverter alteração no UI em caso de erro
      setTarefas(tarefasAtuais => 
        tarefasAtuais.map(tarefa => 
          tarefa.id === id ? { ...tarefa, concluida: !concluida } : tarefa
        )
      );
      
      toast({
        title: 'Erro ao atualizar tarefa',
        description: 'Não foi possível atualizar o status da tarefa. Tente novamente.',
        variant: 'destructive',
      });
    }
  };
  
  // Toggle de notificação para tarefa
  const handleToggleNotificacao = async (id: string, notificacao: boolean) => {
    try {
      // Otimistic UI update
      setTarefas(tarefasAtuais => 
        tarefasAtuais.map(tarefa => 
          tarefa.id === id ? { ...tarefa, notificacao } : tarefa
        )
      );
      
      // Atualizar no backend
      const { error } = await supabase
        .from('tarefas_diarias')
        .update({ notificacao })
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: notificacao ? 'Notificação ativada' : 'Notificação desativada',
        description: notificacao 
          ? 'Você receberá lembretes para esta tarefa.' 
          : 'Você não receberá mais lembretes para esta tarefa.',
        variant: 'default',
      });
      
    } catch (error) {
      console.error('Erro ao atualizar notificação:', error);
      
      // Reverter alteração no UI em caso de erro
      setTarefas(tarefasAtuais => 
        tarefasAtuais.map(tarefa => 
          tarefa.id === id ? { ...tarefa, notificacao: !notificacao } : tarefa
        )
      );
      
      toast({
        title: 'Erro ao atualizar notificação',
        description: 'Não foi possível atualizar a configuração de notificação. Tente novamente.',
        variant: 'destructive',
      });
    }
  };
  
  // Navegar para dia anterior
  const irParaDiaAnterior = () => {
    const novaData = new Date(dataSelecionada);
    novaData.setDate(novaData.getDate() - 1);
    setDataSelecionada(novaData);
  };
  
  // Navegar para próximo dia
  const irParaProximoDia = () => {
    const novaData = new Date(dataSelecionada);
    novaData.setDate(novaData.getDate() + 1);
    setDataSelecionada(novaData);
  };
  
  // Voltar para hoje
  const irParaHoje = () => {
    setDataSelecionada(new Date());
  };
  
  // Formatar horário
  const formatarHorario = (horario: string) => {
    return horario.substring(0, 5); // Pegar apenas HH:MM
  };
  
  // Renderizar lista de tarefas
  const renderizarTarefas = (tipo: 'alimentacao' | 'treino') => {
    const tarefasFiltradas = tarefas.filter(tarefa => tarefa.tipo === tipo);
    
    if (tarefasFiltradas.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="flex justify-center mb-3">
            {tipo === 'alimentacao' ? (
              <Utensils className="h-10 w-10 text-emerald-200" />
            ) : (
              <Dumbbell className="h-10 w-10 text-emerald-200" />
            )}
          </div>
          <h3 className="text-lg font-medium text-emerald-700 mb-1">
            Nenhuma tarefa {tipo === 'alimentacao' ? 'alimentar' : 'de treino'} para hoje
          </h3>
          <p className="text-sm text-emerald-600">
            {isToday(dataSelecionada) 
              ? 'Aproveite seu dia de descanso ou consulte seu plano para adicionar tarefas.' 
              : 'Selecione outra data ou volte para hoje para visualizar suas tarefas.'}
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        {tarefasFiltradas.map((tarefa) => (
          <div 
            key={tarefa.id} 
            className={`p-4 border rounded-lg flex items-start gap-3 transition-all duration-300 ${
              tarefa.concluida 
                ? 'bg-emerald-50 border-emerald-200' 
                : 'bg-white border-gray-200 hover:border-emerald-200'
            }`}
          >
            <div className="flex-shrink-0 pt-0.5">
              <Checkbox
                id={`tarefa-${tarefa.id}`}
                checked={tarefa.concluida}
                onCheckedChange={(checked) => handleToggleTarefa(tarefa.id, checked as boolean)}
                className={tarefa.concluida ? 'bg-emerald-500 text-emerald-50' : ''}
              />
            </div>
            
            <div className="flex-grow">
              <div className="flex items-center gap-2 mb-1">
                <label 
                  htmlFor={`tarefa-${tarefa.id}`}
                  className={`text-base font-medium cursor-pointer ${
                    tarefa.concluida ? 'text-emerald-700 line-through' : 'text-gray-800'
                  }`}
                >
                  {tarefa.titulo}
                </label>
                
                {tarefa.concluida && (
                  <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Concluída
                  </Badge>
                )}
              </div>
              
              <p className={`text-sm ${tarefa.concluida ? 'text-emerald-600/80' : 'text-gray-600'}`}>
                {tarefa.descricao}
              </p>
              
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center text-xs text-emerald-600">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  {formatarHorario(tarefa.horario)}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 px-2 rounded-full ${
                    tarefa.notificacao 
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                  onClick={() => handleToggleNotificacao(tarefa.id, !tarefa.notificacao)}
                >
                  <Bell className="h-3.5 w-3.5 mr-1" />
                  {tarefa.notificacao ? 'Notificar' : 'Silenciado'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Componente de loading
  if (isLoading) {
    return (
      <DashboardLayout title="Tarefas Diárias" subtitle="Acompanhe suas tarefas de alimentação e treino">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-40 bg-emerald-100/70" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-9 rounded-md bg-emerald-100/70" />
                <Skeleton className="h-9 w-9 rounded-md bg-emerald-100/70" />
                <Skeleton className="h-9 w-9 rounded-md bg-emerald-100/70" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-6 bg-emerald-100/50" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full bg-emerald-50" />
              ))}
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title="Tarefas Diárias" subtitle="Acompanhe suas tarefas de alimentação e treino">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Painel lateral com estatísticas */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center text-emerald-800">
              <CalendarHeart className="h-5 w-5 mr-2 text-emerald-600" />
              Progresso Diário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Estatísticas de Alimentação */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <Utensils className="h-4 w-4 mr-1.5 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">Alimentação</span>
                  </div>
                  <span className="text-xs font-medium text-emerald-600">
                    {stats.alimentacao.tarefasConcluidas}/{stats.alimentacao.totalTarefas}
                  </span>
                </div>
                <Progress value={stats.alimentacao.progresso} className="h-2" />
                <p className="mt-1 text-xs text-emerald-600">
                  {stats.alimentacao.totalTarefas === 0 
                    ? 'Nenhuma tarefa alimentar para hoje' 
                    : `${stats.alimentacao.progresso}% concluído`}
                </p>
              </div>
              
              {/* Estatísticas de Treino */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <Dumbbell className="h-4 w-4 mr-1.5 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">Treino</span>
                  </div>
                  <span className="text-xs font-medium text-emerald-600">
                    {stats.treino.tarefasConcluidas}/{stats.treino.totalTarefas}
                  </span>
                </div>
                <Progress value={stats.treino.progresso} className="h-2" />
                <p className="mt-1 text-xs text-emerald-600">
                  {stats.treino.totalTarefas === 0 
                    ? 'Nenhuma tarefa de treino para hoje' 
                    : `${stats.treino.progresso}% concluído`}
                </p>
              </div>
              
              {/* Link para visualizar planos */}
              <div className="pt-3 border-t border-emerald-100">
                <Button 
                  variant="outline" 
                  className="w-full text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                  onClick={() => navigate('/meu-plano')}
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Visualizar meus planos
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Painel principal com as tarefas */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-600" />
                <span className="font-semibold text-lg text-emerald-800">
                  {format(dataSelecionada, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </span>
                {isToday(dataSelecionada) && (
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 ml-2">
                    Hoje
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={irParaDiaAnterior}
                  className="rounded-full h-9 w-9 hover:bg-emerald-100 hover:text-emerald-700"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={irParaHoje}
                  className="h-9 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  disabled={isToday(dataSelecionada)}
                >
                  Hoje
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={irParaProximoDia}
                  className="rounded-full h-9 w-9 hover:bg-emerald-100 hover:text-emerald-700"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="alimentacao" className="mt-2">
              <TabsList className="w-full bg-emerald-50/80 border border-emerald-100">
                <TabsTrigger 
                  value="alimentacao" 
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
                >
                  <Utensils className="h-4 w-4 mr-2" />
                  Alimentação {stats.alimentacao.totalTarefas > 0 && (
                    <Badge className="ml-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                      {stats.alimentacao.tarefasConcluidas}/{stats.alimentacao.totalTarefas}
                    </Badge>
                  )}
                </TabsTrigger>
                
                <TabsTrigger 
                  value="treino" 
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
                >
                  <Dumbbell className="h-4 w-4 mr-2" />
                  Treino {stats.treino.totalTarefas > 0 && (
                    <Badge className="ml-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                      {stats.treino.tarefasConcluidas}/{stats.treino.totalTarefas}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="alimentacao" className="mt-4">
                {renderizarTarefas('alimentacao')}
              </TabsContent>
              
              <TabsContent value="treino" className="mt-4">
                {renderizarTarefas('treino')}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TarefasDiarias; 