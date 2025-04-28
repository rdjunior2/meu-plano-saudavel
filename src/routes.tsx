import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

// Importação das páginas que sabemos que existem
import MeuPlano from '@/pages/MeuPlano';
import PlanoDetalhe from '@/pages/PlanoDetalhe';

// Componente de rota protegida
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Componente de rotas simplificado
const AppRoutes = () => {
  return (
    <Routes>
      {/* Rota principal que leva ao plano do usuário */}
      <Route 
        path="/meu-plano" 
        element={
          <ProtectedRoute>
            <MeuPlano />
          </ProtectedRoute>
        } 
      />

      {/* Rota de detalhes do plano */}
      <Route 
        path="/plano/:id" 
        element={
          <ProtectedRoute>
            <PlanoDetalhe />
          </ProtectedRoute>
        } 
      />
      
      {/* Rota fallback */}
      <Route path="*" element={<Navigate to="/meu-plano" replace />} />
    </Routes>
  );
};

export default AppRoutes; 