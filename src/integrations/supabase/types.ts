export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type FormStatus = 'pending' | 'completed' | 'not_started'
export type PlanStatus = 'ready' | 'active' | 'awaiting'
export type PurchaseStatus = 'approved' | 'refunded' | 'pending' | 'cancelled'
export type ProductType = 'meal' | 'workout' | 'combo'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          status_geral: string
          formulario_alimentar_preenchido: boolean
          formulario_treino_preenchido: boolean
          is_admin: boolean
          created_at: string
          updated_at: string
          telefone: string | null
          nome: string | null
          email: string | null
          first_name: string | null
          cpf: string | null
        }
        Insert: {
          id: string
          status_geral?: string
          formulario_alimentar_preenchido?: boolean
          formulario_treino_preenchido?: boolean
          is_admin?: boolean
          created_at?: string
          updated_at?: string
          telefone?: string | null
          nome?: string | null
          email?: string | null
          first_name?: string | null
          cpf?: string | null
        }
        Update: {
          id?: string
          status_geral?: string
          formulario_alimentar_preenchido?: boolean
          formulario_treino_preenchido?: boolean
          is_admin?: boolean
          created_at?: string
          updated_at?: string
          telefone?: string | null
          nome?: string | null
          email?: string | null
          first_name?: string | null
          cpf?: string | null
        }
      }
      meal_plans: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string | null
          meals: Json | null
          user_id: string
          status: string
          data_inicio: string | null
          data_fim: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description?: string | null
          meals?: Json | null
          user_id: string
          status?: string
          data_inicio?: string | null
          data_fim?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string | null
          meals?: Json | null
          user_id?: string
          status?: string
          data_inicio?: string | null
          data_fim?: string | null
        }
      }
      workout_plans: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string | null
          days: Json | null
          user_id: string
          status: string
          data_inicio: string | null
          data_fim: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description?: string | null
          days?: Json | null
          user_id: string
          status?: string
          data_inicio?: string | null
          data_fim?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string | null
          days?: Json | null
          user_id?: string
          status?: string
          data_inicio?: string | null
          data_fim?: string | null
        }
      }
      purchases: {
        Row: {
          id: string
          user_id: string
          kiwify_id: string
          purchase_date: string | null
          status: PurchaseStatus
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          kiwify_id: string
          purchase_date?: string | null
          status: PurchaseStatus
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          kiwify_id?: string
          purchase_date?: string | null
          status?: PurchaseStatus
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          type: ProductType
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: ProductType
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: ProductType
          active?: boolean
          created_at?: string
        }
      }
      purchase_items: {
        Row: {
          id: string
          purchase_id: string
          product_id: string
          created_at: string
          form_status: FormStatus
          plan_status: PlanStatus
        }
        Insert: {
          id?: string
          purchase_id: string
          product_id: string
          created_at?: string
          form_status?: FormStatus
          plan_status?: PlanStatus
        }
        Update: {
          id?: string
          purchase_id?: string
          product_id?: string
          created_at?: string
          form_status?: FormStatus
          plan_status?: PlanStatus
        }
      }
      form_responses: {
        Row: {
          id: string
          user_id: string
          form_type: string
          version: number
          responses: Json
          purchase_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          form_type: string
          version?: number
          responses: Json
          purchase_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          form_type?: string
          version?: number
          responses?: Json
          purchase_id?: string
          product_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      v_purchase_items: {
        Row: {
          purchase_id: string
          user_id: string
          user_email: string
          kiwify_id: string
          purchase_status: PurchaseStatus
          purchase_date: string | null
          item_id: string
          product_id: string
          product_name: string
          product_type: ProductType
          form_status: FormStatus
          plan_status: PlanStatus
          has_form_response: boolean
          item_created_at: string
        }
      }
    }
    Functions: {
      get_user_purchase_status: {
        Args: {
          user_id: string
        }
        Returns: {
          user_id: string
          total_purchases: number
          completed_forms: number
          pending_forms: number
          ready_plans: number
          active_plans: number
          awaiting_plans: number
        }[]
      }
    }
  }
}