/**
 * Archivo: FeedbackAnalytics.tsx
 * Ruta: src/components/dashboard/FeedbackAnalytics.tsx
 * Última modificación: 2026-03-31
 * Descripción: Resumen visual del feedback de sesiones para coaches.
 *   Fix: join profiles separado para evitar bloqueo de RLS en relación embebida.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageSquare } from 'lucide-react';

const RATING_EMOJI: Record<number, { emoji: string; label: string }> = {
  1: { emoji: '😞', label: 'Muy mal' },
  2: { emoji: '😕', label: 'Mal' },
  3: { emoji: '😐', label: 'Regular' },
  4: { emoji: '😊', label: 'Bien' },
  5: { emoji: '🤩', label: 'Excelente' },
};

const RATING_COLORS: Record<number, string> = {
  1: 'bg-destructive',
  2: 'bg-accent',
  3: 'bg-muted-foreground',
  4: 'bg-secondary',
  5: 'bg-primary',
};

const DISCOMFORT_LABELS: Record<string, { emoji: string; label: string }> = {
  legs:    { emoji: '🦵', label: 'Piernas' },
  body:    { emoji: '💪', label: 'Cuerpo' },
  weather: { emoji: '🌧️', label: 'Clima' },
  shoes:   { emoji: '👟', label: 'Zapatillas' },
  vibe:    { emoji: '😶', label: 'Ambiente' },
  crew:    { emoji: '👥', label: 'Crew' },
};

export default function FeedbackAnalytics() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ['coach-feedback-analytics', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // 1. IDs de sesiones del coach en los últimos 30 días
      const { data: sessionRows } = await supabase
        .from('sessions')
        .select('id, title, start_time')
        .eq('coach_id', user.id)
        .gte('start_time', thirtyDaysAgo.toISOString());

      if (!sessionRows?.length) return null;

      const sessionMap: Record<string, { title: string; start_time: string }> = {};
      sessionRows.forEach(s => { sessionMap[s.id] = { title: s.title, start_time: s.start_time }; });
      const ids = Object.keys(sessionMap);

      // 2. Feedbacks — sin join a profiles
      const { data: feedbacks } = await supabase
        .from('session_feedback')
        .select('id, session_id, user_id, rating, discomforts, note, created_at')
        .in('session_id', ids)
        .order('created_at', { ascending: false });

      if (!feedbacks?.length) return null;

      // 3. Perfiles de los miembros que dieron feedback (query separada)
      const memberIds = [...new Set(feedbacks.map(f => f.user_id))];
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', memberIds);

      const profileMap: Record<string, string> = {};
      profileRows?.forEach(p => { profileMap[p.user_id] = p.full_name; });

      // 4. Calcular métricas
      const ratings = feedbacks.map(f => f.rating);
      const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;

      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratings.forEach(r => { distribution[r] = (distribution[r] || 0) + 1; });
      const maxCount = Math.max(...Object.values(distribution), 1);

      const discomfortCounts: Record<string, number> = {};
      feedbacks.forEach(f => {
        ((f.discomforts || []) as string[]).forEach(d => {
          discomfortCounts[d] = (discomfortCounts[d] || 0) + 1;
        });
      });
      const topDiscomforts = Object.entries(discomfortCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);

      const recentNotes = feedbacks
        .filter(f => f.note)
        .slice(0, 5)
        .map(f => ({
          note: f.note,
          rating: f.rating,
          memberName: profileMap[f.user_id] || 'Miembro',
          sessionTitle: sessionMap[f.session_id]?.title || 'Sesión',
          date: sessionMap[f.session_id]?.start_time,
        }));

      return {
        total: feedbacks.length,
        avg: Math.round(avg * 10) / 10,
        distribution,
        maxCount,
        topDiscomforts,
        recentNotes,
      };
    },
    enabled: !!user?.id,
  });

  if (!data) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
          <MessageSquare size={18} className="text-primary" /> Feedback de Sesiones
        </h3>
        <p className="text-muted-foreground text-center py-6 text-sm">
          Todavía no hay feedback de tus sesiones. Aparecerá cuando los miembros califiquen.
        </p>
      </div>
    );
  }

  const avgEmoji = RATING_EMOJI[Math.round(data.avg)] || RATING_EMOJI[3];

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-5">
      <h3 className="font-display font-bold text-foreground flex items-center gap-2">
        <MessageSquare size={18} className="text-primary" /> Feedback de Sesiones
        <span className="text-xs font-normal text-muted-foreground ml-auto">
          {data.total} respuesta{data.total !== 1 ? 's' : ''} · 30 días
        </span>
      </h3>

      {/* Promedio + distribución */}
      <div className="flex items-start gap-6">
        <div className="text-center shrink-0">
          <span className="text-5xl">{avgEmoji.emoji}</span>
          <p className="text-2xl font-display font-bold text-foreground mt-1">{data.avg}</p>
          <p className="text-xs text-muted-foreground">{avgEmoji.label}</p>
        </div>

        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map(r => {
            const count = data.distribution[r] || 0;
            const pct = (count / data.maxCount) * 100;
            const info = RATING_EMOJI[r];
            return (
              <div key={r} className="flex items-center gap-2">
                <span className="text-sm w-6 text-center">{info.emoji}</span>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${RATING_COLORS[r]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Incomodidades frecuentes */}
      {data.topDiscomforts.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2">
            Incomodidades más reportadas
          </p>
          <div className="flex flex-wrap gap-2">
            {data.topDiscomforts.map(([key, count]) => {
              const info = DISCOMFORT_LABELS[key];
              if (!info) return null;
              return (
                <div key={key} className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1.5">
                  <span className="text-sm">{info.emoji}</span>
                  <span className="text-xs font-medium text-foreground">{info.label}</span>
                  <span className="text-xs text-muted-foreground">×{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comentarios recientes */}
      {data.recentNotes.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2">
            Últimos comentarios
          </p>
          <div className="space-y-2">
            {data.recentNotes.map((n, i) => (
              <div key={i} className="border border-border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{RATING_EMOJI[n.rating]?.emoji || '😐'}</span>
                  <span className="text-xs font-medium text-foreground">{n.memberName}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {n.date && format(new Date(n.date), "d MMM", { locale: es })}
                    {' · '}{n.sessionTitle}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 italic">"{n.note}"</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}