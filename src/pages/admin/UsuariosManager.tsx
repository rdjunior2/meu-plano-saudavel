import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Search, 
  Plus, 
  Calendar, 
  FileText, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  XCircle, 
  ClockIcon, 
  Filter 
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

// Interfaces
interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  avatar_url: string | null;
  is_admin: boolean;
  data_registro: string;
  planos_pendentes?: number;
  planos_ativos?: number;
}

interface Plano {
  id: string;
  nome: string;
  tipo: string;
  descricao: string;
}

interface LiberacaoPlano {
  id: string;
  usuario_id: string;
  plano_id: string;
  data_inicio: string;
  data_termino: string;
  status: 'pendente' | 'ativo' | 'expirado';
  usuario?: {
    nome: string;
    email: string;
  };
  plano?: {
    nome: string;
    tipo: string;
  };
}

// Componente principal
export default function UsuariosManager() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [liberacoes, setLiberacoes] = useState<LiberacaoPlano[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [currentTab, setCurrentTab] = useState('usuarios');
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
  const [planoSelecionado, setPlanoSelecionado] = useState('');
  const [dataInicio, setDataInicio] = useState<Date>(new Date());
  const [dataTermino, setDataTermino] = useState<Date>(new Date());
  const [isAtribuindoPlano, setIsAtribuindoPlano] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('');
  const { toast } = useToast();

  // Carregar dados
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Buscar usuários
        const { data: usuariosData, error: usuariosError } = await supabase
          .from('profiles')
          .select('*')
          .order('nome');
          
        if (usuariosError) throw usuariosError;
        
        // Buscar planos
        const { data: planosData, error: planosError } = await supabase
          .from('meal_plans')
          .select('id, nome, tipo, descricao')
          .eq('status', 'ativo')
          .order('nome');
          
        if (planosError) throw planosError;
        
        // Buscar liberações de planos
        const { data: liberacoesData, error: liberacoesError } = await supabase
          .from('user_plans')
          .select(`
            id,
            user_id,
            plan_id,
            start_date,
            end_date,
            status,
            profiles!user_id (
              nome,
              email
            ),
            meal_plans!plan_id (
              nome,
              tipo
            )
          `)
          .order('status', { ascending: false })
          .order('start_date', { ascending: false });
          
        if (liberacoesError) {
          console.error('Erro ao buscar liberações:', liberacoesError);
          throw liberacoesError;
        }
        
        // Mapear os dados para o formato esperado
        const liberacoesFormatadas = liberacoesData?.map(item => ({
          id: item.id,
          usuario_id: item.user_id,
          plano_id: item.plan_id,
          data_inicio: item.start_date,
          data_termino: item.end_date,
          status: item.status,
          usuario: item.profiles,
          plano: item.meal_plans
        })) || [];
        
        // Simplificando para evitar múltiplas consultas por usuário
        // Contar planos ativos e pendentes para cada usuário
        const usuariosComPlanos = usuariosData.map(user => {
          // Contar planos pendentes e ativos do usuário nas liberações já carregadas
          const planosPendentes = liberacoesFormatadas.filter(
            lib => lib.usuario_id === user.id && lib.status === 'pendente'
          ).length;
          
          const planosAtivos = liberacoesFormatadas.filter(
            lib => lib.usuario_id === user.id && lib.status === 'ativo'
          ).length;
          
          return {
            ...user,
            planos_pendentes: planosPendentes,
            planos_ativos: planosAtivos
          };
        });
        
        setUsuarios(usuariosComPlanos);
        setPlanos(planosData || []);
        setLiberacoes(liberacoesFormatadas);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar os dados dos usuários e planos. Verifique o console para mais detalhes.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);

  // Filtrar usuários com base na busca
  const filtrarUsuarios = () => {
    if (!busca) return usuarios;
    
    const termoBusca = busca.toLowerCase();
    return usuarios.filter(
      usuario => 
        usuario.nome.toLowerCase().includes(termoBusca) ||
        usuario.email.toLowerCase().includes(termoBusca)
    );
  };
  
  // Filtrar liberações com base na busca e filtro de status
  const filtrarLiberacoes = () => {
    let liberacoesFiltradas = liberacoes;
    
    // Filtro por status
    if (filtroStatus) {
      liberacoesFiltradas = liberacoesFiltradas.filter(lib => lib.status === filtroStatus);
    }
    
    // Filtro por busca
    if (busca) {
      const termoBusca = busca.toLowerCase();
      liberacoesFiltradas = liberacoesFiltradas.filter(
        lib => 
          lib.usuario?.nome.toLowerCase().includes(termoBusca) ||
          lib.usuario?.email.toLowerCase().includes(termoBusca) ||
          lib.plano?.nome.toLowerCase().includes(termoBusca)
      );
    }
    
    return liberacoesFiltradas;
  };
  
  // Atribuir plano a um usuário
  const atribuirPlano = async () => {
    if (!usuarioSelecionado || !planoSelecionado || !dataInicio || !dataTermino) {
      toast({
        title: 'Dados incompletos',
        description: 'Preencha todos os campos para atribuir o plano',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsAtribuindoPlano(true);
      
      // Verificar se já existe atribuição ativa para este plano e usuário
      const { data: existingPlan, error: checkError } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', usuarioSelecionado.id)
        .eq('plan_id', planoSelecionado)
        .or('status.eq.ativo,status.eq.pendente');
        
      if (checkError) throw checkError;
      
      if (existingPlan && existingPlan.length > 0) {
        toast({
          title: 'Plano já atribuído',
          description: 'Este usuário já possui este plano ativo ou pendente',
          variant: 'destructive',
        });
        return;
      }
      
      // Criar nova atribuição
      const { data, error } = await supabase
        .from('user_plans')
        .insert({
          user_id: usuarioSelecionado.id,
          plan_id: planoSelecionado,
          start_date: format(dataInicio, 'yyyy-MM-dd'),
          end_date: format(dataTermino, 'yyyy-MM-dd'),
          status: 'pendente'
        })
        .select('*, profiles(nome, email), meal_plans(nome, tipo)');
        
      if (error) throw error;
      
      // Atualizar estado local
      if (data && data.length > 0) {
        setLiberacoes(prev => [data[0], ...prev]);
        
        // Atualizar contador de planos pendentes para o usuário
        setUsuarios(prev => 
          prev.map(user => 
            user.id === usuarioSelecionado.id 
              ? { ...user, planos_pendentes: (user.planos_pendentes || 0) + 1 } 
              : user
          )
        );
      }
      
      toast({
        title: 'Plano atribuído com sucesso',
        description: 'O plano foi atribuído ao usuário e está pendente',
        variant: 'default',
      });
      
      // Limpar seleção
      setUsuarioSelecionado(null);
      setPlanoSelecionado('');
      
    } catch (error) {
      console.error('Erro ao atribuir plano:', error);
      toast({
        title: 'Erro ao atribuir plano',
        description: 'Não foi possível atribuir o plano ao usuário',
        variant: 'destructive',
      });
    } finally {
      setIsAtribuindoPlano(false);
    }
  };
  
  // Atualizar status de uma liberação
  const atualizarStatusLiberacao = async (id: string, novoStatus: 'ativo' | 'pendente' | 'expirado') => {
    try {
      // Buscar dados da liberação atual
      const { data: liberacaoAtual, error: errorBusca } = await supabase
        .from('user_plans')
        .select('status, user_id')
        .eq('id', id)
        .single();
        
      if (errorBusca) throw errorBusca;
      
      // Atualizar status
      const { error } = await supabase
        .from('user_plans')
        .update({ status: novoStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      // Atualizar estado local da liberação
      setLiberacoes(prev => 
        prev.map(lib => 
          lib.id === id ? { ...lib, status: novoStatus } : lib
        )
      );
      
      // Atualizar contagem de planos do usuário
      if (liberacaoAtual) {
        setUsuarios(prev => 
          prev.map(user => {
            if (user.id === liberacaoAtual.user_id) {
              // Ajustar contadores baseado na mudança de status
              let planosAtivos = user.planos_ativos || 0;
              let planosPendentes = user.planos_pendentes || 0;
              
              if (liberacaoAtual.status === 'pendente' && novoStatus === 'ativo') {
                planosPendentes--;
                planosAtivos++;
              } else if (liberacaoAtual.status === 'ativo' && novoStatus === 'pendente') {
                planosAtivos--;
                planosPendentes++;
              } else if (liberacaoAtual.status === 'ativo' && novoStatus === 'expirado') {
                planosAtivos--;
              } else if (liberacaoAtual.status === 'pendente' && novoStatus === 'expirado') {
                planosPendentes--;
              }
              
              return {
                ...user,
                planos_ativos: planosAtivos,
                planos_pendentes: planosPendentes
              };
            }
            return user;
          })
        );
      }
      
      toast({
        title: 'Status atualizado',
        description: `O plano agora está ${
          novoStatus === 'ativo' ? 'ativo' : 
          novoStatus === 'pendente' ? 'pendente' : 'expirado'
        }`,
        variant: 'default',
      });
      
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro ao atualizar status',
        description: 'Não foi possível atualizar o status do plano',
        variant: 'destructive',
      });
    }
  };
  
  // Obter cor do badge de status
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200';
      case 'pendente':
        return 'bg-amber-100 text-amber-700 hover:bg-amber-200';
      case 'expirado':
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    }
  };
  
  // Obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativo':
        return <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />;
      case 'pendente':
        return <ClockIcon className="h-3.5 w-3.5 mr-1.5" />;
      case 'expirado':
        return <XCircle className="h-3.5 w-3.5 mr-1.5" />;
      default:
        return null;
    }
  };
  
  // Formatar data
  const formatarData = (data: string) => {
    return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
  };

  return (
    <DashboardLayout 
      title="Gerenciamento de Usuários"
      subtitle="Gerencie o acesso e os planos dos usuários do sistema"
      icon={<User className="h-5 w-5 text-blue-600" />}
      gradient="subtle"
      isAdmin={true}
    >
      <div className="space-y-8">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full space-y-6">
          <TabsList className="w-full bg-gray-50 p-1 rounded-lg border border-gray-100">
            <TabsTrigger value="usuarios" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm">
              Usuários
            </TabsTrigger>
            <TabsTrigger value="liberacoes" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm">
              Liberações de Planos
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="usuarios">
            <Card className="border border-gray-200 shadow-sm overflow-hidden">
              <CardHeader className="pb-2 border-b border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>Lista de Usuários</CardTitle>
                    <CardDescription>Gerencie usuários e suas permissões</CardDescription>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="relative flex-1 md:min-w-[300px]">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input 
                        placeholder="Buscar usuários..." 
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="pl-9 border-gray-200"
                      />
                    </div>
                    
                    <Button variant="outline" size="icon" className="border-gray-200">
                      <Filter className="h-4 w-4 text-gray-500" />
                    </Button>
                    
                    <Button variant="default" className="bg-sky-600 hover:bg-sky-700">
                      <Plus className="h-4 w-4 mr-2" /> Novo Usuário
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6 space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-4 w-[200px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="relative overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Registro</TableHead>
                          <TableHead>Planos</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtrarUsuarios().length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                              Nenhum usuário encontrado.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filtrarUsuarios().map((usuario) => (
                            <TableRow key={usuario.id}>
                              <TableCell className="py-3">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10 border border-gray-200">
                                    <AvatarImage src={usuario.avatar_url || undefined} alt={usuario.nome} />
                                    <AvatarFallback className="bg-sky-100 text-sky-700">
                                      {usuario.nome.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{usuario.nome}</div>
                                    <div className="text-sm text-slate-500">{usuario.email}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={usuario.is_admin ? "bg-purple-100 text-purple-800" : "bg-sky-100 text-sky-800"}>
                                  {usuario.is_admin ? "Administrador" : "Usuário"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {usuario.data_registro ? formatarData(usuario.data_registro) : "N/A"}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {usuario.planos_ativos && usuario.planos_ativos > 0 && (
                                    <Badge className="bg-green-100 text-green-800">
                                      {usuario.planos_ativos} ativo(s)
                                    </Badge>
                                  )}
                                  {usuario.planos_pendentes && usuario.planos_pendentes > 0 && (
                                    <Badge className="bg-amber-100 text-amber-800">
                                      {usuario.planos_pendentes} pendente(s)
                                    </Badge>
                                  )}
                                  {(!usuario.planos_ativos || usuario.planos_ativos === 0) && 
                                   (!usuario.planos_pendentes || usuario.planos_pendentes === 0) && (
                                    <Badge className="bg-gray-100 text-gray-800">
                                      Sem planos
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" size="sm" className="border-gray-200">
                                    <FileText className="h-4 w-4 mr-1" /> Detalhes
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-gray-200"
                                    onClick={() => {
                                      setUsuarioSelecionado(usuario);
                                      setIsAtribuindoPlano(true);
                                    }}
                                  >
                                    <Plus className="h-4 w-4 mr-1" /> Plano
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="liberacoes">
            <Card className="border border-gray-200 shadow-sm overflow-hidden">
              <CardHeader className="pb-2 border-b border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>Liberações de Planos</CardTitle>
                    <CardDescription>Gerencie os planos liberados para os usuários</CardDescription>
                  </div>
                  
                  <div className="flex gap-2">
                    <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                      <SelectTrigger className="w-[180px] border-gray-200">
                        <SelectValue placeholder="Filtrar por status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="expirado">Expirado</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="relative flex-1 md:min-w-[300px]">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input 
                        placeholder="Buscar liberações..." 
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="pl-9 border-gray-200"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {/* Implementar tabela de liberações similar ao exemplo anterior */}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Diálogo para atribuir um plano ao usuário */}
        {isAtribuindoPlano && usuarioSelecionado && (
          <Dialog open={isAtribuindoPlano} onOpenChange={setIsAtribuindoPlano}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Atribuir Plano</DialogTitle>
                <DialogDescription>
                  Atribuir um plano para {usuarioSelecionado.nome}
                </DialogDescription>
              </DialogHeader>
              
              {/* Conteúdo do diálogo de atribuição de plano */}
              
              <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAtribuindoPlano(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => {/* Implementar ação de atribuir plano */}}
                  disabled={!planoSelecionado}
                >
                  Atribuir Plano
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
} 