import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoginDebugger from '@/components/dev/LoginDebugger';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, AlertTriangleIcon, CheckCircleIcon } from "lucide-react";
import { supabase } from '@/lib/supabaseClient';
import { Navigate } from 'react-router-dom';

const DebugLogin = () => {
  // Verificar se estamos em ambiente de desenvolvimento
  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';
  
  // Se não estiver em ambiente de desenvolvimento, redirecionar para a página inicial
  if (!isDevelopment) {
    return <Navigate to="/" replace />;
  }

  const [browserInfo, setBrowserInfo] = useState({
    userAgent: '',
    localStorage: false,
    cookiesEnabled: false,
    sessionStorage: false
  });
  const [networkStatus, setNetworkStatus] = useState({
    online: false,
    lastChecked: ''
  });
  const [apiStatus, setApiStatus] = useState({
    supabaseConnected: false,
    checking: false,
    error: ''
  });

  // Verificar recursos do navegador
  useEffect(() => {
    // Obter informações do navegador
    setBrowserInfo({
      userAgent: navigator.userAgent,
      localStorage: isLocalStorageAvailable(),
      cookiesEnabled: navigator.cookieEnabled,
      sessionStorage: isSessionStorageAvailable()
    });

    // Verificar status de rede
    checkNetworkStatus();
    
    // Continuar verificando a cada 30 segundos
    const networkInterval = setInterval(checkNetworkStatus, 30000);
    
    return () => clearInterval(networkInterval);
  }, []);

  // Função para verificar disponibilidade do localStorage
  const isLocalStorageAvailable = () => {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch (e) {
      return false;
    }
  };

  // Função para verificar disponibilidade do sessionStorage
  const isSessionStorageAvailable = () => {
    try {
      sessionStorage.setItem('test', 'test');
      sessionStorage.removeItem('test');
      return true;
    } catch (e) {
      return false;
    }
  };

  // Verificar status da rede
  const checkNetworkStatus = () => {
    setNetworkStatus({
      online: navigator.onLine,
      lastChecked: new Date().toLocaleTimeString()
    });
  };

  // Verificar conexão com o Supabase
  const checkSupabaseConnection = async () => {
    setApiStatus({
      ...apiStatus,
      checking: true,
      error: ''
    });

    try {
      // Ping simples ao Supabase para verificar a conexão
      const { data, error } = await supabase.from('health_check').select('count');
      
      if (error) throw error;
      
      setApiStatus({
        supabaseConnected: true,
        checking: false,
        error: ''
      });
    } catch (error) {
      console.error('Erro na verificação do Supabase:', error);
      setApiStatus({
        supabaseConnected: false,
        checking: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  };

  // Limpar o armazenamento local
  const clearStorages = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      
      // Tentar limpar cookies (simplificado)
      document.cookie.split(";").forEach(cookie => {
        const name = cookie.split("=")[0].trim();
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });
      
      // Recarregar a página para aplicar as alterações
      window.location.reload();
    } catch (e) {
      console.error('Erro ao limpar storages:', e);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <h1 className="text-2xl font-bold mb-8">Ferramentas de Diagnóstico de Login</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Navegador</CardTitle>
            <CardDescription>Detalhes sobre seu navegador e armazenamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-semibold">User Agent:</p>
                <p className="text-sm opacity-80 break-words">{browserInfo.userAgent}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Alert variant={browserInfo.localStorage ? "default" : "destructive"}>
                  <CheckCircleIcon className={browserInfo.localStorage ? "h-4 w-4" : "hidden"} />
                  <AlertTriangleIcon className={!browserInfo.localStorage ? "h-4 w-4" : "hidden"} />
                  <AlertTitle>LocalStorage</AlertTitle>
                  <AlertDescription>{browserInfo.localStorage ? "Disponível" : "Não disponível"}</AlertDescription>
                </Alert>
                
                <Alert variant={browserInfo.cookiesEnabled ? "default" : "destructive"}>
                  <CheckCircleIcon className={browserInfo.cookiesEnabled ? "h-4 w-4" : "hidden"} />
                  <AlertTriangleIcon className={!browserInfo.cookiesEnabled ? "h-4 w-4" : "hidden"} />
                  <AlertTitle>Cookies</AlertTitle>
                  <AlertDescription>{browserInfo.cookiesEnabled ? "Habilitados" : "Desabilitados"}</AlertDescription>
                </Alert>
                
                <Alert variant={browserInfo.sessionStorage ? "default" : "destructive"}>
                  <CheckCircleIcon className={browserInfo.sessionStorage ? "h-4 w-4" : "hidden"} />
                  <AlertTriangleIcon className={!browserInfo.sessionStorage ? "h-4 w-4" : "hidden"} />
                  <AlertTitle>SessionStorage</AlertTitle>
                  <AlertDescription>{browserInfo.sessionStorage ? "Disponível" : "Não disponível"}</AlertDescription>
                </Alert>
                
                <Alert variant={networkStatus.online ? "default" : "destructive"}>
                  <CheckCircleIcon className={networkStatus.online ? "h-4 w-4" : "hidden"} />
                  <AlertTriangleIcon className={!networkStatus.online ? "h-4 w-4" : "hidden"} />
                  <AlertTitle>Conexão</AlertTitle>
                  <AlertDescription>{networkStatus.online ? "Online" : "Offline"}</AlertDescription>
                </Alert>
              </div>
              
              <div className="text-xs text-gray-500">
                Última verificação: {networkStatus.lastChecked}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Status do API</CardTitle>
            <CardDescription>Verificar conexão com serviços externos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Conexão com Supabase:</span>
                {apiStatus.checking ? (
                  <span className="text-yellow-500">Verificando...</span>
                ) : apiStatus.supabaseConnected ? (
                  <span className="text-green-500">Conectado</span>
                ) : (
                  <span className="text-red-500">Não conectado</span>
                )}
              </div>
              
              {apiStatus.error && (
                <Alert variant="destructive">
                  <AlertTriangleIcon className="h-4 w-4" />
                  <AlertTitle>Erro de conexão</AlertTitle>
                  <AlertDescription>{apiStatus.error}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                variant="outline" 
                onClick={checkSupabaseConnection}
                disabled={apiStatus.checking}
              >
                {apiStatus.checking ? 'Verificando...' : 'Verificar conexão com Supabase'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Ações de Diagnóstico</CardTitle>
          <CardDescription>Ferramentas para corrigir problemas comuns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button variant="outline" onClick={clearStorages} className="w-full">
              Limpar Todos os Dados de Navegação
            </Button>
            
            <Button variant="outline" onClick={() => window.location.href = '/login'} className="w-full">
              Ir para Página de Login
            </Button>
            
            <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
              Recarregar Página
            </Button>
            
            <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
              Ir para Página Inicial
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Depurador de Login</CardTitle>
          <CardDescription>Diagnóstico detalhado do estado de autenticação</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginDebugger />
        </CardContent>
      </Card>
    </div>
  );
};

export default DebugLogin; 