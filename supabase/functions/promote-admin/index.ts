import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Criar um client Supabase com os privilégios da função
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const targetEmail = "04junior.silva09@gmail.com"
    const newPassword = "33milhoes"
    
    // 1. Verificar se o usuário existe
    const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserByEmail(targetEmail)
    
    if (userError) {
      throw new Error(`Erro ao buscar usuário: ${userError.message}`)
    }
    
    if (!userData || !userData.user) {
      throw new Error(`Usuário com email ${targetEmail} não encontrado`)
    }
    
    const userId = userData.user.id
    
    // 2. Atualizar senha do usuário
    const { error: passwordError } = await supabaseClient.auth.admin.updateUserById(userId, {
      password: newPassword
    })
    
    if (passwordError) {
      throw new Error(`Erro ao atualizar senha: ${passwordError.message}`)
    }
    
    // 3. Promover a administrador na tabela profiles
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        is_admin: true,
        status_geral: 'ativo',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
    
    if (profileError) {
      throw new Error(`Erro ao atualizar perfil: ${profileError.message}`)
    }
    
    // 4. Registrar a operação no log
    await supabaseClient
      .from('log_agente_automacao')
      .insert({
        evento: 'promote_to_admin',
        payload: {
          user_id: userId,
          email: targetEmail
        },
        status: 'sucesso',
        mensagem: 'Usuário promovido a administrador com sucesso'
      })
    
    return new Response(
      JSON.stringify({
        success: true, 
        message: 'Usuário promovido a administrador com sucesso',
        user: {
          id: userId,
          email: targetEmail
        }
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
    
  } catch (error) {
    console.error('Erro:', error.message)
    
    // Registrar erro no log
    try {
      await supabaseClient
        .from('log_agente_automacao')
        .insert({
          evento: 'promote_to_admin_error',
          payload: {
            email: "04junior.silva09@gmail.com",
            error: error.message
          },
          status: 'erro',
          mensagem: error.message
        })
    } catch (logError) {
      console.error('Erro ao registrar log:', logError.message)
    }
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}) 