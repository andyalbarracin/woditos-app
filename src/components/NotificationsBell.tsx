/**
 * Archivo: NotificationsBell.tsx
 * Ruta: src/components/NotificationsBell.tsx
 * Última modificación: 2026-03-09
 * Descripción: Icono de campana con dropdown de notificaciones.
 *   - Muestra número de no leídas
 *   - Lista las últimas notificaciones
 *   - Permite marcar como leídas
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Bell, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  action_url: string | null;
}

export default function NotificationsBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Fetch notificaciones
  const { data: notifications } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      return (data || []) as Notification[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });

  // Marcar todas como leídas
  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Marcar una como leída
  const markOneRead = useMutation({
    mutationFn: async (notificationId: string) => {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return '📢';
      case 'session':
        return '🏃';
      case 'achievement':
        return '🏆';
      case 'reminder':
        return '⏰';
      default:
        return '💬';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-card border-border" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="font-display font-bold text-foreground">Notificaciones</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary hover:text-primary"
              onClick={() => markAllRead.mutate()}
            >
              Marcar todas leídas
            </Button>
          )}
        </div>

        {/* Lista de notificaciones */}
        <ScrollArea className="h-[320px]">
          {notifications && notifications.length > 0 ? (
            <div className="divide-y divide-border">
              {notifications.map(notif => (
                <button
                  key={notif.id}
                  onClick={() => {
                    if (!notif.is_read) markOneRead.mutate(notif.id);
                    if (notif.action_url) window.location.href = notif.action_url;
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors',
                    !notif.is_read && 'bg-primary/5'
                  )}
                >
                  <div className="flex gap-3">
                    <span className="text-lg shrink-0">{getTypeIcon(notif.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          'text-sm truncate',
                          notif.is_read ? 'text-muted-foreground' : 'font-medium text-foreground'
                        )}>
                          {notif.title}
                        </p>
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
              <Bell size={32} className="text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Sin notificaciones</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
