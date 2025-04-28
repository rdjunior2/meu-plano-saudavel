import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Schema para o step de experiência
export const experienciaSchema = z.object({
  tipo_treino_atual: z.string().optional(),
  tempo_experiencia: z.coerce.number().min(0, { message: "Tempo inválido" }).optional(),
  frequencia_atual: z.coerce.number().min(0, { message: "Frequência inválida" }).max(7, { message: "Frequência deve ser no máximo 7 dias" }).optional(),
  gosta_treinar: z.boolean().default(true),
  dificuldades: z.string().optional(),
  resultados_anteriores: z.string().optional(),
});

export type ExperienciaFormValues = z.infer<typeof experienciaSchema>;

// Tipo para os valores do formulário completo (acessando campos de outros steps)
interface FormCompleteValues extends ExperienciaFormValues {
  treina_atualmente: boolean;
}

interface ExperienciaStepProps {
  onValidSubmit: () => void;
  form: ReturnType<typeof useForm<FormCompleteValues>>;
}

const ExperienciaStep: React.FC<ExperienciaStepProps> = ({ onValidSubmit, form }) => {
  const handleNext = async () => {
    const isValid = await form.trigger();
    if (isValid) onValidSubmit();
  };

  // Verificar se o usuário treina atualmente (importado do PerfilObjetivoStep)
  const treinaAtualmente = form.watch("treina_atualmente", false);

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
        {treinaAtualmente && (
          <>
            <FormField
              control={form.control}
              name="tipo_treino_atual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Que tipo de treino você faz atualmente?</FormLabel>
                  <FormControl>
                    <RadioGroup 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Musculação" id="musculacao" />
                        <label htmlFor="musculacao">Musculação</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Treino funcional" id="funcional" />
                        <label htmlFor="funcional">Treino funcional</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="CrossFit" id="crossfit" />
                        <label htmlFor="crossfit">CrossFit</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Calistenia" id="calistenia" />
                        <label htmlFor="calistenia">Calistenia</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Corrida" id="corrida" />
                        <label htmlFor="corrida">Corrida</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Outro" id="outro-tipo" />
                        <label htmlFor="outro-tipo">Outro</label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tempo_experiencia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Há quanto tempo treina? (em meses)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="frequencia_atual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantas vezes por semana treina atualmente?</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="7" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="gosta_treinar"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center space-x-2">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange} 
                    id="gosta_treinar" 
                  />
                </FormControl>
                <label htmlFor="gosta_treinar">
                  Gosta de treinar?
                </label>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dificuldades"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quais são suas principais dificuldades em manter um treino?</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descreva suas dificuldades" 
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="resultados_anteriores"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quais resultados já obteve com treinos anteriores?</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descreva seus resultados anteriores" 
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

export default ExperienciaStep; 