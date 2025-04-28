import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

// Interface para os planos
export interface Plano {
  id: string;
  nome: string;
  descricao: string;
  tipo: string;
  status: 'ativo' | 'pendente' | 'expirado' | 'cancelado';
  data_inicio: string;
  data_termino: string;
  imagem_url?: string;
  progress?: number;
  diasRestantes?: number;
}

// Interface para os dados da API
export interface PlanoData {
  id: string;
  plano_id: string;
  status: 'ativo' | 'pendente' | 'expirado' | 'cancelado';
  data_inicio: string;
  data_termino: string;
  plano_dados: {
    id: string;
    name: string;
    description: string;
    type: string;
    thumbnail_url?: string;
  };
}

export const usePlanos = () => {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const calcularProgresso = (dataInicio: string, dataTermino: string) => {
    const inicio = new Date(dataInicio);
    const termino = new Date(dataTermino);
    const hoje = new Date();
    
    const diasTotal = Math.ceil((termino.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
    const diasPassados = Math.ceil((hoje.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
    
    // Limitar o progresso entre 0 e 100%
    return Math.max(0, Math.min(100, Math.round((diasPassados / diasTotal) * 100)));
  };

  const fetchPlanos = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Buscar planos associados ao usuário usando a nova view
      const { data, error } = await supabase
        .from('v_usuario_planos')
        .select('*')
        .eq('usuario_id', user.id);
        
      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        setPlanos([]);
        return;
      }

      // Transformar os dados para o formato necessário
      const planosFormatados = data.map((item: any) => {
        // Só processar se tiver data_inicio e data_termino
        let progress = 0;
        let diasRestantes = 0;
        
        if (item.data_inicio && item.data_termino) {
          const dataInicio = new Date(item.data_inicio);
          const dataTermino = new Date(item.data_termino);
          const hoje = new Date();
          
          const diasTotal = Math.ceil((dataTermino.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
          const diasPassados = Math.ceil((hoje.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
          diasRestantes = Math.max(0, diasTotal - diasPassados);
          
          progress = calcularProgresso(item.data_inicio, item.data_termino);
        }
        
        return {
          id: item.plano_id,
          nome: item.plano_dados.name,
          descricao: item.plano_dados.description || '',
          tipo: item.plano_dados.type,
          status: item.status,
          data_inicio: item.data_inicio,
          data_termino: item.data_termino,
          imagem_url: item.plano_dados.thumbnail_url,
          progress,
          diasRestantes
        };
      });
      
      setPlanos(planosFormatados);
    } catch (error: any) {
      console.error('Erro ao buscar planos:', error);
      setError(error.message || 'Erro ao carregar planos');
      toast({
        title: 'Erro ao carregar planos',
        description: 'Não foi possível carregar seus planos. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchPlanos();
    }
  }, [user?.id]);

  return {
    planos,
    isLoading,
    error,
    refetch: fetchPlanos
  };
}; 