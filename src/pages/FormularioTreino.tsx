
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell } from "lucide-react";
import { useAuthStore } from '@/stores/authStore';
import { useFormularioTreino } from '@/hooks/useFormularioTreino';
import FormCard from '@/components/forms/common/FormCard';
import PerfilObjetivoStep from '@/components/forms/treino/PerfilObjetivoStep';
import CondicoesFisicasStep from '@/components/forms/treino/CondicoesFisicasStep';
import NivelAtualStep from '@/components/forms/treino/NivelAtualStep';

const FormularioTreino = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const {
    currentStep,
    isSubmitting,
    steps,
    step1Form,
    step2Form,
    step3Form,
    handleNext,
    handleBack,
    handleSubmit
  } = useFormularioTreino();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Render different form steps
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <PerfilObjetivoStep onValidSubmit={handleNext} form={step1Form} />;
      case 1:
        return <CondicoesFisicasStep onValidSubmit={handleNext} form={step2Form} />;
      case 2:
        return <NivelAtualStep form={step3Form} />;
      default:
        return null;
    }
  };

  return (
    <FormCard
      icon={<Dumbbell className="h-6 w-6 text-white" />}
      title="Formulário de Planejamento de Treino"
      description="Vamos conhecer sua rotina e objetivos de treino para criar um plano personalizado"
      steps={steps}
      currentStep={currentStep}
      isSubmitting={isSubmitting}
      onBack={handleBack}
      onNext={handleNext}
      onSubmit={handleSubmit}
    >
      {renderStep()}
    </FormCard>
  );
};

export default FormularioTreino;
