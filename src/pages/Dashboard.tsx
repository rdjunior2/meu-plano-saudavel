
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, AlertCircle, CheckCircle, Apple, Dumbbell, Clock, Download } from "lucide-react";
import { useAuthStore } from '@/stores/authStore';
import { usePlanStore, PlanStatus } from '@/stores/planStore';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, formCompleted } = useAuthStore();
  const { mealPlan, workoutPlan, planStatus, pdfUrl } = usePlanStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const renderStatusMessage = () => {
    switch (planStatus) {
      case 'awaiting':
        return (
          <Alert className="bg-lavender-light border-lavender">
            <Clock className="h-5 w-5 text-lavender-dark" />
            <AlertTitle>Aguardando preenchimento do formulário</AlertTitle>
            <AlertDescription>
              Preencha o formulário de anamnese para que possamos criar seu plano personalizado.
            </AlertDescription>
            <div className="mt-4">
              <Link to="/anamnese">
                <Button variant="outline" className="bg-white hover:bg-lavender-light border-lavender text-lavender-dark">
                  Preencher Formulário
                </Button>
              </Link>
            </div>
          </Alert>
        );
      case 'processing':
        return (
          <Alert className="bg-mint-light border-mint">
            <Clock className="h-5 w-5 text-mint-dark" />
            <AlertTitle>Seu plano está sendo elaborado</AlertTitle>
            <AlertDescription>
              Estamos criando seu plano personalizado. Aguarde, isso pode levar alguns minutos.
            </AlertDescription>
          </Alert>
        );
      case 'ready':
        return (
          <Alert className="bg-mint-light border-mint">
            <CheckCircle className="h-5 w-5 text-mint-dark" />
            <AlertTitle>Seu plano está pronto!</AlertTitle>
            <AlertDescription>
              Seu plano personalizado já está disponível. Confira abaixo.
            </AlertDescription>
            {pdfUrl && (
              <div className="mt-4">
                <Button variant="outline" className="bg-white hover:bg-mint-light border-mint text-mint-dark" asChild>
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Baixar PDF
                  </a>
                </Button>
              </div>
            )}
          </Alert>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container py-8 space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo{user?.name ? `, ${user.name}` : ''}! Confira seu plano personalizado.
        </p>
      </div>

      {renderStatusMessage()}

      {planStatus === 'ready' && (
        <Tabs defaultValue="meal" className="w-full mt-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="meal">
              <Apple className="mr-2 h-4 w-4" />
              Plano Alimentar
            </TabsTrigger>
            <TabsTrigger value="workout">
              <Dumbbell className="mr-2 h-4 w-4" />
              Plano de Treino
            </TabsTrigger>
          </TabsList>
          <TabsContent value="meal" className="space-y-4 mt-4">
            {mealPlan ? (
              <Card>
                <CardHeader>
                  <CardTitle>{mealPlan.title}</CardTitle>
                  <CardDescription>{mealPlan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mealPlan.meals.map((meal, index) => (
                      <Card key={index} className="card-gradient">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">{meal.name}</CardTitle>
                            <span className="text-sm text-muted-foreground">{meal.time}</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {meal.foods.map((food, foodIndex) => (
                              <li key={foodIndex} className="flex justify-between">
                                <span>{food.name}</span>
                                <span className="text-muted-foreground">{food.portion}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Plano Alimentar</CardTitle>
                  <CardDescription>Aguardando criação do plano</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">O plano alimentar estará disponível em breve</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="workout" className="space-y-4 mt-4">
            {workoutPlan ? (
              <Card>
                <CardHeader>
                  <CardTitle>{workoutPlan.title}</CardTitle>
                  <CardDescription>{workoutPlan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {workoutPlan.days.map((day, index) => (
                      <Card key={index} className="card-gradient">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{day.day}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-4">
                            {day.exercises.map((exercise, exIndex) => (
                              <li key={exIndex} className="border-b pb-3 last:border-0 last:pb-0">
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
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Plano de Treino</CardTitle>
                  <CardDescription>Aguardando criação do plano</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">O plano de treino estará disponível em breve</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Dashboard;
