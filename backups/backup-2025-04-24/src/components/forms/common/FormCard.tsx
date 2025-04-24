
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import FormStepper from '@/components/FormStepper';

interface FormCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  steps: string[];
  currentStep: number;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  children: React.ReactNode;
}

const FormCard: React.FC<FormCardProps> = ({
  icon,
  title,
  description,
  steps,
  currentStep,
  isSubmitting,
  onBack,
  onNext,
  onSubmit,
  children,
}) => {
  return (
    <div className="container py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary">
              {icon}
            </div>
          </div>
          <CardTitle className="text-2xl text-center">{title}</CardTitle>
          <CardDescription className="text-center">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormStepper steps={steps} currentStep={currentStep} />
          <div className="mt-6">
            {children}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={currentStep === 0 || isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          
          {currentStep < steps.length - 1 ? (
            <Button type="button" onClick={onNext}>
              Próximo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={onSubmit}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? "Enviando..." : "Finalizar"} <Check className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default FormCard;
