import { supabase } from '../integrations/supabase/client';

async function createAdminUser() {
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
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Usuário não foi criado');
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
      throw profileError;
    }

    console.log('Usuário admin criado com sucesso!');
    console.log('ID:', authData.user.id);
    console.log('Email:', email);
    console.log('Telefone:', phone);

  } catch (error) {
    console.error('Erro ao criar usuário admin:', error);
  }
}

createAdminUser(); 