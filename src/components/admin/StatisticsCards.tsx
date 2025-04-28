import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, Utensils, Dumbbell } from 'lucide-react';

export interface Stats {
  totalPending: number;
  mealPlans: number;
  workoutPlans: number;
  activatedToday: number;
}

interface StatisticsCardsProps {
  stats: Stats;
}

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700">Planos Pendentes</p>
              <h3 className="text-2xl font-bold mt-1 text-amber-800">{stats.totalPending}</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shadow-sm">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700">Planos Alimentares</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-800">{stats.mealPlans}</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shadow-sm">
              <Utensils className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Planos de Treino</p>
              <h3 className="text-2xl font-bold mt-1 text-blue-800">{stats.workoutPlans}</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shadow-sm">
              <Dumbbell className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-white border-green-100 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Ativados Hoje</p>
              <h3 className="text-2xl font-bold mt-1 text-green-800">{stats.activatedToday}</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatisticsCards; 