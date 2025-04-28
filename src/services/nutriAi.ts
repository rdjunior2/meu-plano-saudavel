import { supabase } from '@/lib/supabaseClient'
import { hasNutriAIAccess } from './products'
import { api } from './api'

export interface NutriAIMessage {
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

export interface NutriAIInteraction {
  id: string
  user_id: string
  purchase_item_id?: string
  session_id?: string
  query: string
  response: string
  context?: any
  created_at: string
}

/**
 * Envia uma pergunta para o Agente Nutri AI
 * @param userId ID do usuário
 * @param message Mensagem enviada pelo usuário
 * @param sessionId ID da sessão de chat (opcional)
 * @param purchaseItemId ID do item de compra relacionado (opcional)
 * @param history Histórico de conversas para contexto
 */
export const sendMessageToNutriAI = async (
  userId: string,
  message: string,
  sessionId?: string,
  purchaseItemId?: string,
  history: NutriAIMessage[] = []
) => {
  try {
    // Primeiro verifica se o usuário tem acesso ao Nutri AI
    const accessCheck = await hasNutriAIAccess(userId)
    
    if (!accessCheck.success || !accessCheck.hasAccess) {
      return { 
        success: false, 
        error: 'Você não tem acesso ao Agente Nutri AI. Adquira um plano com este recurso.' 
      }
    }
    
    // TODO: Substituir por integração real com API externa LLM
    // Esta é uma implementação simulada que será substituída pela API real
    const simulatedResponse = await simulateAIResponse(message, history)
    
    // Salvar a interação no banco de dados
    const { error } = await supabase
      .from('nutri_ai_interactions')
      .insert({
        user_id: userId,
        purchase_item_id: purchaseItemId,
        session_id: sessionId || new Date().toISOString(),
        query: message,
        response: simulatedResponse,
        context: { history: history.slice(-5) } // Armazena as últimas 5 mensagens como contexto
      })
    
    if (error) {
      console.error('Erro ao salvar interação com Nutri AI:', error)
      // Não retornamos erro aqui para não interromper a experiência do usuário
    }
    
    return { 
      success: true, 
      response: simulatedResponse 
    }
  } catch (error) {
    console.error('Erro ao enviar mensagem para Nutri AI:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.' }
  }
}

/**
 * Busca o histórico de interações do usuário com o Nutri AI
 * @param userId ID do usuário
 * @param sessionId ID da sessão específica (opcional)
 * @param limit Número máximo de interações para retornar
 */
export const getNutriAIHistory = async (
  userId: string, 
  sessionId?: string,
  limit: number = 50
) => {
  try {
    let query = supabase
      .from('nutri_ai_interactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (sessionId) {
      query = query.eq('session_id', sessionId)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Erro ao buscar histórico de interações com Nutri AI:', error)
      return { success: false, error: error.message, interactions: [] }
    }
    
    return { success: true, interactions: data }
  } catch (error) {
    console.error('Erro ao buscar histórico de interações com Nutri AI:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.', interactions: [] }
  }
}

/**
 * Busca todas as sessões únicas de interação do usuário com o Nutri AI
 * @param userId ID do usuário
 */
export const getNutriAISessions = async (userId: string) => {
  try {
    // Buscar sessões únicas ordenadas por data mais recente de interação
    const { data, error } = await supabase
      .rpc('get_unique_nutri_ai_sessions', { user_id_param: userId })
    
    if (error) {
      console.error('Erro ao buscar sessões de Nutri AI:', error)
      return { success: false, error: error.message, sessions: [] }
    }
    
    return { success: true, sessions: data || [] }
  } catch (error) {
    console.error('Erro ao buscar sessões de Nutri AI:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.', sessions: [] }
  }
}

/**
 * Cria uma nova sessão de chat com o Nutri AI
 * @param userId ID do usuário
 * @param purchaseItemId ID do item de compra relacionado (opcional)
 */
export const createNutriAISession = async (userId: string, purchaseItemId?: string) => {
  try {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    
    // Mensagem inicial do sistema
    const welcomeMessage = 'Olá! Sou o Agente Nutri AI, seu assistente de nutrição pessoal. ' +
      'Como posso ajudá-lo hoje com seus objetivos de saúde e alimentação?'
    
    // Registrar a primeira interação (mensagem de boas-vindas)
    const { error } = await supabase
      .from('nutri_ai_interactions')
      .insert({
        user_id: userId,
        purchase_item_id: purchaseItemId,
        session_id: sessionId,
        query: 'session_start',
        response: welcomeMessage,
        context: { is_welcome: true }
      })
    
    if (error) {
      console.error('Erro ao criar sessão com Nutri AI:', error)
      return { success: false, error: error.message }
    }
    
    return { 
      success: true, 
      sessionId,
      welcomeMessage
    }
  } catch (error) {
    console.error('Erro ao criar sessão com Nutri AI:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.' }
  }
}

/**
 * Função temporária para simular resposta da API externa
 * Será substituída pela integração real
 */
const simulateAIResponse = async (
  message: string, 
  history: NutriAIMessage[]
): Promise<string> => {
  // Simulação de um pequeno atraso para parecer mais realista
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Conjunto de respostas pré-definidas baseadas em palavras-chave
  const responses: Record<string, string[]> = {
    'dieta': [
      'Uma dieta equilibrada deve incluir proteínas, carboidratos complexos, gorduras saudáveis e muitas frutas e vegetais. Considere consultar um nutricionista para um plano personalizado.',
      'Dietas muito restritivas geralmente não são sustentáveis a longo prazo. Foque em mudanças graduais que você possa manter.',
      'Lembre-se que uma alimentação saudável é aquela que você consegue manter ao longo do tempo. Encontre um equilíbrio que funcione para você.'
    ],
    'treino': [
      'Combinar treinos de força com exercícios cardiovasculares é uma ótima estratégia para melhorar a composição corporal.',
      'A consistência é mais importante que a intensidade quando se trata de exercícios físicos. Estabeleça uma rotina que você possa manter.',
      'Lembre-se de sempre respeitar os limites do seu corpo e descansar adequadamente entre os treinos.'
    ],
    'água': [
      'A hidratação adequada é essencial para o funcionamento do organismo. Tente beber pelo menos 2 litros de água por dia.',
      'Manter-se bem hidratado ajuda na digestão, no transporte de nutrientes e na regulação da temperatura corporal.',
      'Uma dica é sempre ter uma garrafa de água com você e estabelecer horários para beber água ao longo do dia.'
    ],
    'proteína': [
      'Proteínas são fundamentais para a recuperação muscular. Boas fontes incluem carnes magras, ovos, laticínios, leguminosas e proteínas vegetais.',
      'Para quem pratica atividades físicas, recomenda-se consumir entre 1,6g e 2,2g de proteína por kg de peso corporal, dependendo dos objetivos.',
      'Distribua o consumo de proteínas ao longo do dia para maximizar a síntese proteica muscular.'
    ],
    'emagrecer': [
      'Para emagrecer de forma saudável, crie um déficit calórico moderado combinado com atividade física regular.',
      'Priorize alimentos integrais, frutas, vegetais e proteínas magras. Evite alimentos processados e ricos em açúcares.',
      'Lembre-se que o emagrecimento saudável é gradual, geralmente entre 0,5kg e 1kg por semana.'
    ],
    'músculo': [
      'Para ganho de massa muscular, combine um superávit calórico moderado com treino de força progressivo.',
      'Certifique-se de consumir proteína suficiente (1,6g a 2,2g por kg de peso corporal) e distribuí-la ao longo do dia.',
      'O descanso adequado e sono de qualidade são fundamentais para a recuperação e crescimento muscular.'
    ],
    'vegetariano': [
      'Dietas vegetarianas podem ser nutricionalmente completas quando bem planejadas. Certifique-se de incluir boas fontes de proteínas vegetais como leguminosas, tofu, tempeh e seitan.',
      'Considere suplementar com vitamina B12, que é encontrada principalmente em alimentos de origem animal.',
      'Combine diferentes fontes de proteínas vegetais para obter todos os aminoácidos essenciais.'
    ],
    'vegano': [
      'Dietas veganas requerem atenção especial a certos nutrientes como B12, ferro, zinco, cálcio e ômega-3. Considere suplementação quando necessário.',
      'Excelentes fontes de proteínas veganas incluem leguminosas, tofu, tempeh, seitan e proteínas vegetais texturizadas.',
      'Utilize alimentos fortificados como leites vegetais enriquecidos com cálcio e vitaminas.'
    ]
  }
  
  // Verifica se a mensagem contém alguma das palavras-chave
  const matchingKeywords = Object.keys(responses).filter(keyword => 
    message.toLowerCase().includes(keyword.toLowerCase())
  )
  
  if (matchingKeywords.length > 0) {
    // Escolhe uma das palavras-chave correspondentes aleatoriamente
    const keyword = matchingKeywords[Math.floor(Math.random() * matchingKeywords.length)]
    // Escolhe uma das respostas para essa palavra-chave aleatoriamente
    return responses[keyword][Math.floor(Math.random() * responses[keyword].length)]
  }
  
  // Respostas padrão se nenhuma palavra-chave for encontrada
  const defaultResponses = [
    'Entendo sua pergunta. Para oferecer uma orientação nutricional adequada, poderia fornecer mais detalhes sobre seus objetivos e hábitos alimentares atuais?',
    'Essa é uma ótima pergunta! Para responder de forma mais personalizada, poderia me contar um pouco mais sobre sua rotina de alimentação e atividade física?',
    'Compreendo sua dúvida. A nutrição é bastante individual, então quanto mais informações você puder compartilhar sobre seus objetivos e hábitos, melhor poderei auxiliá-lo.',
    'Para ajudar com essa questão, seria útil saber mais sobre suas preferências alimentares, restrições e objetivos de saúde. Poderia compartilhar essas informações?'
  ]
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
} 