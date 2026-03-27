/**
 * Archivo: useSessionFeedback.tsx
 * Ruta: src/hooks/useSessionFeedback.tsx
 * Última modificación: 2026-03-27
 * Descripción: Hook que detecta si hay sesiones terminadas sin feedback
 *   y muestra el modal de feedback al miembro.
 *   Crea notificación post-sesión si corresponde.
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PendingFeedback {
  sessionId: string;
  sessionTitle: string;
  sessionLocation: string | null;
  notificationId?: string;
}

export function useSessionFeedback() {
  const { user } = useAuth();
  const [pending, setPending] = useState<PendingFeedback | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    // Solo para miembros
    if (user?.role !== 'member') return;

    checkPendingFeedback();
  }, [user?.id]);

  const checkPendingFeedback = async () => {
    if (!user?.id) return;

    // Buscar notificaciones de feedback pendientes no leídas
    const { data: feedbackNotif } = await supabase
      .from('notifications')
      .select('id, action_url, message')
      .eq('user_id', user.id)
      .eq('type', 'session_feedback')
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (feedbackNotif?.action_url) {
      // action_url = "feedback:SESSION_ID:TITLE:LOCATION"
      const parts = feedbackNotif.action_url.replace('feedback:', '').split('|||');
      if (parts.length >= 2) {
        setPending({
          sessionId: parts[0],
          sessionTitle: parts[1],
          sessionLocation: parts[2] || null,
          notificationId: feedbackNotif.id,
        });
        return;
      }
    }

    // Si no hay notificación, buscar sesiones terminadas sin feedback
    const now = new Date().toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: sessions } = await supabase
      .from('sessions')
      .select('id, title, location, end_time')
      .lt('end_time', now)
      .gte('end_time', oneDayAgo)
      .order('end_time', { ascending: false })
      .limit(5);

    if (!sessions?.length) return;

    for (const session of sessions) {
      // Verificar que el miembro estuvo presente
      const { data: attendance } = await supabase
        .from('attendance')
        .select('id')
        .eq('session_id', session.id)
        .eq('user_id', user.id)
        .eq('attendance_status', 'present')
        .maybeSingle();

      if (!attendance) continue;

      // Verificar que no hay feedback previo
      const { data: existingFeedback } = await supabase
        .from('session_feedback')
        .select('id')
        .eq('session_id', session.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingFeedback) continue;

      // Crear notificación de feedback
      const actionUrl = `feedback:${session.id}|||${session.title}|||${session.location || ''}`;
      const { data: notif } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'session_feedback',
          title: '¿Cómo te fue en la sesión?',
          message: `Contanos cómo estuvo "${session.title}"`,
          action_url: actionUrl,
          is_read: false,
        })
        .select('id')
        .single();

      setPending({
        sessionId: session.id,
        sessionTitle: session.title,
        sessionLocation: session.location,
        notificationId: notif?.id,
      });
      break;
    }
  };

  const dismiss = () => setPending(null);

  return { pending, dismiss };
}