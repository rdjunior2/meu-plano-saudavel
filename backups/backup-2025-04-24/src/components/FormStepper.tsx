
import React from 'react';
import { Check } from 'lucide-react';

interface FormStepperProps {
  steps: string[];
  currentStep: number;
}

const FormStepper: React.FC<FormStepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center h-8 w-8 rounded-full border text-sm font-medium
                  ${
                    index < currentStep
                      ? 'bg-primary border-primary text-primary-foreground'
                      : index === currentStep
                      ? 'border-primary bg-background text-primary'
                      : 'border-muted bg-muted/20 text-muted-foreground'
                  }`}
              >
                {index < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div className="text-xs mt-1 text-center max-w-[80px]">{step}</div>
            </div>
            
            {index < steps.length - 1 && (
              <div
                className={`h-[1px] w-full max-w-[80px] transition-colors
                  ${
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default FormStepper;
