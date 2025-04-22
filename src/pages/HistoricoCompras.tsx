import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabaseClient';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { 
  ShoppingBag, 
  FileCheck, 
  FileX, 
  Package, 
  ClipboardCheck, 
  AlertCircle,
  Hourglass
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PurchaseItemView {
  purchase_id: string;
  user_id: string;
  user_email: string;
  kiwify_id: string;
  purchase_status: string;
  purchase_date: string;
  item_id: string;
  product_id: string;
  product_name: string;
  product_type: string;
  form_status: string;
  plan_status: string;
  has_form_response: boolean;
  item_created_at: string;
}

interface GroupedPurchase {
  purchase_id: string;
  kiwify_id: string;
  purchase_date: string;
  purchase_status: string;
  items: PurchaseItemView[];
}

const HistoricoCompras: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<GroupedPurchase[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchPurchases();
  }, [isAuthenticated, user?.id]);

  const fetchPurchases = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('v_purchase_items')
        .select('*')
        .eq('user_id', user.id)
        .order('purchase_date', { ascending: false });
      
      if (error) throw error;
      
      // Agrupar itens por compra
      const groupedData = groupPurchases(data || []);
      setPurchases(groupedData);
    } catch (error) {
      console.error('Erro ao buscar compras:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar seu histórico de compras.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const groupPurchases = (items: PurchaseItemView[]): GroupedPurchase[] => {
    const grouped: Record<string, GroupedPurchase> = {};
    
    items.forEach(item => {
      if (!grouped[item.purchase_id]) {
        grouped[item.purchase_id] = {
          purchase_id: item.purchase_id,
          kiwify_id: item.kiwify_id,
          purchase_date: item.purchase_date,
          purchase_status: item.purchase_status,
          items: []
        };
      }
      
      grouped[item.purchase_id].items.push(item);
    });
    
    return Object.values(grouped);
  };

  const formatPurchaseDate = (dateString: string | null): string => {
    if (!dateString) return 'Data não disponível';
    
    try {
      const date = new Date(dateString);
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (e) {
      return 'Data inválida';
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved':
        return <Badge variant="success">Aprovado</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendente</Badge>;
      case 'refunded':
        return <Badge variant="destructive">Reembolsado</Badge>;
      case 'canceled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getFormStatusBadge = (status: string, hasResponse: boolean) => {
    switch(status) {
      case 'completed':
        return <Badge className="bg-green-500"><FileCheck className="mr-1 h-3 w-3" /> Preenchido</Badge>;
      case 'pending':
        return hasResponse 
          ? <Badge variant="outline" className="border-amber-500 text-amber-600"><Hourglass className="mr-1 h-3 w-3" /> Parcial</Badge>
          : <Badge variant="outline" className="border-red-500 text-red-600"><FileX className="mr-1 h-3 w-3" /> Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlanStatusBadge = (status: string) => {
    switch(status) {
      case 'ready':
        return <Badge className="bg-blue-500"><ClipboardCheck className="mr-1 h-3 w-3" /> Pronto</Badge>;
      case 'awaiting':
        return <Badge variant="outline" className="border-amber-500 text-amber-600"><Hourglass className="mr-1 h-3 w-3" /> Aguardando</Badge>;
      case 'active':
        return <Badge className="bg-green-500"><Package className="mr-1 h-3 w-3" /> Ativo</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getFormularioLink = (item: PurchaseItemView) => {
    if (item.form_status === 'pending') {
      if (item.product_type === 'meal') {
        return `/formulario-alimentar/${item.purchase_id}/${item.product_id}`;
      } else if (item.product_type === 'workout') {
        return `/formulario-treino/${item.purchase_id}/${item.product_id}`;
      } else if (item.product_type === 'combo') {
        // Para produtos do tipo combo, verificamos se já existe resposta
        if (!item.has_form_response) {
          return `/formulario-alimentar/${item.purchase_id}/${item.product_id}`;
        } else {
          return `/formulario-treino/${item.purchase_id}/${item.product_id}`;
        }
      }
    }
    return null;
  };

  const renderSkeleton = () => {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-60" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Histórico de Compras</h1>
          <p className="text-muted-foreground">
            Veja o histórico de suas compras e o status dos seus planos.
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard')}>
          Voltar para o Dashboard
        </Button>
      </div>

      {loading ? (
        renderSkeleton()
      ) : purchases.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma compra encontrada</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Você ainda não realizou nenhuma compra. Visite nossa página de produtos para escolher seu plano.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {purchases.map((purchase) => (
            <Card key={purchase.purchase_id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Compra #{purchase.kiwify_id.slice(-6)}
                    </CardTitle>
                    <CardDescription>
                      {formatPurchaseDate(purchase.purchase_date)}
                    </CardDescription>
                  </div>
                  {getStatusBadge(purchase.purchase_status)}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Formulário</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchase.items.map((item) => {
                      const formLink = getFormularioLink(item);
                      
                      return (
                        <TableRow key={item.item_id}>
                          <TableCell className="font-medium">{item.product_name}</TableCell>
                          <TableCell>
                            {item.product_type === 'meal' && 'Plano Alimentar'}
                            {item.product_type === 'workout' && 'Plano de Treino'}
                            {item.product_type === 'combo' && 'Combo Alimentar + Treino'}
                          </TableCell>
                          <TableCell>
                            {getFormStatusBadge(item.form_status, item.has_form_response)}
                          </TableCell>
                          <TableCell>
                            {getPlanStatusBadge(item.plan_status)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formLink && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(formLink)}
                              >
                                Preencher Formulário
                              </Button>
                            )}
                            {item.plan_status === 'ready' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(`/plano/${item.product_id}?type=${item.product_type}`)}
                              >
                                Ver Plano
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoricoCompras; 