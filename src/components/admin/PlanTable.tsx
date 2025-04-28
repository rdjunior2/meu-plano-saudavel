import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, Calendar } from 'lucide-react';

export interface Plan {
  id: string;
  title: string;
  status: string;
  data_inicio?: string;
  data_fim?: string;
  days?: number[];
  type: 'meal' | 'workout';
  created_at: string;
  user_id: string;
  profiles?: { nome: string };
  content?: any;
}

interface PlanTableProps {
  plans: Plan[];
  selectedPlans: string[];
  handleSelectPlan: (planId: string, checked: boolean) => void;
  handleSelectAllInPage: (checked: boolean) => void;
  viewPlanDetails: (plan: Plan) => void;
  formatDate: (dateString?: string) => string;
  updatePlan: (plan: Plan) => Promise<void>;
  updateLoading: string | null;
}

export const PlanTable: React.FC<PlanTableProps> = ({
  plans,
  selectedPlans,
  handleSelectPlan,
  handleSelectAllInPage,
  viewPlanDetails,
  formatDate,
  updatePlan,
  updateLoading
}) => {
  const allSelected = plans.length > 0 && plans.every(plan => selectedPlans.includes(plan.id));
  
  return (
    <div className="rounded-md border">
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <th className="h-10 px-2 text-left align-middle font-medium">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAllInPage}
                  aria-label="Selecionar todos"
                />
              </th>
              <th className="h-10 px-2 text-left align-middle font-medium">Tipo</th>
              <th className="h-10 px-4 text-left align-middle font-medium">Título</th>
              <th className="h-10 px-4 text-left align-middle font-medium">Usuário</th>
              <th className="h-10 px-4 text-left align-middle font-medium">Criado em</th>
              <th className="h-10 px-4 text-left align-middle font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {plans.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground">
                  Nenhum plano pendente encontrado
                </td>
              </tr>
            ) : (
              plans.map((plan) => (
                <tr key={plan.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td className="p-2 align-middle">
                    <Checkbox
                      checked={selectedPlans.includes(plan.id)}
                      onCheckedChange={(checked) => handleSelectPlan(plan.id, checked as boolean)}
                      aria-label={`Selecionar ${plan.title}`}
                    />
                  </td>
                  <td className="p-2 align-middle">
                    <Badge variant={plan.type === 'meal' ? 'default' : 'secondary'}>
                      {plan.type === 'meal' ? 'Alimentar' : 'Treino'}
                    </Badge>
                  </td>
                  <td className="p-4 align-middle font-medium">{plan.title}</td>
                  <td className="p-4 align-middle">{plan.profiles?.nome || 'Usuário'}</td>
                  <td className="p-4 align-middle">{formatDate(plan.created_at)}</td>
                  <td className="p-4 align-middle">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewPlanDetails(plan)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => updatePlan(plan)}
                        disabled={updateLoading === plan.id}
                      >
                        {updateLoading === plan.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-opacity-50 border-t-transparent"></div>
                        ) : (
                          <Calendar className="h-4 w-4 mr-1" />
                        )}
                        Ativar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlanTable; 