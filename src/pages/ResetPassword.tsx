import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
import { AlertCircle, CheckCircle2, XCircle, RefreshCw, Lock } from 'lucide-react';
import { toast } from 'sonner';
import AuthLayout from '@/layouts/AuthLayout';

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
  const [isRequestingNewLink, setIsRequestingNewLink] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
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
        console.log('[ResetPassword] Iniciando verificação de tokens na URL');
        console.log('[ResetPassword] URL completa:', window.location.href);
        
        // Estratégia 1: Verificar se já existe uma sessão ativa
        const { data: existingSession } = await supabase.auth.getSession();
        if (existingSession.session) {
          console.log('[ResetPassword] Sessão existente encontrada');
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (!userError && userData.user) {
            console.log('[ResetPassword] Usuário já autenticado:', userData.user.email);
            setUserEmail(userData.user.email);
            setIsSessionSet(true);
            return;
          }
        }
        
        // Estratégia 2: Tentar obter tokens de diferentes partes da URL
        console.log('[ResetPassword] Verificando tokens na URL');
        
        // Verificar tanto o hash (#) quanto os parâmetros de consulta (?) da URL
        let accessToken = null;
        let refreshToken = null;
        let type = null;
        let tokensSource = 'nenhum';
        
        // 2.1 Verificar no hash (formato #access_token=...)
        const hash = window.location.hash.substring(1);
        if (hash) {
          console.log('[ResetPassword] Verificando tokens no hash da URL');
          const hashParams = new URLSearchParams(hash);
          accessToken = hashParams.get('access_token');
          refreshToken = hashParams.get('refresh_token');
          type = hashParams.get('type');
          
          if (accessToken && refreshToken) {
            tokensSource = 'hash';
            console.log('[ResetPassword] Tokens encontrados no hash da URL');
          }
        }
        
        // 2.2 Verificar na query string (formato ?access_token=...)
        if (!accessToken || !refreshToken) {
          console.log('[ResetPassword] Verificando tokens na query string');
          const queryParams = new URLSearchParams(window.location.search);
          accessToken = queryParams.get('access_token');
          refreshToken = queryParams.get('refresh_token');
          type = queryParams.get('type');
          
          if (accessToken && refreshToken) {
            tokensSource = 'query';
            console.log('[ResetPassword] Tokens encontrados na query string');
          }
        }
        
        // 2.3 Verificar token do Supabase no formato especial de URLs de recuperação
        // O Supabase às vezes usa um formato tipo: /reset-password#token=eyJhbGc...
        if (!accessToken && hash && hash.startsWith('token=')) {
          console.log('[ResetPassword] Verificando token especial do Supabase');
          const token = hash.substring(6); // Remove 'token='
          
          if (token) {
            // Alguns fluxos do Supabase usam apenas um token para recuperação
            tokensSource = 'token_especial';
            console.log('[ResetPassword] Token especial encontrado');
            
            // Tentar definir a sessão usando apenas o token
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'recovery',
            });
            
            if (!error && data.session) {
              console.log('[ResetPassword] Sessão verificada com token especial');
              setUserEmail(data.user?.email || null);
              setIsSessionSet(true);
              return;
            } else {
              console.error('[ResetPassword] Erro ao verificar token especial:', error);
            }
          }
        }
        
        // 2.4 Verificar no localStorage como último recurso
        if (!accessToken || !refreshToken) {
          console.log('[ResetPassword] Verificando tokens no localStorage');
          const storedSession = localStorage.getItem('meu-plano-saude-auth-storage');
          
          if (storedSession) {
            try {
              const sessionData = JSON.parse(storedSession);
              if (sessionData?.session?.access_token && sessionData?.session?.refresh_token) {
                accessToken = sessionData.session.access_token;
                refreshToken = sessionData.session.refresh_token;
                tokensSource = 'localStorage';
                console.log('[ResetPassword] Tokens encontrados no localStorage');
              }
            } catch (e) {
              console.error('[ResetPassword] Erro ao parsear sessão do localStorage:', e);
            }
          }
        }

        // Informações para depuração
        const debug = {
          tokensSource,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          type,
          url: window.location.href,
          urlOrigin: window.location.origin
        };
        
        console.log('[ResetPassword] Informações de depuração:', debug);
        setDebugInfo(JSON.stringify(debug, null, 2));
        
        // Tentar configurar a sessão se tokens foram encontrados
        if (accessToken && refreshToken) {
          console.log('[ResetPassword] Tentando configurar sessão com os tokens encontrados');
          
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
          return;
        }
        
        // Estratégia 3: Último recurso - tentar recuperar a sessão através do verifyOtp
        // Isso é necessário para links que não contêm tokens explícitos
        console.log('[ResetPassword] Tentando verificar se há um fluxo de OTP ativo');
        
        // Se todas as tentativas anteriores falharam, exibir o erro
        setInvalidLink(true);
        setError('Link de recuperação inválido ou expirado. Solicite um novo link.');
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
      setError('Sua sessão não foi estabelecida. Solicite um novo link de recuperação.');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('[ResetPassword] Iniciando alteração de senha');
      
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password
      });
      
      if (updateError) {
        console.error('[ResetPassword] Erro ao atualizar senha:', updateError);
        setError(`Erro ao atualizar senha: ${updateError.message}`);
        return;
      }
      
      console.log('[ResetPassword] Senha atualizada com sucesso');
      setSuccess(true);
      
      // Exibir mensagem de sucesso
      toast.success('Senha redefinida com sucesso!');
      
      // Redirecionar para login após algum tempo
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      console.error('[ResetPassword] Erro inesperado ao redefinir senha:', error);
      setError('Ocorreu um erro inesperado. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const requestNewPasswordResetLink = async () => {
    try {
      setIsRequestingNewLink(true);
      
      // Verificar se temos o email do usuário para reenviar
      if (!userEmail) {
        toast.error('Email não disponível. Por favor, volte à página de login e use a opção "Esqueci minha senha".');
        return;
      }
      
      // Determinar a URL de redirecionamento
      const origin = window.location.origin;
      const redirectUrl = `${origin}/reset-password`;
      
      console.log('[ResetPassword] Enviando novo link para:', userEmail);
      
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: redirectUrl
      });
      
      if (error) {
        console.error('[ResetPassword] Erro ao solicitar novo link:', error);
        toast.error(`Erro ao enviar novo link: ${error.message}`);
        return;
      }
      
      toast.success(
        `Novo link de recuperação enviado para ${userEmail}. 
        Verifique sua caixa de entrada e pasta de spam.`
      );
    } catch (error: any) {
      console.error('[ResetPassword] Erro inesperado ao solicitar novo link:', error);
      toast.error('Ocorreu um erro ao solicitar novo link. Tente novamente mais tarde.');
    } finally {
      setIsRequestingNewLink(false);
    }
  };

  return (
    <AuthLayout
      title="Redefinir sua senha"
      subtitle="Digite sua nova senha para recuperar o acesso à sua conta"
      linkText="Voltar para o login"
      linkTo="/login"
    >
      <Card className="border border-emerald-100">
        <CardContent className="pt-6">
          {success ? (
            <div className="space-y-4">
              <Alert className="bg-emerald-50 border-emerald-200">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <AlertTitle className="text-emerald-700 font-medium">Senha redefinida com sucesso!</AlertTitle>
                <AlertDescription className="text-emerald-600">
                  Sua senha foi atualizada. Você será redirecionado para a página de login em instantes.
                </AlertDescription>
              </Alert>
              
              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-4"
                onClick={() => navigate('/login')}
              >
                Ir para o login
              </Button>
            </div>
          ) : invalidLink ? (
            <div className="space-y-4">
              <Alert className="bg-red-50 border-red-200">
                <XCircle className="h-5 w-5 text-red-600" />
                <AlertTitle className="text-red-700 font-medium">Link inválido ou expirado</AlertTitle>
                <AlertDescription className="text-red-600">
                  {error || 'O link de recuperação é inválido ou expirou. Solicite um novo link.'}
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col space-y-4 mt-4">
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={requestNewPasswordResetLink}
                  disabled={isRequestingNewLink || !userEmail}
                >
                  {isRequestingNewLink ? (
                    <span className="flex items-center">
                      <RefreshCw className="animate-spin mr-2 h-4 w-4" />
                      Enviando...
                    </span>
                  ) : (
                    'Solicitar novo link'
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => navigate('/login')}
                >
                  Voltar para o login
                </Button>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert className="bg-red-50 border-red-200 mb-4">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <AlertTitle className="text-red-700 font-medium">Erro</AlertTitle>
                    <AlertDescription className="text-red-600">{error}</AlertDescription>
                  </Alert>
                )}
                
                {userEmail && (
                  <Alert className="bg-blue-50 border-blue-200 mb-4">
                    <AlertTitle className="text-blue-700 font-medium">
                      Redefinindo senha para: {userEmail}
                    </AlertTitle>
                  </Alert>
                )}
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-emerald-700 font-medium">Nova senha</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-2.5 h-5 w-5 text-emerald-600" />
                          <Input 
                            placeholder="Digite sua nova senha" 
                            type="password" 
                            className="pl-10 border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <p className="text-xs text-slate-500">
                        Sua senha deve ter pelo menos 8 caracteres, incluir uma letra maiúscula, 
                        uma minúscula, um número e um caractere especial.
                      </p>
                      <FormMessage className="text-red-500 text-sm" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-emerald-700 font-medium">Confirmar senha</FormLabel>
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
                
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={isLoading || !isSessionSet}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <RefreshCw className="animate-spin mr-2 h-4 w-4" />
                      Redefinindo senha...
                    </span>
                  ) : (
                    'Redefinir senha'
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}