import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Dumbbell } from "lucide-react";
import { useAuthStore } from '@/stores/authStore';
import { usePlanStore } from '@/stores/planStore';
import Logo from '@/components/Logo';

const PlanoDetalhes = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { mealPlan, workoutPlan, planStatus, pdfUrl } = usePlanStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
    
    if (planStatus !== 'ready') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, planStatus, navigate]);

  return (
    <div className="container py-8 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Seu Plano Personalizado</h1>
          <p className="text-muted-foreground">
            Confira os detalhes do seu plano alimentar e de treino
          </p>
        </div>
        
        {pdfUrl && (
          <Button variant="outline" className="flex gap-2 border-lavender" asChild>
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4" />
              <span>Baixar PDF</span>
            </a>
          </Button>
        )}
      </div>

      <Tabs defaultValue="meal" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="meal" className="flex gap-2 items-center">
            <Logo size={16} withShadow={false} />
            Plano Alimentar
          </TabsTrigger>
          <TabsTrigger value="workout" className="flex gap-2">
            <Dumbbell className="h-4 w-4" />
            Plano de Treino
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="meal" className="space-y-4 mt-6">
          {mealPlan ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center">{mealPlan.title}</CardTitle>
                <CardDescription className="text-center">{mealPlan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {mealPlan.meals.map((meal, index) => (
                    <Card key={index} className="card-gradient overflow-hidden border-lavender-light/30">
                      <CardHeader className="pb-3 bg-gradient-to-r from-lavender-light/30 to-transparent">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">{meal.name}</CardTitle>
                          <span className="text-sm font-medium text-lavender-dark">{meal.time}</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {meal.foods.map((food, foodIndex) => (
                            <li key={foodIndex} className="flex justify-between text-sm">
                              <span>{food.name}</span>
                              <span className="text-muted-foreground">{food.portion}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-8 space-y-4 bg-lavender-light/20 p-4 rounded-lg border border-lavender-light/30">
                  <h3 className="font-medium text-lg">Dicas para o Plano Alimentar</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Mantenha-se hidratado bebendo pelo menos 2 litros de água por dia</li>
                    <li>Procure manter os horários das refeições para estabilizar seu metabolismo</li>
                    <li>Evite alimentos processados e com excesso de açúcar</li>
                    <li>Consuma uma variedade de frutas e vegetais para garantir uma boa ingestão de nutrientes</li>
                    <li>Se tiver dificuldade com alguma refeição, consulte seu nutricionista para ajustes</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12">
              <p>Plano alimentar não disponível</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="workout" className="space-y-4 mt-6">
          {workoutPlan ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center">{workoutPlan.title}</CardTitle>
                <CardDescription className="text-center">{workoutPlan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {workoutPlan.days.map((day, index) => (
                    <Card key={index} className="card-gradient overflow-hidden border-mint-light/30">
                      <CardHeader className="pb-3 bg-gradient-to-r from-mint-light/30 to-transparent">
                        <CardTitle className="text-lg">{day.day}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-3">
                          {day.exercises.map((exercise, exIndex) => (
                            <div key={exIndex} className="border-b pb-3 last:border-0 last:pb-0">
                              <div className="font-medium">{exercise.name}</div>
                              <div className="grid grid-cols-3 mt-1 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Séries: </span>
                                  {exercise.sets}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Reps: </span>
                                  {exercise.reps}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Descanso: </span>
                                  {exercise.rest}
                                </div>
                              </div>
                              {exercise.notes && (
                                <div className="mt-1 text-sm text-muted-foreground">
                                  {exercise.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-8 space-y-4 bg-mint-light/20 p-4 rounded-lg border border-mint-light/30">
                  <h3 className="font-medium text-lg">Dicas para o Plano de Treino</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Faça um aquecimento adequado antes de iniciar os exercícios</li>
                    <li>Mantenha a técnica correta para evitar lesões</li>
                    <li>Aumente as cargas progressivamente conforme se sentir confortável</li>
                    <li>Não pule o descanso entre as séries</li>
                    <li>Inclua exercícios de alongamento após o treino</li>
                    <li>Descanse pelo menos 24-48 horas o mesmo grupo muscular</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12">
              <p>Plano de treino não disponível</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlanoDetalhes;
