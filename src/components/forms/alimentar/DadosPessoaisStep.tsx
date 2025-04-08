
import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Schema for step 1
export const dadosPessoaisSchema = z.object({
  nome_completo: z.string().min(3, { message: "Nome completo é obrigatório" }),
  idade: z.coerce.number().min(10, { message: "Idade deve ser maior que 10" }).max(120, { message: "Idade deve ser menor que 120" }),
  genero: z.string().min(1, { message: "Gênero é obrigatório" }),
  altura_cm: z.coerce.number().min(100, { message: "Altura deve ser maior que 100cm" }).max(250, { message: "Altura deve ser menor que 250cm" }),
  peso_kg: z.coerce.number().min(30, { message: "Peso deve ser maior que 30kg" }).max(300, { message: "Peso deve ser menor que 300kg" }),
  objetivo: z.string().min(1, { message: "Objetivo é obrigatório" }),
});

export type DadosPessoaisFormValues = z.infer<typeof dadosPessoaisSchema>;

interface DadosPessoaisStepProps {
  onValidSubmit: () => void;
  form: ReturnType<typeof useForm<DadosPessoaisFormValues>>;
}

const DadosPessoaisStep: React.FC<DadosPessoaisStepProps> = ({ onValidSubmit, form }) => {
  const handleNext = async () => {
    const isValid = await form.trigger();
    if (isValid) onValidSubmit();
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
        <FormField
          control={form.control}
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
            control={form.control}
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
            control={form.control}
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
            control={form.control}
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
            control={form.control}
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
          control={form.control}
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
};

export default DadosPessoaisStep;
