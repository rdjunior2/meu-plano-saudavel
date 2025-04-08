
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
                className={`progress-step ${
                  index < currentStep
                    ? 'progress-step-completed'
                    : index === currentStep
                    ? 'progress-step-active'
                    : 'progress-step-inactive'
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
                className={`progress-line ${
                  index < currentStep ? 'progress-line-active' : ''
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
