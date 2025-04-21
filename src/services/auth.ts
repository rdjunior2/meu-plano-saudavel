import { supabase } from '../lib/supabaseClient'
import Cookies from 'js-cookie'
import { User } from '../types/user'

const COOKIE_OPTIONS = {
  secure: import.meta.env.PROD, // Secure em produção
  sameSite: 'strict' as const,
  expires: 7 // 7 dias
}

/**
 * Armazena tokens de autenticação em cookies HttpOnly quando possível
 * ou em cookies comuns com opções de segurança em clientes
 */
const setAuthCookies = (session: any) => {
  if (!session) return
  
  Cookies.set('access_token', session.access_token, COOKIE_OPTIONS)
  Cookies.set('refresh_token', session.refresh_token, COOKIE_OPTIONS)
}

/**
 * Remove cookies de autenticação no logout
 */
const clearAuthCookies = () => {
  Cookies.remove('access_token')
  Cookies.remove('refresh_token')
}

/**
 * Verifica se a sessão atual é válida e a atualiza se necessário
 * @returns A sessão atualizada ou null se expirada
 */
export const checkSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Erro ao verificar sessão:', error)
      return null
    }
    
    if (!data.session) {
      return null
    }
    
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('Erro ao fazer login:', error)
      return { success: false, error: 'Email ou senha incorretos.' }
    }
    
    setAuthCookies(data.session)
    
    const profile = await getUserProfile(data.user.id)
    
    if (!profile) {
      return { success: false, error: 'Erro ao buscar dados do perfil.' }
    }
    
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