import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Info, Check, X, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

/**
 * Componente para diagnóstico de problemas de login
 * APENAS PARA AMBIENTE DE DESENVOLVIMENTO
 */
const LoginDebugger = () => {
  const [sessionStatus, setSessionStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const [tokenStatus, setTokenStatus] = useState<'checking' | 'exists' | 'missing'>('checking');
  const [cookieStatus, setCookieStatus] = useState<'checking' | 'exists' | 'missing'>('checking');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDebugger, setShowDebugger] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [tokens, setTokens] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  const { isAuthenticated, user: authUser } = useAuthStore();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Verificar token no localStorage
        const token = localStorage.getItem('token');
        setTokenStatus(token ? 'exists' : 'missing');
        
        // Verificar cookies
        const accessToken = document.cookie.includes('access_token');
        setCookieStatus(accessToken ? 'exists' : 'missing');
        
        // Verificar sessão do Supabase
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          setError(error.message);
          setSessionStatus('invalid');
        } else if (data.session) {
          setSessionStatus('valid');
          
          // Buscar perfil do usuário
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.session.user.id)
              .single();
              
            if (profileError) {
              setError(`Erro ao buscar perfil: ${profileError.message}`);
            } else {
              setUserProfile(profile);
            }
          } catch (e) {
            setError(`Erro ao processar perfil: ${e}`);
          }
        } else {
          setSessionStatus('invalid');
        }
      } catch (e) {
        setError(`Erro ao verificar autenticação: ${e}`);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  const toggleDebugger = () => {
    setShowDebugger(prev => !prev);
  };
  
  const handleFixTokens = async () => {
    if (sessionStatus === 'valid' && tokenStatus === 'missing') {
      // Se houver uma sessão válida, mas não há token no localStorage
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          localStorage.setItem('token', data.session.access_token);
          setTokenStatus('exists');
        }
      } catch (error) {
        console.error('Erro ao obter sessão:', error);
      }
    } else if (sessionStatus === 'invalid' && tokenStatus === 'exists') {
      // Se houver um token no localStorage, mas não há sessão válida
      localStorage.removeItem('token');
      setTokenStatus('missing');
    }
  };

  // Função para atualizar os dados de autenticação
  const refreshAuthData = async () => {
    setLoading(true);
    try {
      // Obter sessão atual
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Erro ao obter sessão:', sessionError);
      }
      
      // Obter usuário atual
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Erro ao obter usuário:', userError);
      }
      
      // Definir dados de autenticação no estado
      setSession(currentSession);
      setUser(currentUser);
      
      // Extrair tokens se disponíveis
      if (currentSession) {
        setTokens({
          access_token: currentSession.access_token,
          refresh_token: currentSession.refresh_token,
          expires_at: new Date(currentSession.expires_at * 1000).toLocaleString(),
        });
      } else {
        setTokens(null);
      }
      
      // Atualizar timestamp
      setLastUpdated(new Date().toLocaleString());
    } catch (error) {
      console.error('Erro ao atualizar dados de autenticação:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados na montagem do componente
  useEffect(() => {
    refreshAuthData();
    
    // Configurar listener para mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Evento de autenticação:', event);
        refreshAuthData();
      }
    );
    
    return () => {
      // Limpar listener ao desmontar
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const renderJsonView = (data: any) => {
    if (!data) return <p className="text-muted-foreground">Nenhum dado disponível</p>;
    
    return (
      <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 text-xs">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  // Função para copiar para a área de transferência
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Copiado para a área de transferência');
      })
      .catch(err => {
        console.error('Erro ao copiar:', err);
      });
  };

  // Função para simular um logout
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      refreshAuthData();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={toggleDebugger}
        className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300"
      >
        <Info className="h-4 w-4 mr-2" />
        Login Debugger
      </Button>
      
      {showDebugger && (
        <Card className="absolute bottom-12 right-0 w-[400px] shadow-lg border-yellow-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Diagnóstico de Login
            </CardTitle>
            <CardDescription>
              Esta ferramenta ajuda a identificar problemas de autenticação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Estado do AuthStore:</span>
                <span className={isAuthenticated ? "text-green-600" : "text-red-600"}>
                  {isAuthenticated ? "Autenticado" : "Não autenticado"}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span>Token no localStorage:</span>
                <span className={tokenStatus === 'exists' ? "text-green-600" : "text-red-600"}>
                  {tokenStatus === 'checking' ? "Verificando..." : tokenStatus === 'exists' ? "Presente" : "Ausente"}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span>Cookies de autenticação:</span>
                <span className={cookieStatus === 'exists' ? "text-green-600" : "text-red-600"}>
                  {cookieStatus === 'checking' ? "Verificando..." : cookieStatus === 'exists' ? "Presente" : "Ausente"}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span>Sessão do Supabase:</span>
                <span className={sessionStatus === 'valid' ? "text-green-600" : "text-red-600"}>
                  {sessionStatus === 'checking' ? "Verificando..." : sessionStatus === 'valid' ? "Válida" : "Inválida"}
                </span>
              </div>
            </div>
            
            {error && (
              <Alert variant="destructive" className="py-2">
                <X className="h-4 w-4" />
                <AlertTitle className="text-xs">Erro Detectado</AlertTitle>
                <AlertDescription className="text-xs overflow-auto max-h-20">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            {userProfile && (
              <div className="border rounded p-2 space-y-1">
                <h4 className="font-medium text-gray-700">Dados do Usuário:</h4>
                <div className="text-xs space-y-1">
                  <p><span className="font-medium">ID:</span> {userProfile.id}</p>
                  <p><span className="font-medium">Nome:</span> {userProfile.nome || 'N/A'}</p>
                  <p><span className="font-medium">Email:</span> {userProfile.email || 'N/A'}</p>
                  <p><span className="font-medium">Admin:</span> {userProfile.is_admin ? 'Sim' : 'Não'}</p>
                </div>
              </div>
            )}
            
            <div className="border rounded p-2 space-y-1">
              <h4 className="font-medium text-gray-700">Diagnóstico:</h4>
              <div className="text-xs space-y-1">
                {sessionStatus === 'valid' && tokenStatus === 'exists' && isAuthenticated ? (
                  <p className="text-green-600 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Autenticação funcionando corretamente.
                  </p>
                ) : (
                  <>
                    {sessionStatus === 'invalid' && (
                      <p className="text-red-600 flex items-center gap-1">
                        <X className="h-3 w-3" /> Não há sessão válida no Supabase.
                      </p>
                    )}
                    {tokenStatus === 'missing' && (
                      <p className="text-red-600 flex items-center gap-1">
                        <X className="h-3 w-3" /> Token ausente no localStorage.
                      </p>
                    )}
                    {!isAuthenticated && (
                      <p className="text-red-600 flex items-center gap-1">
                        <X className="h-3 w-3" /> AuthStore não está marcando como autenticado.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleFixTokens}
              disabled={!(
                (sessionStatus === 'valid' && tokenStatus === 'missing') || 
                (sessionStatus === 'invalid' && tokenStatus === 'exists')
              )}
            >
              Tentar Corrigir
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Recarregar Página
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default LoginDebugger; 