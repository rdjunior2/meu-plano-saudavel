
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { 
  perfilObjetivoSchema, 
  PerfilObjetivoFormValues 
} from '@/components/forms/treino/PerfilObjetivoStep';
import { 
  condicoesFisicasSchema, 
  CondicoesFisicasFormValues 
} from '@/components/forms/treino/CondicoesFisicasStep';
import { 
  nivelAtualSchema, 
  NivelAtualFormValues 
} from '@/components/forms/treino/NivelAtualStep';

export const useFormularioTreino = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, updateUser } = useAuthStore();

  const steps = ["Perfil e Objetivo", "Condições Físicas", "Nível Atual"];

  // Setup forms for each step
  const step1Form = useForm<PerfilObjetivoFormValues>({
    resolver: zodResolver(perfilObjetivoSchema),
    defaultValues: {
      treina_atualmente: false,
      objetivo_treino: "",
      frequencia_semanal: 3,
      tempo_disponivel: 60,
    }
  });

  const step2Form = useForm<CondicoesFisicasFormValues>({
    resolver: zodResolver(condicoesFisicasSchema),
    defaultValues: {
      possui_lesao: false,
      lesoes: [],
      local_treino: "",
      exercicios_favoritos: [],
      exercicios_menos_gostados: [],
    }
  });

  const step3Form = useForm<NivelAtualFormValues>({
    resolver: zodResolver(nivelAtualSchema),
    defaultValues: {
      nivel_condicionamento: "",
      acompanhamento_profissional: false,
    }
  });

  const handleNext = async () => {
    setCurrentStep(Math.min(steps.length - 1, currentStep + 1));
  };

  const handleBack = () => {
    setCurrentStep(Math.max(0, currentStep - 1));
  };

  // Submit form data
  const handleSubmit = async () => {
    try {
      // Validate all forms
      const step1Valid = await step1Form.trigger();
      const step2Valid = await step2Form.trigger();
      const step3Valid = await step3Form.trigger();

      if (!step1Valid || !step2Valid || !step3Valid) {
        toast.error("Por favor, corrija os erros no formulário.");
        return;
      }

      if (!user?.id) {
        toast.error("Usuário não identificado. Por favor, faça login novamente.");
        return;
      }

      setIsSubmitting(true);

      // Combine form data from all steps
      const formData = {
        ...step1Form.getValues(),
        ...step2Form.getValues(),
        ...step3Form.getValues(),
        usuario_id: user.id,
      };

      // Save to Supabase
      const { error } = await supabase
        .from('formulario_treino')
        .insert(formData);

      if (error) {
        throw error;
      }

      // Update profile status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          formulario_treino_preenchido: true
        })
        .eq('id', user.id);
      
      if (profileError) {
        console.error('Error updating profile:', profileError);
      }
      
      // Update local state
      updateUser({ formulario_treino_preenchido: true });

      toast.success("Formulário de treino enviado com sucesso!");

      // Check if diet form is also completed
      const { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('formulario_alimentar_preenchido')
        .eq('id', user.id)
        .single();

      if (profileFetchError) {
        console.error('Error fetching profile:', profileFetchError);
      }

      if (profile?.formulario_alimentar_preenchido) {
        navigate('/dashboard');
      } else {
        navigate('/formulario-alimentar');
      }
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      toast.error("Erro ao enviar formulário. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    currentStep,
    setCurrentStep,
    isSubmitting,
    steps,
    step1Form,
    step2Form,
    step3Form,
    handleNext,
    handleBack,
    handleSubmit
  };
};
