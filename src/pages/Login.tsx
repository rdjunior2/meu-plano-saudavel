import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { useAuthStore } from '@/stores/authStore';
import { useAuthContext } from '@/contexts/AuthContext';
import { Mail, Lock, User, Shield, ArrowRight, CheckCircle, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { logEvent, LogSeverity } from '../services/logs';
import { debugAuthState, fixAuthIssues } from '../utils/authDebug';
import AuthLayout from '@/layouts/AuthLayout';

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
  const location = useLocation();
  const { loginWithEmail } = useAuthStore();
  const { isAuthenticated } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Verificar se o usuário já está autenticado
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      console.log('[Login] Token encontrado no localStorage, redirecionando para dashboard');
      navigate('/dashboard');
    }
  }, [navigate]);

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setIsLoading(true);
      
      console.log('[Login] Tentando fazer login com email:', values.email);
      logEvent('auth_attempt', 'Tentativa de login', LogSeverity.INFO, { email: values.email });
      
      // Limpar qualquer token existente para garantir uma sessão limpa
      localStorage.removeItem('token');
      
      // Tentar fazer login com email
      const { success, error, user, session } = await loginWithEmail(values.email, values.password);
      
      if (!success) {
        console.error('[Login] Falha no login:', error);
        logEvent('auth_failed', 'Falha no login', LogSeverity.WARNING, { error });
        toast.error(error || "Erro ao realizar login. Verifique seus dados.");
        
        // Exibir informações adicionais para depuração
        if (import.meta.env.DEV) {
          console.debug('[Login] Detalhes do erro:', { error });
          
          // Tentar diagnosticar problemas de autenticação no ambiente de desenvolvimento
          try {
            const diagnostics = await debugAuthState();
            console.log('[Login] Diagnóstico de autenticação após falha:', diagnostics);
          } catch (diagError) {
            console.error('[Login] Erro ao executar diagnóstico:', diagError);
          }
        }
        
        return;
      }
      
      // Sucesso no login
      console.log('[Login] Login realizado com sucesso, dados:', { user, hasSession: !!session });
      
      // Garantir que o token está salvo no localStorage
      if (session?.access_token) {
        localStorage.setItem("token", session.access_token);
        
        // Teste de verificação de token
        console.log('[Login] Token salvo no localStorage:', localStorage.getItem("token") === session.access_token);
      } else {
        console.error('[Login] Login bem-sucedido mas sem access_token na sessão');
        toast.error("Erro interno de autenticação. Por favor, tente novamente.");
        return;
      }
      
      // Verificar token após login
      const tokenAfterLogin = localStorage.getItem("token");
      console.log('[Login] Token após login:', !!tokenAfterLogin);
      
      if (!tokenAfterLogin) {
        console.error('[Login] Token não encontrado após login');
        toast.error("Erro ao salvar credenciais. Por favor, verifique as configurações do seu navegador e tente novamente.");
        return;
      }
      
      logEvent('auth_success', 'Login realizado com sucesso', LogSeverity.INFO, { 
        user_id: user?.id,
        hasToken: !!tokenAfterLogin
      });
      
      toast.success("Login realizado com sucesso!");
      
      // Usar from do state ou redirecionar para dashboard
      const from = (location.state as any)?.from?.pathname || "/dashboard";
      console.log('[Login] Redirecionando para:', from);
      
      // Aguardar um pouco para garantir que o estado de autenticação seja atualizado
      setTimeout(() => navigate(from, { replace: true }), 500);
      
    } catch (error: any) {
      console.error('[Login] Erro não tratado durante o login:', error);
      logEvent('auth_error', 'Erro durante o login', LogSeverity.ERROR, { error: error?.message });
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
      // Garantir que a URL seja absoluta (com protocolo) para compatibilidade
      const origin = window.location.origin;
      const redirectUrl = `${origin}/reset-password`;
      
      // Log detalhado para depuração da configuração do Supabase
      console.log('[PasswordReset] Iniciando recuperação de senha:', { 
        email,
        redirectUrl,
        currentLocationFull: window.location.href
      });
      
      // Usar a instância centralizada do Supabase em vez de criar uma nova
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
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
        { duration: 8000 }
      );
      
      // Mostrar instruções adicionais para o usuário
      setTimeout(() => {
        toast.info(
          "Ao clicar no link enviado, você será redirecionado para definir uma nova senha. Se o link não funcionar, solicite um novo na página de login.",
          { duration: 10000 }
        );
      }, 1000);
    } catch (error) {
      console.error('[PasswordReset] Erro completo:', error);
      toast.error("Ocorreu um erro. Tente novamente mais tarde.");
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Acesse sua conta" 
      subtitle="Entre para acessar seu plano personalizado"
      linkText="Não possui uma conta? Cadastre-se"
      linkTo="/register"
    >
      <Card className="border-slate-200 shadow-md">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-slate-700 font-medium">Email</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                        <Input 
                          placeholder="seu@email.com" 
                          className="pl-10 border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-slate-700 font-medium">Senha</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                        <Input 
                          placeholder="Sua senha" 
                          type="password" 
                          className="pl-10 border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm" />
                  </FormItem>
                )}
              />
              
              <Button 
                type="button" 
                variant="link" 
                className="text-sky-600 p-0 h-auto font-normal text-sm" 
                onClick={handlePasswordReset}
                disabled={isResetLoading}
              >
                {isResetLoading ? "Enviando..." : "Esqueceu sua senha?"}
              </Button>
              
              <Button 
                type="submit" 
                className="w-full bg-sky-600 hover:bg-sky-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Entrar
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
};

export default Login;
