import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
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
  const { user, updateUser } = useAuthStore();

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

      setIsSubmitting(true);

      // Converter string para boolean
      const jaTreinaBoolean = values.ja_treina === "Sim";

      // Salvar no Supabase
      const { error } = await supabase
        .from('formularios_treino')
        .insert({
          id_usuario: user.id,
          ja_treina: jaTreinaBoolean,
          frequencia: values.frequencia,
          equipamentos: values.equipamentos,
          foco: values.foco,
          limitacoes: values.limitacoes
        });

      if (error) {
        throw error;
      }

      // Atualizar status do usuário localmente
      updateUser({ formulario_treino_preenchido: true });
      
      toast.success("Formulário de treino enviado com sucesso!");
      
      // Verificar se o formulário alimentar já foi preenchido
      const { data: formAlimentar, error: alimentarError } = await supabase
        .from('formularios_alimentacao')
        .select('id')
        .eq('id_usuario', user.id)
        .single();

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
