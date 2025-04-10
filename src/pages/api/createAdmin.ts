import { supabase } from '@/integrations/supabase/client';

export async function createAdmin() {
  const phone = '819989758872';
  const password = '33milhoes';
  const email = `${phone}@meuplanosaude.app`;

  try {
    // 1. Registrar o usuário
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          phone
        }
      }
    });

    if (authError) {
      console.error('Erro ao criar usuário:', authError);
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      console.error('Usuário não foi criado');
      return { success: false, error: 'Usuário não foi criado' };
    }

    // 2. Atualizar o perfil como admin
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        is_admin: true,
        nome: 'Administrador',
        telefone: phone,
        status: 'ativo'
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('Erro ao atualizar perfil:', profileError);
      return { success: false, error: profileError.message };
    }

    return {
      success: true,
      user: {
        id: authData.user.id,
        email,
        phone
      }
    };

  } catch (error) {
    console.error('Erro ao criar usuário admin:', error);
    return { success: false, error: 'Erro interno ao criar usuário admin' };
  }
} 