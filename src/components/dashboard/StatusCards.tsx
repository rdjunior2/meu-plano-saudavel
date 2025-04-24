import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { List, Activity, Package, ShoppingCart, FileText } from "lucide-react";
import { cn } from '@/lib/utils';

/**
 * Interface representando o status de compras do usuário
 */
interface UserPurchaseStatus {
  user_id: string;
  total_purchases: number;
  completed_forms: number;
  pending_forms: number;
  ready_plans: number;
  active_plans: number;
  awaiting_plans: number;
}

interface StatusCardsProps {
  stats: UserPurchaseStatus | null;
}

const StatusCards: React.FC<StatusCardsProps> = ({ stats }) => {
  if (!stats) {
    return null;
  }

  // Criando os cards de status
  const statusItems = [
    {
      title: "Planos Ativos",
      value: stats.active_plans,
      icon: <Package className="h-4 w-4" />,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Planos em Espera",
      value: stats.awaiting_plans,
      icon: <List className="h-4 w-4" />,
      color: "text-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-950",
    },
    {
      title: "Compras",
      value: stats.total_purchases,
      icon: <ShoppingCart className="h-4 w-4" />,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-950",
    },
    {
      title: "Formulários",
      value: stats.completed_forms,
      suffix: stats.pending_forms > 0 ? `/ ${stats.completed_forms + stats.pending_forms}` : '',
      icon: <FileText className="h-4 w-4" />,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statusItems.map((item, index) => (
        <Card key={index} className="overflow-hidden transition-all duration-300 hover:shadow-md">
          <CardContent className="p-0">
            <div className="flex items-center p-4">
              <div className={cn("p-2 rounded-md mr-3", item.bgColor)}>
                <div className={item.color}>
                  {item.icon}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
                <h4 className="text-2xl font-semibold">{item.value}{item.suffix}</h4>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatusCards; 