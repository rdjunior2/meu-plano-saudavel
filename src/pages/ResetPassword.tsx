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
import { AlertCircle, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

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
      setError('A sessão não foi configurada corretamente. Tente novamente.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[ResetPassword] Tentando atualizar senha');
      
      // Atualizar a senha do usuário
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });
      
      if (error) {
        console.error('[ResetPassword] Erro ao atualizar senha:', error);
        throw new Error(error.message);
      }
      
      console.log('[ResetPassword] Senha atualizada com sucesso');
      setSuccess(true);
      
      // Garantir que o usuário esteja autenticado
      const { data: sessionData } = await supabase.auth.getSession();
      
      // Obter dados do usuário para configuração adequada no estado
      if (sessionData.session) {
        const { data: userData } = await supabase.auth.getUser();
        
        if (userData.user) {
          // Armazenar o token na localStorage para o AuthContext e useAuthStore
          localStorage.setItem('token', sessionData.session.access_token);
          
          // Forçar um recarregamento completo da página para atualizar todos os estados
          // Isso evita problemas de hooks e estados inconsistentes
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1500);
          
          return;
        }
      }
      
      // Se não conseguiu obter a sessão, redirecionar para login após 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      console.error('[ResetPassword] Erro ao redefinir senha:', err);
      setError(err.message || 'Ocorreu um erro ao redefinir sua senha.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para solicitar um novo link de redefinição
  const requestNewPasswordResetLink = async () => {
    let emailToUse = userEmail;
    
    if (!emailToUse) {
      // Se não temos o email do usuário, solicitar que ele informe
      const inputEmail = prompt("Por favor, digite seu email para receber um novo link de recuperação:");
      if (!inputEmail) {
        toast.error("É necessário informar um email para receber o link de recuperação.");
        return;
      }
      
      // Validar o email informado
      const emailResult = z.string().email().safeParse(inputEmail);
      if (!emailResult.success) {
        toast.error("Por favor, digite um email válido.");
        return;
      }
      
      emailToUse = inputEmail;
    }
    
    setIsRequestingNewLink(true);
    
    try {
      // Determinar a URL de redirecionamento apropriada
      const origin = window.location.origin;
      const redirectUrl = `${origin}/reset-password`;
      
      console.log('[ResetPassword] Solicitando novo link:', { 
        email: emailToUse,
        redirectUrl
      });
      
      // Adicionar verificação do site URL no Supabase
      const siteUrlsToTry = [
        redirectUrl,
        origin,
        'https://meu-plano-saudavel.vercel.app/reset-password',
        'http://localhost:3000/reset-password'
      ];
      
      let requestError = null;
      
      // Tentar todas as URLs de redirecionamento possíveis até uma funcionar
      for (const redirectTo of siteUrlsToTry) {
        try {
          console.log(`[ResetPassword] Tentando com redirectTo: ${redirectTo}`);
          
          const { error } = await supabase.auth.resetPasswordForEmail(emailToUse, {
            redirectTo,
          });
          
          if (!error) {
            // Se a requisição foi bem-sucedida, sair do loop
            requestError = null;
            break;
          } else {
            requestError = error;
            console.warn(`[ResetPassword] Falha com redirectTo ${redirectTo}:`, error);
          }
        } catch (err) {
          requestError = err;
          console.warn(`[ResetPassword] Exceção com redirectTo ${redirectTo}:`, err);
        }
      }
      
      // Verificar se todas as tentativas falharam
      if (requestError) {
        console.error('[ResetPassword] Todas as tentativas de envio falharam:', requestError);
        throw requestError;
      }
      
      // Se chegamos aqui, significa que pelo menos uma das tentativas funcionou
      toast.success(
        "Email de recuperação enviado! Verifique sua caixa de entrada e spam. O link expira em 1 hora.",
        { duration: 6000 }
      );
      
    } catch (err) {
      console.error('[ResetPassword] Erro ao solicitar novo link:', err);
      toast.error("Não foi possível enviar um novo link. Tente novamente mais tarde.");
    } finally {
      setIsRequestingNewLink(false);
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
                <div className="mt-2 flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    onClick={requestNewPasswordResetLink}
                    disabled={isRequestingNewLink}
                    className="w-full flex gap-2 items-center justify-center"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {isRequestingNewLink ? "Enviando..." : "Solicitar um novo link"}
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => navigate('/login')}
                    className="w-full"
                  >
                    Voltar para a página de login
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Exibir informações adicionais sobre como resolver o problema */}
          {invalidLink && !import.meta.env.PROD && (
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <AlertTitle className="text-blue-700">Informações adicionais</AlertTitle>
              <AlertDescription className="text-blue-600 text-sm">
                <p>Possíveis causas:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>O link foi usado mais de uma vez (links de redefinição são válidos apenas para um uso)</li>
                  <li>O link expirou (links são válidos por 1 hora)</li>
                  <li>O link foi modificado ou truncado no email</li>
                </ul>
                <p className="mt-2">Recomendações:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>Solicite um novo link usando o botão acima</li>
                  <li>Verifique se o email foi recebido (incluindo a pasta de spam)</li>
                  <li>Copie e cole o link completo na barra de endereços</li>
                </ul>
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
          
          {/* Informações de depuração (visíveis apenas em desenvolvimento) */}
          {import.meta.env.DEV && debugInfo && (
            <div className="mt-6 text-xs p-3 bg-gray-100 rounded overflow-auto max-h-40">
              <h4 className="font-bold mb-1">Informações de depuração:</h4>
              <pre>{debugInfo}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}