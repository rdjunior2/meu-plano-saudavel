import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import TreinoForm from '@/components/forms/common/TreinoForm';

const FormularioTreino = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Verificar se o formulário já foi preenchido
    if (user?.formulario_treino_preenchido) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate, user]);

  return (
    <div className="container max-w-4xl py-10">
      <TreinoForm />
    </div>
  );
};

export default FormularioTreino;
