
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dumbbell, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from '@/stores/authStore';
import { supabase } from "@/integrations/supabase/client";
import FormStepper from '@/components/FormStepper';

// Schema for step 1
const step1Schema = z.object({
  treina_atualmente: z.boolean().default(false),
  objetivo_treino: z.string().min(1, { message: "Objetivo é obrigatório" }),
  frequencia_semanal: z.coerce.number().min(1, { message: "Frequência deve ser pelo menos 1 dia" }).max(7, { message: "Frequência deve ser no máximo 7 dias" }),
  tempo_disponivel: z.coerce.number().min(15, { message: "Tempo deve ser pelo menos 15 minutos" }).max(240, { message: "Tempo deve ser no máximo 240 minutos" }),
});

// Schema for step 2
const step2Schema = z.object({
  possui_lesao: z.boolean().default(false),
  lesoes: z.array(z.string()).optional(),
  local_treino: z.string().min(1, { message: "Local de treino é obrigatório" }),
  exercicios_favoritos: z.array(z.string()).optional(),
  exercicios_menos_gostados: z.array(z.string()).optional(),
});

// Schema for step 3
const step3Schema = z.object({
  nivel_condicionamento: z.string().min(1, { message: "Nível de condicionamento é obrigatório" }),
  acompanhamento_profissional: z.boolean().default(false),
});

// Types for the form data
type Step1FormValues = z.infer<typeof step1Schema>;
type Step2FormValues = z.infer<typeof step2Schema>;
type Step3FormValues = z.infer<typeof step3Schema>;

type FormularioTreinoValues = Step1FormValues & Step2FormValues & Step3FormValues;

const FormularioTreino = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, isAuthenticated } = useAuthStore((state) => ({ 
    user: state.user, 
    isAuthenticated: state.isAuthenticated 
  }));

  const steps = ["Perfil e Objetivo", "Condições Físicas", "Nível Atual"];

  // Setup forms for each step
  const step1Form = useForm<Step1FormValues>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      treina_atualmente: false,
      objetivo_treino: "",
      frequencia_semanal: 3,
      tempo_disponivel: 60,
    }
  });

  const step2Form = useForm<Step2FormValues>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      possui_lesao: false,
      lesoes: [],
      local_treino: "",
      exercicios_favoritos: [],
      exercicios_menos_gostados: [],
    }
  });

  const step3Form = useForm<Step3FormValues>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      nivel_condicionamento: "",
      acompanhamento_profissional: false,
    }
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Handle navigation between steps
  const handleNext = async () => {
    switch (currentStep) {
      case 0:
        const step1Valid = await step1Form.trigger();
        if (step1Valid) setCurrentStep(1);
        break;
      case 1:
        const step2Valid = await step2Form.trigger();
        if (step2Valid) setCurrentStep(2);
        break;
      default:
        break;
    }
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
        .insert([formData]);

      if (error) {
        throw error;
      }

      // Update profile status
      await supabase
        .from('profiles')
        .update({ formulario_treino_preenchido: true })
        .eq('id', user.id);

      toast.success("Formulário de treino enviado com sucesso!");

      // Check if diet form is also completed
      const { data: profile } = await supabase
        .from('profiles')
        .select('formulario_alimentar_preenchido')
        .eq('id', user.id)
        .single();

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

  // Render different form steps
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <Form {...step1Form}>
            <form className="space-y-4">
              <FormField
                control={step1Form.control}
                name="treina_atualmente"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                          id="treina_atualmente" 
                        />
                      </FormControl>
                      <label htmlFor="treina_atualmente">
                        Já treina atualmente?
                      </label>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={step1Form.control}
                name="objetivo_treino"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qual seu objetivo principal com o treino?</FormLabel>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Hipertrofia" id="hipertrofia" />
                          <label htmlFor="hipertrofia">Hipertrofia</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Emagrecimento" id="emagrecimento" />
                          <label htmlFor="emagrecimento">Emagrecimento</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Condicionamento" id="condicionamento" />
                          <label htmlFor="condicionamento">Condicionamento</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Outro" id="outro-objetivo" />
                          <label htmlFor="outro-objetivo">Outro</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={step1Form.control}
                name="frequencia_semanal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequência semanal ideal de treino (dias/semana)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="7" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={step1Form.control}
                name="tempo_disponivel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tempo disponível por dia (minutos)</FormLabel>
                    <FormControl>
                      <Input type="number" min="15" max="240" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        );
      
      case 1:
        return (
          <Form {...step2Form}>
            <form className="space-y-4">
              <FormField
                control={step2Form.control}
                name="possui_lesao"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                          id="possui_lesao" 
                        />
                      </FormControl>
                      <label htmlFor="possui_lesao">
                        Possui alguma lesão ou limitação?
                      </label>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {step2Form.watch("possui_lesao") && (
                <FormField
                  control={step2Form.control}
                  name="lesoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quais lesões ou limitações?</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva suas lesões ou limitações" 
                          onChange={(e) => field.onChange(e.target.value.split(',').map(item => item.trim()))}
                          value={field.value?.join(', ')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={step2Form.control}
                name="local_treino"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Onde pretende treinar?</FormLabel>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Academia" id="academia" />
                          <label htmlFor="academia">Academia</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Casa com equipamentos" id="casa-equipamentos" />
                          <label htmlFor="casa-equipamentos">Casa com equipamentos</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Apenas peso corporal" id="peso-corporal" />
                          <label htmlFor="peso-corporal">Apenas peso corporal</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Outro" id="outro-local" />
                          <label htmlFor="outro-local">Outro</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={step2Form.control}
                name="exercicios_favoritos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quais exercícios mais gosta?</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Separe os exercícios por vírgulas" 
                        onChange={(e) => field.onChange(e.target.value.split(',').map(item => item.trim()))}
                        value={field.value?.join(', ')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={step2Form.control}
                name="exercicios_menos_gostados"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quais exercícios menos gosta?</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Separe os exercícios por vírgulas" 
                        onChange={(e) => field.onChange(e.target.value.split(',').map(item => item.trim()))}
                        value={field.value?.join(', ')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        );
      
      case 2:
        return (
          <Form {...step3Form}>
            <form className="space-y-4">
              <FormField
                control={step3Form.control}
                name="nivel_condicionamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível de condicionamento</FormLabel>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Iniciante" id="iniciante" />
                          <label htmlFor="iniciante">Iniciante</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Intermediário" id="intermediario" />
                          <label htmlFor="intermediario">Intermediário</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Avançado" id="avancado" />
                          <label htmlFor="avancado">Avançado</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={step3Form.control}
                name="acompanhamento_profissional"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                          id="acompanhamento_profissional" 
                        />
                      </FormControl>
                      <label htmlFor="acompanhamento_profissional">
                        Já realizou algum treino com acompanhamento profissional?
                      </label>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="container py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-mint">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Formulário de Planejamento de Treino</CardTitle>
          <CardDescription className="text-center">
            Vamos conhecer sua rotina e objetivos de treino para criar um plano personalizado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormStepper steps={steps} currentStep={currentStep} />
          <div className="mt-6">
            {renderStep()}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          
          {currentStep < steps.length - 1 ? (
            <Button type="button" onClick={handleNext}>
              Próximo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-mint hover:bg-mint-dark"
            >
              {isSubmitting ? "Enviando..." : "Finalizar"} <Check className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default FormularioTreino;
