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
      
      // Verificar e corrigir possíveis problemas de autenticação
      try {
        const fixResult = await fixAuthIssues();
        console.log('[Login] Resultado da correção de autenticação:', fixResult);
      } catch (authFixError) {
        console.error('[Login] Erro ao verificar autenticação:', authFixError);
      }
      
      // Usar from do state ou redirecionar para dashboard
      const from = (location.state as any)?.from?.pathname || "/dashboard";
      console.log('[Login] Redirecionando para:', from);
      
      // Aguardar um pouco para garantir que o estado de autenticação seja atualizado
      setTimeout(() => {
        // Verificar token novamente antes de navegar
        const finalToken = localStorage.getItem("token");
        if (finalToken) {
          navigate(from, { replace: true });
        } else {
          console.error('[Login] Token perdido antes da navegação');
          toast.error("Erro de sessão. Por favor, tente fazer login novamente.");
        }
      }, 500);
      
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
    <div className="flex min-h-screen relative bg-gray-950 overflow-hidden py-8">
      {/* Elementos decorativos de fundo */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]"></div>
      
      <div className="w-full flex flex-col items-center justify-center py-4">
        <div className="w-full max-w-md px-4 md:px-0">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white drop-shadow-[0_0_5px_rgba(34,197,94,0.4)]">
              Transforme Seu Corpo, <span className="text-emerald-400">Transforme Sua Vida</span>
            </h1>
            <div className="h-1 w-32 bg-gradient-to-r from-green-500 to-emerald-500 mx-auto mt-4 rounded-full"></div>
          </div>
          
          <Card className="border-none shadow-[0_0_20px_rgba(34,197,94,0.4)] bg-gray-900/80 backdrop-blur-sm animate-fade-in">
            <CardHeader className="space-y-1 pb-4 border-b border-green-500/20">
              <CardTitle className="text-2xl font-bold text-center text-white">Login</CardTitle>
              <CardDescription className="text-center text-emerald-200">
                Entre para acessar seu plano personalizado
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-emerald-300 font-medium">Email</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-green-400 transition-colors group-hover:text-emerald-300" />
                            <Input 
                              placeholder="seu@email.com" 
                              className="pl-10 bg-gray-800 border-green-500/30 text-white focus:border-green-500 focus:ring-1 focus:ring-emerald-500 shadow-[0_0_5px_rgba(34,197,94,0.3)] transition-all" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400 text-sm" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-emerald-300 font-medium">Senha</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-green-400 transition-colors group-hover:text-emerald-300" />
                            <Input 
                              type="password" 
                              className="pl-10 bg-gray-800 border-green-500/30 text-white focus:border-green-500 focus:ring-1 focus:ring-emerald-500 shadow-[0_0_5px_rgba(34,197,94,0.3)] transition-all" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400 text-sm" />
                      </FormItem>
                    )}
                  />
                  
                  <div className="mt-6">
                    <Button 
                      type="submit" 
                      className="relative w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium py-2 overflow-hidden transition-all duration-300"
                      disabled={isLoading}
                    >
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"></span>
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Entrando...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center relative z-10">
                          Acessar Meu Plano <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex justify-center pt-1">
                    <Button 
                      variant="link"
                      type="button"
                      className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                      onClick={handlePasswordReset}
                      disabled={isResetLoading}
                    >
                      {isResetLoading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Enviando...
                        </span>
                      ) : "Esqueceu sua senha?"}
                    </Button>
                  </div>
                  
                  <div className="relative flex items-center justify-center my-4">
                    <div className="absolute w-full border-t border-gray-600"></div>
                    <div className="relative bg-gray-900 px-4 text-xs text-gray-400">OU</div>
                  </div>
                  
                  <Button
                    type="button"
                    className="w-full bg-white hover:bg-gray-100 text-gray-800 font-medium py-2 px-4 rounded-md flex items-center justify-center gap-2 border border-gray-300 transition-colors"
                    onClick={() => navigate('/auth/google')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24" height="24">
                      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                    </svg>
                    <span>Entrar com Google</span>
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="border-t border-green-500/20 pt-4 pb-6 px-6 flex flex-col space-y-4">
              <div className="text-center text-sm text-emerald-200">
                Ainda não tem uma conta?{" "}
                <Link to="/register" className="font-medium text-green-400 hover:text-emerald-300 transition-colors underline">
                  Criar minha conta agora
                </Link>
              </div>
              
              <div className="flex items-center justify-center gap-6 pt-2">
                <div className="text-xs text-emerald-400 flex items-center">
                  <Shield className="h-3 w-3 mr-1 text-green-400" />
                  <span>100% seguro</span>
                </div>
                <div className="text-xs text-emerald-400 flex items-center">
                  <Zap className="h-3 w-3 mr-1 text-emerald-400" />
                  <span>Acesso imediato</span>
                </div>
              </div>
            </CardFooter>
          </Card>
          
          <div className="mt-8 text-center pb-8">
            <p className="text-sm text-emerald-300 mb-2">
              Desenvolvido pela Xsharks Tech
            </p>
            <p className="text-sm text-emerald-300">
              <Link to="/termos" className="text-green-400 hover:text-emerald-300 underline">
                Termos de Uso
              </Link>{" "}
              e{" "}
              <Link to="/privacidade" className="text-green-400 hover:text-emerald-300 underline">
                Política de Privacidade
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
