import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import FormCard from '@/components/forms/common/FormCard';
import PerfilObjetivoStep, { perfilObjetivoSchema, PerfilObjetivoFormValues } from '@/components/forms/treino/PerfilObjetivoStep';
import CondicoesFisicasStep, { condicoesFisicasSchema, CondicoesFisicasFormValues } from '@/components/forms/treino/CondicoesFisicasStep';
import ExperienciaStep, { experienciaSchema, ExperienciaFormValues } from '@/components/forms/treino/ExperienciaStep';
import NivelAtualStep, { nivelAtualSchema, NivelAtualFormValues } from '@/components/forms/treino/NivelAtualStep';

import { useAuthStore } from '@/stores/authStore';
import { usePurchaseStore } from '@/stores/purchaseStore';

// Unificar todos os schemas
const formSchema = z.object({
  ...perfilObjetivoSchema.shape,
  ...condicoesFisicasSchema.shape,
  ...experienciaSchema.shape,
  ...nivelAtualSchema.shape,
});

// Tipo unificado
type FormValues = PerfilObjetivoFormValues & 
                  CondicoesFisicasFormValues & 
                  ExperienciaFormValues & 
                  NivelAtualFormValues;

const TreinoForm = () => {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activePurchase, submitFormResponse } = usePurchaseStore();

  // Definir os passos do formulário
  const steps = ["Perfil e Objetivo", "Experiência", "Condições Físicas", "Nível Atual"];

  // Setup form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      treina_atualmente: false,
      objetivo_treino: "",
      frequencia_semanal: 3,
      tempo_disponivel: 60,
      
      tipo_treino_atual: "",
      tempo_experiencia: 0,
      frequencia_atual: 0,
      gosta_treinar: true,
      dificuldades: "",
      resultados_anteriores: "",
      
      possui_lesao: false,
      lesoes: [],
      local_treino: "",
      exercicios_favoritos: [],
      exercicios_menos_gostados: [],
      
      nivel_condicionamento: "",
      acompanhamento_profissional: false,
    }
  });

  // Função para avançar para o próximo passo
  const nextStep = () => {
    setStep(step + 1);
  };

  // Função para voltar ao passo anterior
  const prevStep = () => {
    setStep(step - 1);
  };

  // Enviar o formulário
  const onSubmit = async (data: FormValues) => {
    try {
      if (!user?.id) {
        toast.error("Usuário não identificado. Por favor, faça login novamente.");
        return;
      }

      if (!activePurchase) {
        toast.error("Nenhuma compra ativa encontrada.");
        return;
      }

      setIsSubmitting(true);

      // Encontrar o produto do tipo treino na compra ativa
      const workoutItem = activePurchase.items.find(item => item.product_type === "workout");
      
      if (!workoutItem) {
        toast.error("Produto relacionado ao plano de treino não encontrado na sua compra.");
        return;
      }

      // Preparar os dados da resposta
      const formData = {
        userId: user.id,
        formType: "treino",
        purchaseId: activePurchase.id,
        productId: workoutItem.product_id,
        responses: {
          ...data,
          data_envio: new Date().toISOString()
        }
      };

      // Enviar resposta usando o purchaseStore
      const success = await submitFormResponse(formData);

      if (!success) {
        throw new Error("Falha ao enviar formulário. Tente novamente.");
      }

      toast.success("Formulário de treino enviado com sucesso!");

      // Redirecionar para o dashboard
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      toast.error("Erro ao enviar formulário. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderizar o passo atual
  const renderStep = () => {
    switch (step) {
      case 0:
        return <PerfilObjetivoStep form={form} onValidSubmit={nextStep} />;
      case 1:
        return <ExperienciaStep form={form} onValidSubmit={nextStep} />;
      case 2:
        return <CondicoesFisicasStep form={form} onValidSubmit={nextStep} />;
      case 3:
        return <NivelAtualStep form={form} onValidSubmit={nextStep} />;
      default:
        return null;
    }
  };

  return (
    <FormCard
      icon={<Dumbbell className="h-6 w-6" />}
      title="Formulário de Treino"
      description="Vamos conhecer seu perfil e objetivos para criar um plano personalizado"
      steps={steps}
      currentStep={step}
      isSubmitting={isSubmitting}
      onBack={step > 0 ? prevStep : undefined}
      onNext={step < steps.length - 1 ? nextStep : undefined}
      onSubmit={step === steps.length - 1 ? form.handleSubmit(onSubmit) : undefined}
    >
      {renderStep()}
    </FormCard>
  );
};

export default TreinoForm; 