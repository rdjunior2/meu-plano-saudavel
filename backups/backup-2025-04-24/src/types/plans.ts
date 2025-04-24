/**
 * Interface para plano alimentar
 */
export interface MealPlan {
  id: string;
  title: string;
  description: string | null;
  meals: any | null;
  created_at: string;
  user_id: string;
  status?: string;
  notes?: string | null;
}

/**
 * Interface para um dia do plano de treino
 */
export interface WorkoutDay {
  title: string;
  description?: string | null;
  exercises: WorkoutExercise[];
}

/**
 * Interface para um exercício
 */
export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string | null;
  video_url?: string | null;
  image_url?: string | null;
}

/**
 * Interface para plano de treino
 */
export interface WorkoutPlan {
  id: string;
  title: string;
  description: string | null;
  days: WorkoutDay[] | null;
  created_at: string;
  user_id: string;
  status?: string;
  notes?: string | null;
}

/**
 * Interface para status de preenchimento dos formulários
 */
export interface UserFormStatus {
  alimentar_completed: boolean;
  treino_completed: boolean;
} 