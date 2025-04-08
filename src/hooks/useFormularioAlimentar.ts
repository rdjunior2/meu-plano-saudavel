
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { 
  dadosPessoaisSchema, 
  DadosPessoaisFormValues 
} from '@/components/forms/alimentar/DadosPessoaisStep';
import { 
  rotinaSchema, 
  RotinaFormValues 
} from '@/components/forms/alimentar/RotinaStep';
import { 
  habitosSchema, 
  HabitosFormValues 
} from '@/components/forms/alimentar/HabitosStep';

export const useFormularioAlimentar = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, updateUser } = useAuthStore();

  const steps = ["Dados Pessoais", "Rotina", "Hábitos"];

  // Setup forms for each step
  const step1Form = useForm<DadosPessoaisFormValues>({
    resolver: zodResolver(dadosPessoaisSchema),
    defaultValues: {
      nome_completo: "",
      idade: 0,
      genero: "",
      altura_cm: 0,
      peso_kg: 0,
      objetivo: "",
    }
  });

  const step2Form = useForm<RotinaFormValues>({
    resolver: zodResolver(rotinaSchema),
    defaultValues: {
      horario_trabalho: "",
      refeicoes_dia: 3,
      restricao_alimentar: false,
      restricoes: [],
      preferencia_alimentar: "",
      rotina_sono: "",
    }
  });

  const step3Form = useForm<HabitosFormValues>({
    resolver: zodResolver(habitosSchema),
    defaultValues: {
      consome_alcool: false,
      fuma: false,
      bebe_cafe: false,
      pratica_atividade: false,
      tipo_atividade: "",
      frequencia_atividade: 0,
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
        .from('formulario_alimentar')
        .insert(formData);

      if (error) {
        throw error;
      }

      // Update profile status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          formulario_alimentar_preenchido: true
        })
        .eq('id', user.id);
        
      if (profileError) {
        console.error('Error updating profile:', profileError);
      }
      
      // Update local state
      updateUser({ formulario_alimentar_preenchido: true });

      toast.success("Formulário alimentar enviado com sucesso!");

      // Check if workout form is also completed
      const { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('formulario_treino_preenchido')
        .eq('id', user.id)
        .single();

      if (profileFetchError) {
        console.error('Error fetching profile:', profileFetchError);
      }

      if (profile?.formulario_treino_preenchido) {
        navigate('/dashboard');
      } else {
        navigate('/formulario-treino');
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
