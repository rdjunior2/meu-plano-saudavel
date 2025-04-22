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
  const [isSessionSet, setIsSessionSet] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });
  
  // Configura a sessão com os tokens da URL e valida o usuário
  useEffect(() => {
    const setupUserSession = async () => {
      try {
        // O Supabase envia os parâmetros após o "#" na URL
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');
        
        console.log('[ResetPassword] Parâmetros detectados:', { 
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          type
        });
        
        // Validar se temos tokens e o tipo é 'recovery'
        if (!accessToken || !refreshToken || type !== 'recovery') {
          setInvalidLink(true);
          setError('Link de recuperação inválido ou expirado. Solicite um novo link.');
          return;
        }
        
        // Configurar a sessão com os tokens recebidos
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (sessionError) {
          console.error('[ResetPassword] Erro ao configurar sessão:', sessionError);
          setInvalidLink(true);
          setError(`Erro ao validar tokens: ${sessionError.message}`);
          return;
        }
        
        console.log('[ResetPassword] Sessão configurada com sucesso');
        
        // Verificar se o usuário está autenticado
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError || !userData.user) {
          console.error('[ResetPassword] Erro ao obter usuário:', userError);
          setInvalidLink(true);
          setError('Não foi possível validar sua identidade. Solicite um novo link.');
          return;
        }
        
        console.log('[ResetPassword] Usuário autenticado:', userData.user.email);
        setUserEmail(userData.user.email);
        setIsSessionSet(true);
      } catch (err) {
        console.error('[ResetPassword] Erro ao processar parâmetros:', err);
        setInvalidLink(true);
        setError('Ocorreu um erro ao processar o link de recuperação.');
      }
    };
    
    setupUserSession();
  }, []);
  
  const onSubmit = async (data: ResetPasswordForm) => {
    if (invalidLink) {
      setError('Link de recuperação inválido ou expirado. Solicite um novo link.');
      return;
    }
    
    if (!isSessionSet) {
      setError('A sessão não foi configurada corretamente. Tente novamente.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Atualizar a senha do usuário
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
      console.error('[ResetPassword] Erro ao redefinir senha:', err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao redefinir sua senha.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Extraindo campos do formulário para melhorar a legibilidade do JSX
  const passwordField = (
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
  );
  
  const confirmPasswordField = (
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
  );
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Redefinir Senha</CardTitle>
          <CardDescription className="text-center">
            {userEmail ? `Para a conta ${userEmail}` : 'Digite sua nova senha para continuar'}
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
                {passwordField}
                
                {confirmPasswordField}
                
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
                  disabled={isLoading || !isSessionSet}
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