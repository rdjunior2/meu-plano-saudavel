import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plan } from './PlanTable';

interface PlanPreviewDialogProps {
  plan: Plan | null;
  onClose: () => void;
  updatePlan: (plan: Plan) => Promise<void>;
  updateLoading: string | null;
  formatDate: (dateString?: string) => string;
}

export const PlanPreviewDialog: React.FC<PlanPreviewDialogProps> = ({
  plan,
  onClose,
  updatePlan,
  updateLoading,
  formatDate
}) => {
  if (!plan) return null;
  
  const handleDateChange = (field: 'data_inicio' | 'data_fim', value: string) => {
    if (plan) {
      plan[field] = value;
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (plan) {
      updatePlan(plan);
    }
  };
  
  return (
    <Dialog open={!!plan} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {plan.title}
            <Badge variant={plan.type === 'meal' ? 'default' : 'secondary'}>
              {plan.type === 'meal' ? 'Alimentar' : 'Treino'}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Criado em {formatDate(plan.created_at)} por {plan.profiles?.nome || 'Usuário'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[60vh] overflow-y-auto py-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Conteúdo do Plano</h3>
              <div className="rounded-md bg-muted p-3 text-sm">
                {plan.type === 'meal' ? (
                  <div>
                    <p className="font-medium">Plano Alimentar</p>
                    <pre className="whitespace-pre-wrap text-xs mt-2 overflow-x-auto">
                      {JSON.stringify(plan.content, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium">Plano de Treino</p>
                    <pre className="whitespace-pre-wrap text-xs mt-2 overflow-x-auto">
                      {JSON.stringify(plan.content, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Data de Início</label>
                  <Input
                    type="date"
                    defaultValue={plan.data_inicio || ''}
                    onChange={(e) => handleDateChange('data_inicio', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Data de Término</label>
                  <Input
                    type="date"
                    defaultValue={plan.data_fim || ''}
                    onChange={(e) => handleDateChange('data_fim', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateLoading === plan.id}
                >
                  {updateLoading === plan.id ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-opacity-50 border-t-transparent"></div>
                  ) : (
                    'Ativar Plano'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlanPreviewDialog; 