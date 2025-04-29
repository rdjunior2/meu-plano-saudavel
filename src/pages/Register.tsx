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
import { Mail, Lock, User, Phone, ArrowRight } from 'lucide-react';
import { logEvent, LogSeverity } from '../services/logs';
import AuthLayout from '@/layouts/AuthLayout';

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

  return (
    <AuthLayout
      title="Crie sua conta"
      subtitle="Comece hoje sua jornada de transformação"
      linkText="Já possui uma conta? Faça login"
      linkTo="/login"
    >
      <Card className="border border-emerald-100">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Botão de registro com Google */}
              <Button
                type="button"
                className="w-full bg-white hover:bg-gray-50 text-gray-800 font-medium py-2 px-4 rounded-md flex items-center justify-center gap-2 border border-gray-300 transition-colors mb-6"
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

              <div className="relative flex items-center justify-center my-4">
                <div className="absolute w-full border-t border-emerald-100"></div>
                <div className="relative bg-white px-4 text-xs text-emerald-600">OU</div>
              </div>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-emerald-700 font-medium">Nome completo</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <User className="absolute left-3 top-2.5 h-5 w-5 text-emerald-600" />
                        <Input 
                          placeholder="Seu nome completo" 
                          className="pl-10 border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
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
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-emerald-700 font-medium">Email</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-emerald-600" />
                        <Input 
                          placeholder="seu@email.com" 
                          className="pl-10 border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
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
                name="phone"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-emerald-700 font-medium">Telefone</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Phone className="absolute left-3 top-2.5 h-5 w-5 text-emerald-600" />
                        <Input 
                          placeholder="(00) 00000-0000" 
                          className="pl-10 border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
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
                    <FormLabel className="text-emerald-700 font-medium">Senha</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-emerald-600" />
                        <Input 
                          placeholder="Sua senha" 
                          type="password" 
                          className="pl-10 border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
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
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-emerald-700 font-medium">Confirmar Senha</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-emerald-600" />
                        <Input 
                          placeholder="Confirme sua senha" 
                          type="password" 
                          className="pl-10 border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm" />
                  </FormItem>
                )}
              />
              
              <p className="text-xs text-slate-500 mt-4">
                Ao se cadastrar, você concorda com nossos <Link to="/termos" className="text-emerald-600 hover:text-emerald-700">Termos de Uso</Link> e <Link to="/privacidade" className="text-emerald-600 hover:text-emerald-700">Política de Privacidade</Link>.
              </p>
              
              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Criando conta...
                  </span>
                ) : (
                  <>Criar minha conta</>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
};

export default Register;
