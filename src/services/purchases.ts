import { supabase } from '@/lib/supabaseClient'
import { FormStatus, PlanStatus, PurchaseStatus } from '../integrations/supabase/types'

/**
 * Busca histórico de compras do usuário
 */
export const getUserPurchases = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('v_purchase_items')
      .select('*')
      .eq('user_id', userId)
      .order('purchase_date', { ascending: false })
    
    if (error) {
      console.error('Erro ao buscar compras:', error)
      return { success: false, error: error.message, purchases: [] }
    }
    
    return { success: true, purchases: data }
  } catch (error) {
    console.error('Erro ao buscar compras:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.', purchases: [] }
  }
}

/**
 * Busca detalhes de uma compra específica
 */
export const getPurchaseDetails = async (purchaseId: string) => {
  try {
    const { data, error } = await supabase
      .from('purchases')
      .select(`
        *,
        purchase_items:purchase_items(
          *,
          product:products(*)
        )
      `)
      .eq('id', purchaseId)
      .single()
    
    if (error) {
      console.error('Erro ao buscar detalhes da compra:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, purchase: data }
  } catch (error) {
    console.error('Erro ao buscar detalhes da compra:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.' }
  }
}

/**
 * Atualiza o status de um item de compra
 */
export const updatePurchaseItemStatus = async (
  itemId: string, 
  formStatus?: FormStatus, 
  planStatus?: PlanStatus
) => {
  try {
    const updates: any = {}
    
    if (formStatus) {
      updates.form_status = formStatus
    }
    
    if (planStatus) {
      updates.plan_status = planStatus
    }
    
    // Se não há nada para atualizar
    if (Object.keys(updates).length === 0) {
      return { success: true }
    }
    
    const { error } = await supabase
      .from('purchase_items')
      .update(updates)
      .eq('id', itemId)
    
    if (error) {
      console.error('Erro ao atualizar status do item:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Erro ao atualizar status do item:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.' }
  }
}

/**
 * Atualiza o status de uma compra
 */
export const updatePurchaseStatus = async (
  purchaseId: string, 
  status: PurchaseStatus
) => {
  try {
    const { error } = await supabase
      .from('purchases')
      .update({ status })
      .eq('id', purchaseId)
    
    if (error) {
      console.error('Erro ao atualizar status da compra:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Erro ao atualizar status da compra:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.' }
  }
}

/**
 * Cria uma nova compra
 */
export const createPurchase = async (
  userId: string,
  kiwifyId: string,
  items: Array<{ productId: string }>
) => {
  try {
    // Inicia uma transação
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        kiwify_id: kiwifyId,
        purchase_date: new Date().toISOString(),
        status: 'approved' as PurchaseStatus
      })
      .select()
      .single()
    
    if (purchaseError) {
      console.error('Erro ao criar compra:', purchaseError)
      return { success: false, error: purchaseError.message, status: 'incompleto' }
    }
    
    // Insere os itens da compra
    const purchaseItems = items.map(item => ({
      purchase_id: purchase.id,
      product_id: item.productId,
      form_status: 'not_started' as FormStatus,
      plan_status: 'awaiting' as PlanStatus
    }))
    
    const { error: itemsError } = await supabase
      .from('purchase_items')
      .insert(purchaseItems)
    
    if (itemsError) {
      console.error('Erro ao criar itens da compra:', itemsError)
      
      // Atualiza o status da compra para indicar falha parcial
      await supabase
        .from('purchases')
        .update({ status: 'pending' as PurchaseStatus })
        .eq('id', purchase.id)
      
      return { 
        success: false, 
        error: itemsError.message, 
        purchaseId: purchase.id, 
        status: 'incompleto' 
      }
    }
    
    return { 
      success: true, 
      purchaseId: purchase.id,
      status: 'completo'
    }
  } catch (error) {
    console.error('Erro ao criar compra:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.', status: 'incompleto' }
  }
} 