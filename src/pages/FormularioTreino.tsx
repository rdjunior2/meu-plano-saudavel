import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell } from "lucide-react";
import { useAuthStore } from '@/stores/authStore';
import { useFormularioTreino, FormularioTreinoValues } from '@/hooks/useFormularioTreino';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const FormularioTreino = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { form, isSubmitting, handleSubmit } = useFormularioTreino();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Verificar se o formulário já foi preenchido
    if (user?.formulario_treino_preenchido) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate, user]);

  const onSubmit = (data: FormularioTreinoValues) => {
    handleSubmit(data);
  };

  return (
    <div className="container max-w-4xl py-10">
      <Card className="w-full shadow-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-lavender flex items-center justify-center mb-4">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Formulário de Planejamento de Treino</CardTitle>
          <CardDescription>
            Vamos conhecer sua rotina e objetivos de treino para criar um plano personalizado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="ja_treina"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Já treina atualmente?</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Sim">Sim</SelectItem>
                        <SelectItem value="Não">Não</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="frequencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantas vezes por semana?</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        max="7"
                        {...field} 
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="equipamentos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipamentos disponíveis</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva os equipamentos ou acessórios que você possui para treinar (halteres, elásticos, etc.)" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="foco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partes do corpo que deseja focar</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Informe quais partes do corpo você gostaria de priorizar no treino" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="limitacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tem alguma limitação física?</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva qualquer lesão ou limitação física que precise ser considerada" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="bg-lavender hover:bg-lavender-dark"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Enviando..." : "Enviar Formulário"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormularioTreino;
