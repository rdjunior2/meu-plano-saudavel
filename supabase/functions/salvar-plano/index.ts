import { serve } from 'https://deno.land/std@0.140.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

// Tipo para o payload do webhook
interface PlanPayload {
  usuario_id: string;
  plano_alimentar: Record<string, any>;
  plano_treino: Record<string, any>;
}

// Validação básica do payload
function isValidPayload(body: any): body is PlanPayload {
  return (
    body &&
    typeof body === 'object' &&
    body.usuario_id &&
    (body.plano_alimentar || body.plano_treino)
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
    
    // Extrair API key do header
    const apiKey = req.headers.get('x-api-key');
    
    // Verificar API key (em produção, usar um método mais seguro)
    const validApiKey = Deno.env.get('WEBHOOK_API_KEY');
    if (!apiKey || apiKey !== validApiKey) {
      return new Response(
        JSON.stringify({ error: 'API key inválida ou não fornecida' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Criar cliente do Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    
    // Extrair e validar dados
    const payload = await req.json();
    
    if (!isValidPayload(payload)) {
      return new Response(
        JSON.stringify({ error: 'Formato de payload inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const { usuario_id, plano_alimentar, plano_treino } = payload;
    
    // Verificar se o usuário existe
    const { data: existingUser, error: userError } = await supabaseClient
      .from('usuarios')
      .select('id')
      .eq('id', usuario_id)
      .single();
      
    if (userError || !existingUser) {
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Salvar plano
    const { data: newPlan, error: insertError } = await supabaseClient
      .from('planos')
      .insert({
        id_usuario: usuario_id,
        plano_alimentar,
        plano_treino
      })
      .select()
      .single();
      
    if (insertError) {
      throw new Error(`Erro ao salvar plano: ${insertError.message}`);
    }
    
    // Atualizar status do usuário
    const { error: updateError } = await supabaseClient
      .from('usuarios')
      .update({ status: 'plano_gerado' })
      .eq('id', usuario_id);
      
    if (updateError) {
      console.error(`Erro ao atualizar status do usuário: ${updateError.message}`);
    }
    
    return new Response(
      JSON.stringify({ 
        message: 'Plano salvo com sucesso',
        plano_id: newPlan.id 
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Erro ao salvar plano:', error.message);
    
    return new Response(
      JSON.stringify({ error: 'Erro interno no servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}); 