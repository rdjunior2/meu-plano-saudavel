import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ActivationRecord {
  id: string;
  plan_id: string;
  plan_type: 'meal' | 'workout';
  activated_at: string;
  activated_by?: string;
  user_id?: string;
}

interface ActivationHistoryProps {
  activationHistory: ActivationRecord[];
  formatDate: (dateString?: string) => string;
}

export const ActivationHistory: React.FC<ActivationHistoryProps> = ({
  activationHistory,
  formatDate
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Histórico de Ativações Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activationHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma ativação recente encontrada</p>
          ) : (
            <ul className="space-y-3">
              {activationHistory.map((record) => (
                <li key={record.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <Badge variant={record.plan_type === 'meal' ? 'default' : 'secondary'}>
                      {record.plan_type === 'meal' ? 'Alimentar' : 'Treino'}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      ID: {record.plan_id.substring(0, 8)}...
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{formatDate(record.activated_at)}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(record.activated_at).toLocaleTimeString()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivationHistory; 