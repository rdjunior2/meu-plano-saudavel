import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Criar cliente Supabase com a URL e chave anônima
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verificar o método da requisição
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método não permitido' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      })
    }

    // Recuperar a chave secreta do Stripe das variáveis de ambiente
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
    
    if (!stripeSecretKey || !stripeWebhookSecret) {
      console.error('Chaves do Stripe não configuradas!')
      return new Response(
        JSON.stringify({ error: 'Configuração incompleta do servidor' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Inicializar o cliente Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2022-11-15',
    })

    // Obter a assinatura do Stripe do cabeçalho
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Assinatura do webhook não fornecida' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Obter o corpo da requisição como texto para verificação da assinatura
    const rawBody = await req.text()
    
    // Verificar a assinatura do webhook
    let event
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        stripeWebhookSecret
      )
    } catch (err) {
      console.error('Erro na verificação da assinatura do webhook:', err)
      return new Response(
        JSON.stringify({ error: 'Assinatura do webhook inválida' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log('Evento Stripe recebido:', event.type)

    // Dados a serem enviados para nossa função RPC
    let userId = null
    let transactionId = null
    let status = null
    let expirationDate = null

    // Processar diferentes tipos de eventos do Stripe
    switch (event.type) {
      case 'checkout.session.completed':
        // Quando um checkout é finalizado com sucesso
        const session = event.data.object
        userId = session.client_reference_id // ID do usuário deve ser enviado como referência
        transactionId = session.id
        status = 'approved'
        // Se for assinatura, a data de expiração será definida mais tarde
        break

      case 'invoice.paid':
        // Quando uma fatura é paga (para assinaturas)
        const invoice = event.data.object
        
        // Buscar a assinatura para obter o cliente
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
        
        // Buscar o cliente para obter metadados (onde guardamos o user_id)
        const customer = await stripe.customers.retrieve(invoice.customer)
        userId = customer.metadata?.user_id
        transactionId = invoice.id
        status = 'approved'

        // Calcular data de expiração baseada no período da assinatura
        if (subscription) {
          expirationDate = new Date(subscription.current_period_end * 1000).toISOString()
        }
        break

      case 'customer.subscription.updated':
        // Quando uma assinatura é atualizada
        const updatedSubscription = event.data.object
        const updatedCustomer = await stripe.customers.retrieve(updatedSubscription.customer)
        userId = updatedCustomer.metadata?.user_id
        transactionId = updatedSubscription.id
        
        // Verificar o status da assinatura
        if (updatedSubscription.status === 'active' || updatedSubscription.status === 'trialing') {
          status = 'approved'
        } else {
          status = 'cancelled'
        }
        
        // Atualizar data de expiração
        expirationDate = new Date(updatedSubscription.current_period_end * 1000).toISOString()
        break

      case 'customer.subscription.deleted':
        // Quando uma assinatura é cancelada
        const deletedSubscription = event.data.object
        const deletedCustomer = await stripe.customers.retrieve(deletedSubscription.customer)
        userId = deletedCustomer.metadata?.user_id
        transactionId = deletedSubscription.id
        status = 'cancelled'
        // Não definimos data de expiração pois já foi cancelado
        break

      default:
        // Registrar eventos não processados para depuração
        await supabaseClient.from('log_agente_automacao').insert({
          evento: 'stripe_webhook_unhandled_event',
          payload: { eventType: event.type },
          status: 'info',
          mensagem: `Evento não processado: ${event.type}`
        })
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Evento ${event.type} recebido mas não processado` 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
    }

    // Validar dados obrigatórios
    if (!userId || !transactionId || !status) {
      console.error('Dados incompletos após processamento de evento:', { userId, transactionId, status })
      
      await supabaseClient.from('log_agente_automacao').insert({
        evento: 'stripe_webhook_incomplete_data',
        payload: { event_type: event.type, user_id: userId, transaction_id: transactionId, status },
        status: 'error',
        mensagem: 'Dados incompletos após processamento de evento Stripe'
      })
      
      return new Response(
        JSON.stringify({ error: 'Dados incompletos extraídos do evento' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Processar o webhook usando a função RPC
    const { data, error } = await supabaseClient.rpc('process_payment_webhook', {
      p_user_id: userId,
      p_purchase_id: transactionId,
      p_purchase_status: status,
      p_expiration_date: expirationDate
    })

    if (error) {
      console.error('Erro ao processar webhook:', error)
      
      // Registrar o erro
      await supabaseClient.from('log_agente_automacao').insert({
        evento: 'stripe_webhook_error',
        payload: { event_type: event.type, user_id: userId, transaction_id: transactionId, status },
        status: 'error',
        mensagem: error.message
      })
      
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Verificar o status atual da compra
    const { data: statusData, error: statusError } = await supabaseClient.rpc('check_purchase_status', {
      p_user_id: userId
    })

    if (statusError) {
      console.error('Erro ao verificar status da compra:', statusError)
    }

    // Registrar o sucesso
    await supabaseClient.from('log_agente_automacao').insert({
      evento: 'stripe_webhook_processed',
      payload: { event_type: event.type, user_id: userId, transaction_id: transactionId, status },
      status: 'success',
      mensagem: 'Webhook do Stripe processado com sucesso'
    })

    // Retornar resposta de sucesso
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook do Stripe processado com sucesso',
        status: statusData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Erro não tratado:', error)
    
    // Registrar erro não tratado
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )
    
    await supabaseClient.from('log_agente_automacao').insert({
      evento: 'stripe_webhook_unhandled_error',
      status: 'error',
      mensagem: error instanceof Error ? error.message : 'Erro desconhecido'
    })
    
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 