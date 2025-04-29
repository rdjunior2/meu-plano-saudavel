import axios from 'axios';
import { supabase } from '@/lib/supabaseClient'
import { processPaymentWebhook } from './purchases';

// URL base da API, usando variável de ambiente quando disponível
const baseURL = import.meta.env.VITE_API_URL || 'https://api.meuplanonutri.com.br';

// Criando instância do axios com configurações padrão
export const api = axios.create({
  baseURL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('[API] Erro na configuração da requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de respostas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Tratamento de erros comuns
    if (error.response) {
      // Erro retornado pelo servidor (4xx, 5xx)
      console.error('[API] Erro na resposta:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
      });
      
      // Se o erro for de autenticação (401), podemos disparar ações como logout
      if (error.response.status === 401) {
        // Verificar se não estamos em uma rota de autenticação para evitar loops
        if (
          !error.config.url.includes('/auth/login') && 
          !error.config.url.includes('/auth/register')
        ) {
          console.warn('[API] Erro de autenticação, redirecionando para login');
          // Aqui poderia haver um redirecionamento para login ou limpeza do estado
          localStorage.removeItem('token');
        }
      }
    } else if (error.request) {
      // Requisição foi feita mas não houve resposta (problemas de rede)
      console.error('[API] Sem resposta do servidor:', error.request);
    } else {
      // Algo aconteceu na configuração da requisição
      console.error('[API] Erro na configuração:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;

/**
 * Executa uma chamada GET para uma API externa
 */
export const fetchData = async (url: string, token?: string) => {
  try {
    const headers: HeadersInit = {}
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers
    })
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Erro ao fazer requisição:', error)
    throw error
  }
}

/**
 * Executa uma chamada POST para uma API externa
 */
export const postData = async (url: string, data: any, token?: string) => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Erro ao fazer requisição:', error)
    throw error
  }
}

/**
 * Configura um endpoint Edge Function para receber webhooks de pagamento
 * 
 * Este serviço vai criar uma função serverless que recebe notificações de 
 * pagamentos e atualiza o status do usuário
 */
export const setupPaymentWebhook = async () => {
  try {
    // Na versão atual do supabase-js, não podemos listar funções diretamente
    // Esta funcionalidade precisaria ser implementada como uma Edge Function separada
    // que tem acesso ao Supabase Management API
    
    // Nome da função de webhook
    const webhookFunctionName = 'payment-webhook'
    
    // Uma abordagem alternativa é verificar se a função responde
    try {
      const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/${webhookFunctionName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.status !== 404) {
        console.log('Função de webhook parece existir')
        return { 
          success: true, 
          url: `${process.env.SUPABASE_URL}/functions/v1/${webhookFunctionName}`,
          message: 'Função de webhook encontrada' 
        }
      }
    } catch (e) {
      // Ignorar erro, provavelmente a função não existe
    }
    
    return { 
      success: false, 
      error: 'A criação automática de funções Edge não está disponível via API do navegador. ' +
             'Por favor, crie a função manualmente no painel do Supabase ou via CLI.',
      instructions: `
        1. Crie uma nova função Edge chamada '${webhookFunctionName}'
        2. Implemente o código que processa o webhook e chama process_payment_webhook
        3. Publique a função e adicione-a como webhook no sistema de pagamento
      `
    }
  } catch (error) {
    console.error('Erro ao configurar webhook:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.' }
  }
}

/**
 * Processa os dados recebidos do webhook de pagamento
 * Esta função seria chamada pela Edge Function
 */
export const handlePaymentWebhookData = async (webhookData: any) => {
  try {
    // Extraindo dados do webhook (formato pode variar dependendo do serviço de pagamento)
    const { 
      user_id,
      transaction_id,
      status,
      expiration_date
    } = webhookData;
    
    // Validação básica
    if (!user_id || !transaction_id || !status) {
      return { 
        success: false, 
        error: 'Dados do webhook incompletos' 
      };
    }
    
    // Processa o webhook usando a função que criamos
    const result = await processPaymentWebhook(
      user_id,
      transaction_id,
      status,
      expiration_date
    );
    
    // Registra o evento de webhook para fins de auditoria
    await supabase
      .from('log_agente_automacao')
      .insert({
        evento: 'payment_webhook_processed',
        payload: webhookData,
        status: result.success ? 'success' : 'error',
        mensagem: result.success ? 'Webhook processado com sucesso' : result.error
      });
    
    return result;
  } catch (error) {
    console.error('Erro ao processar dados do webhook:', error);
    
    // Registra o erro
    await supabase
      .from('log_agente_automacao')
      .insert({
        evento: 'payment_webhook_error',
        payload: webhookData,
        status: 'error',
        mensagem: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    
    return { success: false, error: 'Erro ao processar webhook de pagamento' };
  }
} 