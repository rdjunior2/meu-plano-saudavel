
import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

// Schema for step 3
export const nivelAtualSchema = z.object({
  nivel_condicionamento: z.string().min(1, { message: "Nível de condicionamento é obrigatório" }),
  acompanhamento_profissional: z.boolean().default(false),
});

export type NivelAtualFormValues = z.infer<typeof nivelAtualSchema>;

interface NivelAtualStepProps {
  form: ReturnType<typeof useForm<NivelAtualFormValues>>;
}

const NivelAtualStep: React.FC<NivelAtualStepProps> = ({ form }) => {
  return (
    <Form {...form}>
      <form className="space-y-4">
        <FormField
          control={form.control}
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
          control={form.control}
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
};

export default NivelAtualStep;
