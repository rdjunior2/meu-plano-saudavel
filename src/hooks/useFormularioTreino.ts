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
export const formularioTreinoSchema = z.object({
  ja_treina: z.enum(["Sim", "Não"], {
    errorMap: () => ({ message: "Selecione uma opção" }),
  }),
  frequencia: z.number().min(0, "Frequência inválida").max(7, "Frequência inválida"),
  equipamentos: z.string().optional(),
  foco: z.string().optional(),
  limitacoes: z.string().optional(),
});

export type FormularioTreinoValues = z.infer<typeof formularioTreinoSchema>;

export const useFormularioTreino = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();
  const { activePurchase, submitFormResponse } = usePurchaseStore();

  // Setup form
  const form = useForm<FormularioTreinoValues>({
    resolver: zodResolver(formularioTreinoSchema),
    defaultValues: {
      ja_treina: "Não",
      frequencia: 0,
      equipamentos: "",
      foco: "",
      limitacoes: "",
    }
  });

  // Submit form data
  const handleSubmit = async (values: FormularioTreinoValues) => {
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

      // Converter string para boolean
      const jaTreinaBoolean = values.ja_treina === "Sim";

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
          ja_treina: jaTreinaBoolean,
          frequencia: values.frequencia,
          equipamentos: values.equipamentos,
          foco: values.foco,
          limitacoes: values.limitacoes,
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

  return {
    form,
    isSubmitting,
    handleSubmit
  };
};
