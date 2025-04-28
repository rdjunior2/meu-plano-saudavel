import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabaseClient';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon, LineChart, BarChart3, BarChart, PieChart, Activity, TrendingUp, Scale } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Importando React Charts 2
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Registrando componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Interfaces
interface MedicaoUsuario {
  id: string;
  usuario_id: string;
  data: string;
  peso: number;
  altura: number;
  imc: number;
  gordura_corporal: number;
  massa_muscular: number;
  medidas: {
    cintura?: number;
    quadril?: number;
    braco_esquerdo?: number;
    braco_direito?: number;
    coxa_esquerda?: number;
    coxa_direita?: number;
    [key: string]: number | undefined;
  };
}

interface AtividadeUsuario {
  id: string;
  usuario_id: string;
  data: string;
  tipo: 'treino' | 'alimentacao';
  descricao: string;
  duracao?: number;
  calorias?: number;
  detalhes?: any;
}

// Componente principal
const Acompanhamento = () => {
  const [medicoes, setMedicoes] = useState<MedicaoUsuario[]>([]);
  const [atividades, setAtividades] = useState<AtividadeUsuario[]>([]);
  const [periodoSelecionado, setPeriodoSelecionado] = useState<string>('3meses');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  // Buscar dados de acompanhamento
  useEffect(() => {
    const fetchDados = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        
        // Calcular data inicial com base no período selecionado
        const hoje = new Date();
        let dataInicial;
        
        switch (periodoSelecionado) {
          case '1mes':
            dataInicial = subMonths(hoje, 1);
            break;
          case '3meses':
            dataInicial = subMonths(hoje, 3);
            break;
          case '6meses':
            dataInicial = subMonths(hoje, 6);
            break;
          case '12meses':
            dataInicial = subMonths(hoje, 12);
            break;
          default:
            dataInicial = subMonths(hoje, 3);
        }
        
        // Formatando datas para consulta
        const dataInicialStr = format(dataInicial, 'yyyy-MM-dd');
        const dataFinalStr = format(hoje, 'yyyy-MM-dd');
        
        // Buscar medições
        const { data: medicoesData, error: medicoesError } = await supabase
          .from('medicoes_usuario')
          .select('*')
          .eq('usuario_id', user.id)
          .gte('data', dataInicialStr)
          .lte('data', dataFinalStr)
          .order('data', { ascending: true });
          
        if (medicoesError) throw medicoesError;
        
        // Buscar atividades
        const { data: atividadesData, error: atividadesError } = await supabase
          .from('atividades_usuario')
          .select('*')
          .eq('usuario_id', user.id)
          .gte('data', dataInicialStr)
          .lte('data', dataFinalStr)
          .order('data', { ascending: true });
          
        if (atividadesError) throw atividadesError;
        
        // Atualizar estados
        setMedicoes(medicoesData || []);
        setAtividades(atividadesData || []);
        
      } catch (error) {
        console.error('Erro ao buscar dados de acompanhamento:', error);
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar seus dados de acompanhamento. Tente novamente mais tarde.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDados();
  }, [user?.id, periodoSelecionado]);

  // Função para gerar dados do gráfico de peso
  const gerarDadosGraficoPeso = () => {
    const labels = medicoes.map(m => format(new Date(m.data), 'dd/MM/yyyy'));
    const pesos = medicoes.map(m => m.peso);
    
    return {
      labels,
      datasets: [
        {
          label: 'Peso (kg)',
          data: pesos,
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
          fill: true,
        }
      ]
    };
  };
  
  // Função para gerar dados do gráfico de composição corporal
  const gerarDadosGraficoComposicao = () => {
    const labels = medicoes.map(m => format(new Date(m.data), 'dd/MM/yyyy'));
    const gorduraCorporal = medicoes.map(m => m.gordura_corporal);
    const massaMuscular = medicoes.map(m => m.massa_muscular);
    
    return {
      labels,
      datasets: [
        {
          label: 'Gordura Corporal (%)',
          data: gorduraCorporal,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.3,
        },
        {
          label: 'Massa Muscular (%)',
          data: massaMuscular,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
        }
      ]
    };
  };
  
  // Função para gerar dados do gráfico de medidas
  const gerarDadosGraficoMedidas = () => {
    const medidasRecentes = medicoes.slice(-1)[0]?.medidas || {};
    const medidasAnteriores = medicoes.length > 1 ? medicoes[0]?.medidas : {};
    
    const labels = Object.keys(medidasRecentes).filter(key => 
      medidasRecentes[key] !== undefined && 
      (key === 'cintura' || key === 'quadril' || key === 'braco_direito' || key === 'coxa_direita')
    ).map(key => {
      switch(key) {
        case 'cintura': return 'Cintura';
        case 'quadril': return 'Quadril';
        case 'braco_direito': return 'Braço';
        case 'coxa_direita': return 'Coxa';
        default: return key;
      }
    });
    
    const medidasRecentesValues = Object.keys(medidasRecentes)
      .filter(key => 
        medidasRecentes[key] !== undefined && 
        (key === 'cintura' || key === 'quadril' || key === 'braco_direito' || key === 'coxa_direita')
      )
      .map(key => medidasRecentes[key]);
      
    const medidasAnterioresValues = Object.keys(medidasRecentes)
      .filter(key => 
        medidasRecentes[key] !== undefined && 
        (key === 'cintura' || key === 'quadril' || key === 'braco_direito' || key === 'coxa_direita')
      )
      .map(key => medidasAnteriores[key] || 0);
    
    return {
      labels,
      datasets: [
        {
          label: 'Inicial',
          data: medidasAnterioresValues,
          backgroundColor: 'rgba(156, 163, 175, 0.8)',
        },
        {
          label: 'Atual',
          data: medidasRecentesValues,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
        }
      ]
    };
  };
  
  // Função para gerar dados do gráfico de atividades
  const gerarDadosGraficoAtividades = () => {
    // Obter intervalo de meses no período
    const hoje = new Date();
    const mesesAtras = subMonths(hoje, periodoSelecionado === '1mes' ? 1 : 
                                        periodoSelecionado === '3meses' ? 3 : 
                                        periodoSelecionado === '6meses' ? 6 : 12);
    
    const meses = eachMonthOfInterval({
      start: startOfMonth(mesesAtras),
      end: endOfMonth(hoje)
    });
    
    // Preparar labels (nomes dos meses)
    const labels = meses.map(mes => format(mes, 'MMM', { locale: ptBR }));
    
    // Contar atividades por mês
    const atividadesPorMes = meses.map(mes => {
      const inicio = startOfMonth(mes);
      const fim = endOfMonth(mes);
      
      return atividades.filter(atividade => {
        const dataAtividade = new Date(atividade.data);
        return dataAtividade >= inicio && dataAtividade <= fim;
      }).length;
    });
    
    return {
      labels,
      datasets: [
        {
          label: 'Atividades Realizadas',
          data: atividadesPorMes,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
        }
      ]
    };
  };
  
  // Opções de configuração dos gráficos
  const optionsLine = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };
  
  const optionsBar = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
  
  // Componente de loading
  if (isLoading) {
    return (
      <DashboardLayout title="Acompanhamento" subtitle="Acompanhe sua evolução e resultados">
        <div className="flex justify-end mb-4">
          <Skeleton className="h-10 w-40 bg-emerald-100/50" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Skeleton className="h-64 w-full bg-emerald-50" />
          <Skeleton className="h-64 w-full bg-emerald-50" />
          <Skeleton className="h-64 w-full bg-emerald-50" />
          <Skeleton className="h-64 w-full bg-emerald-50" />
        </div>
      </DashboardLayout>
    );
  }
  
  // Verificar se há dados para exibir
  const temDados = medicoes.length > 0 && atividades.length > 0;
  
  return (
    <DashboardLayout title="Acompanhamento" subtitle="Acompanhe sua evolução e resultados">
      <div className="flex justify-end mb-6">
        <div className="flex items-center gap-3">
          <Label htmlFor="periodo-select" className="text-emerald-700">
            <CalendarIcon className="h-4 w-4 mr-1 inline-block" />
            Período:
          </Label>
          <Select
            value={periodoSelecionado}
            onValueChange={setPeriodoSelecionado}
          >
            <SelectTrigger className="w-[140px] border-emerald-200">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1mes">Último mês</SelectItem>
              <SelectItem value="3meses">Últimos 3 meses</SelectItem>
              <SelectItem value="6meses">Últimos 6 meses</SelectItem>
              <SelectItem value="12meses">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {!temDados ? (
        <Card className="bg-white border border-emerald-100">
          <CardContent className="pt-10 pb-10 px-6 text-center">
            <div className="mx-auto w-16 h-16 mb-6 flex items-center justify-center rounded-full bg-emerald-50">
              <LineChart className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold text-emerald-700 mb-2">
              Sem dados de acompanhamento disponíveis
            </h3>
            <p className="text-emerald-600 mb-6 max-w-md mx-auto">
              Para começar a acompanhar sua evolução, registre suas medidas corporais e atividades regularmente.
            </p>
            <Button 
              variant="default" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Registrar medidas
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="evolucao" className="space-y-6">
          <TabsList className="w-full bg-emerald-50/80 border border-emerald-100">
            <TabsTrigger value="evolucao" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
              <Activity className="h-4 w-4 mr-2" />
              Evolução Corporal
            </TabsTrigger>
            <TabsTrigger value="atividades" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              Histórico de Atividades
            </TabsTrigger>
          </TabsList>
          
          {/* Tab de Evolução Corporal */}
          <TabsContent value="evolucao" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gráfico de Peso */}
              <Card className="border border-emerald-100">
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <Scale className="h-5 w-5 mr-2 text-emerald-600" />
                    <CardTitle className="text-lg font-semibold text-emerald-800">Evolução de Peso</CardTitle>
                  </div>
                  <CardDescription className="text-emerald-600">
                    Acompanhe a variação do seu peso corporal
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {medicoes.length > 1 ? (
                    <Line data={gerarDadosGraficoPeso()} options={optionsLine} height={medicoes.length > 5 ? 70 : 90} />
                  ) : (
                    <div className="text-center py-8 text-emerald-600">
                      Dados insuficientes para gerar o gráfico. 
                      <br />
                      Registre pelo menos duas medições.
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Gráfico de Composição Corporal */}
              <Card className="border border-emerald-100">
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <PieChart className="h-5 w-5 mr-2 text-emerald-600" />
                    <CardTitle className="text-lg font-semibold text-emerald-800">Composição Corporal</CardTitle>
                  </div>
                  <CardDescription className="text-emerald-600">
                    Acompanhe sua gordura corporal e massa muscular
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {medicoes.length > 1 ? (
                    <Line data={gerarDadosGraficoComposicao()} options={optionsLine} height={medicoes.length > 5 ? 70 : 90} />
                  ) : (
                    <div className="text-center py-8 text-emerald-600">
                      Dados insuficientes para gerar o gráfico. 
                      <br />
                      Registre pelo menos duas medições.
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Gráfico de Medidas */}
              <Card className="border border-emerald-100">
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-emerald-600" />
                    <CardTitle className="text-lg font-semibold text-emerald-800">Comparação de Medidas</CardTitle>
                  </div>
                  <CardDescription className="text-emerald-600">
                    Compare as medidas iniciais com as atuais
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {medicoes.length > 1 ? (
                    <Bar data={gerarDadosGraficoMedidas()} options={optionsBar} height={90} />
                  ) : (
                    <div className="text-center py-8 text-emerald-600">
                      Dados insuficientes para gerar o gráfico. 
                      <br />
                      Registre pelo menos duas medições.
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Gráfico de IMC */}
              <Card className="border border-emerald-100">
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-emerald-600" />
                    <CardTitle className="text-lg font-semibold text-emerald-800">Índice de Massa Corporal</CardTitle>
                  </div>
                  <CardDescription className="text-emerald-600">
                    Acompanhe a evolução do seu IMC
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {medicoes.length > 1 ? (
                    <div>
                      <Line 
                        data={{
                          labels: medicoes.map(m => format(new Date(m.data), 'dd/MM/yyyy')),
                          datasets: [{
                            label: 'IMC',
                            data: medicoes.map(m => m.imc),
                            borderColor: 'rgb(139, 92, 246)',
                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                            tension: 0.3,
                            fill: true,
                          }]
                        }} 
                        options={optionsLine} 
                        height={medicoes.length > 5 ? 70 : 90} 
                      />
                      
                      <div className="flex justify-center gap-4 mt-4 text-xs font-medium">
                        <div className="flex items-center">
                          <span className="w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
                          Abaixo do peso (&lt;18.5)
                        </div>
                        <div className="flex items-center">
                          <span className="w-3 h-3 rounded-full bg-green-500 mr-1"></span>
                          Normal (18.5-24.9)
                        </div>
                        <div className="flex items-center">
                          <span className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></span>
                          Sobrepeso (25-29.9)
                        </div>
                        <div className="flex items-center">
                          <span className="w-3 h-3 rounded-full bg-red-500 mr-1"></span>
                          Obesidade (≥30)
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-emerald-600">
                      Dados insuficientes para gerar o gráfico. 
                      <br />
                      Registre pelo menos duas medições.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Tab de Histórico de Atividades */}
          <TabsContent value="atividades">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Gráfico de Atividades por Mês */}
              <Card className="border border-emerald-100 lg:col-span-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <BarChart className="h-5 w-5 mr-2 text-emerald-600" />
                    <CardTitle className="text-lg font-semibold text-emerald-800">Atividades por Mês</CardTitle>
                  </div>
                  <CardDescription className="text-emerald-600">
                    Total de atividades realizadas por mês
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {atividades.length > 0 ? (
                    <Bar data={gerarDadosGraficoAtividades()} options={optionsBar} height={80} />
                  ) : (
                    <div className="text-center py-8 text-emerald-600">
                      Nenhuma atividade registrada no período selecionado.
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Distribuição de Atividades */}
              <Card className="border border-emerald-100">
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <PieChart className="h-5 w-5 mr-2 text-emerald-600" />
                    <CardTitle className="text-lg font-semibold text-emerald-800">Distribuição</CardTitle>
                  </div>
                  <CardDescription className="text-emerald-600">
                    Proporção entre treinos e alimentação
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {atividades.length > 0 ? (
                    <div className="flex items-center justify-center">
                      <Pie 
                        data={{
                          labels: ['Treinos', 'Alimentação'],
                          datasets: [{
                            data: [
                              atividades.filter(a => a.tipo === 'treino').length,
                              atividades.filter(a => a.tipo === 'alimentacao').length
                            ],
                            backgroundColor: [
                              'rgba(59, 130, 246, 0.8)',
                              'rgba(16, 185, 129, 0.8)'
                            ],
                            borderWidth: 1,
                            borderColor: '#fff'
                          }]
                        }}
                        options={{
                          plugins: {
                            legend: {
                              position: 'bottom',
                            }
                          }
                        }}
                        height={180}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-emerald-600">
                      Nenhuma atividade registrada no período selecionado.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </DashboardLayout>
  );
};

export default Acompanhamento; 