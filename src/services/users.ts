import { supabase } from '@/lib/supabaseClient'
import { User } from '../types/user'

/**
 * Busca um usuário pelo ID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Erro ao buscar usuário:', error)
      return null
    }
    
    return {
      id: data.id,
      nome: data.nome,
      telefone: data.telefone,
      email: data.email,
      status: data.status_geral,
      is_admin: data.is_admin,
      formulario_alimentar_preenchido: data.formulario_alimentar_preenchido,
      formulario_treino_preenchido: data.formulario_treino_preenchido
    }
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return null
  }
}

/**
 * Atualiza dados do usuário
 */
export const updateUser = async (userId: string, userData: Partial<User>) => {
  try {
    console.log('Tentando atualizar usuário no serviço users.ts:', userData);
    
    const updateData = {
      nome: userData.nome,
      telefone: userData.telefone,
      email: userData.email,
      status_geral: userData.status,
      is_admin: userData.is_admin,
      formulario_alimentar_preenchido: userData.formulario_alimentar_preenchido,
      formulario_treino_preenchido: userData.formulario_treino_preenchido
    };
    
    // Primeiro tenta atualizar na tabela 'profiles'
    const { error: profilesError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);
    
    // Se ocorrer erro, tenta na tabela 'perfis'
    if (profilesError) {
      console.log('Erro ao atualizar na tabela profiles, tentando tabela perfis:', profilesError);
      
      const { error: perfisError } = await supabase
        .from('perfis')
        .update(updateData)
        .eq('id', userId);
        
      if (perfisError) {
        console.error('Erro ao atualizar usuário em ambas as tabelas:', perfisError);
        return { success: false, error: perfisError.message };
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return { success: false, error: 'Ocorreu um erro inesperado.' };
  }
}

/**
 * Lista todos os usuários (para admin)
 */
export const listUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Erro ao listar usuários:', error)
      return { success: false, error: error.message }
    }
    
    return { 
      success: true, 
      users: data.map(u => ({
        id: u.id,
        nome: u.nome,
        telefone: u.telefone,
        email: u.email,
        status: u.status_geral,
        is_admin: u.is_admin
      })) 
    }
  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.' }
  }
}

/**
 * Obtém o status geral do usuário
 */
export const getUserStatus = async (userId: string) => {
  try {
    // Usando a nova assinatura da função RPC
    const { data, error } = await supabase.rpc('get_user_purchase_status', {
      p_user_id: userId
    })
    
    if (error) {
      console.error('Erro ao buscar status do usuário:', error)
      return { success: false, error: error.message }
    }
    
    return { 
      success: true, 
      status: data
    }
  } catch (error) {
    console.error('Erro ao buscar status do usuário:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.' }
  }
}

/**
 * Obtém o status completo do usuário incluindo compra e formulários
 */
export const getUserFullStatus = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_full_status')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) {
      console.error('Erro ao buscar status completo do usuário:', error)
      return { success: false, error: error.message }
    }
    
    return {
      success: true,
      status: data
    }
  } catch (error) {
    console.error('Erro ao buscar status completo do usuário:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.' }
  }
}

/**
 * Verifica se o usuário tem acesso (assinatura ativa)
 */
export const checkUserAccess = async (userId: string) => {
  try {
    const { data, error } = await supabase.rpc('check_user_access', {
      p_user_id: userId
    })
    
    if (error) {
      console.error('Erro ao verificar acesso do usuário:', error)
      return { success: false, error: error.message, hasAccess: false }
    }
    
    return {
      success: true,
      hasAccess: data
    }
  } catch (error) {
    console.error('Erro ao verificar acesso do usuário:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.', hasAccess: false }
  }
} 