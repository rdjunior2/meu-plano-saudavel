import { 
  PlanStatus, 
  PurchaseStatus, 
  ProductType, 
  FormStatus 
} from '../integrations/supabase/types';

/**
 * Interface representando um item de compra
 */
export interface PurchaseItem {
  purchase_id: string;
  user_id: string;
  user_email: string;
  kiwify_id: string;
  purchase_status: PurchaseStatus;
  purchase_date: string | null;
  item_id: string;
  product_id: string;
  product_name: string;
  product_type: ProductType;
  form_status: FormStatus;
  plan_status: PlanStatus;
  has_form_response: boolean;
  item_created_at: string;
}

/**
 * Interface representando um item de compra com tipo estendido
 */
export interface PurchaseItemExtended extends Omit<PurchaseItem, 'product_type'> {
  product_type: ProductType | 'alimentar' | 'treino';
}

/**
 * Interface representando o status de compras do usuário
 */
export interface UserPurchaseStatus {
  user_id: string;
  total_purchases: number;
  completed_forms: number;
  pending_forms: number;
  ready_plans: number;
  active_plans: number;
  awaiting_plans: number;
}

/**
 * Interface representando uma compra completa
 */
export interface Purchase {
  id: string;
  user_id: string;
  kiwify_id: string;
  status: PurchaseStatus;
  purchase_date: string | null;
  created_at: string;
  updated_at: string;
  payment_method?: string;
  total_amount?: number;
  items?: PurchaseItem[];
} 