import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check, Copy, Database } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';

interface SupabaseSetupInstructionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missingColumns?: string[];
}

const SQL_SCRIPT = `-- Adicionar colunas necessárias se não existirem
DO $$
BEGIN
    -- Adiciona coluna avatar_url se não existir
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;
    
    -- Adiciona coluna nome se não existir
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'nome'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN nome TEXT;
    END IF;
    
    -- Registrar alteração no log
    BEGIN
        INSERT INTO public.log_agente_automacao (
            evento,
            payload,
            status,
            mensagem
        )
        VALUES (
            'add_missing_columns_to_profiles_manual',
            jsonb_build_object(
                'table', 'profiles',
                'action', 'add columns',
                'columns', '["avatar_url", "nome"]'
            ),
            'sucesso',
            'Colunas faltantes adicionadas manualmente à tabela profiles'
        );
    EXCEPTION WHEN OTHERS THEN
        -- Ignora erro se a tabela de log não existir
        NULL;
    END;
END $$;`;

const SupabaseSetupInstructions: React.FC<SupabaseSetupInstructionsProps> = ({ 
  open, 
  onOpenChange,
  missingColumns = [] 
}) => {
  const { toast } = useToast();
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(SQL_SCRIPT).then(() => {
      toast({
        title: "Copiado!",
        description: "Script SQL copiado para a área de transferência",
      });
    });
  };

  const getMissingColumnsText = () => {
    if (missingColumns.length === 0) {
      return "colunas necessárias";
    }
    return missingColumns.map(col => `<code>${col}</code>`).join(', ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Configuração necessária do Supabase
          </DialogTitle>
          <DialogDescription>
            Detectamos que seu banco de dados precisa ser atualizado para o funcionamento correto do perfil de usuário.
          </DialogDescription>
        </DialogHeader>
        
        <Alert variant="warning" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ajuste necessário no banco de dados</AlertTitle>
          <AlertDescription>
            Estão faltando colunas na tabela <code>profiles</code> do seu banco de dados Supabase, incluindo <code>nome</code> e <code>avatar_url</code>. Estas colunas são necessárias para o funcionamento correto do perfil.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Como resolver:</h3>
          
          <ol className="list-decimal pl-5 space-y-2">
            <li>Acesse o dashboard do Supabase</li>
            <li>Navegue até "SQL Editor"</li>
            <li>Crie uma nova consulta</li>
            <li>Cole o script SQL abaixo</li>
            <li>Execute a consulta clicando em "Run"</li>
            <li>Volte para o aplicativo e recarregue a página</li>
          </ol>
          
          <div className="relative mt-4">
            <pre className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto text-sm">
              {SQL_SCRIPT}
            </pre>
            <Button 
              size="sm" 
              variant="secondary" 
              className="absolute top-2 right-2"
              onClick={copyToClipboard}
            >
              <Copy className="h-4 w-4 mr-1" />
              Copiar
            </Button>
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={copyToClipboard}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar script SQL
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SupabaseSetupInstructions; 