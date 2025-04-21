import { serve } from 'https://deno.land/std@0.140.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

// Tipo para o webhook da Kiwify
interface KiwifyWebhook {
  event: string;
  data: {
    product: {
      id: string;
      name: string;
    };
    customer: {
      name: string;
      email: string;
      phone: string;
      first_name?: string;
      cpf?: string;
    };
    order: {
      id: string;
      status: string;
    };
  };
}

// Tipo para resposta da função
interface WebhookResponse {
  success: boolean;
  message: string;
  user_id?: string;
  status?: 'completo' | 'incompleto';
  error?: string;
}

// Validação básica do webhook
function isValidWebhook(body: any): body is KiwifyWebhook {
  return (
    body &&
    typeof body === 'object' &&
    body.event &&
    body.data &&
    body.data.customer &&
    body.data.customer.phone
  );
}

// Registra log de erro
async function logError(supabaseClient: any, event: string, description: string, metadata: any = {}) {
  try {
    await supabaseClient
      .from('log_agente_automacao')
      .insert({
        evento: event,
        descricao: description,
        severidade: 'error',
        metadata: metadata,
        timestamp: new Date().toISOString()
      });
  } catch (logError) {
    // Se não conseguir logar, apenas registra no console
    console.error('Erro ao registrar log:', logError);
  }
}

// Processa a compra e cria usuário se necessário
async function processNewPurchase(
  supabaseClient: any, 
  webhook: KiwifyWebhook
): Promise<WebhookResponse> {
  try {
    const { customer, product, order } = webhook.data;
    
    // Extrair primeiro nome do cliente
    const first_name = customer.first_name || customer.name?.split(' ')[0] || null;
    
    // Extrair e formatar CPF (removendo caracteres não numéricos se existirem)
    const cpf = customer.cpf ? customer.cpf.replace(/\D/g, '') : null;
    
    // Log de recebimento dos dados do cliente
    await supabaseClient
      .from('log_agente_automacao')
      .insert({
        evento: 'kiwify_customer_data',
        payload: {
          customer_name: customer.name,
          customer_first_name: first_name,
          customer_cpf: cpf,
          customer_email: customer.email,
          customer_phone: customer.phone,
          order_id: order.id
        },
        status: 'recebido',
        mensagem: 'Dados do cliente recebidos do webhook Kiwify'
      });
    
    // Verificar se o usuário já existe pelo telefone
    const { data: existingUser, error: userError } = await supabaseClient
      .from('profiles')
      .select('id, cpf')
      .eq('telefone', customer.phone)
      .single();
      
    if (userError && userError.code !== 'PGRST116') {
      throw new Error(`Erro ao verificar usuário: ${userError.message}`);
    }
    
    // Se o CPF já estiver em uso por outro usuário, registrar erro
    if (cpf) {
      const { data: existingCpf, error: cpfError } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('cpf', cpf)
        .neq('id', existingUser?.id || 'none')  // Ignora o usuário atual na verificação
        .maybeSingle();
        
      if (existingCpf) {
        await logError(
          supabaseClient, 
          'webhook_kiwify_cpf_conflict', 
          `CPF já em uso por outro usuário: ${cpf}`,
          { customer, order_id: order.id, conflicting_user_id: existingCpf.id }
        );
        // Continuamos o processamento, mas não atualizamos o CPF
      }
    }
    
    let userId: string;
    
    // Se o usuário não existe, criamos um novo
    if (!existingUser) {
      // Gerar um email único baseado no telefone
      const tmpEmail = `${customer.phone.replace(/\D/g, '')}@temp.meuplanosaudeapp.com.br`;
      
      // Criar usuário na autenticação
      const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
        email: tmpEmail,
        phone: customer.phone,
        email_confirm: true,
        user_metadata: {
          nome: customer.name,
          first_name: first_name,
          cpf: cpf,
          from_kiwify: true
        }
      });
      
      if (authError) {
        await logError(
          supabaseClient, 
          'webhook_kiwify_auth_error', 
          `Erro ao criar usuário na auth: ${authError.message}`,
          { customer, order_id: order.id }
        );
        return { 
          success: false, 
          message: 'Erro ao criar autenticação do usuário', 
          error: authError.message,
          status: 'incompleto' 
        };
      }
      
      userId = authData.user.id;
      
      // Criar perfil do usuário com os novos campos
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .insert({
          id: userId,
          nome: customer.name,
          first_name: first_name,
          cpf: cpf,
          telefone: customer.phone,
          email: customer.email || tmpEmail,
          status_geral: 'aguardando_formulario'
        });
        
      if (profileError) {
        await logError(
          supabaseClient, 
          'webhook_kiwify_profile_error', 
          `Erro ao criar perfil do usuário: ${profileError.message}`,
          { customer, user_id: userId, order_id: order.id }
        );
        return { 
          success: false, 
          message: 'Erro ao criar perfil do usuário', 
          user_id: userId,
          error: profileError.message,
          status: 'incompleto' 
        };
      }
    } else {
      userId = existingUser.id;
      
      // Atualiza os campos first_name e cpf se não existir conflito
      const updateFields: Record<string, any> = {};
      
      if (first_name) {
        updateFields.first_name = first_name;
      }
      
      // Só atualiza o CPF se o usuário ainda não tiver um CPF ou se for o mesmo CPF
      if (cpf && (!existingUser.cpf || existingUser.cpf === cpf)) {
        updateFields.cpf = cpf;
      }
      
      // Atualiza o perfil apenas se houver campos para atualizar
      if (Object.keys(updateFields).length > 0) {
        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update(updateFields)
          .eq('id', userId);
          
        if (updateError) {
          await logError(
            supabaseClient, 
            'webhook_kiwify_profile_update_error', 
            `Erro ao atualizar perfil do usuário: ${updateError.message}`,
            { user_id: userId, update_fields: updateFields, order_id: order.id }
          );
          // Continuamos o processamento mesmo com erro de atualização
        }
      }
    }
    
    // Buscar informações do produto
    const { data: productData, error: productError } = await supabaseClient
      .from('products')
      .select('id')
      .eq('kiwify_id', product.id)
      .single();
    
    if (productError) {
      await logError(
        supabaseClient, 
        'webhook_kiwify_product_error', 
        `Produto não encontrado: ${productError.message}`,
        { product_id: product.id, user_id: userId, order_id: order.id }
      );
      return { 
        success: false, 
        message: 'Produto não encontrado', 
        user_id: userId, 
        error: productError.message,
        status: 'incompleto' 
      };
    }
    
    // Criar a compra
    const { data: purchaseData, error: purchaseError } = await supabaseClient
      .from('purchases')
      .insert({
        user_id: userId,
        kiwify_id: order.id,
        purchase_date: new Date().toISOString(),
        status: order.status === 'paid' ? 'approved' : 'pending'
      })
      .select()
      .single();
    
    if (purchaseError) {
      await logError(
        supabaseClient, 
        'webhook_kiwify_purchase_error', 
        `Erro ao criar compra: ${purchaseError.message}`,
        { user_id: userId, order_id: order.id }
      );
      return { 
        success: false, 
        message: 'Erro ao criar compra', 
        user_id: userId, 
        error: purchaseError.message,
        status: 'incompleto' 
      };
    }
    
    // Criar item da compra
    const { error: itemError } = await supabaseClient
      .from('purchase_items')
      .insert({
        purchase_id: purchaseData.id,
        product_id: productData.id,
        form_status: 'not_started',
        plan_status: 'awaiting'
      });
    
    if (itemError) {
      await logError(
        supabaseClient, 
        'webhook_kiwify_item_error', 
        `Erro ao criar item da compra: ${itemError.message}`,
        { user_id: userId, purchase_id: purchaseData.id, order_id: order.id }
      );
      
      // Marcar a compra como incompleta para reprocessamento posterior
      await supabaseClient
        .from('purchases')
        .update({ status: 'pending' })
        .eq('id', purchaseData.id);
      
      return { 
        success: false, 
        message: 'Erro ao criar item da compra', 
        user_id: userId, 
        error: itemError.message,
        status: 'incompleto' 
      };
    }
    
    return { 
      success: true, 
      message: 'Compra processada com sucesso', 
      user_id: userId,
      status: 'completo' 
    };
  } catch (error) {
    await logError(
      supabaseClient, 
      'webhook_kiwify_unexpected_error', 
      `Erro inesperado: ${error.message}`,
      { webhook_data: webhook }
    );
    return { 
      success: false, 
      message: 'Erro inesperado', 
      error: error.message,
      status: 'incompleto' 
    };
  }
}

serve(async (req) => {
  try {
    // Verificar método
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Apenas métodos POST são aceitos' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar header de segurança
    const webhookSecret = req.headers.get('x-webhook-secret');
    const expectedSecret = Deno.env.get('WEBHOOK_SECRET');
    
    if (!webhookSecret || webhookSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: 'Acesso não autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Criar cliente do Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') || '' },
        },
      }
    );
    
    // Extrair e validar dados
    const webhookBody = await req.json();
    
    if (!isValidWebhook(webhookBody)) {
      return new Response(
        JSON.stringify({ error: 'Formato de webhook inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Processar apenas eventos de venda confirmada ou atualizada
    if (!['order_completed', 'order_updated'].includes(webhookBody.event)) {
      return new Response(
        JSON.stringify({ 
          message: 'Evento ignorado. Apenas processamos order_completed e order_updated.' 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Processar a compra
    const result = await processNewPurchase(supabaseClient, webhookBody);
    
    // Logar resultado para eventos críticos
    if (!result.success) {
      await logError(
        supabaseClient,
        'webhook_kiwify_processing_failed',
        `Falha no processamento: ${result.error}`,
        { webhook_data: webhookBody, result }
      );
      
      // Enviar notificação se for um erro crítico
      if (Deno.env.get('NOTIFICATION_WEBHOOK_URL')) {
        try {
          await fetch(Deno.env.get('NOTIFICATION_WEBHOOK_URL') || '', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'webhook_kiwify_error',
              description: `Erro no webhook Kiwify: ${result.error}`,
              severity: 'critical',
              metadata: { order_id: webhookBody.data.order.id }
            })
          });
        } catch (notifyError) {
          console.error('Erro ao enviar notificação:', notifyError);
        }
      }
      
      // Ainda retornamos 200 para não fazer a Kiwify retentar indefinidamente
      // Mas incluímos o status de incompleto para identificação interna
      return new Response(
        JSON.stringify({ 
          message: result.message,
          user_id: result.user_id,
          error: result.error,
          status: 'incompleto'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        message: result.message,
        user_id: result.user_id,
        status: result.status
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Erro no webhook:', error.message);
    
    return new Response(
      JSON.stringify({ error: 'Erro interno no servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}); 