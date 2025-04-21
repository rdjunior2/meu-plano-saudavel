import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const SUPABASE_URL = "https://ykepyxcjsnvesbkuxgmv.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // Precisa ser a chave de serviço

if (!SUPABASE_SERVICE_KEY) {
  console.error("ERRO: SUPABASE_SERVICE_KEY não definida. Use: SUPABASE_SERVICE_KEY=sua_chave node promoteToAdmin.js");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const promoteUserToAdmin = async () => {
  const targetEmail = "04junior.silva09@gmail.com";
  const newPassword = "33milhoes";
  
  try {
    // 1. Verificar se o usuário existe
    console.log(`Verificando se o usuário com email ${targetEmail} existe...`);
    const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(targetEmail);
    
    if (userError) {
      throw new Error(`Erro ao buscar usuário: ${userError.message}`);
    }
    
    if (!userData || !userData.user) {
      throw new Error(`Usuário com email ${targetEmail} não encontrado`);
    }
    
    const userId = userData.user.id;
    console.log(`Usuário encontrado com ID: ${userId}`);
    
    // 2. Atualizar senha do usuário
    console.log("Atualizando senha do usuário...");
    const { error: passwordError } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword
    });
    
    if (passwordError) {
      throw new Error(`Erro ao atualizar senha: ${passwordError.message}`);
    }
    
    console.log("Senha atualizada com sucesso");
    
    // 3. Promover a administrador na tabela profiles
    console.log("Promovendo usuário a administrador...");
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        is_admin: true,
        status_geral: 'ativo',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (profileError) {
      throw new Error(`Erro ao atualizar perfil: ${profileError.message}`);
    }
    
    console.log("Usuário promovido a administrador com sucesso!");
    
    // 4. Registrar a operação no log
    await supabase
      .from('log_agente_automacao')
      .insert({
        evento: 'promote_to_admin',
        payload: {
          user_id: userId,
          email: targetEmail
        },
        status: 'sucesso',
        mensagem: 'Usuário promovido a administrador com sucesso'
      });
    
    console.log("Operação concluída com sucesso!");
    
  } catch (error) {
    console.error("Erro durante a operação:", error.message);
    
    // Registrar erro no log
    try {
      await supabase
        .from('log_agente_automacao')
        .insert({
          evento: 'promote_to_admin_error',
          payload: {
            email: targetEmail,
            error: error.message
          },
          status: 'erro',
          mensagem: error.message
        });
    } catch (logError) {
      console.error("Erro ao registrar log:", logError.message);
    }
  }
};

promoteUserToAdmin(); 