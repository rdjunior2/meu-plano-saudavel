import { supabase } from '../lib/supabaseClient'
import Cookies from 'js-cookie'
import { User } from '../types/user'

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
const setAuthCookies = (session: any) => {
  if (!session) return
  
  console.log('Configurando cookies de autenticação', { domain: COOKIE_OPTIONS.domain, sameSite: COOKIE_OPTIONS.sameSite });
  Cookies.set('access_token', session.access_token, COOKIE_OPTIONS)
  Cookies.set('refresh_token', session.refresh_token, COOKIE_OPTIONS)
}

/**
 * Remove cookies de autenticação no logout
 */
const clearAuthCookies = () => {
  console.log('Removendo cookies de autenticação');
  Cookies.remove('access_token', { domain: COOKIE_OPTIONS.domain })
  Cookies.remove('refresh_token', { domain: COOKIE_OPTIONS.domain })
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
    
    console.log('Login bem-sucedido, configurando cookies');
    setAuthCookies(data.session)
    
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
        is_admin: false
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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      
    if (error) {
      console.error('Erro ao buscar perfil:', error)
      return null
    }
    
    return {
      id: data.id,
      nome: data.nome || 'Usuário',
      telefone: data.telefone || '',
      email: data.email || '',
      status: data.status_geral || 'ativo',
      is_admin: data.is_admin || false,
      formulario_alimentar_preenchido: data.formulario_alimentar_preenchido || false,
      formulario_treino_preenchido: data.formulario_treino_preenchido || false
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
    const { error } = await supabase
      .from('profiles')
      .update({
        nome: data.nome,
        telefone: data.telefone,
        email: data.email,
        status_geral: data.status
      })
      .eq('id', userId)
      
    if (error) {
      console.error('Erro ao atualizar perfil:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.' }
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
    return { exists: false, status: null }
  }
} 