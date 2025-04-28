import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  ClipboardList,
  Link as LinkIcon,
  Eye,
  Search,
  Filter,
  ArrowUpDown,
  Check,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import DashboardLayout from '@/components/DashboardLayout';
import { migrateFormularios, createPgSQLFunction } from '@/lib/migrateFormularios';

// Interfaces
interface Formulario {
  id: string;
  nome: string;
  descricao: string;
  tipo: 'anamnese' | 'avaliacao' | 'progresso';
  ativo: boolean;
  data_criacao: string;
  campos: Campo[];
  planos_vinculados?: number;
}

interface Campo {
  id: string;
  label: string;
  tipo: 'texto' | 'numero' | 'selecao' | 'checkbox' | 'data' | 'textarea';
  obrigatorio: boolean;
  opcoes?: string[];
  ordem: number;
}

interface Plano {
  id: string;
  nome: string;
  tipo: string;
}

// Componente principal
export default function FormularioManager() {
  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [busca, setBusca] = useState('');
  const [formularioSelecionado, setFormularioSelecionado] = useState<Formulario | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Carregar formulários
  useEffect(() => {
    const fetchFormularios = async () => {
      try {
        setIsLoading(true);
        
        // Verificar e criar tabelas se necessário
        try {
          // Tenta criar as funções utilitárias primeiro
          await createPgSQLFunction();
          
          // Executa a migração das tabelas de formulários
          const migrationResult = await migrateFormularios();
          
          if (!migrationResult.success && migrationResult.message?.includes('função pgsql')) {
            console.warn('As tabelas precisam ser criadas manualmente via SQL no painel do Supabase');
            toast({
              title: 'Configuração necessária',
              description: 'É necessário configurar o banco de dados. Entre em contato com o administrador do sistema.',
              variant: 'destructive',
            });
          } else if (!migrationResult.exists) {
            toast({
              title: 'Estrutura criada',
              description: 'A estrutura de formulários foi configurada com sucesso.',
              variant: 'default',
            });
          }
        } catch (migrationError) {
          console.error('Erro na migração:', migrationError);
          // Continua mesmo com erro na migração
        }
        
        // Buscar formulários
        const { data: formulariosData, error: formulariosError } = await supabase
          .from('forms')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (formulariosError) {
          console.error('Erro ao buscar formulários:', formulariosError);
          // Verificar se o erro é de tabela não encontrada (código 404)
          if (formulariosError.code === '404' || formulariosError.message?.includes('does not exist')) {
            // Criar dados iniciais simulados para evitar página em branco
            setFormularios([]);
            toast({
              title: 'Tabela não encontrada',
              description: 'A tabela de formulários ainda não existe. Crie seu primeiro formulário para inicializá-la.',
              variant: 'default',
            });
            setIsLoading(false);
            return;
          }
          throw formulariosError;
        }
        
        // Mapear para o formato esperado
        const formulariosFormatados = formulariosData?.map(form => ({
          id: form.id,
          nome: form.name || form.title || 'Sem nome',
          descricao: form.description || 'Sem descrição',
          tipo: form.type || 'anamnese',
          ativo: form.is_active || false,
          data_criacao: form.created_at,
          campos: form.fields || [],
          planos_vinculados: 0
        })) || [];
        
        // Buscar contagem de planos vinculados para cada formulário
        const formulariosComVinculos = await Promise.all(
          formulariosFormatados.map(async (form) => {
            try {
              const { count, error } = await supabase
                .from('plan_forms')
                .select('*', { count: 'exact', head: true })
                .eq('form_id', form.id);
              
              if (error) {
                console.warn('Erro ao buscar vínculos:', error);
                return {
                  ...form,
                  planos_vinculados: 0
                };
              }
                
              return {
                ...form,
                planos_vinculados: count || 0
              };
            } catch (e) {
              console.warn('Erro ao processar vínculos:', e);
              return {
                ...form,
                planos_vinculados: 0
              };
            }
          })
        );
        
        // Buscar planos para seleção
        try {
          const { data: planosData, error: planosError } = await supabase
            .from('meal_plans')
            .select('id, nome, tipo')
            .eq('status', 'ativo')
            .order('nome');
            
          if (planosError) {
            console.warn('Erro ao buscar planos:', planosError);
          } else {
            setPlanos(planosData || []);
          }
        } catch (planError) {
          console.warn('Erro ao processar planos:', planError);
        }
        
        setFormularios(formulariosComVinculos);
      } catch (error) {
        console.error('Erro ao carregar formulários:', error);
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar os formulários. Verifique o console para mais detalhes.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFormularios();
  }, [toast]);

  // Filtrar formulários baseado na tab, tipo e busca
  const filtrarFormularios = () => {
    return formularios.filter(form => {
      // Filtro por tab
      if (currentTab === 'ativos' && !form.ativo) return false;
      if (currentTab === 'inativos' && form.ativo) return false;
      
      // Filtro por tipo
      if (filtroTipo && filtroTipo !== 'todos' && form.tipo !== filtroTipo) return false;
      
      // Filtro por busca
      if (busca) {
        const termoBusca = busca.toLowerCase();
        return (
          form.nome.toLowerCase().includes(termoBusca) ||
          form.descricao.toLowerCase().includes(termoBusca)
        );
      }
      
      return true;
    });
  };
  
  // Alternar status ativo/inativo
  const toggleStatus = async (id: string, novoStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('forms')
        .update({ is_active: novoStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      // Atualizar estado local
      setFormularios(prev => 
        prev.map(form => 
          form.id === id ? { ...form, ativo: novoStatus } : form
        )
      );
      
      toast({
        title: `Formulário ${novoStatus ? 'ativado' : 'desativado'}`,
        description: `O formulário foi ${novoStatus ? 'ativado' : 'desativado'} com sucesso`,
        variant: novoStatus ? 'default' : 'destructive',
      });
    } catch (error) {
      console.error('Erro ao alternar status:', error);
      toast({
        title: 'Erro ao alterar status',
        description: 'Não foi possível alterar o status do formulário',
        variant: 'destructive',
      });
    }
  };
  
  // Excluir formulário
  const excluirFormulario = async (id: string) => {
    try {
      // Verificar se há planos vinculados
      const { count, error: countError } = await supabase
        .from('plan_forms')
        .select('*', { count: 'exact', head: true })
        .eq('form_id', id);
        
      if (countError) throw countError;
      
      if (count && count > 0) {
        toast({
          title: 'Não é possível excluir',
          description: `Este formulário está vinculado a ${count} plano(s)`,
          variant: 'destructive',
        });
        return;
      }
      
      // Excluir o formulário
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Atualizar estado local
      setFormularios(prev => prev.filter(form => form.id !== id));
      
      toast({
        title: 'Formulário excluído',
        description: 'O formulário foi excluído com sucesso',
        variant: 'default',
      });
    } catch (error) {
      console.error('Erro ao excluir formulário:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o formulário',
        variant: 'destructive',
      });
    }
  };
  
  // Visualizar ou criar novo formulário
  const handleCreateOrEdit = (formulario?: Formulario) => {
    if (formulario) {
      navigate(`/admin/formularios/editar/${formulario.id}`);
    } else {
      navigate('/admin/formularios/novo');
    }
  };
  
  // Obter nome do tipo
  const getTipoNome = (tipo: string) => {
    switch (tipo) {
      case 'anamnese': return 'Anamnese';
      case 'avaliacao': return 'Avaliação Física';
      case 'progresso': return 'Acompanhamento';
      default: return tipo;
    }
  };
  
  // Obter cor do badge do tipo
  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
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
  
  // Componente de loading
  if (isLoading) {
    return (
      <DashboardLayout 
        title="Gerenciamento de Formulários"
        subtitle="Visualize e gerencie formulários submetidos pelos usuários"
        icon={<FileText className="h-5 w-5 text-emerald-600" />}
        gradient="subtle"
        isAdmin={true}
      >
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
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
  
  // Lista filtrada de formulários
  const formulariosExibidos = filtrarFormularios();
  
  return (
    <DashboardLayout 
      title="Gerenciamento de Formulários"
      subtitle="Visualize e gerencie formulários submetidos pelos usuários"
      icon={<FileText className="h-5 w-5 text-emerald-600" />}
      gradient="subtle"
      isAdmin={true}
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl text-emerald-800">Gerenciador de Formulários</CardTitle>
              <CardDescription>
                Crie e gerencie formulários de anamnese e avaliação para seus planos
              </CardDescription>
            </div>
            <Button 
              onClick={() => handleCreateOrEdit()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Formulário
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative w-full sm:w-auto sm:flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar formulários..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  className="pl-9 border-emerald-200 w-full"
                />
              </div>
              
              <div className="flex gap-3">
                <div className="w-full sm:w-auto">
                  <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                    <SelectTrigger className="border-emerald-200 w-full sm:w-[180px]">
                      <div className="flex items-center">
                        <Filter className="h-4 w-4 mr-2 text-emerald-500" />
                        <SelectValue placeholder="Filtrar por tipo" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os tipos</SelectItem>
                      <SelectItem value="anamnese">Anamnese</SelectItem>
                      <SelectItem value="avaliacao">Avaliação Física</SelectItem>
                      <SelectItem value="progresso">Acompanhamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="w-full bg-emerald-50/80 border border-emerald-100 mb-4">
                <TabsTrigger value="todos" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Todos
                </TabsTrigger>
                <TabsTrigger value="ativos" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
                  <Check className="h-4 w-4 mr-2" />
                  Ativos
                </TabsTrigger>
                <TabsTrigger value="inativos" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
                  <X className="h-4 w-4 mr-2" />
                  Inativos
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {formulariosExibidos.length === 0 ? (
              <div className="text-center py-8 border rounded-lg bg-gray-50">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-600 mb-1">Nenhum formulário encontrado</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {busca || filtroTipo 
                    ? 'Tente ajustar os filtros para ver mais resultados.' 
                    : 'Crie seu primeiro formulário para começar.'}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-emerald-50/70">
                      <TableHead className="w-[300px]">
                        <div className="flex items-center">
                          <span>Nome</span>
                          <ArrowUpDown className="ml-2 h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-center">Planos Vinculados</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formulariosExibidos.map((formulario) => (
                      <TableRow key={formulario.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="text-emerald-700">{formulario.nome}</span>
                            <span className="text-xs text-gray-500 truncate max-w-[280px]">
                              {formulario.descricao}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getTipoBadgeColor(formulario.tipo)}`}>
                            {getTipoNome(formulario.tipo)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Badge 
                              variant="outline" 
                              className="bg-gray-50 hover:bg-gray-100 font-medium"
                            >
                              <LinkIcon className="h-3 w-3 mr-1 text-emerald-500" />
                              {formulario.planos_vinculados}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {formulario.ativo ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                              <Check className="h-3 w-3 mr-1" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500 border-gray-300">
                              <X className="h-3 w-3 mr-1" />
                              Inativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 border-emerald-200"
                              onClick={() => setFormularioSelecionado(formulario)}
                            >
                              <Eye className="h-4 w-4 text-emerald-700" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 border-emerald-200"
                              onClick={() => handleCreateOrEdit(formulario)}
                            >
                              <Edit className="h-4 w-4 text-emerald-700" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-300"
                              onClick={() => {
                                if (formulario.planos_vinculados && formulario.planos_vinculados > 0) {
                                  toast({
                                    title: 'Não é possível excluir',
                                    description: `Este formulário está vinculado a ${formulario.planos_vinculados} plano(s). Desvincule-o antes de excluir.`,
                                    variant: 'destructive',
                                  });
                                } else {
                                  excluirFormulario(formulario.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
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
      
      {/* Dialog de visualização do formulário */}
      <Dialog open={!!formularioSelecionado} onOpenChange={(open) => {
        if (!open) setFormularioSelecionado(null);
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-emerald-800">
              {formularioSelecionado?.nome}
            </DialogTitle>
            <DialogDescription>
              {formularioSelecionado?.descricao}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div className="flex flex-wrap gap-3">
              <Badge className={`${getTipoBadgeColor(formularioSelecionado?.tipo || '')}`}>
                {getTipoNome(formularioSelecionado?.tipo || '')}
              </Badge>
              
              {formularioSelecionado?.ativo ? (
                <Badge className="bg-emerald-100 text-emerald-700">
                  <Check className="h-3 w-3 mr-1" />
                  Ativo
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-500 border-gray-300">
                  <X className="h-3 w-3 mr-1" />
                  Inativo
                </Badge>
              )}
              
              <Badge variant="outline" className="bg-gray-50 font-medium">
                <LinkIcon className="h-3 w-3 mr-1 text-emerald-500" />
                {formularioSelecionado?.planos_vinculados} plano(s) vinculado(s)
              </Badge>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-emerald-50 p-3 border-b font-medium text-emerald-700">
                Campos do formulário
              </div>
              
              <div className="p-4 divide-y">
                {formularioSelecionado?.campos?.map((campo, idx) => (
                  <div key={campo.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-emerald-800">{campo.label}</span>
                        {campo.obrigatorio && (
                          <Badge className="bg-red-100 text-red-700 text-xs">Obrigatório</Badge>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {campo.tipo === 'texto' ? 'Texto' : 
                         campo.tipo === 'numero' ? 'Número' : 
                         campo.tipo === 'selecao' ? 'Seleção' : 
                         campo.tipo === 'checkbox' ? 'Checkbox' : 
                         campo.tipo === 'data' ? 'Data' : 
                         campo.tipo === 'textarea' ? 'Área de texto' : campo.tipo}
                      </Badge>
                    </div>
                    
                    {campo.tipo === 'selecao' && campo.opcoes && (
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="text-xs text-gray-500">Opções: </span>
                        {campo.opcoes.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
                
                {(!formularioSelecionado?.campos || formularioSelecionado.campos.length === 0) && (
                  <div className="py-4 text-center text-gray-500">
                    Este formulário não possui campos definidos.
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setFormularioSelecionado(null)}
              className="border-gray-200"
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                const formulario = formularioSelecionado;
                setFormularioSelecionado(null);
                if (formulario) {
                  handleCreateOrEdit(formulario);
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar Formulário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
} 