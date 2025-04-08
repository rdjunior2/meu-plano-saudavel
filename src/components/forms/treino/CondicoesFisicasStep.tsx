
import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

// Schema for step 2
export const condicoesFisicasSchema = z.object({
  possui_lesao: z.boolean().default(false),
  lesoes: z.array(z.string()).optional(),
  local_treino: z.string().min(1, { message: "Local de treino é obrigatório" }),
  exercicios_favoritos: z.array(z.string()).optional(),
  exercicios_menos_gostados: z.array(z.string()).optional(),
});

export type CondicoesFisicasFormValues = z.infer<typeof condicoesFisicasSchema>;

interface CondicoesFisicasStepProps {
  onValidSubmit: () => void;
  form: ReturnType<typeof useForm<CondicoesFisicasFormValues>>;
}

const CondicoesFisicasStep: React.FC<CondicoesFisicasStepProps> = ({ onValidSubmit, form }) => {
  const handleNext = async () => {
    const isValid = await form.trigger();
    if (isValid) onValidSubmit();
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
        <FormField
          control={form.control}
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
        
        {form.watch("possui_lesao") && (
          <FormField
            control={form.control}
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
          control={form.control}
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
          control={form.control}
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
          control={form.control}
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
};

export default CondicoesFisicasStep;
