import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  ClipboardList,
  Eye,
  Search,
  Filter,
  ArrowUpDown,
  Clipboard,
  Calendar,
  User,
  Database,
  Tag,
  Download
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/DashboardLayout';
import { FormStatus, PlanStatus, ProductType } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { migrateRespostas } from '@/lib/migrateRespostas';

// Interfaces
interface FormResponse {
  id: string;
  user_id: string;
  user_name?: string;
  form_type: string;
  version: number;
  responses: Record<string, any>;
  purchase_id: string;
  product_id: string;
  product_name?: string;
  product_type?: ProductType;
  created_at: string;
}

interface UserData {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
}

// Componente principal
export default function RespostasManager() {
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<FormResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [busca, setBusca] = useState('');
  const [responseSelecionada, setResponseSelecionada] = useState<FormResponse | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Carregar respostas
  useEffect(() => {
    const fetchResponses = async () => {
      try {
        setIsLoading(true);
        
        // Verificar e criar tabelas se necessário
        try {
          // Executar a migração das tabelas de respostas
          const migrationResult = await migrateRespostas();
          
          if (!migrationResult.success) {
            console.warn('As tabelas precisam ser criadas manualmente via SQL no painel do Supabase');
            toast({
              title: 'Configuração necessária',
              description: 'É necessário configurar o banco de dados. Entre em contato com o administrador do sistema.',
              variant: 'destructive',
            });
          } else if (!migrationResult.exists) {
            toast({
              title: 'Estrutura criada',
              description: 'A estrutura de respostas de formulários foi configurada com sucesso.',
              variant: 'default',
            });
          }
        } catch (migrationError) {
          console.error('Erro na migração:', migrationError);
          // Continua mesmo com erro na migração
        }
        
        // Buscar respostas dos formulários
        const { data: responsesData, error: responsesError } = await supabase
          .from('form_responses')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (responsesError) {
          console.error('Erro ao buscar respostas:', responsesError);
          throw responsesError;
        }
        
        // Buscar informações de usuários e produtos
        const responsesWithDetails = await Promise.all(
          (responsesData || []).map(async (response) => {
            // Buscar informações do usuário
            const { data: userData, error: userError } = await supabase
              .from('profiles')
              .select('nome, email, telefone')
              .eq('id', response.user_id)
              .single();
              
            if (userError && userError.code !== 'PGRST116') {
              console.warn('Erro ao buscar informações do usuário:', userError);
            }
            
            // Buscar informações do produto
            const { data: productData, error: productError } = await supabase
              .from('products')
              .select('name, type')
              .eq('id', response.product_id)
              .single();
              
            if (productError && productError.code !== 'PGRST116') {
              console.warn('Erro ao buscar informações do produto:', productError);
            }
            
            return {
              ...response,
              user_name: userData?.nome || 'Usuário não encontrado',
              product_name: productData?.name || 'Produto não encontrado',
              product_type: productData?.type
            };
          })
        );
        
        setResponses(responsesWithDetails);
        setFilteredResponses(responsesWithDetails);
      } catch (error) {
        console.error('Erro ao carregar respostas:', error);
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar as respostas dos formulários.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResponses();
  }, [toast]);

  // Filtrar respostas baseado na tab, tipo e busca
  useEffect(() => {
    const filtered = responses.filter(response => {
      // Filtro por tab
      if (currentTab === 'anamnese' && response.form_type !== 'anamnese') return false;
      if (currentTab === 'avaliacao' && response.form_type !== 'avaliacao') return false;
      if (currentTab === 'progresso' && response.form_type !== 'progresso') return false;
      
      // Filtro por tipo de produto
      if (filtroTipo && filtroTipo !== 'todos') {
        if (filtroTipo === 'meal_plan' && response.product_type !== ProductType.MEAL_PLAN) return false;
        if (filtroTipo === 'workout_plan' && response.product_type !== ProductType.WORKOUT_PLAN) return false;
        if (filtroTipo === 'combo' && response.product_type !== ProductType.COMBO) return false;
      }
      
      // Filtro por busca
      if (busca) {
        const termoBusca = busca.toLowerCase();
        return (
          response.user_name?.toLowerCase().includes(termoBusca) ||
          response.product_name?.toLowerCase().includes(termoBusca) ||
          response.id.toLowerCase().includes(termoBusca)
        );
      }
      
      return true;
    });
    
    setFilteredResponses(filtered);
  }, [responses, currentTab, filtroTipo, busca]);
  
  // Visualizar resposta detalhada
  const viewResponseDetails = async (response: FormResponse) => {
    try {
      setResponseSelecionada(response);
      
      // Buscar dados completos do usuário
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', response.user_id)
        .single();
        
      if (userError) {
        console.error('Erro ao buscar dados do usuário:', userError);
      } else {
        setUserData(userData as UserData);
      }
    } catch (error) {
      console.error('Erro ao preparar visualização da resposta:', error);
      toast({
        title: 'Erro ao carregar detalhes',
        description: 'Não foi possível carregar os detalhes da resposta.',
        variant: 'destructive',
      });
    }
  };
  
  // Exportar resposta como JSON
  const exportResponseAsJson = (response: FormResponse) => {
    try {
      const data = JSON.stringify(response.responses, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `resposta_${response.form_type}_${response.user_id.substring(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Arquivo exportado',
        description: 'A resposta foi exportada com sucesso.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Erro ao exportar resposta:', error);
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível exportar a resposta.',
        variant: 'destructive',
      });
    }
  };
  
  // Obter nome do tipo de formulário
  const getFormTypeName = (type: string) => {
    switch (type) {
      case 'anamnese': return 'Anamnese';
      case 'avaliacao': return 'Avaliação Física';
      case 'progresso': return 'Acompanhamento';
      default: return type;
    }
  };
  
  // Obter cor do badge do tipo
  const getFormTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'anamnese':
        return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
      case 'avaliacao':
        return 'bg-purple-100 text-purple-700 hover:bg-purple-200';
      case 'progresso':
        return 'bg-amber-100 text-amber-700 hover:bg-amber-200';
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    }
  };
  
  // Obter nome do tipo de produto
  const getProductTypeName = (type?: ProductType) => {
    switch (type) {
      case ProductType.MEAL_PLAN: return 'Plano Alimentar';
      case ProductType.WORKOUT_PLAN: return 'Plano de Treino';
      case ProductType.COMBO: return 'Combo';
      default: return 'Desconhecido';
    }
  };
  
  // Obter cor do badge do tipo de produto
  const getProductTypeBadgeColor = (type?: ProductType) => {
    switch (type) {
      case ProductType.MEAL_PLAN:
        return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200';
      case ProductType.WORKOUT_PLAN:
        return 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200';
      case ProductType.COMBO:
        return 'bg-pink-100 text-pink-700 hover:bg-pink-200';
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    }
  };
  
  // Formatar data
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return dateString;
    }
  };
  
  // Componente de loading
  if (isLoading) {
    return (
      <DashboardLayout 
        title="Respostas de Formulários"
        subtitle="Visualize e gerencie respostas de formulários enviadas pelos usuários"
        icon={<Clipboard className="h-5 w-5 text-indigo-600" />}
        gradient="subtle"
        isAdmin={true}
      >
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col space-y-2">
                  <Skeleton className="h-5 w-64" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout 
      title="Respostas de Formulários"
      subtitle="Visualize e gerencie respostas de formulários enviadas pelos usuários"
      icon={<Clipboard className="h-5 w-5 text-indigo-600" />}
      gradient="subtle"
      isAdmin={true}
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl text-indigo-800">Gerenciador de Respostas</CardTitle>
              <CardDescription>
                Visualize e exporte as respostas dos formulários submetidos pelos usuários
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative w-full sm:w-auto sm:flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por usuário ou produto..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  className="pl-9 border-indigo-200 w-full"
                />
              </div>
              
              <div className="flex gap-3">
                <div className="w-full sm:w-auto">
                  <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                    <SelectTrigger className="border-indigo-200 w-full sm:w-[180px]">
                      <div className="flex items-center">
                        <Filter className="h-4 w-4 mr-2 text-indigo-500" />
                        <SelectValue placeholder="Filtrar por tipo" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os produtos</SelectItem>
                      <SelectItem value="meal_plan">Plano Alimentar</SelectItem>
                      <SelectItem value="workout_plan">Plano de Treino</SelectItem>
                      <SelectItem value="combo">Combo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="w-full bg-indigo-50/80 border border-indigo-100 mb-4">
                <TabsTrigger value="todos" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Todos
                </TabsTrigger>
                <TabsTrigger value="anamnese" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Anamnese
                </TabsTrigger>
                <TabsTrigger value="avaliacao" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm">
                  <Tag className="h-4 w-4 mr-2" />
                  Avaliação
                </TabsTrigger>
                <TabsTrigger value="progresso" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Progresso
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {filteredResponses.length === 0 ? (
              <div className="text-center py-8 border rounded-lg bg-gray-50">
                <Clipboard className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-600 mb-1">Nenhuma resposta encontrada</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {busca || filtroTipo || currentTab !== 'todos'
                    ? 'Tente ajustar os filtros para ver mais resultados.' 
                    : 'Ainda não há respostas de formulários enviadas pelos usuários.'}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-indigo-50/70">
                      <TableHead className="w-[250px]">
                        <div className="flex items-center">
                          <span>Usuário</span>
                          <ArrowUpDown className="ml-2 h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResponses.map((response) => (
                      <TableRow key={response.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="text-indigo-700">{response.user_name}</span>
                            <span className="text-xs text-gray-500">
                              ID: {response.user_id.substring(0, 8)}...
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getFormTypeBadgeColor(response.form_type)}`}>
                            {getFormTypeName(response.form_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getProductTypeBadgeColor(response.product_type)}`}>
                            {getProductTypeName(response.product_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 text-gray-500" />
                            <span className="text-sm">{formatDate(response.created_at)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 border-indigo-200"
                              onClick={() => viewResponseDetails(response)}
                            >
                              <Eye className="h-4 w-4 text-indigo-700" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 border-indigo-200"
                              onClick={() => exportResponseAsJson(response)}
                            >
                              <Download className="h-4 w-4 text-indigo-700" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Dialog de visualização das respostas */}
      <Dialog open={!!responseSelecionada} onOpenChange={(open) => {
        if (!open) {
          setResponseSelecionada(null);
          setUserData(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-indigo-800 flex items-center gap-2">
              <Clipboard className="h-5 w-5" />
              Detalhes da Resposta - {getFormTypeName(responseSelecionada?.form_type || '')}
            </DialogTitle>
            <DialogDescription>
              Visualizando resposta de {responseSelecionada?.user_name || 'Usuário'} para {responseSelecionada?.product_name || 'Produto'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 my-4">
            {/* Informações do usuário */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-blue-50 p-3 border-b font-medium text-blue-700 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Informações do Usuário
              </div>
              
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nome:</p>
                  <p className="font-medium">{userData?.nome || responseSelecionada?.user_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">E-mail:</p>
                  <p className="font-medium">{userData?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Telefone:</p>
                  <p className="font-medium">{userData?.telefone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ID:</p>
                  <p className="font-medium text-gray-700">{responseSelecionada?.user_id || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            {/* Informações da resposta */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-indigo-50 p-3 border-b font-medium text-indigo-700 flex items-center flex justify-between">
                <div className="flex items-center">
                  <Database className="h-4 w-4 mr-2" />
                  Dados da Resposta
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-indigo-200 bg-white"
                  onClick={() => responseSelecionada && exportResponseAsJson(responseSelecionada)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Exportar JSON
                </Button>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Tipo de Formulário:</p>
                    <Badge className={`${getFormTypeBadgeColor(responseSelecionada?.form_type || '')}`}>
                      {getFormTypeName(responseSelecionada?.form_type || '')}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Produto:</p>
                    <Badge className={`${getProductTypeBadgeColor(responseSelecionada?.product_type)}`}>
                      {responseSelecionada?.product_name || 'Desconhecido'} ({getProductTypeName(responseSelecionada?.product_type)})
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Data de Envio:</p>
                    <p className="font-medium">{responseSelecionada && formatDate(responseSelecionada.created_at)}</p>
                  </div>
                </div>
                
                {/* Respostas em formato de tabela */}
                <div className="border rounded-md mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-1/3">Campo</TableHead>
                        <TableHead>Resposta</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {responseSelecionada && Object.entries(responseSelecionada.responses).map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell className="font-medium">{key}</TableCell>
                          <TableCell>
                            {typeof value === 'object' 
                              ? JSON.stringify(value) 
                              : value?.toString() || 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {responseSelecionada && Object.keys(responseSelecionada.responses).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-4 text-gray-500">
                            Este formulário não possui respostas ou o formato é inválido.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setResponseSelecionada(null);
                setUserData(null);
              }}
              className="border-gray-200"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
} 