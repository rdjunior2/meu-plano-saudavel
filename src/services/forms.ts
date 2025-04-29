import { supabase } from '@/lib/supabaseClient'

interface FormResponse {
  user_id: string;
  form_type: string;
  version: number;
  responses: any;
  purchase_id: string;
  product_id: string;
}

/**
 * Salva uma resposta de formulário
 */
export const saveFormResponse = async (formData: FormResponse) => {
  try {
    const { error } = await supabase
      .from('form_responses')
      .insert(formData)
    
    if (error) {
      console.error('Erro ao salvar formulário:', error)
      return { success: false, error: error.message }
    }
    
    // Atualiza o status do item da compra
    const { error: updateError } = await supabase
      .from('purchase_items')
      .update({ form_status: 'completed' })
      .eq('purchase_id', formData.purchase_id)
      .eq('product_id', formData.product_id)
    
    if (updateError) {
      console.error('Erro ao atualizar status do item:', updateError)
      return { 
        success: true, 
        warning: 'Formulário salvo, mas houve um erro ao atualizar o status do item.' 
      }
    }
    
    // Atualiza o status de preenchimento dos formulários usando as novas funções
    if (formData.form_type === 'alimentar') {
      const { error: statusError } = await supabase.rpc('update_dietary_form_status', {
        p_user_id: formData.user_id,
        p_completed: true
      })
      
      if (statusError) {
        console.error('Erro ao atualizar status do formulário alimentar:', statusError)
        return { 
          success: true, 
          warning: 'Formulário salvo, mas houve um erro ao atualizar o status do formulário.' 
        }
      }
    } else if (formData.form_type === 'treino') {
      const { error: statusError } = await supabase.rpc('update_training_form_status', {
        p_user_id: formData.user_id,
        p_completed: true
      })
      
      if (statusError) {
        console.error('Erro ao atualizar status do formulário de treino:', statusError)
        return { 
          success: true, 
          warning: 'Formulário salvo, mas houve um erro ao atualizar o status do formulário.' 
        }
      }
    }
    
    // Gerencia a progressão do usuário após preenchimento do formulário
    const { error: progressError } = await supabase.rpc('manage_user_progress', {
      p_user_id: formData.user_id
    })
    
    if (progressError) {
      console.error('Erro ao gerenciar progressão do usuário:', progressError)
    }
    
    return { success: true }
  } catch (error) {
    console.error('Erro ao salvar formulário:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.' }
  }
}

/**
 * Busca uma resposta específica de formulário
 */
export const getFormResponse = async (
  userId: string, 
  formType: string,
  purchaseId?: string,
  productId?: string
) => {
  try {
    let query = supabase
      .from('form_responses')
      .select('*')
      .eq('user_id', userId)
      .eq('form_type', formType)
      .order('created_at', { ascending: false })
    
    if (purchaseId) {
      query = query.eq('purchase_id', purchaseId)
    }
    
    if (productId) {
      query = query.eq('product_id', productId)
    }
    
    const { data, error } = await query.limit(1)
    
    if (error) {
      console.error('Erro ao buscar formulário:', error)
      return { success: false, error: error.message }
    }
    
    return { 
      success: true, 
      formResponse: data && data.length > 0 ? data[0] : null 
    }
  } catch (error) {
    console.error('Erro ao buscar formulário:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.' }
  }
}

/**
 * Lista todos os formulários do usuário
 */
export const getUserForms = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('form_responses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Erro ao listar formulários:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, forms: data }
  } catch (error) {
    console.error('Erro ao listar formulários:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.' }
  }
}

/**
 * Verifica o status de preenchimento dos formulários do usuário
 */
export const checkFormStatus = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_status')
      .select('dietary_form_completed, training_form_completed')
      .eq('user_id', userId)
      .single()
    
    if (error) {
      console.error('Erro ao verificar status dos formulários:', error)
      return { 
        success: false, 
        error: error.message,
        dietary_completed: false,
        training_completed: false
      }
    }
    
    return { 
      success: true, 
      dietary_completed: data?.dietary_form_completed || false,
      training_completed: data?.training_form_completed || false
    }
  } catch (error) {
    console.error('Erro ao verificar status dos formulários:', error)
    return { 
      success: false, 
      error: 'Ocorreu um erro inesperado.',
      dietary_completed: false,
      training_completed: false
    }
  }
} 