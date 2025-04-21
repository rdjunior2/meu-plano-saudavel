export interface User {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  status: string;
  is_admin?: boolean;
  formulario_alimentar_preenchido?: boolean;
  formulario_treino_preenchido?: boolean;
} 