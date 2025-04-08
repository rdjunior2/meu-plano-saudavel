
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
import { UserPlus, Smartphone, Lock } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

const registerSchema = z.object({
  phone: z.string()
    .min(11, { message: "O número deve ter pelo menos 11 dígitos" })
    .max(15, { message: "O número deve ter no máximo 15 dígitos" })
    .regex(/^\d+$/, { message: "O número deve conter apenas dígitos" }),
  password: z.string()
    .min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
  confirmPassword: z.string()
    .min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      setIsLoading(true);
      
      // Sign up with Supabase using email+password
      // We format the phone as an email to work with Supabase auth
      const email = `${values.phone}@meuplanosaude.app`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password: values.password,
        options: {
          data: {
            phone: values.phone,
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (data.user) {
        // Create a user object from Supabase auth response
        const user = {
          id: data.user.id,
          phone: values.phone,
        };
        
        // Store auth data in the auth store
        login(values.phone, data.session ? data.session.access_token : "", user);
        toast.success("Conta criada com sucesso!");
        navigate("/anamnese");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta. Tente novamente.");
      console.error("Erro no registro:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gradient-to-br from-lavender-light via-white to-mint-light">
      <Card className="w-full max-w-md mx-auto border-lavender-light/50 shadow-lg animate-fade-in">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-mint p-3">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Criar Conta</CardTitle>
          <CardDescription className="text-center">
            Registre-se com seu número de WhatsApp
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
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
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
              <Button type="submit" className="w-full bg-mint hover:bg-mint-dark" disabled={isLoading}>
                {isLoading ? "Criando conta..." : "Criar Conta"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-center text-sm">
            Já tem uma conta?{" "}
            <Link to="/login" className="underline text-lavender-dark font-medium hover:text-lavender">
              Faça login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
