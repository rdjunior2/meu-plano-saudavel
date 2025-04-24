
import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

// Schema for step 1
export const perfilObjetivoSchema = z.object({
  treina_atualmente: z.boolean().default(false),
  objetivo_treino: z.string().min(1, { message: "Objetivo é obrigatório" }),
  frequencia_semanal: z.coerce.number().min(1, { message: "Frequência deve ser pelo menos 1 dia" }).max(7, { message: "Frequência deve ser no máximo 7 dias" }),
  tempo_disponivel: z.coerce.number().min(15, { message: "Tempo deve ser pelo menos 15 minutos" }).max(240, { message: "Tempo deve ser no máximo 240 minutos" }),
});

export type PerfilObjetivoFormValues = z.infer<typeof perfilObjetivoSchema>;

interface PerfilObjetivoStepProps {
  onValidSubmit: () => void;
  form: ReturnType<typeof useForm<PerfilObjetivoFormValues>>;
}

const PerfilObjetivoStep: React.FC<PerfilObjetivoStepProps> = ({ onValidSubmit, form }) => {
  const handleNext = async () => {
    const isValid = await form.trigger();
    if (isValid) onValidSubmit();
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
        <FormField
          control={form.control}
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
          control={form.control}
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
          control={form.control}
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
          control={form.control}
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
};

export default PerfilObjetivoStep;
