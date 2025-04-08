import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { useAuthStore } from '@/stores/authStore';
import { KeyRound, Shield } from 'lucide-react';

const criarSenhaSchema = z.object({
  password: z.string()
    .min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
  confirmPassword: z.string()
    .min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type CriarSenhaFormValues = z.infer<typeof criarSenhaSchema>;

const CriarSenha = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { createPassword, loginWithPassword, checkUserByPhone } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState("");
  
  // Extrair o telefone da URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const phoneParam = params.get('phone');
    
    if (!phoneParam) {
      toast.error("Número de telefone não informado");
      navigate('/login');
      return;
    }
    
    // Verificar se o usuário realmente existe e está no status correto
    const verifyUser = async () => {
      const { exists, status } = await checkUserByPhone(phoneParam);
      
      if (!exists) {
        toast.error("Usuário não encontrado");
        navigate('/login');
        return;
      }
      
      if (status !== 'aguardando_formulario') {
        toast.error("Este usuário já possui senha");
        navigate('/login');
        return;
      }
      
      setPhone(phoneParam);
    };
    
    verifyUser();
  }, [location.search, navigate, checkUserByPhone]);
  
  const form = useForm<CriarSenhaFormValues>({
    resolver: zodResolver(criarSenhaSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: CriarSenhaFormValues) => {
    try {
      if (!phone) return;
      
      setIsLoading(true);
      
      // Criar senha
      const { success, error } = await createPassword(phone, values.password);
      
      if (!success) {
        toast.error(error || "Erro ao criar senha. Tente novamente.");
        return;
      }
      
      toast.success("Senha criada com sucesso!");
      
      // Fazer login automático
      const loginResult = await loginWithPassword(phone, values.password);
      
      if (loginResult.success) {
        navigate('/formulario-alimentar');
      } else {
        navigate('/login');
      }
      
    } catch (error: any) {
      toast.error("Erro ao criar senha. Tente novamente.");
      console.error("Erro ao criar senha:", error);
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
              <KeyRound className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Criar Senha</CardTitle>
          <CardDescription className="text-center">
            Defina uma senha para acessar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-md mb-4 flex items-start">
                <Shield className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                <p className="text-sm text-blue-700">
                  Você precisa criar uma senha para acessar seu plano. Esta senha será usada junto com seu número de WhatsApp para fazer login.
                </p>
              </div>
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
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
                    <FormLabel>Confirme a Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full bg-lavender hover:bg-lavender-dark" disabled={isLoading}>
                {isLoading ? "Criando..." : "Criar Senha"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CriarSenha; 