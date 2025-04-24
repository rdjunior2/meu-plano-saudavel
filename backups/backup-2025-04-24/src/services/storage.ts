import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * Faz upload de um arquivo de avatar para o storage e retorna a URL pública
 */
export const uploadAvatar = async (userId: string, file: File) => {
  try {
    // Verifica o tipo do arquivo
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'Apenas imagens são permitidas como avatar'
      };
    }

    // Limita o tamanho do arquivo (2MB)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return {
        success: false,
        error: 'O tamanho máximo do arquivo é 2MB'
      };
    }

    // Cria nome único para o arquivo usando UUID
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${uuidv4()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Faz upload do arquivo
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Erro no upload do avatar:', error);
      return {
        success: false,
        error: `Erro ao fazer upload: ${error.message}`
      };
    }

    // Obtém a URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path);

    return {
      success: true,
      url: publicUrl
    };
  } catch (error) {
    console.error('Erro ao fazer upload do avatar:', error);
    return {
      success: false,
      error: 'Ocorreu um erro inesperado ao fazer upload do avatar'
    };
  }
};

/**
 * Remove avatar anterior do usuário caso exista
 */
export const removeOldAvatars = async (userId: string, currentAvatarUrl?: string) => {
  try {
    if (!currentAvatarUrl) return { success: true };

    // Lista todos os arquivos do usuário
    const { data, error } = await supabase.storage
      .from('avatars')
      .list(userId);

    if (error) {
      console.error('Erro ao listar avatares:', error);
      return { success: false, error: error.message };
    }

    // Se não há arquivos, não há o que remover
    if (!data || data.length === 0) {
      return { success: true };
    }

    // Extrai o nome do arquivo atual da URL
    const currentAvatarFileName = currentAvatarUrl.split('/').pop();

    // Filtra arquivos que não são o avatar atual
    const filesToDelete = data
      .filter(file => `${userId}/${file.name}` !== currentAvatarUrl)
      .map(file => `${userId}/${file.name}`);

    if (filesToDelete.length === 0) {
      return { success: true };
    }

    // Remove os arquivos antigos
    const { error: deleteError } = await supabase.storage
      .from('avatars')
      .remove(filesToDelete);

    if (deleteError) {
      console.error('Erro ao remover avatares antigos:', deleteError);
      return { success: false, error: deleteError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao remover avatares antigos:', error);
    return { success: false, error: 'Erro inesperado ao remover avatares antigos' };
  }
}; 