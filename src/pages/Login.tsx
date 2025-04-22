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
import { Mail, Lock } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const loginSchema = z.object({
  email: z.string()
    .email({ message: "Email inválido" })
    .min(1, { message: "Email é obrigatório" }),
  password: z.string()
    .min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const { loginWithEmail } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setIsLoading(true);
      
      console.log('[Login] Tentando fazer login com email:', values.email);
      
      // Tentar fazer login com email
      const { success, error, user } = await loginWithEmail(values.email, values.password);
      
      if (!success) {
        console.error('[Login] Falha no login:', error);
        toast.error(error || "Erro ao realizar login. Verifique seus dados.");
        
        // Exibir informações adicionais para depuração
        if (import.meta.env.DEV) {
          console.debug('[Login] Detalhes do erro:', { error });
        }
        
        return;
      }
      
      console.log('[Login] Login realizado com sucesso, redirecionando para /dashboard');
      toast.success("Login realizado com sucesso!");
      navigate("/dashboard");
      
    } catch (error: any) {
      console.error('[Login] Erro não tratado durante o login:', error);
      const errorMessage = error?.message || "Erro ao realizar login. Tente novamente.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      const email = form.getValues("email");
      
      if (!email) {
        toast.error("Por favor, digite seu email primeiro.");
        return;
      }
      
      // Validar o email
      const emailResult = z.string().email().safeParse(email);
      if (!emailResult.success) {
        toast.error("Por favor, digite um email válido.");
        return;
      }
      
      setIsResetLoading(true);
      
      // Determinar a URL de redirecionamento apropriada
      // Usar a origem atual para funcionamento em desenvolvimento e produção
      const url = window.location.origin;
      const redirectUrl = `${url}/reset-password`;
      
      // Log detalhado para depuração da configuração do Supabase
      console.log('[PasswordReset] Detalhes da configuração:', { 
        email,
        redirectUrl,
        origin: window.location.origin,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'Usando URL padrão',
        supabaseAnonKeyLength: (import.meta.env.VITE_SUPABASE_ANON_KEY || 'N/A').toString().length,
        supabaseAnonKeyStart: (import.meta.env.VITE_SUPABASE_ANON_KEY || 'N/A').toString().substring(0, 10),
        isLocalhost: window.location.hostname === 'localhost',
        fullURL: window.location.href
      });
      
      // Criando uma nova instância do cliente Supabase com a chave fixa
      // para garantir que a chave anônima seja válida
      const supabaseUrl = 'https://ykepyxcjsnvesbkuxgmv.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZXB5eGNqc252ZXNia3V4Z212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk2NzY5NzAsImV4cCI6MjAyNTI1Mjk3MH0.Yx_QXKHf_ED_WTVkw2pGPQE5UgJhHCQF_-dkTBxvEbY';
      
      // Importação dinâmica para evitar problemas de ciclo de referência
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
      
      // Chamada para o Supabase para iniciar o processo de recuperação de senha
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      
      if (error) {
        console.error('[PasswordReset] Erro ao enviar email de recuperação:', error);
        toast.error(error.message || "Erro ao enviar o email de recuperação.");
        return;
      }
      
      // Exibir um toast mais informativo
      toast.success(
        "Email de recuperação enviado! Verifique sua caixa de entrada e spam. O link expira em 1 hora.",
        { duration: 6000 }
      );
    } catch (error) {
      console.error('[PasswordReset] Erro completo:', error);
      toast.error("Ocorreu um erro. Tente novamente mais tarde.");
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gradient-to-br from-lavender-light via-white to-mint-light">
      <Card className="w-full max-w-md mx-auto border-lavender-light/50 shadow-lg animate-fade-in">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-lavender p-3">
              <Mail className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Entre com seu email e senha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input placeholder="seu@email.com" className="pl-10" {...field} />
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
              
              <div className="flex justify-center pt-2">
                <Button 
                  variant="link"
                  type="button"
                  className="text-sm text-lavender-dark hover:text-lavender"
                  onClick={handlePasswordReset}
                  disabled={isResetLoading}
                >
                  {isResetLoading ? "Enviando..." : "Esqueceu sua senha?"}
                </Button>
              </div>
              
              {/* Adicionar informações sobre recuperação de senha */}
              <div className="text-xs text-muted-foreground text-center mt-1">
                Insira seu email e clique em "Esqueceu sua senha?" para receber
                um link de redefinição por email
              </div>
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
