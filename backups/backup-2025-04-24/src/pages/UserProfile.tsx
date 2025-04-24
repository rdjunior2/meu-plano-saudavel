import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabaseClient';
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
import { PurchaseStatus as UserPurchaseStatus } from '@/integrations/supabase/types';
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
  FileX2,
  Upload,
  Camera,
  Pencil,
  Settings
} from 'lucide-react';
import { uploadAvatar } from '@/services/storage';
import SupabaseSetupInstructions from '@/components/SupabaseSetupInstructions';

interface UserFormStatus {
  alimentar_completed: boolean;
  treino_completed: boolean;
}

const UserProfile: React.FC = () => {
  const { isAuthenticated, user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formStatus, setFormStatus] = useState<UserFormStatus>({ 
    alimentar_completed: false, 
    treino_completed: false 
  });
  const [purchaseStatus, setPurchaseStatus] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [userData, setUserData] = useState({
    nome: '',
    telefone: '',
    email: '',
    avatar_url: ''
  });
  
  // Estado para controlar o diálogo de instruções
  const [showSetupInstructions, setShowSetupInstructions] = useState(false);
  const [avatarColumnExists, setAvatarColumnExists] = useState(true);
  const [nomeColumnExists, setNomeColumnExists] = useState(true);
  const [missingColumns, setMissingColumns] = useState<string[]>([]);

  // Verificar se as colunas necessárias existem
  useEffect(() => {
    const checkRequiredColumns = async () => {
      if (!user?.id) return;
      
      try {
        console.log('Verificando colunas necessárias...');
        const columnsToCheck = ['avatar_url', 'nome'];
        const missingCols: string[] = [];
        
        // Primeiro, tente um simples update com valor nulo para verificar se as colunas existem
        // Vamos verificar a coluna 'nome'
        try {
          const { error: nomeError } = await supabase
            .from('profiles')
            .update({ nome: null })
            .eq('id', user.id)
            .select('nome');
            
          if (nomeError && nomeError.message.includes('nome')) {
            console.error('Coluna nome não encontrada');
            setNomeColumnExists(false);
            missingCols.push('nome');
          }
        } catch (error) {
          console.error('Erro ao verificar coluna nome:', error);
        }
        
        // Verificando a coluna 'avatar_url'
        try {
          const { error: avatarError } = await supabase
            .from('profiles')
            .update({ avatar_url: null })
            .eq('id', user.id)
            .select('avatar_url');
            
          if (avatarError && avatarError.message.includes('avatar_url')) {
            console.error('Coluna avatar_url não encontrada');
            setAvatarColumnExists(false);
            missingCols.push('avatar_url');
          }
        } catch (error) {
          console.error('Erro ao verificar coluna avatar_url:', error);
        }
        
        setMissingColumns(missingCols);
        
        // Se alguma coluna estiver faltando e o usuário for admin, mostramos o diálogo
        if (missingCols.length > 0) {
          if (user?.is_admin) {
            setShowSetupInstructions(true);
          } else {
            toast({
              title: "Aviso",
              description: "O sistema está sendo atualizado. Algumas funcionalidades podem estar indisponíveis temporariamente.",
              duration: 5000,
            });
          }
        }
      } catch (error) {
        console.error('Erro ao verificar colunas necessárias:', error);
      }
    };
    
    if (user?.id) {
      checkRequiredColumns();
    }
  }, [user?.id, user?.is_admin, toast]);

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
      email: user.email || '',
      avatar_url: user.avatar_url || ''
    });
    setLoading(false);
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
      // Validar os dados básicos antes de enviar
      if (!userData.nome.trim() && nomeColumnExists) {
        throw new Error('O nome não pode estar vazio');
      }

      if (!userData.telefone.trim()) {
        throw new Error('O telefone não pode estar vazio');
      }

      // Remover qualquer espaço ou caractere especial do telefone
      const telefoneFormatado = userData.telefone.replace(/\D/g, '');
      
      // Preparar os dados para atualização
      const updateData: any = {
        telefone: telefoneFormatado
      };
      
      // Adicionar nome apenas se a coluna existir
      if (nomeColumnExists) {
        updateData.nome = userData.nome.trim();
      }
      
      // Adicionar avatar_url apenas se a coluna existir
      if (avatarColumnExists && userData.avatar_url) {
        updateData.avatar_url = userData.avatar_url;
      }
      
      // Tente atualizar com os campos disponíveis
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('Erro na atualização do perfil:', error);
        throw new Error(error.message || 'Erro ao atualizar perfil no banco de dados');
      }

      // Atualizar o estado global do usuário com todos os dados
      await updateUser({
        ...user,
        nome: userData.nome.trim(),
        telefone: telefoneFormatado,
        avatar_url: userData.avatar_url // Mantemos no estado local mesmo se não existe no banco ainda
      });

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso",
      });
      
      setEditing(false);
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar seu perfil",
        variant: "destructive",
      });
    }
  };

  const handleAvatarClick = () => {
    // Permitir clique apenas se a coluna existir ou se estiver em modo de edição
    if (editing && fileInputRef.current && avatarColumnExists) {
      fileInputRef.current.click();
    } else if (editing && (missingColumns.length > 0) && user?.is_admin) {
      // Se for admin e alguma coluna não existir, mostrar instruções
      setShowSetupInstructions(true);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (!files || files.length === 0 || !user?.id || !avatarColumnExists) {
      return;
    }
    
    const file = files[0];
    
    try {
      setUploading(true);
      
      const result = await uploadAvatar(user.id, file);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Atualizar o avatar no estado local
      setUserData({
        ...userData,
        avatar_url: result.url
      });
      
      // Tente atualizar apenas o avatar_url
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            avatar_url: result.url
          })
          .eq('id', user.id);
          
        if (error) {
          console.error('Erro ao atualizar avatar_url no banco:', error);
          // Continuar mesmo com erro, pois já temos o arquivo armazenado
        }
      } catch (updateError) {
        console.error('Erro ao tentar atualizar avatar_url:', updateError);
        // Continuar mesmo com erro, pois já temos o arquivo armazenado
      }
      
      // Atualizar o store de autenticação
      updateUser({
        ...user,
        avatar_url: result.url
      });
      
      toast({
        title: "Avatar atualizado",
        description: "Sua foto de perfil foi atualizada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao fazer upload do avatar:', error);
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Não foi possível fazer o upload da imagem",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Limpar o input de arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
            <Button type="submit" disabled={uploading}>
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
            <p className="text-sm text-muted-foreground">
              {userData.email || 'Não informado'}
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setEditing(true)}
            className="mt-4"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Editar Perfil
          </Button>
        </div>
      </div>
    );
  };

  const renderFormProgress = () => {
    if (!formStatus) return null;
    
    const completed = (formStatus.alimentar_completed ? 1 : 0) + 
                     (formStatus.treino_completed ? 1 : 0);
    const total = 2;
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
      {/* Diálogo de instruções para configuração do Supabase */}
      <SupabaseSetupInstructions 
        open={showSetupInstructions} 
        onOpenChange={setShowSetupInstructions} 
        missingColumns={missingColumns}
      />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e acompanhe seu progresso
          </p>
        </div>
        <div className="flex gap-2">
          {(missingColumns.length > 0) && user?.is_admin && (
            <Button 
              variant="outline" 
              onClick={() => setShowSetupInstructions(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurar banco
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Voltar para o Dashboard
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <Avatar className={`h-24 w-24 ${editing ? 'cursor-pointer' : ''}`} onClick={handleAvatarClick}>
                    <AvatarImage src={userData.avatar_url || ''} alt={userData.nome} />
                    <AvatarFallback className="bg-primary text-2xl">
                      {userData.nome ? userData.nome.charAt(0).toUpperCase() : 'U'}
                    </AvatarFallback>
                    {editing && (
                      <div className="absolute bottom-0 right-0 bg-primary text-white p-1 rounded-full cursor-pointer">
                        {uploading ? (
                          <span className="animate-spin">
                            <Upload className="h-4 w-4" />
                          </span>
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </div>
                    )}
                  </Avatar>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    disabled={uploading || !editing}
                  />
                </div>
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