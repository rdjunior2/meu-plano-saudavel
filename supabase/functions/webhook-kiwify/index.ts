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
    };
    order: {
      id: string;
      status: string;
    };
  };
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

serve(async (req) => {
  try {
    // Verificar método
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Apenas métodos POST são aceitos' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Criar cliente do Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
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
    
    // Processar apenas eventos de venda confirmada
    if (webhookBody.event !== 'order_completed') {
      return new Response(
        JSON.stringify({ 
          message: 'Evento ignorado. Apenas processamos order_completed.' 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const { customer } = webhookBody.data;
    
    // Verificar se o usuário já existe
    const { data: existingUser, error: userError } = await supabaseClient
      .from('usuarios')
      .select('id')
      .eq('telefone', customer.phone)
      .single();
      
    if (userError && userError.code !== 'PGRST116') {
      throw new Error(`Erro ao verificar usuário: ${userError.message}`);
    }
    
    if (existingUser) {
      return new Response(
        JSON.stringify({ 
          message: 'Usuário já registrado no sistema',
          user_id: existingUser.id 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Cadastrar novo usuário
    const { data: newUser, error: insertError } = await supabaseClient
      .from('usuarios')
      .insert({
        nome: customer.name,
        telefone: customer.phone,
        email: customer.email || null,
        status: 'aguardando_formulario'
      })
      .select()
      .single();
      
    if (insertError) {
      throw new Error(`Erro ao cadastrar usuário: ${insertError.message}`);
    }
    
    return new Response(
      JSON.stringify({ 
        message: 'Usuário cadastrado com sucesso',
        user_id: newUser.id 
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Erro no webhook:', error.message);
    
    return new Response(
      JSON.stringify({ error: 'Erro interno no servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}); 