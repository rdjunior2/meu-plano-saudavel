export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      meal_plans: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string | null
          meals: Json
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
          meals: Json
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
          meals?: Json
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
          days: Json
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
          days: Json
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
          days?: Json
          user_id?: string
          status?: string
          data_inicio?: string | null
          data_fim?: string | null
        }
      }
    }
  }
}