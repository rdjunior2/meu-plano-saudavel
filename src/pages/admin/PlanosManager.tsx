import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Filter, MoreVertical, Plus, RefreshCw, Search, Trash, Edit, Eye, Users } from 'lucide-react';

interface Plano {
  id: string;
  nome: string;
  descricao: string;
  tipo: 'nutricional' | 'treino' | 'combo';
  imagem_url: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  usuarios_ativos?: number;
  usuarios_pendentes?: number;
}

export default function PlanosManager() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [showDialogNovo, setShowDialogNovo] = useState(false);
  const [formPlano, setFormPlano] = useState<Partial<Plano>>({
    nome: '',
    descricao: '',
    tipo: 'nutricional',
    ativo: true
  });
  const { toast } = useToast();

  // Carregar planos
  useEffect(() => {
    carregarPlanos();
  }, []);

  const carregarPlanos = async () => {
    setIsLoading(true);
    try {
      // Buscar planos
      const { data: planosData, error: planosError } = await supabase
        .from('planos')
        .select('*')
        .order('nome');

      if (planosError) throw planosError;
        
      // Para cada plano, buscar contagem de usuários
      const planosComContagens = await Promise.all(
        (planosData || []).map(async (plano) => {
          // Usuários com planos ativos
          const { count: ativos, error: ativosError } = await supabase
            .from('usuario_planos')
            .select('*', { count: 'exact', head: true })
            .eq('plano_id', plano.id)
            .eq('status', 'ativo');
            
          // Usuários com planos pendentes
          const { count: pendentes, error: pendentesError } = await supabase
            .from('usuario_planos')
            .select('*', { count: 'exact', head: true })
            .eq('plano_id', plano.id)
            .eq('status', 'pendente');
            
          if (ativosError || pendentesError) {
            console.warn('Erro ao buscar contagens:', ativosError || pendentesError);
          }
            
          return {
            ...plano,
            usuarios_ativos: ativos || 0,
            usuarios_pendentes: pendentes || 0
          };
        })
      );
      
      setPlanos(planosComContagens);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os planos alimentares.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar planos
  const planosFiltrados = planos
    .filter(plano => {
      // Filtro de texto
      const matchBusca = busca === '' || 
        plano.nome.toLowerCase().includes(busca.toLowerCase()) ||
        plano.descricao?.toLowerCase().includes(busca.toLowerCase());
      
      // Filtro de tipo
      const matchTipo = filtroTipo === 'todos' || plano.tipo === filtroTipo;
      
      // Filtro de status
      const matchStatus = filtroStatus === 'todos' || 
        (filtroStatus === 'ativo' && plano.ativo) || 
        (filtroStatus === 'inativo' && !plano.ativo);
        
      return matchBusca && matchTipo && matchStatus;
    });

  // Salvar novo plano
  const salvarPlano = async () => {
    if (!formPlano.nome || !formPlano.tipo) {
      toast({
        title: 'Dados incompletos',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('planos')
        .insert({
          nome: formPlano.nome,
          descricao: formPlano.descricao || '',
          tipo: formPlano.tipo,
          ativo: formPlano.ativo,
          imagem_url: formPlano.imagem_url || null
        })
        .select();

      if (error) throw error;

      toast({
        title: 'Plano criado com sucesso',
        description: `O plano "${formPlano.nome}" foi adicionado.`,
      });

      // Recarregar a lista de planos
      await carregarPlanos();
      
      // Fechar diálogo e limpar formulário
      setShowDialogNovo(false);
      setFormPlano({
        nome: '',
        descricao: '',
        tipo: 'nutricional',
        ativo: true
      });
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o plano. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Alternar status (ativo/inativo)
  const alternarStatus = async (id: string, novoStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('planos')
        .update({ ativo: novoStatus })
        .eq('id', id);

      if (error) throw error;

      // Atualizar lista local
      setPlanos(planos.map(plano => 
        plano.id === id ? { ...plano, ativo: novoStatus } : plano
      ));

      toast({
        title: `Plano ${novoStatus ? 'ativado' : 'desativado'}`,
        description: `O status do plano foi alterado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro ao alterar status',
        description: 'Não foi possível alterar o status do plano.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-bold">Planos Alimentares</CardTitle>
                <CardDescription>
                  Gerencie os modelos de planos alimentares, de treino e combos
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowDialogNovo(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Plano
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="todos" className="w-full">
              <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative w-full sm:w-auto sm:flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar planos..."
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
                          <SelectItem value="todos">Todos os tipos</SelectItem>
                          <SelectItem value="nutricional">Nutricional</SelectItem>
                          <SelectItem value="treino">Treino</SelectItem>
                          <SelectItem value="combo">Combo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="w-full sm:w-auto">
                      <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                        <SelectTrigger className="border-indigo-200 w-full sm:w-[180px]">
                          <div className="flex items-center">
                            <Filter className="h-4 w-4 mr-2 text-indigo-500" />
                            <SelectValue placeholder="Filtrar por status" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os status</SelectItem>
                          <SelectItem value="ativo">Ativos</SelectItem>
                          <SelectItem value="inativo">Inativos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button
                      variant="outline"
                      className="border-indigo-200"
                      onClick={carregarPlanos}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              </div>
              
              <TabsList className="grid grid-cols-2 w-full max-w-md mb-6">
                <TabsTrigger value="todos">Todos os Planos</TabsTrigger>
                <TabsTrigger value="ativos">Planos Ativos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="todos">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Usuários</TableHead>
                        <TableHead>Última Atualização</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <div className="flex justify-center">
                              <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">Carregando planos...</div>
                          </TableCell>
                        </TableRow>
                      ) : planosFiltrados.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <div className="text-muted-foreground">Nenhum plano encontrado</div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        planosFiltrados.map((plano) => (
                          <TableRow key={plano.id}>
                            <TableCell className="font-medium">{plano.nome}</TableCell>
                            <TableCell>
                              <Badge variant={plano.tipo === 'nutricional' ? 'default' : 
                                    plano.tipo === 'treino' ? 'outline' : 'secondary'}>
                                {plano.tipo === 'nutricional' ? 'Nutricional' : 
                                plano.tipo === 'treino' ? 'Treino' : 'Combo'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={plano.ativo ? 'success' : 'destructive'}>
                                {plano.ativo ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {plano.usuarios_ativos} ativos, {plano.usuarios_pendentes} pendentes
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(plano.updated_at), 'PPp', {locale: ptBR})}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem className="cursor-pointer">
                                    <Eye className="h-4 w-4 mr-2" />
                                    Visualizar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer">
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="cursor-pointer"
                                    onClick={() => alternarStatus(plano.id, !plano.ativo)}
                                  >
                                    <Switch checked={plano.ativo} className="mr-2" />
                                    {plano.ativo ? 'Desativar' : 'Ativar'}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="ativos">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Usuários</TableHead>
                        <TableHead>Última Atualização</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <div className="flex justify-center">
                              <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">Carregando planos...</div>
                          </TableCell>
                        </TableRow>
                      ) : planosFiltrados.filter(p => p.ativo).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <div className="text-muted-foreground">Nenhum plano ativo encontrado</div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        planosFiltrados
                          .filter(p => p.ativo)
                          .map((plano) => (
                            <TableRow key={plano.id}>
                              <TableCell className="font-medium">{plano.nome}</TableCell>
                              <TableCell>
                                <Badge variant={plano.tipo === 'nutricional' ? 'default' : 
                                      plano.tipo === 'treino' ? 'outline' : 'secondary'}>
                                  {plano.tipo === 'nutricional' ? 'Nutricional' : 
                                  plano.tipo === 'treino' ? 'Treino' : 'Combo'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">
                                    {plano.usuarios_ativos} ativos, {plano.usuarios_pendentes} pendentes
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {format(new Date(plano.updated_at), 'PPp', {locale: ptBR})}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem className="cursor-pointer">
                                      <Eye className="h-4 w-4 mr-2" />
                                      Visualizar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer">
                                      <Edit className="h-4 w-4 mr-2" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="cursor-pointer"
                                      onClick={() => alternarStatus(plano.id, false)}
                                    >
                                      <Switch checked={true} className="mr-2" />
                                      Desativar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Diálogo para criar novo plano */}
      <Dialog open={showDialogNovo} onOpenChange={setShowDialogNovo}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Novo Plano</DialogTitle>
            <DialogDescription>
              Crie um novo modelo de plano para oferecer aos usuários.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome do Plano *</Label>
              <Input
                id="nome"
                value={formPlano.nome}
                onChange={(e) => setFormPlano({...formPlano, nome: e.target.value})}
                placeholder="Ex: Plano Alimentar Básico"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tipo">Tipo de Plano *</Label>
              <Select 
                value={formPlano.tipo} 
                onValueChange={(valor) => setFormPlano({...formPlano, tipo: valor as 'nutricional' | 'treino' | 'combo'})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nutricional">Nutricional</SelectItem>
                  <SelectItem value="treino">Treino</SelectItem>
                  <SelectItem value="combo">Combo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formPlano.descricao || ''}
                onChange={(e) => setFormPlano({...formPlano, descricao: e.target.value})}
                placeholder="Descrição detalhada do plano"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="imagem_url">URL da Imagem</Label>
              <Input
                id="imagem_url"
                value={formPlano.imagem_url || ''}
                onChange={(e) => setFormPlano({...formPlano, imagem_url: e.target.value})}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={formPlano.ativo}
                onCheckedChange={(checked) => setFormPlano({...formPlano, ativo: checked})}
              />
              <Label htmlFor="ativo">Plano ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialogNovo(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={salvarPlano} 
              disabled={isSubmitting || !formPlano.nome || !formPlano.tipo}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : 'Salvar Plano'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 