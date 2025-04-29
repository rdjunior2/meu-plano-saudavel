import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';

// Tipos de feedback
export type LoadingState = {
  isLoading: boolean;
  message?: string;
  key?: string;
};

export type FeedbackState = {
  loaders: Record<string, LoadingState>;
  globalLoading: boolean;
};

// Interface do contexto
interface FeedbackContextType {
  // Estado
  feedback: FeedbackState;
  
  // Toast notifications
  showSuccess: (message: string, options?: any) => void;
  showError: (message: string, options?: any) => void;
  showInfo: (message: string, options?: any) => void;
  showWarning: (message: string, options?: any) => void;
  
  // Loading indicators
  showLoading: (key: string, message?: string) => void;
  hideLoading: (key: string) => void;
  isLoading: (key: string) => boolean;
  
  // Global loading
  setGlobalLoading: (loading: boolean) => void;
}

// Valor padrão do contexto
const defaultFeedbackContext: FeedbackContextType = {
  feedback: {
    loaders: {},
    globalLoading: false
  },
  showSuccess: () => {},
  showError: () => {},
  showInfo: () => {},
  showWarning: () => {},
  showLoading: () => {},
  hideLoading: () => {},
  isLoading: () => false,
  setGlobalLoading: () => {}
};

// Criação do contexto
const FeedbackContext = createContext<FeedbackContextType>(defaultFeedbackContext);

// Hook para usar o contexto
export const useFeedback = () => useContext(FeedbackContext);

// Provedor do contexto
interface FeedbackProviderProps {
  children: ReactNode;
}

export const FeedbackProvider: React.FC<FeedbackProviderProps> = ({ children }) => {
  const [feedback, setFeedback] = useState<FeedbackState>({
    loaders: {},
    globalLoading: false
  });
  
  // Toast notifications
  const showSuccess = useCallback((message: string, options?: any) => {
    toast.success(message, options);
  }, []);
  
  const showError = useCallback((message: string, options?: any) => {
    toast.error(message, options);
  }, []);
  
  const showInfo = useCallback((message: string, options?: any) => {
    toast.info(message, options);
  }, []);
  
  const showWarning = useCallback((message: string, options?: any) => {
    toast.warning(message, options);
  }, []);
  
  // Loading indicators
  const showLoading = useCallback((key: string, message?: string) => {
    setFeedback(prev => ({
      ...prev,
      loaders: {
        ...prev.loaders,
        [key]: { isLoading: true, message, key }
      }
    }));
  }, []);
  
  const hideLoading = useCallback((key: string) => {
    setFeedback(prev => {
      const newLoaders = { ...prev.loaders };
      delete newLoaders[key];
      return { ...prev, loaders: newLoaders };
    });
  }, []);
  
  const isLoading = useCallback((key: string) => {
    return !!feedback.loaders[key]?.isLoading;
  }, [feedback.loaders]);
  
  // Global loading
  const setGlobalLoading = useCallback((loading: boolean) => {
    setFeedback(prev => ({ ...prev, globalLoading: loading }));
  }, []);
  
  const value = {
    feedback,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showLoading,
    hideLoading,
    isLoading,
    setGlobalLoading
  };
  
  return (
    <FeedbackContext.Provider value={value}>
      {children}
    </FeedbackContext.Provider>
  );
};

export default FeedbackProvider; 