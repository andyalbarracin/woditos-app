/**
 * Archivo: FeedbackHistory.tsx
 * Ruta: src/components/profile/FeedbackHistory.tsx
 * Última modificación: 2026-03-30
 * Descripción: Timeline visual de feedbacks que el miembro ha dado.
 *   Se integra en Profile.tsx debajo de los insights.
 *   Muestra emoji rating, título de sesión, fecha, incomodidades y nota.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageSquare } from 'lucide-react';

const RATING_EMOJI: Record<number, { emoji: string; label: string; color: string }> = {
  1: { emoji: '😞', label: 'Muy mal',    color: 'bg-destructive/15 border-destructive/30' },
  2: { emoji: '😕', label: 'Mal',        color: 'bg-accent/15 border-accent/30' },
  3: { emoji: '😐', label: 'Regular',    color: 'bg-muted border-border' },
  4: { emoji: '😊', label: 'Bien',       color: 'bg-secondary/15 border-secondary/30' },
  5: { emoji: '🤩', label: 'Excelente',  color: 'bg-primary/15 border-primary/30' },
};

const DISCOMFORT_LABELS: Record<string, { emoji: string; label: string }> = {
  legs:    { emoji: '🦵', label: 'Piernas' },
  body:    { emoji: '💪', label: 'Cuerpo' },
  weather: { emoji: '🌧️', label: 'Clima' },
  shoes:   { emoji: '👟', label: 'Zapatillas' },
  vibe:    { emoji: '😶', label: 'Ambiente' },
  crew:    { emoji: '👥', label: 'Crew' },
};

export default function FeedbackHistory() {
  const { user } = useAuth();

  const { data: feedbacks } = useQuery({
    queryKey: ['my-feedback-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('session_feedback')
        .select('*, sessions!inner(title, start_time, session_type, groups(name))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(15);
      if (error) { console.error('FeedbackHistory query error:', error); return []; }
      return data || [];
    },
    enabled: !!user?.id,
  });

  if (!feedbacks || feedbacks.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
        <MessageSquare size={18} className="text-primary" /> Mi Feedback
      </h3>

      <div className="space-y-2">
        {feedbacks.map((fb: any) => {
          const rating = RATING_EMOJI[fb.rating] || RATING_EMOJI[3];
          const session = fb.sessions;
          const discomforts = (fb.discomforts || []) as string[];

          return (
            <div
              key={fb.id}
              className={`border rounded-xl p-4 transition-colors ${rating.color}`}
            >
              <div className="flex items-start gap-3">
                {/* Emoji grande */}
                <span className="text-3xl shrink-0 mt-0.5">{rating.emoji}</span>

                <div className="flex-1 min-w-0">
                  {/* Título + fecha */}
                  <p className="font-medium text-foreground text-sm truncate">
                    {session?.title || 'Sesión'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session?.start_time && format(new Date(session.start_time), "d MMM · HH:mm", { locale: es })}
                    {session?.groups?.name && ` · ${session.groups.name}`}
                  </p>

                  {/* Incomodidades */}
                  {discomforts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {discomforts.map((d: string) => {
                        const info = DISCOMFORT_LABELS[d];
                        return info ? (
                          <span key={d} className="text-xs bg-card/60 border border-border rounded-full px-2 py-0.5">
                            {info.emoji} {info.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}

                  {/* Nota */}
                  {fb.note && (
                    <p className="text-xs text-foreground/70 mt-2 italic leading-relaxed">
                      "{fb.note}"
                    </p>
                  )}
                </div>

                {/* Badge tipo sesión */}
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-card text-muted-foreground shrink-0">
                  {session?.session_type}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}