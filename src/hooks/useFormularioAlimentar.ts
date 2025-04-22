import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { usePurchaseStore } from '@/stores/purchaseStore';
import { supabase } from '@/lib/supabaseClient';
import { z } from 'zod';

// Schema do formulário
export const formularioAlimentarSchema = z.object({
  objetivo: z.string().min(1, "Selecione um objetivo"),
  peso: z.string().min(1, "Informe seu peso"),
  altura: z.string().min(1, "Informe sua altura"),
  restricoes: z.string().optional(),
  preferencias: z.string().optional(),
  alergias: z.string().optional(),
  tempo_preparo: z.string().min(1, "Selecione o tempo disponível"),
  refeicoes_por_dia: z.number().min(1, "Informe o número de refeições").max(10, "O máximo é 10 refeições"),
});

export type FormularioAlimentarValues = z.infer<typeof formularioAlimentarSchema>;

export const useFormularioAlimentar = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();
  const { activePurchase, submitFormResponse } = usePurchaseStore();

  // Setup form
  const form = useForm<FormularioAlimentarValues>({
    resolver: zodResolver(formularioAlimentarSchema),
    defaultValues: {
      objetivo: "",
      peso: "",
      altura: "",
      restricoes: "",
      preferencias: "",
      alergias: "",
      tempo_preparo: "",
      refeicoes_por_dia: 5,
    }
  });

  // Submit form data
  const handleSubmit = async (values: FormularioAlimentarValues) => {
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

      // Encontrar o produto do tipo meal na compra ativa
      const mealItem = activePurchase.items.find(item => item.product_type === "meal");
      
      if (!mealItem) {
        toast.error("Produto relacionado ao plano alimentar não encontrado na sua compra.");
        return;
      }

      // Preparar os dados da resposta
      const formData = {
        userId: user.id,
        formType: "alimentar",
        purchaseId: activePurchase.id,
        productId: mealItem.product_id,
        responses: {
          objetivo: values.objetivo,
          peso: values.peso,
          altura: values.altura,
          restricoes: values.restricoes,
          preferencias: values.preferencias,
          alergias: values.alergias,
          tempo_preparo: values.tempo_preparo,
          refeicoes_por_dia: values.refeicoes_por_dia,
          data_envio: new Date().toISOString()
        }
      };

      // Enviar resposta usando o purchaseStore
      const success = await submitFormResponse(formData);

      if (!success) {
        throw new Error("Falha ao enviar formulário. Tente novamente.");
      }

      toast.success("Formulário alimentar enviado com sucesso!");

      // Redirecionar para o dashboard
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      toast.error("Erro ao enviar formulário. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isSubmitting,
    handleSubmit
  };
};
