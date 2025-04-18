import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { useAuthStore } from '@/stores/authStore';
import { Smartphone, Lock } from 'lucide-react';

const loginSchema = z.object({
  phone: z.string()
    .min(11, { message: "O número deve ter pelo menos 11 dígitos" })
    .max(15, { message: "O número deve ter no máximo 15 dígitos" })
    .regex(/^\d+$/, { message: "O número deve conter apenas dígitos" }),
  password: z.string()
    .min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const { loginWithPassword, checkUserByPhone } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setIsLoading(true);
      
      // Primeiro, verificar se o usuário existe
      const { exists, status } = await checkUserByPhone(values.phone);
      
      if (!exists) {
        toast.error("Número de telefone não registrado. Verifique os dados.");
        return;
      }
      
      if (status === 'aguardando_formulario') {
        // Redirecionar para criação de senha
        navigate(`/criar-senha?phone=${values.phone}`);
        return;
      }
      
      // Tentar fazer login
      const { success, error } = await loginWithPassword(values.phone, values.password);
      
      if (!success) {
        toast.error(error || "Erro ao realizar login. Verifique seus dados.");
        return;
      }
      
      toast.success("Login realizado com sucesso!");
      
      // Verificar status e redirecionar conforme necessário
      if (status === 'senha_criada') {
        navigate("/formulario-alimentar");
      } else if (status === 'formulario_preenchido') {
        navigate("/dashboard");
      } else {
        navigate("/dashboard");
      }
      
    } catch (error: any) {
      toast.error("Erro ao realizar login. Tente novamente.");
      console.error("Erro no login:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gradient-to-br from-lavender-light via-white to-mint-light">
      <Card className="w-full max-w-md mx-auto border-lavender-light/50 shadow-lg animate-fade-in">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-lavender p-3">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Entre com seu número de WhatsApp e senha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de WhatsApp</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input placeholder="11999999999" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input type="password" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-lavender hover:bg-lavender-dark" disabled={isLoading}>
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-center text-sm">
            Não tem uma conta?{" "}
            <Link to="/register" className="underline text-lavender-dark font-medium hover:text-lavender">
              Registre-se
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
