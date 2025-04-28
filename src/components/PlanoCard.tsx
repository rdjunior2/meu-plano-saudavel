import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertCircle, ChevronRight, BarChart3, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppCard from '@/components/AppCard';
import { Plano } from '@/hooks/use-planos';

interface PlanoCardProps {
  plano: Plano;
  variant?: 'compact' | 'full';
  className?: string;
}

const PlanoCard: React.FC<PlanoCardProps> = ({ 
  plano, 
  variant = 'full',
  className = ''
}) => {
  const navigate = useNavigate();

  // Função para renderizar o ícone de status
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

  // Função para obter a cor do badge com base no status
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

  // Função para formatar a data
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (variant === 'compact') {
    return (
      <AppCard
        className={className}
        variant="default"
        hover={true}
        highlight={plano.status === 'ativo' ? 'primary' : plano.status === 'pendente' ? 'warning' : 'error'}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
            {plano.tipo.toLowerCase().includes('nutri') ? (
              <BarChart3 className="h-6 w-6 text-primary-600" />
            ) : (
              <Calendar className="h-6 w-6 text-primary-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold text-primary-800 truncate">{plano.nome}</h3>
              <Badge 
                variant={getStatusVariant(plano.status)}
                className="ml-2 font-medium text-xs px-2 py-0.5 whitespace-nowrap"
              >
                <span className="flex items-center gap-1">
                  {renderStatusIcon(plano.status)}
                  <span className="capitalize">{plano.status}</span>
                </span>
              </Badge>
            </div>
            <p className="text-xs text-primary-600 line-clamp-1 mt-0.5">{plano.descricao}</p>
            
            <div className="flex justify-between text-xs text-primary-600 mt-2">
              <span>{formatarData(plano.data_inicio)} - {formatarData(plano.data_termino)}</span>
              <span className="font-medium">{plano.progress}%</span>
            </div>
            
            <div className="h-1.5 w-full bg-primary-100 rounded-full overflow-hidden mt-1">
              <motion.div 
                className="h-full bg-primary-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${plano.progress}%` }}
                transition={{ duration: 1, delay: 0.2 }}
              />
            </div>
          </div>
        </div>
      </AppCard>
    );
  }

  return (
    <AppCard
      className={className}
      variant="default"
      hover={true}
      highlight={plano.status === 'ativo' ? 'primary' : plano.status === 'pendente' ? 'warning' : 'error'}
    >
      <div className="relative h-40 rounded-lg bg-gradient-to-r from-primary-500 to-primary-700 mb-5 overflow-hidden">
        {plano.imagem_url ? (
          <img 
            src={plano.imagem_url} 
            alt={plano.nome} 
            className="w-full h-full object-cover opacity-85"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            {plano.tipo.toLowerCase().includes('nutri') ? (
              <BarChart3 className="h-16 w-16 text-white/80" />
            ) : (
              <Calendar className="h-16 w-16 text-white/80" />
            )}
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge 
            variant={getStatusVariant(plano.status)}
            className="font-medium px-3 py-1 shadow-sm"
          >
            <span className="flex items-center gap-1.5">
              {renderStatusIcon(plano.status)}
              <span className="capitalize">{plano.status}</span>
            </span>
          </Badge>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-primary-800 mb-1">{plano.nome}</h3>
          <p className="text-sm text-primary-600">{plano.tipo}</p>
        </div>
        
        <p className="text-sm text-primary-600 line-clamp-2">
          {plano.descricao}
        </p>
        
        <div className="space-y-1.5">
          <div className="text-xs text-primary-600 flex justify-between">
            <span>Progresso</span>
            <span className="font-medium">{plano.progress}%</span>
          </div>
          <div className="h-2 w-full bg-primary-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${plano.progress}%` }}
              transition={{ duration: 1, delay: 0.2 }}
            />
          </div>
        </div>
        
        <div className="flex justify-between text-xs text-primary-600">
          <div>
            <p className="font-medium">Início</p>
            <p>{formatarData(plano.data_inicio)}</p>
          </div>
          <div className="text-right">
            <p className="font-medium">Término</p>
            <p>{formatarData(plano.data_termino)}</p>
          </div>
        </div>
        
        <div className="pt-2 flex justify-end">
          <Button 
            onClick={() => navigate(`/plano/${plano.id}`)}
            variant="outline" 
            className="border-primary-200 text-primary-700 hover:bg-primary-50 hover:text-primary-800 hover:border-primary-300"
          >
            Ver detalhes
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </AppCard>
  );
};

export default PlanoCard; 