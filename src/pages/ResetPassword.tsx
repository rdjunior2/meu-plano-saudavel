import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

// Componentes de interface
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';

// Validação de formulário
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

// Alerta para feedback
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

// Esquema de validação para o formulário
const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres')
    .max(100, 'A senha não pode exceder 100 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial'
    ),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [invalidLink, setInvalidLink] = useState<boolean>(false);
  
  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });
  
  // Verifica se a URL contém os parâmetros de recuperação de senha
  useEffect(() => {
    const handleHashParams = () => {
      // O Supabase envia os parâmetros após o "#" na URL
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      
      const type = params.get('type');
      
      console.log('Tipo de ação na URL:', type);
      
      // Validar se o tipo é 'recovery'
      if (type !== 'recovery') {
        setInvalidLink(true);
        setError('Link de recuperação inválido ou expirado.');
      }
    };
    
    handleHashParams();
  }, []);
  
  const onSubmit = async (data: ResetPasswordForm) => {
    if (invalidLink) {
      setError('Link de recuperação inválido ou expirado. Solicite um novo link.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Quando o usuário clica no link de recuperação, o Supabase já processa 
      // o token e configura a sessão automaticamente. Então, podemos
      // simplesmente chamar updateUser diretamente.
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      setSuccess(true);
      
      // Limpar o hash da URL por segurança
      window.history.replaceState(null, '', window.location.pathname);
      
      // Redirecionar para a página de login após 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err) {
      console.error('Erro ao redefinir senha:', err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao redefinir sua senha.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Redefinir Senha</CardTitle>
          <CardDescription className="text-center">
            Digite sua nova senha para continuar
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-700">Senha redefinida com sucesso!</AlertTitle>
              <AlertDescription className="text-green-600">
                Você será redirecionado para a página de login em alguns segundos.
              </AlertDescription>
            </Alert>
          )}
          
          {invalidLink && (
            <Alert variant="destructive" className="mb-6">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Link Inválido</AlertTitle>
              <AlertDescription>
                O link de recuperação de senha é inválido ou expirou. 
                <Button 
                  variant="link" 
                  onClick={() => navigate('/login')}
                  className="px-0 text-destructive"
                >
                  Volte para a página de login
                </Button> 
                e solicite um novo link.
              </AlertDescription>
            </Alert>
          )}
          
          {!success && !invalidLink && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Digite sua nova senha" 
                          {...field} 
                        />
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
                      <FormLabel>Confirme a Nova Senha</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Confirme sua nova senha" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="text-xs text-muted-foreground mt-2">
                  <p>A senha deve conter pelo menos:</p>
                  <ul className="list-disc list-inside mt-1">
                    <li>8 caracteres</li>
                    <li>Uma letra maiúscula</li>
                    <li>Uma letra minúscula</li>
                    <li>Um número</li>
                    <li>Um caractere especial (@$!%*?&)</li>
                  </ul>
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processando...' : 'Redefinir Senha'}
                </Button>
              </form>
            </Form>
          )}
          
          {!invalidLink && !success && (
            <div className="mt-4 text-center">
              <Button 
                variant="link" 
                onClick={() => navigate('/login')}
                className="text-sm"
              >
                Voltar para o Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 