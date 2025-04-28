import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clipboard, ChevronLeft, Calendar, Clock, Users, AlertCircle, CheckCircle2, BarChart3 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/stores/authStore';
import { Plano } from '@/hooks/use-planos';
import DashboardLayout from '@/components/DashboardLayout';
import AppCard from '@/components/AppCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import LoadingPlanos from '@/components/LoadingPlanos';

const PlanoDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [plano, setPlano] = useState<Plano | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlanoDetalhe = async () => {
      if (!id || !user?.id) return;

      try {
        setIsLoading(true);
        setError(null);
        
        // Buscar o plano específico usando a nova view
        const { data, error } = await supabase
          .from('v_usuario_planos')
          .select('*')
          .eq('usuario_id', user.id)
          .eq('plano_id', id)
          .single();
          
        if (error) {
          throw error;
        }

        if (!data) {
          setError('Plano não encontrado');
          return;
        }

        // Verificar se plano_dados existe
        if (!data.plano_dados) {
          setError('Detalhes do plano não encontrados');
          return;
        }

        // Calcular progresso do plano
        let progress = 0;
        let diasRestantes = 0;
        
        if (data.data_inicio && data.data_termino) {
          const dataInicio = new Date(data.data_inicio);
          const dataTermino = new Date(data.data_termino);
          const hoje = new Date();
          
          const diasTotal = Math.ceil((dataTermino.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
          const diasPassados = Math.ceil((hoje.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
          diasRestantes = Math.max(0, diasTotal - diasPassados);
          
          // Limitar o progresso entre 0 e 100%
          progress = Math.max(0, Math.min(100, Math.round((diasPassados / diasTotal) * 100)));
        }
        
        // Formatar o plano
        const planoFormatado: Plano = {
          id: data.plano_id,
          nome: data.plano_dados.name,
          descricao: data.plano_dados.description || '',
          tipo: data.plano_dados.type,
          status: data.status,
          data_inicio: data.data_inicio,
          data_termino: data.data_termino,
          imagem_url: data.plano_dados.thumbnail_url,
          progress,
          diasRestantes
        };
        
        setPlano(planoFormatado);
      } catch (error: any) {
        console.error('Erro ao buscar detalhes do plano:', error);
        setError(error.message || 'Erro ao carregar detalhes do plano');
        toast({
          title: 'Erro ao carregar detalhes',
          description: 'Não foi possível carregar os detalhes do plano. Tente novamente mais tarde.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlanoDetalhe();
  }, [id, user?.id]);

  // Renderizar ícone de status
  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'ativo':
        return <CheckCircle2 className="h-5 w-5 text-primary-500" />;
      case 'pendente':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'expirado':
        return <AlertCircle className="h-5 w-5 text-accent-500" />;
      case 'cancelado':
        return <AlertCircle className="h-5 w-5 text-neutral-500" />;
      default:
        return null;
    }
  };

  // Obter variante do badge
  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'ativo':
        return 'success';
      case 'pendente':
        return 'warning';
      case 'expirado':
        return 'error';
      case 'cancelado':
        return 'default';
      default:
        return 'default';
    }
  };

  // Formatar data
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout 
        title="Detalhes do Plano" 
        subtitle="Visualize informações detalhadas do seu plano"
        icon={<Clipboard className="h-6 w-6" />}
        actions={
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        }
      >
        <LoadingPlanos qtd={1} />
      </DashboardLayout>
    );
  }

  if (error || !plano) {
    return (
      <DashboardLayout 
        title="Detalhes do Plano" 
        subtitle="Visualize informações detalhadas do seu plano"
        icon={<Clipboard className="h-6 w-6" />}
        actions={
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        }
      >
        <AppCard>
          <div className="text-center py-8">
            <AlertCircle className="h-16 w-16 text-accent-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-primary-800 mb-2">
              {error || 'Plano não encontrado'}
            </h3>
            <p className="text-primary-600 mb-6">
              Não foi possível encontrar o plano solicitado. Verifique se o endereço está correto.
            </p>
            <Button 
              onClick={() => navigate('/meu-plano')}
            >
              Ver meus planos
            </Button>
          </div>
        </AppCard>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Detalhes do Plano" 
      subtitle="Visualize informações detalhadas do seu plano"
      icon={<Clipboard className="h-6 w-6" />}
      actions={
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações do plano */}
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <AppCard>
            <div className="relative h-60 md:h-80 rounded-lg bg-gradient-to-r from-primary-500 to-primary-700 mb-6 overflow-hidden">
              {plano.imagem_url ? (
                <img 
                  src={plano.imagem_url} 
                  alt={plano.nome} 
                  className="w-full h-full object-cover opacity-90"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  {plano.tipo.toLowerCase().includes('nutri') ? (
                    <BarChart3 className="h-24 w-24 text-white/80" />
                  ) : (
                    <Calendar className="h-24 w-24 text-white/80" />
                  )}
                </div>
              )}
              <div className="absolute top-4 right-4">
                <Badge 
                  variant={getStatusVariant(plano.status)}
                  className="font-medium px-4 py-1 text-sm shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    {renderStatusIcon(plano.status)}
                    <span className="capitalize">{plano.status}</span>
                  </span>
                </Badge>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{plano.nome}</h1>
                <p className="text-white/90">{plano.tipo}</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-primary-800 mb-3">Descrição</h2>
                <p className="text-primary-600">
                  {plano.descricao}
                </p>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold text-primary-800 mb-3">Progresso</h2>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-primary-600">
                    <span>Completado</span>
                    <span className="font-medium">{plano.progress}%</span>
                  </div>
                  
                  <div className="h-3 w-full bg-primary-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${plano.progress}%` }}
                      transition={{ duration: 1.5, delay: 0.3 }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs text-primary-500 mt-1">
                    <span>Início: {formatarData(plano.data_inicio)}</span>
                    <span>Término: {formatarData(plano.data_termino)}</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-primary-100 pt-6">
                <h2 className="text-xl font-semibold text-primary-800 mb-4">Conteúdo do Plano</h2>
                
                {plano.tipo.toLowerCase().includes('nutri') ? (
                  <div className="space-y-4">
                    <p className="text-primary-600">
                      O plano nutricional completo está disponível na área de nutrição. Clique no botão abaixo para acessar.
                    </p>
                    <Button 
                      className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700"
                      onClick={() => navigate('/nutricao')}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Visualizar Plano Nutricional
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-primary-600">
                      O plano de treino completo está disponível na área de treinos. Clique no botão abaixo para acessar.
                    </p>
                    <Button 
                      className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700"
                      onClick={() => navigate('/treinos')}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Visualizar Plano de Treino
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </AppCard>
        </motion.div>
        
        {/* Sidebar lateral com informações adicionais */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="space-y-6">
            {/* Card de resumo */}
            <AppCard
              title="Resumo do Plano"
              variant="subtle"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3 py-2">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-primary-600">Duração</p>
                    <p className="font-medium text-primary-900">
                      {Math.ceil((new Date(plano.data_termino).getTime() - new Date(plano.data_inicio).getTime()) / (1000 * 60 * 60 * 24))} dias
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 py-2">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-primary-600">Dias Restantes</p>
                    <p className="font-medium text-primary-900">
                      {plano.diasRestantes} dias
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 py-2">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-primary-600">Tipo de Plano</p>
                    <p className="font-medium text-primary-900">
                      {plano.tipo}
                    </p>
                  </div>
                </div>
              </div>
            </AppCard>
            
            {/* Card de suporte */}
            <AppCard
              title="Precisa de Ajuda?"
              variant="default"
            >
              <div className="space-y-4">
                <p className="text-sm text-primary-600">
                  Se você tiver dúvidas sobre seu plano ou precisar de suporte, entre em contato com nossa equipe.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/suporte')}
                >
                  Contatar Suporte
                </Button>
              </div>
            </AppCard>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default PlanoDetalhe; 