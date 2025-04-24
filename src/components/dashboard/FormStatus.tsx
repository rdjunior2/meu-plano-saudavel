import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, FileCheck2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import { FormStatus as ApiFormStatus, ProductType } from '@/integrations/supabase/types';
import { UserFormStatus } from '@/types/plans';
import { PurchaseItem } from '@/types/purchase';

interface FormStatusProps {
  formStatus: UserFormStatus;
  purchaseItems: PurchaseItem[];
  getFormCompletionPercentage: () => number;
}

const FormStatus: React.FC<FormStatusProps> = ({ formStatus, purchaseItems, getFormCompletionPercentage }) => {
  const formCompletionPercentage = getFormCompletionPercentage();

  const getFormularioLink = (item: PurchaseItem) => {
    if (item.product_type === ProductType.MEAL_PLAN) {
      return '/formulario-alimentar';
    }
    if (item.product_type === ProductType.WORKOUT_PLAN) {
      return '/formulario-treino';
    }
    return '/dashboard';
  };

  const renderPendingFormsList = () => {
    const pendingForms = purchaseItems.filter(
      (item) => item.form_status === ApiFormStatus.PENDING || item.form_status === ApiFormStatus.NOT_STARTED
    );

    if (pendingForms.length === 0) {
      return null;
    }

    return (
      <div className="mt-4 space-y-3">
        {pendingForms.map((item) => (
          <div key={item.item_id} className="flex items-center justify-between bg-secondary/20 rounded-lg p-3">
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{item.product_name}</span>
            </div>
            <Link to={getFormularioLink(item)}>
              <Button variant="outline" size="sm">Preencher</Button>
            </Link>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold flex items-center space-x-2">
          <FileCheck2 className="h-5 w-5 text-primary" />
          <span>Formulários</span>
        </CardTitle>
        <CardDescription>
          Status dos seus formulários de anamnese
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progresso</span>
              <span className="text-sm font-medium">{formCompletionPercentage}%</span>
            </div>
            <Progress value={formCompletionPercentage} className="h-2" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div 
              className={cn(
                "rounded-lg p-3 border",
                formStatus.alimentar_completed 
                  ? "bg-primary/10 border-primary/20" 
                  : "bg-secondary/10 border-secondary/20"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Alimentar</span>
                {formStatus.alimentar_completed ? (
                  <Badge variant="outline" className="bg-primary/20 text-primary border-primary/10">
                    <Check className="h-3 w-3 mr-1" /> Completo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-secondary/20 text-secondary-foreground border-secondary/10">
                    <Clock className="h-3 w-3 mr-1" /> Pendente
                  </Badge>
                )}
              </div>
            </div>
            
            <div 
              className={cn(
                "rounded-lg p-3 border", 
                formStatus.treino_completed 
                  ? "bg-primary/10 border-primary/20" 
                  : "bg-secondary/10 border-secondary/20"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Treino</span>
                {formStatus.treino_completed ? (
                  <Badge variant="outline" className="bg-primary/20 text-primary border-primary/10">
                    <Check className="h-3 w-3 mr-1" /> Completo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-secondary/20 text-secondary-foreground border-secondary/10">
                    <Clock className="h-3 w-3 mr-1" /> Pendente
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {renderPendingFormsList()}
        </div>
      </CardContent>
    </Card>
  );
};

export default FormStatus; 