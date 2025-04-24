import { supabase } from '@/lib/supabaseClient'
import Cookies from 'js-cookie'
import { User } from '../types/user'
import { syncAuthToken } from '@/lib/supabaseClient'
import { PurchaseStatus, PlanStatus, FormStatus } from '@/integrations/supabase/types'

const COOKIE_OPTIONS = {
  secure: import.meta.env.PROD, // Secure em produção
  sameSite: import.meta.env.PROD ? 'none' as const : 'lax' as const, // Alterar para 'none' em produção
  expires: 7, // 7 dias
  domain: import.meta.env.PROD ? window.location.hostname.split('.').slice(-2).join('.') : undefined // Define o domínio em produção
}

/**
 * Armazena tokens de autenticação em cookies HttpOnly quando possível
 * ou em cookies comuns com opções de segurança em clientes
 */
export const setAuthCookies = (session: any) => {
  if (!session) return
  
  console.log('Configurando cookies de autenticação', { domain: COOKIE_OPTIONS.domain, sameSite: COOKIE_OPTIONS.sameSite });
  Cookies.set('access_token', session.access_token, COOKIE_OPTIONS)
  Cookies.set('refresh_token', session.refresh_token, COOKIE_OPTIONS)
  
  // Armazenar token no localStorage para sincronização com hooks
  localStorage.setItem('token', session.access_token)
  
  // Sincronizar tokens com o supabaseClient
  syncAuthToken()
}

/**
 * Remove cookies de autenticação no logout
 */
export const clearAuthCookies = () => {
  console.log('Removendo cookies de autenticação');
  Cookies.remove('access_token', { domain: COOKIE_OPTIONS.domain })
  Cookies.remove('refresh_token', { domain: COOKIE_OPTIONS.domain })
  localStorage.removeItem('token')
}

/**
 * Verifica se a sessão atual é válida e a atualiza se necessário
 * @returns A sessão atualizada ou null se expirada
 */
export const checkSession = async () => {
  try {
    console.log('Verificando sessão atual');
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Erro ao verificar sessão:', error)
      return null
    }
    
    if (!data.session) {
      console.log('Nenhuma sessão encontrada');
      return null
    }
    
    console.log('Sessão ativa encontrada, atualizando cookies');
    setAuthCookies(data.session)
    return data.session
  } catch (error) {
    console.error('Erro ao verificar sessão:', error)
    return null
  }
}

/**
 * Realiza login com email e senha
 */
export const loginWithEmail = async (email: string, password: string) => {
  try {
    console.log('Tentando login com:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('Erro ao fazer login:', error)
      return { success: false, error: error.message || 'Email ou senha incorretos.' }
    }
    
    console.log('Login bem-sucedido, configurando cookies e localStorage');
    // Definir token no localStorage para persistência
    localStorage.setItem('token', data.session.access_token);
    // Configurar também os cookies (para as APIs que usam cookies para auth)
    setAuthCookies(data.session);
    
    // Sincronizar token e atualizar cliente API
    syncAuthToken();
    
    console.log('Buscando perfil do usuário:', data.user.id);
    const profile = await getUserProfile(data.user.id)
    
    if (!profile) {
      console.error('Perfil não encontrado para o usuário:', data.user.id);
      return { success: false, error: 'Erro ao buscar dados do perfil.' }
    }
    
    console.log('Perfil encontrado:', profile);
    return { 
      success: true, 
      user: profile, 
      session: data.session 
    }
  } catch (error) {
    console.error('Erro ao fazer login:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.' }
  }
}

/**
 * Registra um novo usuário
 */
export const registerUser = async (
  email: string, 
  password: string, 
  userData: Partial<User>
) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome: userData.nome,
          telefone: userData.telefone
        }
      }
    })
    
    if (error) {
      console.error('Erro ao registrar usuário:', error)
      return { success: false, error: error.message }
    }
    
    setAuthCookies(data.session)
    
    // Criar perfil do usuário
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user?.id,
        nome: userData.nome,
        telefone: userData.telefone,
        email: email,
        status_geral: 'ativo',
        is_admin: false,
        formulario_alimentar_preenchido: false,
        formulario_treino_preenchido: false
      })
      
    if (profileError) {
      console.error('Erro ao criar perfil:', profileError)
      return { 
        success: true, 
        warning: 'Usuário criado, mas houve um erro ao criar o perfil.', 
        user: data.user 
      }
    }
    
    return { 
      success: true, 
      user: data.user 
    }
  } catch (error) {
    console.error('Erro ao registrar usuário:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.' }
  }
}

/**
 * Realiza logout do usuário
 */
export const logout = async () => {
  try {
    await supabase.auth.signOut()
    clearAuthCookies()
    return { success: true }
  } catch (error) {
    console.error('Erro ao fazer logout:', error)
    return { success: false, error: 'Erro ao fazer logout.' }
  }
}

/**
 * Busca o perfil do usuário
 */
export const getUserProfile = async (userId: string) => {
  try {
    // Primeiro, buscamos o perfil básico
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      
    if (error) {
      console.error('Erro ao buscar perfil:', error)
      return null
    }
    
    // Tenta buscar o status dos formulários, mas não falha se a tabela não existir
    let statusData = null;
    try {
      const { data: fetchedStatus, error: statusError } = await supabase
        .from('user_status')
        .select('alimentar_completed, treino_completed')
        .eq('user_id', userId)
        .maybeSingle()
      
      if (!statusError) {
        statusData = fetchedStatus;
      } else {
        console.warn('Status dos formulários não encontrado, criando valores padrão')
      }
    } catch (statusFetchError) {
      console.warn('Erro ao buscar status dos formulários:', statusFetchError)
    }
    
    // Se a tabela user_status não existe ou não tem dados para esse usuário,
    // tenta criar um registro para ele
    if (!statusData) {
      try {
        // Criar entrada na tabela de status com valores padrão
        const { error: createError } = await supabase
          .from('user_status')
          .insert({
            user_id: userId,
            alimentar_completed: false,
            treino_completed: false
          })
          
        if (createError && createError.code !== '42P01') { // 42P01 é "tabela não existe"
          console.warn('Erro ao criar status do usuário:', createError)
        }
      } catch (createError) {
        console.warn('Erro ao criar status do usuário:', createError)
      }
    }
    
    // Combina os dados do perfil com o status dos formulários
    return {
      id: data.id,
      nome: data.nome || 'Usuário',
      telefone: data.telefone || '',
      email: data.email || '',
      status: data.status_geral || 'ativo',
      is_admin: data.is_admin || false,
      formulario_alimentar_preenchido: data.formulario_alimentar_preenchido || false,
      formulario_treino_preenchido: data.formulario_treino_preenchido || false,
      // Adiciona os campos de formulários do user_status se disponíveis
      alimentar_completed: statusData?.alimentar_completed || false,
      treino_completed: statusData?.treino_completed || false,
      // Adiciona URL do avatar
      avatar_url: data.avatar_url || ''
    } as User
  } catch (error) {
    console.error('Erro ao buscar perfil:', error)
    return null
  }
}

/**
 * Atualiza o perfil do usuário
 */
export const updateUserProfile = async (userId: string, data: Partial<User>) => {
  try {
    console.log('Atualizando perfil do usuário:', userId, data);
    
    // Criar objeto com apenas os campos a serem atualizados
    const updateData: Record<string, any> = {};
    
    if (data.nome !== undefined) updateData.nome = data.nome;
    if (data.telefone !== undefined) updateData.telefone = data.telefone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.status !== undefined) updateData.status_geral = data.status;
    if (data.formulario_alimentar_preenchido !== undefined) 
      updateData.formulario_alimentar_preenchido = data.formulario_alimentar_preenchido;
    if (data.formulario_treino_preenchido !== undefined) 
      updateData.formulario_treino_preenchido = data.formulario_treino_preenchido;
    if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;
    
    // Só atualiza se houver campos a serem atualizados
    if (Object.keys(updateData).length === 0) {
      console.log('Nenhum campo para atualizar');
      return { success: true };
    }
    
    console.log('Campos a serem atualizados:', updateData);
    
    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);
      
    if (error) {
      console.error('Erro ao atualizar perfil:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Perfil atualizado com sucesso');
    
    // Se temos dados de formulários, atualizamos também na tabela de status
    if (data.alimentar_completed !== undefined || data.treino_completed !== undefined) {
      const statusUpdateData: Record<string, any> = {};
      
      if (data.alimentar_completed !== undefined) {
        statusUpdateData.alimentar_completed = data.alimentar_completed;
      }
      
      if (data.treino_completed !== undefined) {
        statusUpdateData.treino_completed = data.treino_completed;
      }
      
      if (Object.keys(statusUpdateData).length > 0) {
        console.log('Atualizando status dos formulários:', statusUpdateData);
        
        const { error: statusError } = await supabase
          .from('user_status')
          .update(statusUpdateData)
          .eq('user_id', userId);
          
        if (statusError) {
          console.error('Erro ao atualizar status dos formulários:', statusError);
          return { success: false, error: statusError.message };
        }
        
        console.log('Status dos formulários atualizado com sucesso');
      }
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar perfil:', error);
    return { success: false, error: error.message || 'Ocorreu um erro inesperado.' };
  }
}

/**
 * Verifica se o telefone já existe
 */
export const checkPhoneExists = async (phone: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, status_geral')
      .eq('telefone', phone)
      .maybeSingle()
      
    if (error) {
      console.error('Erro ao verificar telefone:', error)
      return { exists: false, status: null }
    }
    
    return { 
      exists: !!data, 
      status: data?.status_geral || null,
      userId: data?.id || null
    }
  } catch (error) {
    console.error('Erro ao verificar telefone:', error)
    return { exists: false, status: null, userId: null }
  }
}

/**
 * Atualiza a senha do usuário usando um token de recuperação
 * @param newPassword Nova senha do usuário
 * @param accessToken Token de acesso fornecido na URL de recuperação
 * @returns Objeto indicando o sucesso ou erro da operação
 */
export const updateUserPassword = async (newPassword: string, accessToken: string) => {
  try {
    console.log('Atualizando senha do usuário com token de acesso');
    
    // Usar diretamente o updateUser sem segundo parâmetro, pois o token já está salvo na sessão
    // após o redirecionamento do link de recuperação
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      console.error('Erro ao atualizar senha:', error);
      return { 
        success: false, 
        error: error.message || 'Não foi possível atualizar a senha.' 
      };
    }
    
    console.log('Senha atualizada com sucesso');
    return { 
      success: true, 
      user: data.user 
    };
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    return { 
      success: false, 
      error: 'Ocorreu um erro inesperado ao atualizar a senha.' 
    };
  }
}

/**
 * Inicia o fluxo de autenticação com Google
 */
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) {
      console.error('Erro ao iniciar login com Google:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, url: data.url };
  } catch (error: any) {
    console.error('Erro ao iniciar login com Google:', error);
    return { success: false, error: error.message || 'Ocorreu um erro inesperado.' };
  }
} 