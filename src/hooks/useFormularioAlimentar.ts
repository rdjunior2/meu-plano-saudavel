import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

// Schema do formulário
export const formularioAlimentarSchema = z.object({
  idade: z.number().min(1, "Idade é obrigatória").max(120, "Idade inválida"),
  altura: z.number().min(50, "Altura inválida").max(250, "Altura inválida"),
  peso: z.number().min(20, "Peso inválido").max(300, "Peso inválido"),
  sexo: z.enum(["Masculino", "Feminino"], {
    errorMap: () => ({ message: "Selecione uma opção" }),
  }),
  objetivo: z.enum(["Emagrecimento", "Ganho de Massa", "Definição", "Manutenção"], {
    errorMap: () => ({ message: "Selecione uma opção" }),
  }),
  restricao: z.string().optional(),
  preferencias: z.string().optional(),
});

export type FormularioAlimentarValues = z.infer<typeof formularioAlimentarSchema>;

export const useFormularioAlimentar = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, updateUser } = useAuthStore();

  // Setup form
  const form = useForm<FormularioAlimentarValues>({
    resolver: zodResolver(formularioAlimentarSchema),
    defaultValues: {
      idade: 30,
      altura: 170,
      peso: 70,
      sexo: "Masculino",
      objetivo: "Emagrecimento",
      restricao: "",
      preferencias: "",
    }
  });

  // Submit form data
  const handleSubmit = async (values: FormularioAlimentarValues) => {
    try {
      if (!user?.id) {
        toast.error("Usuário não identificado. Por favor, faça login novamente.");
        return;
      }

      setIsSubmitting(true);

      // Salvar no Supabase
      const { error } = await supabase
        .from('formularios_alimentacao')
        .insert({
          id_usuario: user.id,
          idade: values.idade,
          altura: values.altura,
          peso: values.peso,
          sexo: values.sexo,
          objetivo: values.objetivo,
          restricao: values.restricao,
          preferencias: values.preferencias
        });

      if (error) {
        throw error;
      }

      // Atualizar status do usuário localmente
      updateUser({ formulario_alimentar_preenchido: true });
      
      toast.success("Formulário alimentar enviado com sucesso!");

      // Verificar se o formulário de treino já foi preenchido
      const { data: usuario, error: userError } = await supabase
        .from('usuarios')
        .select('status')
        .eq('id', user.id)
        .single();

      // Verificar se o outro formulário já foi preenchido
      const { data: formTreino, error: treinoError } = await supabase
        .from('formularios_treino')
        .select('id')
        .eq('id_usuario', user.id)
        .single();

      if (formTreino) {
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
    form,
    isSubmitting,
    handleSubmit
  };
};
