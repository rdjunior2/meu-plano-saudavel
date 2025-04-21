import React from 'react';
import { X, Bell, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { NotificationType, useNotificationStore } from '../../stores/notificationStore';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationItemProps {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  linkText?: string;
  read: boolean;
  createdAt: Date;
  onClose: () => void;
}

const getTypeIcon = (type: NotificationType) => {
  switch (type) {
    case 'info':
      return <Info className="h-5 w-5 text-blue-500" />;
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'warning':
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    case 'error':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Bell className="h-5 w-5 text-gray-500" />;
  }
};

const getTypeStyles = (type: NotificationType, read: boolean) => {
  const baseStyle = read ? 'bg-gray-50' : 'bg-white';
  
  switch (type) {
    case 'info':
      return `${baseStyle} border-l-4 border-blue-500`;
    case 'success':
      return `${baseStyle} border-l-4 border-green-500`;
    case 'warning':
      return `${baseStyle} border-l-4 border-yellow-500`;
    case 'error':
      return `${baseStyle} border-l-4 border-red-500`;
    default:
      return `${baseStyle} border-l-4 border-gray-300`;
  }
};

const NotificationItem: React.FC<NotificationItemProps> = ({
  id,
  type,
  title,
  message,
  link,
  linkText,
  read,
  createdAt,
  onClose
}) => {
  const { markAsRead } = useNotificationStore();
  
  const handleClick = () => {
    if (!read) {
      markAsRead(id);
    }
  };
  
  return (
    <div 
      className={`${getTypeStyles(type, read)} p-4 mb-2 shadow-sm rounded-r relative`}
      onClick={handleClick}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          {getTypeIcon(type)}
        </div>
        <div className="flex-1">
          <div className="flex justify-between">
            <h4 className="text-sm font-medium text-gray-900">{title}</h4>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: ptBR })}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">{message}</p>
          {link && (
            <Link 
              to={link} 
              className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              {linkText || 'Ver mais'}
            </Link>
          )}
        </div>
      </div>
      {!read && <div className="absolute top-4 right-10 w-2 h-2 bg-blue-500 rounded-full"></div>}
    </div>
  );
};

export const NotificationsList: React.FC = () => {
  const { notifications, removeNotification, markAllAsRead } = useNotificationStore();
  
  if (notifications.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Bell className="mx-auto h-8 w-8 mb-2 text-gray-300" />
        <p>Nenhuma notificação no momento</p>
      </div>
    );
  }
  
  return (
    <div className="max-h-80 overflow-y-auto p-2">
      <div className="flex justify-between items-center mb-2 px-2">
        <h3 className="font-medium">Notificações</h3>
        <button 
          onClick={markAllAsRead}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Marcar todas como lidas
        </button>
      </div>
      
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          {...notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

export default NotificationItem; 