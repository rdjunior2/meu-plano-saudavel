import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Apple } from "lucide-react";
import { useAuthStore } from '@/stores/authStore';
import { useFormularioAlimentar, FormularioAlimentarValues } from '@/hooks/useFormularioAlimentar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const FormularioAlimentar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { form, isSubmitting, handleSubmit } = useFormularioAlimentar();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Verificar se o formulário já foi preenchido
    if (user?.formulario_alimentar_preenchido) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate, user]);

  const onSubmit = (data: FormularioAlimentarValues) => {
    handleSubmit(data);
  };

  return (
    <div className="container max-w-4xl py-10">
      <Card className="w-full shadow-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-lavender flex items-center justify-center mb-4">
            <Apple className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Formulário de Planejamento Alimentar</CardTitle>
          <CardDescription>
            Vamos conhecer seus hábitos alimentares para criar um plano personalizado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="idade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Idade</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
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
                  name="altura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Altura (cm)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
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
                  name="peso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (kg)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
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
                  name="sexo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sexo</FormLabel>
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
                          <SelectItem value="Masculino">Masculino</SelectItem>
                          <SelectItem value="Feminino">Feminino</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="objetivo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objetivo</FormLabel>
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
                          <SelectItem value="Emagrecimento">Emagrecimento</SelectItem>
                          <SelectItem value="Ganho de Massa">Ganho de Massa</SelectItem>
                          <SelectItem value="Definição">Definição</SelectItem>
                          <SelectItem value="Manutenção">Manutenção</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="restricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Restrição alimentar?</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva suas restrições alimentares (alergias, intolerâncias, etc.)" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="preferencias"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comidas favoritas</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Liste suas comidas e ingredientes preferidos" 
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

export default FormularioAlimentar;
