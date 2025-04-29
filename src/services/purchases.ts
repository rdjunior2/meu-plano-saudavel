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

/**
 * Processa webhook de pagamento 
 * Utiliza a nova função process_payment_webhook para atualizar o status da compra do usuário
 */
export const processPaymentWebhook = async (
  userId: string,
  purchaseId: string,
  purchaseStatus: string,
  expirationDate?: string
) => {
  try {
    // Converte string de data para objeto Date se fornecida
    let expDate = null;
    if (expirationDate) {
      expDate = new Date(expirationDate).toISOString();
    }
    
    const { data, error } = await supabase.rpc('process_payment_webhook', {
      p_user_id: userId,
      p_purchase_id: purchaseId,
      p_purchase_status: purchaseStatus,
      p_expiration_date: expDate
    });
    
    if (error) {
      console.error('Erro ao processar webhook de pagamento:', error);
      return { success: false, error: error.message };
    }
    
    // Verifica o status de compra atual após o processamento
    const { error: checkError, data: statusData } = await supabase.rpc('check_purchase_status', {
      p_user_id: userId
    });
    
    if (checkError) {
      console.error('Erro ao verificar status da compra:', checkError);
      return { success: true, warning: 'Webhook processado, mas não foi possível verificar o status atual.' };
    }
    
    return { 
      success: true, 
      status: statusData,
      message: 'Webhook processado com sucesso.'
    };
  } catch (error) {
    console.error('Erro ao processar webhook de pagamento:', error);
    return { success: false, error: 'Ocorreu um erro inesperado.' };
  }
}

/**
 * Cria uma sessão de checkout do Stripe
 * @param userId ID do usuário fazendo a compra
 * @param productId ID do produto no Stripe
 * @param mode Modo de pagamento (payment ou subscription)
 * @param successUrl URL de sucesso após pagamento
 * @param cancelUrl URL de cancelamento
 */
export const createStripeCheckout = async (
  userId: string,
  productId: string,
  mode: 'payment' | 'subscription',
  successUrl: string,
  cancelUrl: string
) => {
  try {
    // Chamar uma função Edge para criar a sessão de checkout
    const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
      body: {
        userId,
        productId,
        mode,
        successUrl,
        cancelUrl
      }
    });

    if (error) {
      console.error('Erro ao criar sessão de checkout:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      checkoutUrl: data.url,
      sessionId: data.id
    };
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    return { success: false, error: 'Ocorreu um erro inesperado.' };
  }
} 