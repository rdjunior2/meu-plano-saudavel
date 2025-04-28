/**
 * Funções de formatação para uso em toda a aplicação
 */

/**
 * Remove todos os caracteres não numéricos de uma string
 * @param value String que pode conter caracteres especiais, espaços, etc.
 * @returns Apenas os dígitos numéricos
 */
export const formattedPhoneToDigitsOnly = (value: string): string => {
  return value.replace(/\D/g, '');
};

/**
 * Formata um número de telefone para exibição
 * Exemplos:
 * - 11999887766 -> (11) 99988-7766
 * - 1134567890 -> (11) 3456-7890
 * @param phoneNumber String contendo apenas dígitos do telefone
 * @returns Telefone formatado para exibição
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Se estiver vazio, retorna string vazia
  if (!phoneNumber) return '';
  
  // Remove qualquer caractere não numérico
  const digitsOnly = formattedPhoneToDigitsOnly(phoneNumber);
  
  // Verifica se tem 10 ou 11 dígitos (padrão brasileiro com DDD)
  if (digitsOnly.length === 11) {
    // Formato celular: (99) 99999-9999
    return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2, 7)}-${digitsOnly.slice(7)}`;
  } else if (digitsOnly.length === 10) {
    // Formato fixo: (99) 9999-9999
    return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2, 6)}-${digitsOnly.slice(6)}`;
  }
  
  // Se não corresponder aos formatos esperados, retorna como está
  return phoneNumber;
};

/**
 * Formata uma string de CPF para o formato 999.999.999-99
 * @param cpf String contendo apenas os dígitos do CPF
 * @returns CPF formatado
 */
export const formatCPF = (cpf: string): string => {
  // Remove qualquer caractere não numérico
  const digitsOnly = cpf.replace(/\D/g, '');
  
  // Se não tiver 11 dígitos, retorna como está
  if (digitsOnly.length !== 11) return cpf;
  
  // Aplica a formatação: 999.999.999-99
  return `${digitsOnly.slice(0, 3)}.${digitsOnly.slice(3, 6)}.${digitsOnly.slice(6, 9)}-${digitsOnly.slice(9)}`;
};

/**
 * Formata um valor numérico para moeda (R$)
 * @param value Valor numérico
 * @returns String formatada como moeda brasileira
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}; 