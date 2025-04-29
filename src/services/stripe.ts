import Stripe from 'stripe';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

// Inicializa o cliente Stripe com a chave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

interface CreateCheckoutSessionParams {
  userId: string;
  productId: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Cria uma sessão de checkout do Stripe
 */
export async function createCheckoutSession({
  userId,
  productId,
  successUrl,
  cancelUrl,
}: CreateCheckoutSessionParams) {
  try {
    // Buscar dados do perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Erro ao buscar perfil do usuário:', profileError);
      throw new Error('Usuário não encontrado');
    }

    // Buscar produto no Stripe
    const product = await stripe.products.retrieve(productId);
    
    // Buscar preço associado ao produto
    const prices = await stripe.prices.list({
      product: productId,
      active: true,
      limit: 1,
    });
    
    if (!prices.data.length) {
      throw new Error('Nenhum preço encontrado para este produto');
    }
    
    const priceId = prices.data[0].id;

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: profile.email,
      metadata: {
        userId,
        productId,
      },
    });

    // Registrar a sessão no banco de dados
    const { error: sessionError } = await supabase.from('checkout_sessions').insert({
      user_id: userId,
      product_id: productId,
      session_id: session.id,
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    if (sessionError) {
      console.error('Erro ao registrar sessão no banco de dados:', sessionError);
    }

    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    throw error;
  }
}

/**
 * Verifica o status de uma sessão de checkout
 */
export async function getCheckoutSessionStatus(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return {
      status: session.payment_status,
      metadata: session.metadata,
    };
  } catch (error) {
    console.error('Erro ao verificar status da sessão:', error);
    throw error;
  }
}

/**
 * Processa um pagamento bem-sucedido
 */
export async function processSuccessfulPayment(sessionId: string) {
  try {
    // Buscar detalhes da sessão
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid') {
      console.error('Sessão não está paga:', session.payment_status);
      return false;
    }

    const userId = session.metadata?.userId;
    const productId = session.metadata?.productId;

    if (!userId || !productId) {
      console.error('Metadados ausentes na sessão');
      return false;
    }

    // Recuperar informações do produto
    const product = await stripe.products.retrieve(productId);
    
    // Criar registro de compra
    const { error: purchaseError } = await supabase.from('purchases').insert({
      user_id: userId,
      product_id: productId,
      product_name: product.name,
      product_description: product.description,
      amount_paid: session.amount_total ? session.amount_total / 100 : 0, // Converte de centavos para reais
      status: 'completed',
      purchase_date: new Date().toISOString(),
      session_id: sessionId,
    });

    if (purchaseError) {
      console.error('Erro ao registrar compra:', purchaseError);
      return false;
    }

    // Atualizar status da sessão
    const { error: sessionError } = await supabase
      .from('checkout_sessions')
      .update({ status: 'completed' })
      .eq('session_id', sessionId);

    if (sessionError) {
      console.error('Erro ao atualizar status da sessão:', sessionError);
    }

    return true;
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    return false;
  }
}

/**
 * Lista produtos disponíveis no Stripe
 */
export async function listStripeProducts() {
  try {
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price'],
    });

    return products.data.map(product => {
      const price = product.default_price as Stripe.Price;
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: price?.unit_amount ? price.unit_amount / 100 : 0, // Converte de centavos para reais
        currency: price?.currency || 'brl',
        metadata: product.metadata,
      };
    });
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    throw error;
  }
} 