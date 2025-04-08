
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
import { Apple, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from '@/stores/authStore';
import { supabase } from "@/integrations/supabase/client";
import FormStepper from '@/components/FormStepper';

// Schema for step 1
const step1Schema = z.object({
  nome_completo: z.string().min(3, { message: "Nome completo é obrigatório" }),
  idade: z.coerce.number().min(10, { message: "Idade deve ser maior que 10" }).max(120, { message: "Idade deve ser menor que 120" }),
  genero: z.string().min(1, { message: "Gênero é obrigatório" }),
  altura_cm: z.coerce.number().min(100, { message: "Altura deve ser maior que 100cm" }).max(250, { message: "Altura deve ser menor que 250cm" }),
  peso_kg: z.coerce.number().min(30, { message: "Peso deve ser maior que 30kg" }).max(300, { message: "Peso deve ser menor que 300kg" }),
  objetivo: z.string().min(1, { message: "Objetivo é obrigatório" }),
});

// Schema for step 2
const step2Schema = z.object({
  horario_trabalho: z.string().optional(),
  refeicoes_dia: z.coerce.number().min(1, { message: "Número de refeições deve ser pelo menos 1" }).max(10, { message: "Número de refeições deve ser no máximo 10" }),
  restricao_alimentar: z.boolean().default(false),
  restricoes: z.array(z.string()).optional(),
  preferencia_alimentar: z.string().optional(),
  rotina_sono: z.string().optional(),
});

// Schema for step 3
const step3Schema = z.object({
  consome_alcool: z.boolean().default(false),
  fuma: z.boolean().default(false),
  bebe_cafe: z.boolean().default(false),
  pratica_atividade: z.boolean().default(false),
  tipo_atividade: z.string().optional(),
  frequencia_atividade: z.coerce.number().min(0).max(7).optional(),
});

// Types for the form data
type Step1FormValues = z.infer<typeof step1Schema>;
type Step2FormValues = z.infer<typeof step2Schema>;
type Step3FormValues = z.infer<typeof step3Schema>;

type FormularioAlimentarValues = Step1FormValues & Step2FormValues & Step3FormValues;

const FormularioAlimentar = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, isAuthenticated, updateUser } = useAuthStore((state) => ({ 
    user: state.user, 
    isAuthenticated: state.isAuthenticated,
    updateUser: state.updateUser
  }));

  const steps = ["Dados Pessoais", "Rotina", "Hábitos"];

  // Setup forms for each step
  const step1Form = useForm<Step1FormValues>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      nome_completo: "",
      idade: 0,
      genero: "",
      altura_cm: 0,
      peso_kg: 0,
      objetivo: "",
    }
  });

  const step2Form = useForm<Step2FormValues>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      horario_trabalho: "",
      refeicoes_dia: 3,
      restricao_alimentar: false,
      restricoes: [],
      preferencia_alimentar: "",
      rotina_sono: "",
    }
  });

  const step3Form = useForm<Step3FormValues>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      consome_alcool: false,
      fuma: false,
      bebe_cafe: false,
      pratica_atividade: false,
      tipo_atividade: "",
      frequencia_atividade: 0,
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

  // Render different form steps
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <Form {...step1Form}>
            <form className="space-y-4">
              <FormField
                control={step1Form.control}
                name="nome_completo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={step1Form.control}
                  name="idade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Idade</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Sua idade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={step1Form.control}
                  name="genero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gênero</FormLabel>
                      <FormControl>
                        <RadioGroup 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Masculino" id="masculino" />
                            <label htmlFor="masculino">Masculino</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Feminino" id="feminino" />
                            <label htmlFor="feminino">Feminino</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Outro" id="outro" />
                            <label htmlFor="outro">Outro</label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={step1Form.control}
                  name="altura_cm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Altura (cm)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Sua altura em cm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={step1Form.control}
                  name="peso_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="Seu peso em kg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={step1Form.control}
                name="objetivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objetivo</FormLabel>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Emagrecer" id="emagrecer" />
                          <label htmlFor="emagrecer">Emagrecer</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Ganhar massa" id="ganhar-massa" />
                          <label htmlFor="ganhar-massa">Ganhar massa</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Manter peso" id="manter-peso" />
                          <label htmlFor="manter-peso">Manter peso</label>
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
            </form>
          </Form>
        );
      
      case 1:
        return (
          <Form {...step2Form}>
            <form className="space-y-4">
              <FormField
                control={step2Form.control}
                name="horario_trabalho"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qual seu horário de trabalho ou estudo?</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 8h às 18h" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={step2Form.control}
                name="refeicoes_dia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantas refeições você costuma fazer por dia?</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={step2Form.control}
                name="restricao_alimentar"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                          id="restricao_alimentar" 
                        />
                      </FormControl>
                      <label htmlFor="restricao_alimentar">
                        Possui alguma restrição alimentar?
                      </label>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {step2Form.watch("restricao_alimentar") && (
                <FormField
                  control={step2Form.control}
                  name="restricoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quais restrições alimentares?</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva suas restrições (ex: intolerância à lactose, celiaquía, etc)" 
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
                name="preferencia_alimentar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferência alimentar</FormLabel>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Vegano" id="vegano" />
                          <label htmlFor="vegano">Vegano</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Vegetariano" id="vegetariano" />
                          <label htmlFor="vegetariano">Vegetariano</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Onívoro" id="onivoro" />
                          <label htmlFor="onivoro">Onívoro</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Outro" id="outro-preferencia" />
                          <label htmlFor="outro-preferencia">Outro</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={step2Form.control}
                name="rotina_sono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qual sua rotina de sono?</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva seus horários de dormir e acordar, qualidade do sono, etc."
                        {...field} 
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={step3Form.control}
                  name="consome_alcool"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange} 
                            id="consome_alcool" 
                          />
                        </FormControl>
                        <label htmlFor="consome_alcool">
                          Consome álcool?
                        </label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={step3Form.control}
                  name="fuma"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange} 
                            id="fuma" 
                          />
                        </FormControl>
                        <label htmlFor="fuma">
                          Fuma?
                        </label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={step3Form.control}
                  name="bebe_cafe"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange} 
                            id="bebe_cafe" 
                          />
                        </FormControl>
                        <label htmlFor="bebe_cafe">
                          Bebe café?
                        </label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={step3Form.control}
                name="pratica_atividade"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                          id="pratica_atividade" 
                        />
                      </FormControl>
                      <label htmlFor="pratica_atividade">
                        Pratica atividade física?
                      </label>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {step3Form.watch("pratica_atividade") && (
                <>
                  <FormField
                    control={step3Form.control}
                    name="tipo_atividade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qual tipo de atividade física?</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: musculação, corrida, natação" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={step3Form.control}
                    name="frequencia_atividade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantas vezes por semana?</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" max="7" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
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
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-lavender">
              <Apple className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Formulário de Planejamento Alimentar</CardTitle>
          <CardDescription className="text-center">
            Vamos conhecer seus hábitos alimentares para criar um plano personalizado
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
              className="bg-lavender hover:bg-lavender-dark"
            >
              {isSubmitting ? "Enviando..." : "Finalizar"} <Check className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default FormularioAlimentar;
