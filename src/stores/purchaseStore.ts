import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { FormStatus, PlanStatus } from '@/integrations/supabase/types';
import { useNotificationStore } from './notificationStore';

export interface Product {
  id: string;
  name: string;
  type: string;
  active: boolean;
}

export interface PurchaseStats {
  total_purchases: number;
  completed_forms: number;
  pending_forms: number;
  ready_plans: number;
  active_plans: number;
  awaiting_plans: number;
}

export interface PurchaseItem {
  item_id: string;
  product_id: string;
  product_name: string;
  product_type: 'meal' | 'workout' | 'combo';
  form_status: 'pending' | 'in_progress' | 'completed';
  plan_status: 'awaiting' | 'ready' | 'active';
  has_form_response: boolean;
}

export interface Purchase {
  id: string;
  kiwify_id: string;
  status: string;
  purchase_date: string;
  items: PurchaseItem[];
}

export interface UserStats {
  total_purchases: number;
  completed_forms: number;
  pending_forms: number;
  ready_plans: number;
  active_plans: number;
  awaiting_plans: number;
}

interface PurchaseState {
  purchases: Purchase[];
  activePurchase: Purchase | null;
  products: Product[];
  stats: PurchaseStats | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchUserPurchases: (userId: string) => Promise<void>;
  fetchUserStats: (userId: string) => Promise<void>;
  fetchAvailableProducts: () => Promise<void>;
  setActivePurchase: (purchase: Purchase) => void;
  checkNewReadyPlans: (userId: string) => Promise<void>;
  updateFormStatus: (itemId: string, status: 'pending' | 'in_progress' | 'completed') => Promise<void>;
  updatePlanStatus: (itemId: string, status: 'awaiting' | 'ready' | 'active') => Promise<void>;
}

export const usePurchaseStore = create<PurchaseState>()(
  persist(
    (set, get) => ({
      purchases: [],
      activePurchase: null,
      products: [],
      stats: null,
      isLoading: false,
      error: null,

      fetchUserPurchases: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          // Buscar dados da view v_purchase_items para obter compras e itens
          const { data, error } = await supabase
            .from('v_purchase_items')
            .select('*')
            .eq('user_id', userId)
            .eq('purchase_status', 'approved');

          if (error) throw error;

          if (!data || data.length === 0) {
            set({ purchases: [], isLoading: false });
            return;
          }

          // Agrupar itens por compra
          const purchases: Purchase[] = [];
          const purchaseMap = new Map<string, Purchase>();

          data.forEach(item => {
            if (!purchaseMap.has(item.purchase_id)) {
              purchaseMap.set(item.purchase_id, {
                id: item.purchase_id,
                kiwify_id: item.kiwify_id || '',
                status: item.purchase_status,
                purchase_date: item.purchase_date,
                items: []
              });
            }

            const purchase = purchaseMap.get(item.purchase_id);
            if (purchase) {
              purchase.items.push({
                item_id: item.item_id,
                product_id: item.product_id,
                product_name: item.product_name,
                product_type: item.product_type,
                form_status: item.form_status,
                plan_status: item.plan_status,
                has_form_response: item.has_form_response
              });
            }
          });

          // Converter o Map para array
          purchaseMap.forEach(purchase => {
            purchases.push(purchase);
          });

          set({ purchases, isLoading: false });
          
          // Se tiver pelo menos uma compra, define como ativa
          if (purchases.length > 0) {
            set({ activePurchase: purchases[0] });
          }

          // Verificar se existem novos planos prontos
          await get().checkNewReadyPlans(userId);
          
        } catch (error) {
          console.error('Erro ao buscar compras:', error);
          set({ error: 'Falha ao carregar compras do usuário', isLoading: false });
        }
      },

      fetchUserStats: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .rpc('get_user_purchase_status', { user_id: userId });

          if (error) throw error;

          if (data && data.length > 0) {
            const stats: PurchaseStats = {
              total_purchases: data[0].total_purchases,
              completed_forms: data[0].completed_forms,
              pending_forms: data[0].pending_forms,
              ready_plans: data[0].ready_plans,
              active_plans: data[0].active_plans,
              awaiting_plans: data[0].awaiting_plans
            };
            set({ stats, isLoading: false });
          } else {
            set({ stats: null, isLoading: false });
          }
        } catch (error) {
          console.error('Erro ao buscar estatísticas:', error);
          set({ error: 'Falha ao carregar estatísticas do usuário', isLoading: false });
        }
      },

      fetchAvailableProducts: async () => {
        try {
          set({ isLoading: true, error: null });

          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('active', true)
            .order('name');

          if (error) throw error;

          set({
            products: data || [],
            isLoading: false
          });
          
        } catch (error) {
          console.error('Erro ao buscar produtos:', error);
          set({ error: 'Falha ao carregar produtos disponíveis.', isLoading: false });
        }
      },

      setActivePurchase: (purchase: Purchase) => {
        set({ activePurchase: purchase });
      },
      
      checkNewReadyPlans: async (userId: string) => {
        try {
          // Buscar dados locais armazenados da última verificação
          const storedData = localStorage.getItem('last-ready-plans-check');
          let lastCheckedItems: Record<string, PlanStatus> = {};
          
          if (storedData) {
            lastCheckedItems = JSON.parse(storedData);
          }
          
          const { purchases } = get();
          const currentItems: Record<string, PlanStatus> = {};
          const newReadyItems: PurchaseItem[] = [];
          
          // Verificar se há novos planos prontos
          purchases.forEach(purchase => {
            purchase.items.forEach(item => {
              currentItems[item.item_id] = item.plan_status;
              
              // Se o status anterior não era "ready" mas agora é
              if (item.plan_status === 'ready' && 
                  (!lastCheckedItems[item.item_id] || lastCheckedItems[item.item_id] !== 'ready')) {
                newReadyItems.push(item);
              }
            });
          });
          
          // Gerar notificações para novos planos prontos
          if (newReadyItems.length > 0) {
            const notificationStore = useNotificationStore.getState();
            
            newReadyItems.forEach(item => {
              notificationStore.addNotification({
                type: 'success',
                title: 'Plano pronto para visualização!',
                message: `Seu plano ${item.product_name} está pronto e disponível para visualização.`,
                link: `/planos/${item.item_id}`,
                linkText: 'Ver plano'
              });
            });
          }
          
          // Atualizar o registro de itens verificados
          localStorage.setItem('last-ready-plans-check', JSON.stringify(currentItems));
          
        } catch (error) {
          console.error('Erro ao verificar novos planos prontos:', error);
        }
      },

      updateFormStatus: async (itemId: string, status: 'pending' | 'in_progress' | 'completed') => {
        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase
            .from('purchase_items')
            .update({ form_status: status })
            .eq('id', itemId);

          if (error) throw error;

          // Atualiza o estado localmente
          const { purchases } = get();
          const updatedPurchases = purchases.map(purchase => {
            const updatedItems = purchase.items.map(item => {
              if (item.item_id === itemId) {
                return { ...item, form_status: status };
              }
              return item;
            });
            return { ...purchase, items: updatedItems };
          });

          set({ purchases: updatedPurchases, isLoading: false });
        } catch (error) {
          console.error('Erro ao atualizar status do formulário:', error);
          set({ error: 'Falha ao atualizar status do formulário', isLoading: false });
        }
      },

      updatePlanStatus: async (itemId: string, status: 'awaiting' | 'ready' | 'active') => {
        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase
            .from('purchase_items')
            .update({ plan_status: status })
            .eq('id', itemId);

          if (error) throw error;

          // Atualiza o estado localmente
          const { purchases } = get();
          const updatedPurchases = purchases.map(purchase => {
            const updatedItems = purchase.items.map(item => {
              if (item.item_id === itemId) {
                return { ...item, plan_status: status };
              }
              return item;
            });
            return { ...purchase, items: updatedItems };
          });

          set({ purchases: updatedPurchases, isLoading: false });
        } catch (error) {
          console.error('Erro ao atualizar status do plano:', error);
          set({ error: 'Falha ao atualizar status do plano', isLoading: false });
        }
      }
    }),
    {
      name: 'purchase-store',
      partialize: (state) => ({
        // Persistir apenas dados essenciais
        activePurchase: state.activePurchase,
        stats: state.stats
      }),
    }
  )
); 