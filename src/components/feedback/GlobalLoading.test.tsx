import React from 'react';
import { render, screen } from '@testing-library/react';
import GlobalLoading from './GlobalLoading';
import { FeedbackProvider, useFeedback } from '@/contexts/FeedbackContext';

// Mock para o hook useFeedback
jest.mock('@/contexts/FeedbackContext', () => {
  const originalModule = jest.requireActual('@/contexts/FeedbackContext');
  return {
    ...originalModule,
    useFeedback: jest.fn()
  };
});

describe('GlobalLoading', () => {
  it('não renderiza nada quando não há carregamentos ativos', () => {
    (useFeedback as jest.Mock).mockReturnValue({
      feedback: {
        globalLoading: false,
        loaders: {}
      }
    });

    const { container } = render(<GlobalLoading />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza com a mensagem padrão quando globalLoading está ativo', () => {
    (useFeedback as jest.Mock).mockReturnValue({
      feedback: {
        globalLoading: true,
        loaders: {}
      }
    });

    render(<GlobalLoading />);
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('renderiza com a primeira mensagem de loader quando disponível', () => {
    (useFeedback as jest.Mock).mockReturnValue({
      feedback: {
        globalLoading: false,
        loaders: {
          test: { isLoading: true, message: 'Testando carregamento', key: 'test' }
        }
      }
    });

    render(<GlobalLoading />);
    expect(screen.getByText('Testando carregamento')).toBeInTheDocument();
  });
}); 