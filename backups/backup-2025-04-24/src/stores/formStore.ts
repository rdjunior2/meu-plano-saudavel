
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Interface para dados de anamnese
export interface AnamneseFormData {
  // Dados pessoais
  nome: string;
  idade: number;
  genero: string;
  peso: number;
  altura: number;
  
  // Objetivos e preferências
  objetivo: string;
  restricoes: string[];
  alergias: string[];
  
  // Rotina e estilo de vida
  rotina: string;
  atividadeFisica: string;
  nivelAtividade: 'sedentario' | 'leve' | 'moderado' | 'intenso' | 'muito intenso';
  
  // Saúde
  doencas: string[];
  medicamentos: string[];
  
  // Alimentação
  refeicoesDia: number;
  horarioAcordar: string;
  horarioDormir: string;
  preferenciasAlimentares: string[];
  alimentosIndesejados: string[];
  
  // Treino
  diasTreino: number;
  tempoDisponivel: number;
  localTreino: 'casa' | 'academia' | 'ar livre' | 'outro';
  
  // Extra
  observacoes: string;
}

// Estado inicial do formulário
const initialFormData: AnamneseFormData = {
  nome: "",
  idade: 0,
  genero: "",
  peso: 0,
  altura: 0,
  objetivo: "",
  restricoes: [],
  alergias: [],
  rotina: "",
  atividadeFisica: "",
  nivelAtividade: "moderado",
  doencas: [],
  medicamentos: [],
  refeicoesDia: 4,
  horarioAcordar: "",
  horarioDormir: "",
  preferenciasAlimentares: [],
  alimentosIndesejados: [],
  diasTreino: 3,
  tempoDisponivel: 60,
  localTreino: "academia",
  observacoes: ""
};

// Interface da store do formulário
interface FormState {
  formData: AnamneseFormData;
  activeStep: number;
  isSubmitting: boolean;
  isCompleted: boolean;
  
  updateFormField: <K extends keyof AnamneseFormData>(
    field: K, 
    value: AnamneseFormData[K]
  ) => void;
  setActiveStep: (step: number) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  setIsCompleted: (isCompleted: boolean) => void;
  resetForm: () => void;
}

// Criação da store com persistência
export const useFormStore = create<FormState>()(
  persist(
    (set) => ({
      formData: initialFormData,
      activeStep: 0,
      isSubmitting: false,
      isCompleted: false,
      
      updateFormField: (field, value) => set((state) => ({
        formData: {
          ...state.formData,
          [field]: value
        }
      })),
      
      setActiveStep: (step) => set({ activeStep: step }),
      setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
      setIsCompleted: (isCompleted) => set({ isCompleted }),
      
      resetForm: () => set({ 
        formData: initialFormData,
        activeStep: 0,
        isSubmitting: false,
        isCompleted: false
      })
    }),
    {
      name: "meu-plano-form",
    }
  )
);
