import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clipboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import { usePlanos } from '@/hooks/use-planos';
import PlanoCard from '@/components/PlanoCard';
import LoadingPlanos from '@/components/LoadingPlanos';

const MeuPlano = () => {
  const { planos, isLoading } = usePlanos();
  const navigate = useNavigate();

  // Configurações de animação
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  // Placeholder de carregamento
  if (isLoading) {
    return (
      <DashboardLayout 
        title="Meu Plano" 
        subtitle="Acompanhe seus planos nutricionais e de treino"
        icon={<Clipboard className="h-6 w-6" />}
      >
        <LoadingPlanos qtd={3} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Meu Plano" 
      subtitle="Acompanhe seus planos nutricionais e de treino"
      icon={<Clipboard className="h-6 w-6" />}
      gradient="default"
    >
      {planos.length === 0 ? (
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6 inline-flex p-4 rounded-full bg-primary-50 text-primary-500">
            <FileText className="h-16 w-16" />
          </div>
          <h3 className="text-xl font-semibold text-primary-800 mb-3">Você ainda não possui planos</h3>
          <p className="text-primary-600 mb-6 max-w-md mx-auto">
            Escolha um plano para começar sua jornada de transformação e acompanhe seu progresso de forma simples e eficaz.
          </p>
          <Button 
            onClick={() => navigate('/dashboard')}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6"
            size="lg"
          >
            Explorar planos disponíveis
          </Button>
        </motion.div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {planos.map((plano, index) => (
            <motion.div 
              key={plano.id} 
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }} 
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <PlanoCard plano={plano} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default MeuPlano; 