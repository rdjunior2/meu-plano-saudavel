
import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

// Schema for step 2
export const rotinaSchema = z.object({
  horario_trabalho: z.string().optional(),
  refeicoes_dia: z.coerce.number().min(1, { message: "Número de refeições deve ser pelo menos 1" }).max(10, { message: "Número de refeições deve ser no máximo 10" }),
  restricao_alimentar: z.boolean().default(false),
  restricoes: z.array(z.string()).optional(),
  preferencia_alimentar: z.string().optional(),
  rotina_sono: z.string().optional(),
});

export type RotinaFormValues = z.infer<typeof rotinaSchema>;

interface RotinaStepProps {
  onValidSubmit: () => void;
  form: ReturnType<typeof useForm<RotinaFormValues>>;
}

const RotinaStep: React.FC<RotinaStepProps> = ({ onValidSubmit, form }) => {
  const handleNext = async () => {
    const isValid = await form.trigger();
    if (isValid) onValidSubmit();
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
        <FormField
          control={form.control}
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
          control={form.control}
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
          control={form.control}
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
        
        {form.watch("restricao_alimentar") && (
          <FormField
            control={form.control}
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
          control={form.control}
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
          control={form.control}
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
};

export default RotinaStep;
