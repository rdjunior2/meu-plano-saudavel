import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Salad, Dumbbell, CalendarClock } from "lucide-react";
import { formatDate, calculateDaysAgo } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';
import { MealPlan, WorkoutPlan } from '@/types/plans';

interface PlanosDisponiveisProps {
  mealPlans: MealPlan[];
  workoutPlans: WorkoutPlan[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

enum ActiveTab {
  Meal = 'meal',
  Workout = 'workout',
}

const PlanosDisponiveis: React.FC<PlanosDisponiveisProps> = ({ 
  mealPlans, 
  workoutPlans, 
  activeTab, 
  setActiveTab 
}) => {
  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold flex items-center space-x-2">
          <Salad className="h-5 w-5 text-primary" />
          <span>Seus Planos</span>
        </CardTitle>
        <CardDescription>
          Acesse seus planos personalizados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as ActiveTab)}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value={ActiveTab.Meal} className="flex items-center space-x-1">
              <Salad className="h-4 w-4" />
              <span>Alimentação</span>
            </TabsTrigger>
            <TabsTrigger value={ActiveTab.Workout} className="flex items-center space-x-1">
              <Dumbbell className="h-4 w-4" />
              <span>Treino</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={ActiveTab.Meal}>
            {mealPlans.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p>Nenhum plano alimentar disponível ainda.</p>
                <p className="text-sm mt-2">Assim que seu plano estiver pronto, ele aparecerá aqui.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mealPlans.map((plan) => (
                  <div 
                    key={plan.id} 
                    className="border rounded-lg p-4 hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{plan.title}</h3>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <CalendarClock className="h-3 w-3 mr-1" />
                        <span>{formatDate(plan.created_at)} ({calculateDaysAgo(plan.created_at)})</span>
                      </div>
                    </div>
                    
                    {plan.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {plan.description}
                      </p>
                    )}
                    
                    <div className="flex justify-end">
                      <Link to={`/plano/${plan.id}`}>
                        <Button variant="outline" size="sm">Ver Detalhes</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value={ActiveTab.Workout}>
            {workoutPlans.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p>Nenhum plano de treino disponível ainda.</p>
                <p className="text-sm mt-2">Assim que seu plano estiver pronto, ele aparecerá aqui.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {workoutPlans.map((plan) => (
                  <div 
                    key={plan.id} 
                    className="border rounded-lg p-4 hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{plan.title}</h3>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <CalendarClock className="h-3 w-3 mr-1" />
                        <span>{formatDate(plan.created_at)} ({calculateDaysAgo(plan.created_at)})</span>
                      </div>
                    </div>
                    
                    {plan.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {plan.description}
                      </p>
                    )}
                    
                    <div className="flex justify-end">
                      <Link to={`/plano/${plan.id}`}>
                        <Button variant="outline" size="sm">Ver Detalhes</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PlanosDisponiveis; 