import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserPurchaseStatus } from '@/integrations/supabase/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  User,
  Phone,
  Mail, 
  FileText,
  Package,
  CheckSquare,
  ShoppingCart,
  ShoppingBag,
  FileCheck2,
  FileX2
} from 'lucide-react';

interface UserFormStatus {
  alimentar_completed: boolean;
  treino_completed: boolean;
}

const UserProfile: React.FC = () => {
  const { isAuthenticated, user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [formStatus, setFormStatus] = useState<UserFormStatus>({ 
    alimentar_completed: false, 
    treino_completed: false 
  });
  const [purchaseStatus, setPurchaseStatus] = useState<UserPurchaseStatus | null>(null);
  const [editing, setEditing] = useState(false);
  const [userData, setUserData] = useState({
    nome: '',
    telefone: '',
    email: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchUserData();
    fetchFormStatus();
    fetchPurchaseStatus();
  }, [isAuthenticated, user?.id]);

  const fetchUserData = async () => {
    if (!user) return;
    
    setUserData({
      nome: user.nome || '',
      telefone: user.telefone || '',
      email: user.email || ''
    });
  };

  const fetchFormStatus = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('user_status')
        .select('alimentar_completed, treino_completed')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormStatus(data);
      }
    } catch (error) {
      console.error('Erro ao buscar status dos formulários:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseStatus = async () => {
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
      toast({
        title: "Erro",
        description: "Não foi possível carregar o status das suas compras",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData({
      ...userData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          nome: userData.nome,
          telefone: userData.telefone
        })
        .eq('id', user.id);

      if (error) throw error;

      updateUser({
        ...user,
        nome: userData.nome,
        telefone: userData.telefone
      });

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso",
      });
      
      setEditing(false);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar seu perfil",
        variant: "destructive",
      });
    }
  };

  const renderUserInfo = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      );
    }

    if (editing) {
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              name="nome"
              value={userData.nome}
              onChange={handleInputChange}
              placeholder="Seu nome completo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              name="telefone"
              value={userData.telefone}
              onChange={handleInputChange}
              placeholder="Seu telefone"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              value={userData.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado</p>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar alterações
            </Button>
          </div>
        </form>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-start space-x-4">
          <User className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">Nome</p>
            <p className="text-sm text-muted-foreground">
              {userData.nome || 'Não informado'}
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-4">
          <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">Telefone</p>
            <p className="text-sm text-muted-foreground">
              {userData.telefone || 'Não informado'}
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-4">
          <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">E-mail</p>
            <p className="text-sm text-muted-foreground">{userData.email}</p>
          </div>
        </div>
        <div className="pt-2">
          <Button onClick={() => setEditing(true)}>
            Editar informações
          </Button>
        </div>
      </div>
    );
  };

  const renderFormProgress = () => {
    if (!formStatus) return null;
    
    const completed = (formStatus.alimentar_completed ? 1 : 0) + 
                     (formStatus.treino_completed ? 1 : 0);
    const total = 2; // Total de formulários possíveis
    const percentage = Math.round((completed / total) * 100);
    
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso dos formulários</span>
            <span>{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded-full ${formStatus.alimentar_completed ? 'bg-green-500' : 'bg-amber-500'}`}></div>
              <span className="text-sm">Formulário Alimentar</span>
            </div>
            <span className="text-sm font-medium">
              {formStatus.alimentar_completed ? 'Completo' : 'Pendente'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded-full ${formStatus.treino_completed ? 'bg-green-500' : 'bg-amber-500'}`}></div>
              <span className="text-sm">Formulário de Treino</span>
            </div>
            <span className="text-sm font-medium">
              {formStatus.treino_completed ? 'Completo' : 'Pendente'}
            </span>
          </div>
        </div>
        
        {(!formStatus.alimentar_completed || !formStatus.treino_completed) && (
          <div className="pt-2">
            {!formStatus.alimentar_completed && (
              <Button 
                className="w-full mb-2" 
                onClick={() => navigate('/formulario-alimentar')}
              >
                Preencher Formulário Alimentar
              </Button>
            )}
            {!formStatus.treino_completed && (
              <Button 
                className="w-full" 
                onClick={() => navigate('/formulario-treino')}
              >
                Preencher Formulário de Treino
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderPurchaseStats = () => {
    if (!purchaseStatus) return null;
    
    const totalForms = purchaseStatus.completed_forms + purchaseStatus.pending_forms;
    const formCompletionPercentage = totalForms > 0 
      ? Math.round((purchaseStatus.completed_forms / totalForms) * 100) 
      : 0;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Compras
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
                <Package className="h-4 w-4" />
                Planos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {purchaseStatus.ready_plans + purchaseStatus.active_plans}
                <span className="text-sm text-muted-foreground"> / {purchaseStatus.ready_plans + purchaseStatus.active_plans + purchaseStatus.awaiting_plans}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Planos disponíveis
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Status dos formulários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso de preenchimento</span>
              <span>{formCompletionPercentage}%</span>
            </div>
            <Progress value={formCompletionPercentage} className="h-2" />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Completados</p>
                  <p className="text-xl font-bold">{purchaseStatus.completed_forms}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileX2 className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">Pendentes</p>
                  <p className="text-xl font-bold">{purchaseStatus.pending_forms}</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/historico-compras')}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Ver histórico de compras
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e acompanhe seu progresso
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Voltar para o Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex flex-col items-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarFallback className="text-2xl">
                    {userData.nome ? userData.nome.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-center">{userData.nome || 'Usuário'}</CardTitle>
                <CardDescription className="text-center">
                  {userData.email}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="info">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="forms">Formulários</TabsTrigger>
                </TabsList>
                <TabsContent value="info" className="pt-4">
                  {renderUserInfo()}
                </TabsContent>
                <TabsContent value="forms" className="pt-4">
                  {renderFormProgress()}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Painel de Progresso</CardTitle>
              <CardDescription>
                Acompanhe seu progresso e o status dos seus planos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : (
                renderPurchaseStats()
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 