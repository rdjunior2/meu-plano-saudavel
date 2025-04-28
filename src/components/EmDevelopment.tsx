import { useNavigate } from 'react-router-dom';
import { HardHat, ArrowLeft } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { Button } from './ui/button';

interface EmDevelopmentProps {
  title?: string;
  description?: string;
  returnPath?: string;
  returnText?: string;
}

/**
 * Componente para páginas em desenvolvimento
 */
export default function EmDevelopment({
  title = "Em Desenvolvimento",
  description = "Esta funcionalidade está sendo implementada e estará disponível em breve.",
  returnPath = "/admin",
  returnText = "Voltar ao Painel"
}: EmDevelopmentProps) {
  const navigate = useNavigate();
  
  return (
    <AdminLayout
      title={title}
      subtitle="Recurso em desenvolvimento"
    >
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-amber-50 p-8 rounded-lg border border-amber-200 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <HardHat className="h-16 w-16 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-amber-800 mb-4">{title}</h2>
          <p className="text-amber-700 mb-6">{description}</p>
          <Button 
            onClick={() => navigate(returnPath)}
            className="bg-amber-600 hover:bg-amber-700 transition-colors border-none"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {returnText}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
} 