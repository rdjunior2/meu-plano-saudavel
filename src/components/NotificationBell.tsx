import React, { useEffect, useState } from 'react'
import { 
  Bell, 
  BellRing,
  CheckCheck
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useNotificationStore } from '@/stores/notificationStore'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

const NotificationBell: React.FC = () => {
  const { 
    notifications, 
    markAllAsRead, 
    markAsRead,
    clearAll
  } = useNotificationStore()
  
  const { user } = useAuthStore()
  
  const unreadCount = notifications.filter(n => !n.read).length
  
  // Agrupar notificações por data
  const formatDate = (date: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const notifDate = new Date(date)
    
    if (notifDate.toDateString() === today.toDateString()) {
      return 'Hoje'
    } else if (notifDate.toDateString() === yesterday.toDateString()) {
      return 'Ontem'
    } else {
      return notifDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }
  }
  
  const groupedNotifications = notifications.reduce((acc, notification) => {
    const date = formatDate(notification.createdAt)
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(notification)
    return acc
  }, {} as Record<string, typeof notifications>)
  
  const handleClick = (id: string) => {
    markAsRead(id)
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <>
              <BellRing className="h-5 w-5" />
              <Badge 
                className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center p-0" 
                variant="destructive"
              >
                {unreadCount}
              </Badge>
            </>
          ) : (
            <Bell className="h-5 w-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notificações</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-xs"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Marcar tudo como lido
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            Nenhuma notificação
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            {Object.entries(groupedNotifications).map(([date, items]) => (
              <div key={date}>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  {date}
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                  {items.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={cn(
                        "flex flex-col items-start p-3 cursor-default",
                        !notification.read && "bg-muted/50"
                      )}
                      onClick={() => handleClick(notification.id)}
                    >
                      <div className="flex justify-between w-full mb-1">
                        <span className="font-medium">{notification.title}</span>
                        {!notification.read && (
                          <Badge variant="secondary" className="h-5 px-1.5">Nova</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      {notification.link && (
                        <Link 
                          to={notification.link}
                          className="text-sm text-primary mt-1 hover:underline"
                        >
                          {notification.linkText || 'Ver mais'}
                        </Link>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </div>
            ))}
            <div className="p-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs"
                onClick={clearAll}
              >
                Limpar todas notificações
              </Button>
            </div>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default NotificationBell 