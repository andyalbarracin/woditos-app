/**
 * Archivo: NotificationsBell.tsx
 * Ruta: src/components/NotificationsBell.tsx
 * Última modificación: 2026-04-14
 * Descripción: Campana de notificaciones con dropdown y navegación al destino.
 *   Tipos manejados:
 *   - session_feedback: abre SessionFeedbackModal (comportamiento existente)
 *   - routine: navega a /rutinas
 *   - session: navega a /sesion/:id (si está en action_url) o /asistencia
 *   - reservation: navega a /agenda
 *   - announcement: sin navegación
 *   v2.0: notificaciones clickeables con destino según tipo.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Bell, X, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import SessionFeedbackModal from '@/components/SessionFeedbackModal';

interface FeedbackTarget {
  sessionId: string;
  sessionTitle: string;
  sessionLocation?: string;
  notificationId: string;
}

/**
 * Parsea action_url para feedback: "feedback:sessionId|||title|||location"
 */
function parseFeedbackAction(actionUrl: string): FeedbackTarget | null {
  if (!actionUrl?.startsWith('feedback:')) return null;
  const parts = actionUrl.replace('feedback:', '').split('|||');
  if (parts.length < 2) return null;
  return {
    sessionId:       parts[0],
    sessionTitle:    parts[1],
    sessionLocation: parts[2] || undefined,
    notificationId:  '',
  };
}

/**
 * Devuelve la ruta destino para una notificación o null si no tiene.
 */
function getNotificationRoute(n: any): string | null {
  switch (n.type) {
    case 'routine':     return '/rutinas';
    case 'reservation': return '/agenda';
    case 'session': {
      // action_url puede tener "session:sessionId"
      if (n.action_url?.startsWith('session:')) {
        const sid = n.action_url.replace('session:', '');
        return `/sesion/${sid}`;
      }
      return '/asistencia';
    }
    default: return null;
  }
}

export default function NotificationsBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [feedbackTarget, setFeedbackTarget] = useState<FeedbackTarget | null>(null);

  const { data: notifications } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(30);
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const unreadCount = notifications?.filter((n: any) => !n.is_read).length ?? 0;

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await supabase.from('notifications')
        .update({ is_read: true })
        .eq('user_id', user!.id)
        .eq('is_read', false);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const handleNotificationClick = (n: any) => {
    // Marcar como leída
    if (!n.is_read) markRead.mutate(n.id);

    // session_feedback: abrir modal
    if (n.type === 'session_feedback' && n.action_url) {
      const target = parseFeedbackAction(n.action_url);
      if (target) {
        setFeedbackTarget({ ...target, notificationId: n.id });
        setOpen(false);
        return;
      }
    }

    // Resto: navegar
    const route = getNotificationRoute(n);
    if (route) {
      setOpen(false);
      navigate(route);
    }
  };

  const isClickable = (n: any) => {
    if (n.type === 'session_feedback' && n.action_url) return true;
    return !!getNotificationRoute(n);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="relative flex items-center justify-center h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-0 bg-card border-border shadow-lg" align="end" sideOffset={8}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-display font-bold text-foreground text-sm">Notificaciones</h3>
            {unreadCount > 0 && (
              <button onClick={() => markAllRead.mutate()}
                className="text-xs text-primary hover:underline flex items-center gap-1">
                <Check size={12} /> Marcar todas como leídas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto">
            {!notifications?.length ? (
              <div className="px-4 py-8 text-center">
                <Bell size={24} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No tenés notificaciones</p>
              </div>
            ) : (
              notifications.map((n: any) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 transition-colors',
                    !n.is_read && 'bg-primary/5',
                    isClickable(n) ? 'cursor-pointer hover:bg-muted/50' : 'cursor-default'
                  )}>
                  {/* Dot unread */}
                  <div className="shrink-0 mt-1.5">
                    {!n.is_read
                      ? <div className="w-2 h-2 rounded-full bg-primary" />
                      : <div className="w-2 h-2" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {format(new Date(n.created_at), "d MMM · HH:mm", { locale: es })}
                    </p>
                  </div>
                  {isClickable(n) && (
                    <span className="text-[10px] text-primary/70 shrink-0 mt-1">→</span>
                  )}
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Session feedback modal */}
      {feedbackTarget && (
        <SessionFeedbackModal
          open={!!feedbackTarget}
          onClose={() => setFeedbackTarget(null)}
          sessionId={feedbackTarget.sessionId}
          sessionTitle={feedbackTarget.sessionTitle}
          sessionLocation={feedbackTarget.sessionLocation}
          notificationId={feedbackTarget.notificationId}
        />
      )}
    </>
  );
}