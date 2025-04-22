import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fixAuthIssues } from '@/utils/authDebug';
import { useAuthStore } from '@/stores/authStore';
import { useAuthContext } from '@/contexts/AuthContext';
import { logEvent, LogSeverity } from '@/services/logs';

/**
 * Componente invisível que verifica e corrige problemas de autenticação
 * Deve ser adicionado uma única vez no componente App principal
 */
const AuthDebugHelper = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticatedStore = useAuthStore(state => state.isAuthenticated);
  const { isAuthenticated: isAuthenticatedContext } = useAuthContext();

  // Verificar problemas de autenticação quando a rota mudar
  useEffect(() => {
    const checkAndFixAuthIssues = async () => {
      try {
        console.log('[AuthDebugHelper] Verificando estado de autenticação na navegação para:', location.pathname);
        
        // Se há inconsistência entre os dois estados de autenticação, corrigir
        if (isAuthenticatedStore !== isAuthenticatedContext) {
          console.warn('[AuthDebugHelper] Inconsistência de autenticação detectada:', {
            store: isAuthenticatedStore,
            context: isAuthenticatedContext
          });
          
          logEvent(
            'auth_inconsistency',
            'Inconsistência de autenticação entre store e context',
            LogSeverity.WARNING,
            { store: isAuthenticatedStore, context: isAuthenticatedContext, path: location.pathname }
          );
          
          // Tentativa de correção
          const result = await fixAuthIssues();
          
          if (result.success) {
            console.log('[AuthDebugHelper] Estado de autenticação corrigido:', result.action);
            
            // Se o token foi removido e o usuário estava tentando acessar uma rota protegida,
            // redirecionar para login
            if (result.action === 'token_removed' && !location.pathname.match(/^\/(login|register|reset-password|criar-senha|$)/)) {
              navigate('/login', { replace: true, state: { from: location } });
            }
          }
        }
      } catch (error) {
        console.error('[AuthDebugHelper] Erro ao verificar/corrigir autenticação:', error);
      }
    };
    
    checkAndFixAuthIssues();
  }, [location.pathname, isAuthenticatedStore, isAuthenticatedContext, navigate]);

  // Não renderiza nada visualmente
  return null;
};

export default AuthDebugHelper; 