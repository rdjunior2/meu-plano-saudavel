import { format, formatDistance, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata uma data em string para o formato dd/MM/yyyy
 * @param dateStr String de data ISO
 * @returns Data formatada
 */
export const formatDate = (dateStr: string): string => {
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Data inválida';
  }
};

/**
 * Calcula o tempo passado desde uma data até agora ("há X dias")
 * @param dateStr String de data ISO
 * @returns Texto com o tempo passado
 */
export const calculateDaysAgo = (dateStr: string): string => {
  try {
    return formatDistance(parseISO(dateStr), new Date(), { 
      addSuffix: true,
      locale: ptBR 
    });
  } catch (error) {
    console.error('Erro ao calcular tempo passado:', error);
    return '';
  }
};

/**
 * Formata uma data em string para o formato dd/MM/yyyy HH:mm
 * @param dateStr String de data ISO
 * @returns Data e hora formatadas
 */
export const formatDateTime = (dateStr: string): string => {
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data e hora:', error);
    return 'Data inválida';
  }
};

/**
 * Converte uma data ISO em objeto Date
 * @param dateStr String de data ISO
 * @returns Objeto Date ou null se inválido
 */
export const parseDate = (dateStr: string): Date | null => {
  try {
    return parseISO(dateStr);
  } catch (error) {
    console.error('Erro ao fazer parse da data:', error);
    return null;
  }
}; 