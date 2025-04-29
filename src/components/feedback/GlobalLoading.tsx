import React from 'react';
import { useFeedback } from '@/contexts/FeedbackContext';
import LoadingSpinner from '@/components/LoadingSpinner';

/**
 * Componente de loading global que é exibido quando operações importantes
 * estão em andamento na aplicação.
 */
const GlobalLoading: React.FC = () => {
  const { feedback } = useFeedback();
  const { globalLoading, loaders } = feedback;
  
  // Verificar se há algum loader ativo
  const hasActiveLoaders = globalLoading || Object.keys(loaders).length > 0;
  
  // Se não houver loaders ativos, não renderiza nada
  if (!hasActiveLoaders) return null;
  
  // Buscar a primeira mensagem de loading disponível
  const firstLoader = Object.values(loaders)[0];
  const message = firstLoader?.message || 'Carregando...';
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/25 backdrop-blur-sm z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
        <LoadingSpinner size="lg" color="primary" />
        <p className="mt-4 text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
};

export default GlobalLoading; 