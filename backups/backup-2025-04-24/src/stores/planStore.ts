
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Tipagens dos planos
export interface MealPlan {
  id?: string;
  title: string;
  description: string;
  meals: {
    name: string;
    time: string;
    foods: {
      name: string;
      portion: string;
      calories?: number;
    }[];
  }[];
}

export interface WorkoutPlan {
  id?: string;
  title: string;
  description: string;
  days: {
    day: string;
    exercises: {
      name: string;
      sets: number;
      reps: string;
      rest: string;
      notes?: string;
    }[];
  }[];
}

// Estados do plano
export type PlanStatus = 'awaiting' | 'processing' | 'ready';

// Interface da store dos planos
interface PlanState {
  mealPlan: MealPlan | null;
  workoutPlan: WorkoutPlan | null;
  planStatus: PlanStatus;
  pdfUrl: string | null;
  
  setMealPlan: (plan: MealPlan | null) => void;
  setWorkoutPlan: (plan: WorkoutPlan | null) => void;
  setPlanStatus: (status: PlanStatus) => void;
  setPdfUrl: (url: string | null) => void;
  resetPlans: () => void;
}

// Criação da store com persistência
export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      mealPlan: null,
      workoutPlan: null,
      planStatus: 'awaiting',
      pdfUrl: null,
      
      setMealPlan: (plan) => set({ mealPlan: plan }),
      setWorkoutPlan: (plan) => set({ workoutPlan: plan }),
      setPlanStatus: (status) => set({ planStatus: status }),
      setPdfUrl: (url) => set({ pdfUrl: url }),
      resetPlans: () => set({ 
        mealPlan: null, 
        workoutPlan: null, 
        planStatus: 'awaiting',
        pdfUrl: null
      })
    }),
    {
      name: "meu-plano-plans",
    }
  )
);
