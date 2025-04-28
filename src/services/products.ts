import { supabase } from '@/lib/supabaseClient'

/**
 * Interfaces para tipos de dados
 */
export interface ProductTemplate {
  id: string
  name: string
  description?: string
  active: boolean
  includes_meal_plan: boolean
  includes_workout_plan: boolean
  includes_nutri_ai: boolean
  form_templates?: any
  price?: number
  duration_days?: number
  thumbnail_url?: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  description?: string
  template_id?: string
  includes_meal_plan: boolean
  includes_workout_plan: boolean
  includes_nutri_ai: boolean
  price?: number
  duration_days?: number
  thumbnail_url?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface FormTemplate {
  id: string
  name: string
  description?: string
  form_type: string
  version: number
  schema: any
  active: boolean
}

export interface ProductFormTemplate {
  product_template_id: string
  form_template_id: string
  required: boolean
  order_index: number
}

/**
 * Busca todos os templates de produtos ativos
 */
export const getProductTemplates = async () => {
  try {
    const { data, error } = await supabase
      .from('product_templates')
      .select('*')
      .eq('active', true)
      .order('name')
    
    if (error) {
      console.error('Erro ao buscar templates de produtos:', error)
      return { success: false, error: error.message, templates: [] }
    }
    
    return { success: true, templates: data }
  } catch (error) {
    console.error('Erro ao buscar templates de produtos:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.', templates: [] }
  }
}

/**
 * Busca um template de produto específico com seus formulários associados
 */
export const getProductTemplateWithForms = async (templateId: string) => {
  try {
    const { data: template, error: templateError } = await supabase
      .from('product_templates')
      .select('*')
      .eq('id', templateId)
      .single()
    
    if (templateError) {
      console.error('Erro ao buscar template de produto:', templateError)
      return { success: false, error: templateError.message }
    }
    
    // Buscar os formulários associados
    const { data: formTemplates, error: formsError } = await supabase
      .from('product_form_templates')
      .select(`
        *,
        form_template:form_templates(*)
      `)
      .eq('product_template_id', templateId)
      .order('order_index')
    
    if (formsError) {
      console.error('Erro ao buscar formulários do template:', formsError)
      return { 
        success: true, 
        template, 
        formTemplates: [], 
        warning: 'Não foi possível carregar os formulários associados.' 
      }
    }
    
    return { success: true, template, formTemplates }
  } catch (error) {
    console.error('Erro ao buscar template de produto com formulários:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.' }
  }
}

/**
 * Cria um novo template de produto
 */
export const createProductTemplate = async (templateData: Omit<ProductTemplate, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    const { data, error } = await supabase
      .from('product_templates')
      .insert(templateData)
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao criar template de produto:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, template: data }
  } catch (error) {
    console.error('Erro ao criar template de produto:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.' }
  }
}

/**
 * Atualiza um template de produto existente
 */
export const updateProductTemplate = async (
  templateId: string, 
  templateData: Partial<Omit<ProductTemplate, 'id' | 'created_at' | 'updated_at'>>
) => {
  try {
    const { data, error } = await supabase
      .from('product_templates')
      .update(templateData)
      .eq('id', templateId)
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao atualizar template de produto:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, template: data }
  } catch (error) {
    console.error('Erro ao atualizar template de produto:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.' }
  }
}

/**
 * Associa um formulário a um template de produto
 */
export const associateFormToProductTemplate = async (
  productTemplateId: string,
  formTemplateId: string,
  required: boolean = true,
  orderIndex: number = 0
) => {
  try {
    const { data, error } = await supabase
      .from('product_form_templates')
      .insert({
        product_template_id: productTemplateId,
        form_template_id: formTemplateId,
        required,
        order_index: orderIndex
      })
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao associar formulário ao template:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, association: data }
  } catch (error) {
    console.error('Erro ao associar formulário ao template:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.' }
  }
}

/**
 * Remove a associação de um formulário com um template de produto
 */
export const removeFormFromProductTemplate = async (
  productTemplateId: string,
  formTemplateId: string
) => {
  try {
    const { error } = await supabase
      .from('product_form_templates')
      .delete()
      .eq('product_template_id', productTemplateId)
      .eq('form_template_id', formTemplateId)
    
    if (error) {
      console.error('Erro ao remover formulário do template:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Erro ao remover formulário do template:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.' }
  }
}

/**
 * Busca todos os templates de formulários
 */
export const getFormTemplates = async () => {
  try {
    const { data, error } = await supabase
      .from('form_templates')
      .select('*')
      .eq('active', true)
      .order('name')
    
    if (error) {
      console.error('Erro ao buscar templates de formulários:', error)
      return { success: false, error: error.message, templates: [] }
    }
    
    return { success: true, templates: data }
  } catch (error) {
    console.error('Erro ao buscar templates de formulários:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.', templates: [] }
  }
}

/**
 * Cria um produto a partir de um template
 */
export const createProductFromTemplate = async (
  templateId: string, 
  productName: string,
  productDescription?: string
) => {
  try {
    const { data, error } = await supabase
      .rpc('create_product_from_template', {
        template_id: templateId,
        product_name: productName,
        product_description: productDescription
      })
    
    if (error) {
      console.error('Erro ao criar produto a partir do template:', error)
      return { success: false, error: error.message }
    }
    
    // Buscar o produto criado para retornar dados completos
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', data)
      .single()
    
    if (productError) {
      console.error('Erro ao buscar produto criado:', productError)
      return { success: true, productId: data, warning: 'Produto criado, mas não foi possível carregar seus detalhes.' }
    }
    
    return { success: true, product }
  } catch (error) {
    console.error('Erro ao criar produto a partir do template:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.' }
  }
}

/**
 * Busca os entregáveis de um produto específico
 */
export const getProductDeliverables = async (productId: string) => {
  try {
    const { data, error } = await supabase
      .from('v_product_deliverables')
      .select('*')
      .eq('product_id', productId)
      .single()
    
    if (error) {
      console.error('Erro ao buscar entregáveis do produto:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, deliverables: data }
  } catch (error) {
    console.error('Erro ao buscar entregáveis do produto:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.' }
  }
}

/**
 * Busca todos os produtos ativos
 */
export const getActiveProducts = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('name')
    
    if (error) {
      console.error('Erro ao buscar produtos ativos:', error)
      return { success: false, error: error.message, products: [] }
    }
    
    return { success: true, products: data }
  } catch (error) {
    console.error('Erro ao buscar produtos ativos:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.', products: [] }
  }
}

/**
 * Busca os direitos de um usuário específico
 */
export const getUserEntitlements = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('v_user_entitlements')
      .select('*')
      .eq('user_id', userId)
    
    if (error) {
      console.error('Erro ao buscar direitos do usuário:', error)
      return { success: false, error: error.message, entitlements: [] }
    }
    
    return { success: true, entitlements: data }
  } catch (error) {
    console.error('Erro ao buscar direitos do usuário:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.', entitlements: [] }
  }
}

/**
 * Verifica se um usuário tem acesso ao Agente Nutri AI
 */
export const hasNutriAIAccess = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('v_user_entitlements')
      .select('*')
      .eq('user_id', userId)
      .eq('includes_nutri_ai', true)
      .eq('is_active', true)
      .limit(1)
    
    if (error) {
      console.error('Erro ao verificar acesso ao Nutri AI:', error)
      return { success: false, error: error.message, hasAccess: false }
    }
    
    return { success: true, hasAccess: data && data.length > 0 }
  } catch (error) {
    console.error('Erro ao verificar acesso ao Nutri AI:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.', hasAccess: false }
  }
} 