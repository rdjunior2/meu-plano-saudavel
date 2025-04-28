import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { uploadAvatar, removeOldAvatars } from '@/services/storage';
import SupabaseSetupInstructions from '@/components/SupabaseSetupInstructions';
import { formatPhoneNumber, formattedPhoneToDigitsOnly } from '@/utils/format';

interface UserFormStatus {
  alimentar_completed: boolean;
  treino_completed: boolean;
}

// Componente para Avatar com upload
const AvatarUpload = ({ 
  userData, 
  setUserData, 
  user, 
  editing, 
  avatarColumnExists, 
  missingColumns, 
  setShowSetupInstructions, 
  uploading, 
  setUploading 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleAvatarClick = () => {
    if (editing && fileInputRef.current && avatarColumnExists) {
      fileInputRef.current.click();
    } else if (editing && (missingColumns.length > 0) && user?.is_admin) {
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
      
      // Atualizar o avatar_url no banco de dados
      const { error: profilesError, data } = await supabase
        .from('profiles')
        .update({ avatar_url: result.url })
        .eq('id', user.id)
        .select();
        
      if (profilesError) {
        console.log('Erro ao atualizar avatar_url na tabela profiles, tentando tabela perfis:', profilesError);
        
        const { error: perfisError, data: perfisData } = await supabase
          .from('perfis')
          .update({ avatar_url: result.url })
          .eq('id', user.id)
          .select();
          
        if (perfisError) {
          console.error('Erro ao atualizar avatar_url em ambas as tabelas:', perfisError);
          throw new Error('Não foi possível salvar o avatar no banco de dados');
        }
        
        console.log('Avatar atualizado com sucesso no banco (tabela perfis):', perfisData);
      } else {
        console.log('Avatar atualizado com sucesso no banco (tabela profiles):', data);
      }
      
      // Remover avatares antigos do storage
      const cleanupResult = await removeOldAvatars(user.id, result.url);
      if (!cleanupResult.success) {
        console.warn('Aviso: Não foi possível remover avatares antigos:', cleanupResult.error);
      }
      
      // Atualizar o store de autenticação
      const { updateUser } = useAuthStore.getState();
      updateUser({
        ...user,
        avatar_url: result.url
      });
      
      toast({
        title: "Avatar atualizado",
        description: "Sua foto de perfil foi atualizada com sucesso no banco de dados",
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

  return (
    <div className="relative group">
      <Avatar 
        className="h-20 w-20 md:h-24 md:w-24 border-4 border-emerald-100 bg-emerald-50 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300"
        onClick={handleAvatarClick}
      >
        <AvatarImage src={userData.avatar_url || ''} alt={userData.nome} />
        <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-green-500 text-white text-lg md:text-xl font-medium">
          {userData.nome ? userData.nome.charAt(0).toUpperCase() : 'U'}
        </AvatarFallback>
        {editing && (
          <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Camera className="h-6 w-6 md:h-8 md:w-8 text-white" />
          </div>
        )}
      </Avatar>
      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden" 
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  );
};

// Componente interno para exibir o formulário de edição do perfil
const ProfileEditForm: React.FC<{
  userData: {
    nome: string;
    telefone: string;
  };
  setUserData: React.Dispatch<React.SetStateAction<{
    nome: string;
    telefone: string;
    email: string;
    avatar_url: string;
  }>>;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  setEditing: React.Dispatch<React.SetStateAction<boolean>>;
  isSubmitting: boolean;
}> = ({ userData, setUserData, handleSubmit, setEditing, isSubmitting }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'telefone') {
      // Aplicar formatação em tempo real para o campo de telefone
      const digitsOnly = value.replace(/\D/g, '');
      const formattedValue = formatPhoneNumber(digitsOnly);
      
      setUserData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else {
      setUserData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome</Label>
        <Input
          id="nome"
          name="nome"
          type="text"
          value={userData.nome}
          onChange={handleInputChange}
          placeholder="Seu nome"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="telefone">Telefone</Label>
        <Input
          id="telefone"
          name="telefone"
          type="tel"
          value={userData.telefone}
          onChange={handleInputChange}
          placeholder="(00) 00000-0000"
        />
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setEditing(false)}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
        >
          {isSubmitting ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
};

// Componente interno para exibir os dados do perfil
const ProfileInfo: React.FC<{
  userData: {
    nome: string;
    telefone: string;
    email: string;
  };
  setEditing: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ userData, setEditing }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <User size={20} className="text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Nome</p>
          <p className="text-sm text-muted-foreground">{userData.nome || "-"}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Phone size={20} className="text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Telefone</p>
          <p className="text-sm text-muted-foreground">{userData.telefone || "-"}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Mail size={20} className="text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Email</p>
          <p className="text-sm text-muted-foreground">{userData.email || "-"}</p>
        </div>
      </div>
      <div className="pt-4">
        <Button 
          onClick={() => setEditing(true)} 
          variant="outline" 
          className="w-full"
        >
          <Pencil size={16} className="mr-2" />
          Editar informações
        </Button>
      </div>
    </div>
  );
};

// Componente principal do UserProfile
const UserProfile: React.FC = () => {
  const { isAuthenticated, user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  
  // Obter a tab ativa da URL
  const searchParams = new URLSearchParams(location.search);
  const tabFromUrl = searchParams.get('tab');
  const defaultTab = tabFromUrl === 'forms' || tabFromUrl === 'compras' ? tabFromUrl : 'perfil';

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
    
    try {
      // Busca dados da tabela profiles primeiro
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      // Se houver erro, tenta na tabela perfis
      if (profilesError) {
        console.log('Erro ao buscar na tabela profiles, tentando tabela perfis:', profilesError);
        
        const { data: perfisData, error: perfisError } = await supabase
          .from('perfis')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (perfisError) {
          console.error('Erro ao buscar dados em ambas as tabelas:', perfisError);
          // Continua usando os dados do store
        } else if (perfisData) {
          // Usa os dados da tabela perfis
          setUserData({
            nome: perfisData.nome || user.nome || '',
            telefone: perfisData.telefone || user.telefone || '',
            email: perfisData.email || user.email || '',
            avatar_url: perfisData.avatar_url || user.avatar_url || ''
          });
          console.log('Dados carregados da tabela perfis:', perfisData);
        }
      } else if (profilesData) {
        // Usa os dados da tabela profiles
        setUserData({
          nome: profilesData.nome || user.nome || '',
          telefone: profilesData.telefone || user.telefone || '',
          email: profilesData.email || user.email || '',
          avatar_url: profilesData.avatar_url || user.avatar_url || ''
        });
        console.log('Dados carregados da tabela profiles:', profilesData);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
    } finally {
      // Se for falhar completamente, usa os dados do store de qualquer forma
      if (!userData.nome && !userData.telefone) {
        setUserData({
          nome: user.nome || '',
          telefone: user.telefone || '',
          email: user.email || '',
          avatar_url: user.avatar_url || ''
        });
      }
      setLoading(false);
    }
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      // Validar nome
      if (userData.nome.trim() === '') {
        toast({
          title: "Nome obrigatório",
          description: "Por favor, informe seu nome.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Formatar o telefone para armazenamento (apenas dígitos)
      const telefoneFormatado = userData.telefone ? formattedPhoneToDigitsOnly(userData.telefone) : '';
      
      const updateData: { [key: string]: string } = {};
      
      // Adiciona nome apenas se a coluna existir
      if (nomeColumnExists) {
        updateData.nome = userData.nome.trim();
      }
      
      // Adiciona telefone (já formatado)
      updateData.telefone = telefoneFormatado;
      
      console.log('Tentando atualizar perfil com os dados:', updateData);
      console.log('ID do usuário:', user.id);
      
      // Verifica se está usando a tabela correta (profiles vs perfis)
      let error = null;
      
      // Primeira tentativa na tabela 'profiles'
      const { error: profilesError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
      
      // Se ocorrer erro, tenta na tabela 'perfis'
      if (profilesError) {
        console.log('Erro ao atualizar na tabela profiles, tentando tabela perfis:', profilesError);
        
        const { error: perfisError } = await supabase
          .from('perfis')
          .update(updateData)
          .eq('id', user.id);
        
        error = perfisError;
      }
      
      if (error) {
        console.error('Erro ao atualizar perfil:', error);
        toast({
          title: "Erro ao atualizar",
          description: "Não foi possível atualizar seu perfil. Tente novamente.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Atualiza o estado global do usuário
      await updateUser({
        ...user,
        nome: userData.nome.trim(),
        telefone: telefoneFormatado,
        avatar_url: userData.avatar_url
      });
      
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
      
      setEditing(false);
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao processar sua solicitação.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Atualizar a URL quando a tab mudar
  const handleTabChange = (tab: string) => {
    const newSearchParams = new URLSearchParams(location.search);
    newSearchParams.set('tab', tab);
    navigate(`${location.pathname}?${newSearchParams.toString()}`, { replace: true });
  };

  const renderUserInfo = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center md:items-start">
            <Skeleton className="h-20 w-20 md:h-24 md:w-24 rounded-full" />
            <div className="space-y-2 flex-1 w-full text-center md:text-left">
              <Skeleton className="h-6 w-48 mx-auto md:mx-0" />
              <Skeleton className="h-4 w-64 mx-auto md:mx-0" />
              <Skeleton className="h-4 w-32 mx-auto md:mx-0" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <AvatarUpload 
            userData={userData}
            setUserData={setUserData}
            user={user}
            editing={editing}
            avatarColumnExists={avatarColumnExists}
            missingColumns={missingColumns}
            setShowSetupInstructions={setShowSetupInstructions}
            uploading={uploading}
            setUploading={setUploading}
          />
          
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-emerald-800 mb-1">
              {userData.nome || 'Seu Nome'}
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-3 text-emerald-600">
              <div className="flex items-center justify-center sm:justify-start gap-1">
                <Mail className="h-4 w-4" />
                <span className="text-sm">{userData.email}</span>
              </div>
              {userData.telefone && (
                <div className="flex items-center justify-center sm:justify-start gap-1">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{userData.telefone}</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-3.5 w-3.5 mr-2" />
                Editar Perfil
              </Button>
              
              {user?.is_admin && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white border-purple-200 text-purple-700 hover:bg-purple-50"
                  onClick={() => navigate('/admin')}
                >
                  <Settings className="h-3.5 w-3.5 mr-2" />
                  Painel Admin
                </Button>
              )}
            </div>
          </div>
        </div>

        {editing && (
          <ProfileEditForm 
            userData={userData}
            setUserData={setUserData}
            handleSubmit={handleSubmit}
            setEditing={setEditing}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    );
  };

  const renderFormProgress = () => {
    if (loading || !purchaseStatus) {
      return (
        <Card className="border-emerald-100">
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>
      );
    }

    const formProgressPercentage = () => {
      let completed = 0;
      if (formStatus.alimentar_completed) completed++;
      if (formStatus.treino_completed) completed++;
      
      const total = purchaseStatus.total_purchases * 2; // 2 forms per purchase (alimentar + treino)
      return total > 0 ? Math.round((completed / total) * 100) : 0;
    };

    return (
      <Card className="border-emerald-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            Status dos Formulários
          </CardTitle>
          <CardDescription>
            Acompanhe o preenchimento dos formulários necessários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="flex justify-between items-center mb-1 text-sm">
              <span className="text-emerald-700">Progresso geral</span>
              <span className="font-medium text-emerald-800">{formProgressPercentage()}%</span>
            </div>
            <Progress 
              value={formProgressPercentage()} 
              className="h-2 bg-emerald-100"
            />
          </div>
          
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            <div className={`rounded-lg border p-3 ${formStatus.alimentar_completed ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/50 border-amber-200'}`}>
              <div className="flex items-start gap-3">
                {formStatus.alimentar_completed ? (
                  <FileCheck2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                ) : (
                  <FileX2 className="h-5 w-5 text-amber-600 mt-0.5" />
                )}
                <div>
                  <h4 className={`font-medium ${formStatus.alimentar_completed ? 'text-emerald-800' : 'text-amber-800'}`}>
                    Formulário Alimentar
                  </h4>
                  <p className={`text-sm ${formStatus.alimentar_completed ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {formStatus.alimentar_completed 
                      ? "Preenchido com sucesso" 
                      : "Pendente de preenchimento"}
                  </p>
                </div>
              </div>
              {!formStatus.alimentar_completed && (
                <div className="mt-2 ml-8">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs h-8 bg-white border-amber-200 text-amber-700 hover:bg-amber-50"
                    onClick={() => navigate('/formulario-alimentar')}
                  >
                    Preencher agora
                  </Button>
                </div>
              )}
            </div>
            
            <div className={`rounded-lg border p-3 ${formStatus.treino_completed ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/50 border-amber-200'}`}>
              <div className="flex items-start gap-3">
                {formStatus.treino_completed ? (
                  <FileCheck2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                ) : (
                  <FileX2 className="h-5 w-5 text-amber-600 mt-0.5" />
                )}
                <div>
                  <h4 className={`font-medium ${formStatus.treino_completed ? 'text-emerald-800' : 'text-amber-800'}`}>
                    Formulário de Treino
                  </h4>
                  <p className={`text-sm ${formStatus.treino_completed ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {formStatus.treino_completed 
                      ? "Preenchido com sucesso" 
                      : "Pendente de preenchimento"}
                  </p>
                </div>
              </div>
              {!formStatus.treino_completed && (
                <div className="mt-2 ml-8">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs h-8 bg-white border-amber-200 text-amber-700 hover:bg-amber-50"
                    onClick={() => navigate('/formulario-treino')}
                  >
                    Preencher agora
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPurchaseStats = () => {
    if (loading || !purchaseStatus) {
      return (
        <Card className="border-emerald-100">
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-emerald-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-emerald-600" />
            Resumo de Compras
          </CardTitle>
          <CardDescription>
            Suas compras e planos ativos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50/50 rounded-lg border border-emerald-100 p-4 text-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                  <ShoppingCart className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="text-xl md:text-2xl font-bold text-emerald-800 mb-1">
                  {purchaseStatus.total_purchases}
                </div>
                <div className="text-sm text-emerald-600">
                  Total de compras
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50/50 rounded-lg border border-blue-100 p-4 text-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-xl md:text-2xl font-bold text-blue-800 mb-1">
                  {purchaseStatus.awaiting_plans}
                </div>
                <div className="text-sm text-blue-600">
                  Planos em preparação
                </div>
              </div>
            </div>
            
            <div className="bg-green-50/50 rounded-lg border border-green-100 p-4 text-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <CheckSquare className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-xl md:text-2xl font-bold text-green-800 mb-1">
                  {purchaseStatus.ready_plans}
                </div>
                <div className="text-sm text-green-600">
                  Planos ativos
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={() => navigate('/historico-compras')}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Ver histórico completo
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (showSetupInstructions && user?.is_admin) {
    return (
      <SupabaseSetupInstructions 
        missingColumns={missingColumns}
        onComplete={() => setShowSetupInstructions(false)}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-6">
      <div className="max-w-5xl mx-auto">
        <Tabs defaultValue={defaultTab} className="w-full space-y-6" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="perfil" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
              <User className="h-4 w-4 mr-2" />
              <span>Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="forms" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Formulários</span>
              <span className="sm:hidden">Forms</span>
            </TabsTrigger>
            <TabsTrigger value="compras" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
              <ShoppingBag className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Compras</span>
              <span className="sm:hidden">Compras</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="perfil" className="space-y-6">
            <Card className="border-emerald-100 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-emerald-600" />
                  Meu Perfil
                </CardTitle>
                <CardDescription>
                  Gerencie suas informações pessoais
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderUserInfo()}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="forms" className="space-y-6">
            {renderFormProgress()}
          </TabsContent>
          
          <TabsContent value="compras" className="space-y-6">
            {renderPurchaseStats()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfile; 