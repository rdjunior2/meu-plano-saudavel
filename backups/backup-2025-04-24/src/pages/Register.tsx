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
import { Mail, Lock, User, AlertCircle, Shield, ArrowRight, CheckCircle, Phone, Zap, Sparkles, Star } from 'lucide-react';
import { logEvent, LogSeverity } from '../services/logs';
import { Separator } from '@/components/ui/separator';

// Manter a validação consistente entre diferentes páginas
const phoneRegex = /^(?:\+\d{1,3})?\s*\(?\d{2}\)?[\s.-]?\d{4,5}[\s.-]?\d{4}$/;

// Esquema de validação do formulário de registro
const registerSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  email: z.string()
    .email({ message: "Email inválido" })
    .min(1, { message: "Email é obrigatório" }),
  phone: z.string()
    .regex(phoneRegex, { message: "Telefone inválido. Use o formato (99) 99999-9999" }),
  password: z.string()
    .min(6, { message: "A senha deve ter pelo menos 6 caracteres" })
    .max(100)
    .regex(/[A-Z]/, { message: "A senha deve ter pelo menos uma letra maiúscula" })
    .regex(/[0-9]/, { message: "A senha deve ter pelo menos um número" }),
  confirmPassword: z.string(),
})
.refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const navigate = useNavigate();
  const { registerWithEmail, signInWithGoogle } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      setIsLoading(true);
      
      console.log('[Register] Tentando registrar com email:', values.email);
      logEvent('register_attempt', 'Tentativa de registro', LogSeverity.INFO, { email: values.email });
      
      // Chamada para o registro com email usando o authStore
      const { success, error, user } = await registerWithEmail(
        values.email,
        values.password,
        {
          nome: values.name,
          telefone: values.phone
        }
      );
      
      if (!success) {
        console.error('[Register] Falha no registro:', error);
        logEvent('register_failed', 'Falha no registro', LogSeverity.WARNING, { error });
        
        // Verificar se o erro é específico
        if (error?.includes('email address is already registered')) {
          toast.error("Este email já está registrado. Tente fazer login ou recuperar sua senha.");
          return;
        }
        
        toast.error(error || "Erro ao realizar o registro. Tente novamente.");
        return;
      }
      
      // Sucesso no registro
      console.log('[Register] Registro realizado com sucesso, dados:', { userId: user?.id });
      logEvent('register_success', 'Registro realizado com sucesso', LogSeverity.INFO, { 
        user_id: user?.id 
      });
      
      // Exibir toast de sucesso com informações sobre a confirmação por email
      toast.success("Registro realizado com sucesso! Verificamos seu email para ativar sua conta.");
      
      // Mostrar instruções adicionais após um breve intervalo
      setTimeout(() => {
        toast.info(
          "Enviamos um link de confirmação para seu email. Por favor, verifique sua caixa de entrada e pasta de spam.",
          { duration: 8000 }
        );
      }, 1500);
      
      // Redirecionar para a página de login após registro bem-sucedido
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error: any) {
      console.error('[Register] Erro não tratado durante o registro:', error);
      logEvent('register_error', 'Erro durante o registro', LogSeverity.ERROR, { error: error?.message });
      toast.error("Erro ao criar conta. Por favor, tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      
      console.log('[Register] Iniciando registro com Google');
      logEvent('auth_google_attempt', 'Tentativa de registro com Google', LogSeverity.INFO);
      
      const { success, url, error } = await signInWithGoogle();
      
      if (!success || !url) {
        console.error('[Register] Falha no início do registro com Google:', error);
        logEvent('auth_google_failed', 'Falha ao iniciar registro com Google', LogSeverity.WARNING, { error });
        toast.error(error || "Erro ao iniciar registro com Google. Tente novamente.");
        return;
      }
      
      // Sucesso - redireciona para a URL do Supabase para continuar o fluxo de autenticação
      console.log('[Register] Redirecionando para autenticação com Google');
      window.location.href = url;
      
    } catch (error: any) {
      console.error('[Register] Erro não tratado durante o registro com Google:', error);
      logEvent('auth_google_error', 'Erro durante registro com Google', LogSeverity.ERROR, { error: error?.message });
      toast.error("Erro ao iniciar registro com Google. Por favor, tente novamente.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Lista de benefícios de se registrar
  const benefits = [
    {
      title: "Planos 100% Personalizados",
      description: "Dieta exclusiva baseada no seu biotipo e objetivos específicos",
      icon: <Sparkles className="h-6 w-6 text-green-400" />,
    },
    {
      title: "Treinos de Alta Performance",
      description: "Exercícios otimizados para resultados rápidos e duradouros",
      icon: <Star className="h-6 w-6 text-emerald-400" />,
    },
    {
      title: "Assistente Nutricional 24/7",
      description: "Tire dúvidas e receba orientações a qualquer momento do dia",
      icon: <CheckCircle className="h-6 w-6 text-green-400" />,
    },
    {
      title: "Acompanhamento Detalhado",
      description: "Monitore sua evolução e celebre cada conquista do seu progresso",
      icon: <Zap className="h-6 w-6 text-emerald-400" />,
    }
  ];

  return (
    <div className="flex min-h-screen relative bg-gray-950 overflow-hidden py-8">
      {/* Elementos decorativos de fundo */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]"></div>
      
      <div className="flex flex-col md:flex-row w-full py-4">
        {/* Coluna esquerda (visível apenas em telas maiores) */}
        <div className="hidden md:flex md:w-1/2 p-6 items-start justify-center relative z-10 pt-8">
          <div className="max-w-md animate-float">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white drop-shadow-[0_0_5px_rgba(34,197,94,0.4)]">Transforme seu corpo, renove sua vida</h2>
              <p className="text-emerald-300 text-lg">Comece hoje mesmo sua jornada de transformação com um plano feito exclusivamente para você.</p>
              
              <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 space-y-5 shadow-[0_0_20px_rgba(34,197,94,0.4)] border border-green-500/20">
                <h3 className="text-xl font-bold text-white mb-4">Benefícios Exclusivos Para Você</h3>
                <ul className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="mt-1">{benefit.icon}</div>
                      <div>
                        <h4 className="font-medium text-emerald-200">{benefit.title}</h4>
                        <p className="text-emerald-300 text-sm">{benefit.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-4 border-t border-green-500/20">
                  <p className="text-emerald-200 text-sm font-medium">Junte-se a + de 10.000 pessoas que já transformaram seus corpos com nosso método comprovado.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Coluna direita - Formulário de registro */}
        <div className="w-full md:w-1/2 flex items-start justify-center p-4 sm:p-6 z-10 pt-6">
          <div className="w-full max-w-md">
            <div className="text-center mb-6 md:hidden">
              <h1 className="text-3xl font-bold text-white mt-4 drop-shadow-[0_0_5px_rgba(34,197,94,0.4)]">Crie sua conta</h1>
              <p className="text-emerald-300 mt-2">Comece hoje sua jornada de transformação</p>
            </div>
            
            <Card className="border-none shadow-[0_0_20px_rgba(34,197,94,0.4)] bg-gray-900/80 backdrop-blur-sm animate-fade-in">
              <CardHeader className="space-y-1 border-b border-green-500/20">
                <CardTitle className="text-2xl font-bold text-center text-white">Cadastro</CardTitle>
                <CardDescription className="text-center text-emerald-200">
                  Crie sua conta para acessar seu plano personalizado
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Botão de login com Google */}
                <Button
                  type="button"
                  className="w-full bg-white hover:bg-gray-100 text-gray-800 font-medium py-2 px-4 mb-6 rounded-md flex items-center justify-center gap-2 border border-gray-300 transition-colors"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Conectando...
                    </span>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24" height="24">
                        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                      </svg>
                      <span>Cadastrar com Google</span>
                    </>
                  )}
                </Button>

                <div className="relative flex items-center justify-center mb-6">
                  <Separator className="bg-gray-600" />
                  <span className="absolute px-4 text-xs font-medium text-gray-400 bg-gray-900">OU</span>
                </div>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-emerald-300 font-medium">Nome completo</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <User className="absolute left-3 top-2.5 h-5 w-5 text-green-400 transition-colors group-hover:text-emerald-300" />
                              <Input 
                                placeholder="Seu nome completo" 
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
                      name="email"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-emerald-300 font-medium">Email</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-green-400 transition-colors group-hover:text-emerald-300" />
                              <Input 
                                placeholder="seu@email.com" 
                                type="email" 
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
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-emerald-300 font-medium">Telefone</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <Phone className="absolute left-3 top-2.5 h-5 w-5 text-green-400 transition-colors group-hover:text-emerald-300" />
                              <Input 
                                placeholder="(00) 00000-0000" 
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
                          <p className="text-xs text-emerald-300">Sua senha deve ter no mínimo 6 caracteres, incluir uma letra maiúscula e um número.</p>
                          <FormMessage className="text-red-400 text-sm" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-emerald-300 font-medium">Confirme sua senha</FormLabel>
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
                            Criando conta...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center relative z-10">
                            Começar Minha Transformação <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                        )}
                      </Button>
                    </div>
                    
                    <div className="text-center mt-4">
                      <p className="text-xs text-emerald-300 flex items-center justify-center">
                        <AlertCircle className="h-3 w-3 mr-1 text-green-400" />
                        <span>Acesso imediato após confirmação do email</span>
                      </p>
                    </div>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="border-t border-green-500/20 pt-4 pb-6 px-6 flex flex-col space-y-4">
                <div className="text-center text-sm text-emerald-200">
                  Já tem uma conta?{" "}
                  <Link to="/login" className="font-medium text-green-400 hover:text-emerald-300 transition-colors underline">
                    Acessar meu plano
                  </Link>
                </div>
                
                <div className="flex items-center justify-center gap-6 pt-2">
                  <div className="text-xs text-emerald-400 flex items-center">
                    <Shield className="h-3 w-3 mr-1 text-green-400" />
                    <span>100% seguro</span>
                  </div>
                  <div className="text-xs text-emerald-400 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1 text-emerald-400" />
                    <span>Satisfação garantida</span>
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
    </div>
  );
};

export default Register;
