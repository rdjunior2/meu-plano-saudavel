import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import AuthLayout from '@/layouts/AuthLayout';
import { User } from '@/types/user';

const CriarSenha = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  useEffect(() => {
    // Verificar se o usuário já está logado
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const { data: userData } = await supabase.auth.getUser();
        setUserEmail(userData.user?.email || null);
      } else {
        // Se não está logado, verificar parâmetros na URL
        const params = new URLSearchParams(location.search);
        const email = params.get('email');
        const token = params.get('token');
        
        if (email) {
          setUserEmail(email);
        } else {
          setError('Nenhum email fornecido. Impossível configurar a senha.');
        }
        
        if (!token) {
          setError('Token não encontrado. Impossível configurar a senha.');
        }
      }
    };
    
    checkAuth();
  }, [location]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userEmail) {
      setError('Email não encontrado. Impossível criar senha.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Criar a senha para o usuário
      const { error } = await supabase.auth.updateUser({
        password
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Tentar fazer login com as novas credenciais
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password
      });
      
      if (signInError) {
        throw new Error(signInError.message);
      }
      
      // Se chegou aqui, o login foi bem-sucedido
      if (signInData.session) {
        // Atualizar o estado de autenticação - converter o tipo de usuário do Supabase para o tipo User da aplicação
        const appUser = {
          id: signInData.user.id,
          email: signInData.user.email,
          nome: signInData.user.user_metadata?.nome || 'Usuário',
          telefone: signInData.user.user_metadata?.telefone || '',
          status: 'ativo',
          is_admin: signInData.user.app_metadata?.is_admin || false
        } as User;
        
        login(appUser, signInData.session.access_token);
        
        setSuccess(true);
        toast.success('Senha criada com sucesso! Você será redirecionado para o sistema.');
        
        // Redirecionar após uma pausa
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        throw new Error('Falha ao autenticar com a nova senha.');
      }
    } catch (error: any) {
      console.error('Erro ao criar senha:', error);
      setError(error.message || 'Erro ao criar senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AuthLayout
      title="Crie sua senha"
      subtitle="Configure sua senha para acessar o sistema"
      linkText="Já tem uma senha? Faça login"
      linkTo="/login"
    >
      <Card className="border border-emerald-100">
        <CardContent className="pt-6">
          {success ? (
            <Alert className="bg-emerald-50 border-emerald-200">
              <AlertTitle className="text-emerald-700 font-medium">Senha criada com sucesso!</AlertTitle>
              <AlertDescription className="text-emerald-600">
                Você será redirecionado para o dashboard em instantes.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <AlertTitle className="text-red-700 font-medium">Erro</AlertTitle>
                  <AlertDescription className="text-red-600">{error}</AlertDescription>
                </Alert>
              )}
              
              {userEmail && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertTitle className="text-blue-700 font-medium">
                    Criando senha para: {userEmail}
                  </AlertTitle>
                </Alert>
              )}
              
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-emerald-700 font-medium block">
                  Nova senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-emerald-600" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Sua senha deve ter pelo menos 6 caracteres
                </p>
              </div>
              
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-emerald-700 font-medium block">
                  Confirmar senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-emerald-600" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirme sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Criando senha...' : 'Criar senha e entrar'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
};

export default CriarSenha; 