
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Apple } from "lucide-react";
import { useAuthStore } from '@/stores/authStore';
import { useFormularioAlimentar } from '@/hooks/useFormularioAlimentar';
import FormCard from '@/components/forms/common/FormCard';
import DadosPessoaisStep from '@/components/forms/alimentar/DadosPessoaisStep';
import RotinaStep from '@/components/forms/alimentar/RotinaStep';
import HabitosStep from '@/components/forms/alimentar/HabitosStep';

const FormularioAlimentar = () => {
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
  } = useFormularioAlimentar();

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
        return <DadosPessoaisStep onValidSubmit={handleNext} form={step1Form} />;
      case 1:
        return <RotinaStep onValidSubmit={handleNext} form={step2Form} />;
      case 2:
        return <HabitosStep form={step3Form} />;
      default:
        return null;
    }
  };

  return (
    <FormCard
      icon={<Apple className="h-6 w-6 text-white" />}
      title="Formulário de Planejamento Alimentar"
      description="Vamos conhecer seus hábitos alimentares para criar um plano personalizado"
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

export default FormularioAlimentar;
