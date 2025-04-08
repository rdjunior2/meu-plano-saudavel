
import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

// Schema for step 3
export const habitosSchema = z.object({
  consome_alcool: z.boolean().default(false),
  fuma: z.boolean().default(false),
  bebe_cafe: z.boolean().default(false),
  pratica_atividade: z.boolean().default(false),
  tipo_atividade: z.string().optional(),
  frequencia_atividade: z.coerce.number().min(0).max(7).optional(),
});

export type HabitosFormValues = z.infer<typeof habitosSchema>;

interface HabitosStepProps {
  form: ReturnType<typeof useForm<HabitosFormValues>>;
}

const HabitosStep: React.FC<HabitosStepProps> = ({ form }) => {
  return (
    <Form {...form}>
      <form className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
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
            control={form.control}
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
            control={form.control}
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
          control={form.control}
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
        
        {form.watch("pratica_atividade") && (
          <>
            <FormField
              control={form.control}
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
              control={form.control}
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
};

export default HabitosStep;
