
import { useState } from 'react';

interface UseFormStepsProps {
  totalSteps: number;
  initialStep?: number;
}

export const useFormSteps = ({ totalSteps, initialStep = 0 }: UseFormStepsProps) => {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
    }
  };

  return {
    currentStep,
    handleNext,
    handleBack,
    goToStep,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === totalSteps - 1,
  };
};
