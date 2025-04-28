import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileCheck2, 
  FileX2, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  ClipboardList,
  ActivityIcon
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'form_completed' | 'form_pending' | 'plan_created' | 'plan_activated' | 'plan_expired' | 'purchase';
  entityType: 'meal' | 'workout' | 'combo' | 'general';
  title: string;
  timestamp: string;
  status?: 'completed' | 'pending' | 'ready' | 'active' | 'expired';
}

const RecentActivity: React.FC = () => {
  // Exemplo de dados para teste, na implementação real, estes dados viriam do Supabase
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'form_completed',
      entityType: 'meal',
      title: 'Formulário alimentar',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 horas atrás
      status: 'completed'
    },
    {
      id: '2',
      type: 'plan_created',
      entityType: 'meal',
      title: 'Plano alimentar criado',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 dia atrás
      status: 'ready'
    },
    {
      id: '3',
      type: 'form_pending',
      entityType: 'workout',
      title: 'Formulário de treino',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 dias atrás
      status: 'pending'
    },
    {
      id: '4',
      type: 'plan_activated',
      entityType: 'workout',
      title: 'Plano de treino ativado',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 dias atrás
      status: 'active'
    },
    {
      id: '5',
      type: 'purchase',
      entityType: 'combo',
      title: 'Pacote combo adquirido',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), // 4 dias atrás
    }
  ];

  const getActivityIcon = (type: string, entityType: string) => {
    switch (type) {
      case 'form_completed':
        return <FileCheck2 className="h-5 w-5 text-green-500" />;
      case 'form_pending':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'plan_created':
        return <ClipboardList className="h-5 w-5 text-blue-500" />;
      case 'plan_activated':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'plan_expired':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'purchase':
        return <ActivityIcon className="h-5 w-5 text-violet-500" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'ready':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { 
        addSuffix: true,
        locale: ptBR
      });
    } catch (error) {
      return 'data desconhecida';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Atividades Recentes</CardTitle>
        <CardDescription>
          Suas últimas atividades na plataforma
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-start space-x-4 border-b border-gray-100 pb-3 last:border-0"
              >
                <div className="mt-1 bg-gray-50 p-2 rounded-full">
                  {getActivityIcon(activity.type, activity.entityType)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <span className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={getStatusColor(activity.status)}>
                      {activity.status || 'Realizado'}
                    </Badge>
                    <span className="text-xs text-gray-500 capitalize">
                      {activity.entityType === 'meal' ? 'Alimentar' : 
                       activity.entityType === 'workout' ? 'Treino' : 
                       activity.entityType === 'combo' ? 'Combo' : 'Geral'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <Calendar className="h-10 w-10 text-gray-300 mb-2" />
            <p className="text-gray-500">Nenhuma atividade recente</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity; 