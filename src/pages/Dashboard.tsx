
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, AlertCircle, CheckCircle, Apple, Dumbbell, Clock, Download, ClipboardList } from "lucide-react";
import { useAuthStore } from '@/stores/authStore';
import { usePlanStore, PlanStatus } from '@/stores/planStore';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUser } = useAuthStore((state) => ({ 
    user: state.user, 
    isAuthenticated: state.isAuthenticated,
    updateUser: state.updateUser
  }));
  const { mealPlan, workoutPlan, planStatus, pdfUrl } = usePlanStore();
  const [formStatus, setFormStatus] = useState({
    alimentar: false,
    treino: false,
    bothCompleted: false
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      fetchFormStatus();
    }
  }, [isAuthenticated, navigate]);

  const fetchFormStatus = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('formulario_alimentar_preenchido, formulario_treino_preenchido, plano_status')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        // Update the local state
        setFormStatus({
          alimentar: data.formulario_alimentar_preenchido || false,
          treino: data.formulario_treino_preenchido || false,
          bothCompleted: (data.formulario_alimentar_preenchido && data.formulario_treino_preenchido) || false
        });

        // Update the user state in the auth store
        updateUser({
          formulario_alimentar_preenchido: data.formulario_alimentar_preenchido,
          formulario_treino_preenchido: data.formulario_treino_preenchido,
          plano_status: data.plano_status
        });

        // If status has changed from "aguardando", update the local state
        if (data.plano_status && data.plano_status !== 'aguardando' && planStatus === 'awaiting') {
          const newStatus: PlanStatus = data.plano_status === 'processando' ? 'processing' : 
                                      data.plano_status === 'pronto' ? 'ready' : 'awaiting';
          // Consider updating planStore status here
        }
      }
    } catch (error) {
      console.error('Erro ao buscar status dos formulários:', error);
    }
  };

  const renderFormStatus = () => {
    if (formStatus.bothCompleted) {
      return (
        <Alert className="bg-mint-light border-mint">
          <CheckCircle className="h-5 w-5 text-mint-dark" />
          <AlertTitle>Formulários recebidos!</AlertTitle>
          <AlertDescription>
            Seu plano será entregue em até 4 dias via WhatsApp.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert className="bg-lavender-light border-lavender">
        <AlertCircle className="h-5 w-5 text-lavender-dark" />
        <AlertTitle>Preencha os formulários de planejamento</AlertTitle>
        <AlertDescription>
          Para criar seu plano personalizado, precisamos que você preencha os formulários abaixo:
        </AlertDescription>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Button 
            variant="outline" 
            className={`flex items-center gap-2 ${formStatus.alimentar ? 'bg-green-50 border-green-200' : 'bg-white'}`}
            disabled={formStatus.alimentar}
            onClick={() => navigate('/formulario-alimentar')}
          >
            {formStatus.alimentar ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Apple className="h-4 w-4 text-lavender-dark" />
            )}
            Formulário Alimentar
            {formStatus.alimentar && <span className="text-xs text-green-500 ml-1">(Concluído)</span>}
          </Button>
          
          <Button 
            variant="outline" 
            className={`flex items-center gap-2 ${formStatus.treino ? 'bg-green-50 border-green-200' : 'bg-white'}`}
            disabled={formStatus.treino}
            onClick={() => navigate('/formulario-treino')}
          >
            {formStatus.treino ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Dumbbell className="h-4 w-4 text-mint-dark" />
            )}
            Formulário de Treino
            {formStatus.treino && <span className="text-xs text-green-500 ml-1">(Concluído)</span>}
          </Button>
        </div>
      </Alert>
    );
  };

  const renderStatusMessage = () => {
    if (formStatus.bothCompleted) {
      return null; // Already showing the completion message in renderFormStatus
    }

    switch (planStatus) {
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

      {renderFormStatus()}
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

      {!formStatus.bothCompleted && !(formStatus.alimentar && formStatus.treino) && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              O que preciso fazer?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${formStatus.alimentar ? 'bg-green-100' : 'bg-lavender-light'}`}>
                {formStatus.alimentar ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <span className="text-xs font-medium">1</span>
                )}
              </div>
              <div>
                <h3 className="font-medium">Preencher formulário alimentar</h3>
                <p className="text-sm text-muted-foreground">
                  Informações sobre sua alimentação, rotina e preferências.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${formStatus.treino ? 'bg-green-100' : 'bg-mint-light'}`}>
                {formStatus.treino ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <span className="text-xs font-medium">2</span>
                )}
              </div>
              <div>
                <h3 className="font-medium">Preencher formulário de treino</h3>
                <p className="text-sm text-muted-foreground">
                  Informações sobre sua rotina de exercícios, objetivos e limitações.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100">
                <span className="text-xs font-medium">3</span>
              </div>
              <div>
                <h3 className="font-medium">Aguardar criação do seu plano</h3>
                <p className="text-sm text-muted-foreground">
                  Após preencher os formulários, nossa equipe criará seu plano personalizado.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
