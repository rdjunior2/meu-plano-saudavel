import React from 'react';
import { Button } from '@/components/ui/button';
import { Plan } from './PlanTable';

interface BulkActionsProps {
  selectedPlans: string[];
  plans: Plan[];
  updateLoading: string | null;
  updatePlans: (plans: Plan[]) => Promise<void>;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedPlans,
  plans,
  updateLoading,
  updatePlans
}) => {
  // Filtrar os planos selecionados
  const selectedPlanObjects = plans.filter(plan => selectedPlans.includes(plan.id));
  
  // Verificar se há planos selecionados
  const hasSelectedPlans = selectedPlans.length > 0;
  
  const handleBulkActivate = () => {
    updatePlans(selectedPlanObjects);
  };
  
  return (
    <div className="sticky bottom-0 left-0 right-0 p-4 bg-white border-t z-10 shadow-md">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          {selectedPlans.length} plano(s) selecionado(s)
        </div>
        
        <Button
          onClick={handleBulkActivate}
          disabled={!hasSelectedPlans || updateLoading === 'bulk'}
          className={`${!hasSelectedPlans ? 'opacity-50' : ''}`}
        >
          {updateLoading === 'bulk' ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-opacity-50 border-t-transparent mr-2"></div>
          ) : null}
          Ativar {selectedPlans.length} Plano(s)
        </Button>
      </div>
    </div>
  );
};

export default BulkActions; 