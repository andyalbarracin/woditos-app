/**
 * Archivo: NextSessionBanner.tsx
 * Ruta: src/components/NextSessionBanner.tsx
 * Última modificación: 2026-03-28
 * Descripción: Banner que muestra la próxima sesión del usuario.
 *   - Para coaches: próxima sesión que imparten
 *   - Para members: próxima reserva confirmada con sesión futura
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Clock } from 'lucide-react';
import { format, isToday, isTomorrow, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';

export default function NextSessionBanner() {
  const { user } = useAuth();
  const isCoach = user?.role === 'coach' || user?.role === 'super_admin';

  const { data: nextSession } = useQuery({
    queryKey: ['next-session', user?.id, isCoach],
    queryFn: async () => {
      if (!user?.id) return null;
      const now = new Date().toISOString();

      if (isCoach) {
        const { data } = await supabase
          .from('sessions')
          .select('*, groups(name)')
          .eq('coach_id', user.id)
          .gte('start_time', now)
          .order('start_time', { ascending: true })
          .limit(1)
          .maybeSingle();
        return data;
      } else {
        // Filtra sesiones futuras con inner join
        const { data } = await supabase
          .from('reservations')
          .select('sessions!inner(id, title, start_time, session_type, groups(name))')
          .eq('user_id', user.id)
          .eq('reservation_status', 'confirmed')
          .gte('sessions.start_time', now)
          .order('sessions.start_time', { ascending: true })
          .limit(1)
          .maybeSingle();
        return (data as any)?.sessions || null;
      }
    },
    enabled: !!user?.id,
    refetchInterval: 60_000,
  });

  if (!nextSession) return null;

  const sessionDate = new Date(nextSession.start_time);
  const hoursUntil = differenceInHours(sessionDate, new Date());

  let dateLabel = format(sessionDate, "EEEE d 'de' MMMM", { locale: es });
  if (isToday(sessionDate)) dateLabel = 'Hoy';
  else if (isTomorrow(sessionDate)) dateLabel = 'Mañana';

  const isUrgent = hoursUntil <= 2 && hoursUntil >= 0;
  const isSoon = hoursUntil <= 24 && hoursUntil > 2;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
      isUrgent
        ? 'bg-primary/20 text-primary animate-pulse'
        : isSoon
          ? 'bg-secondary/20 text-secondary'
          : 'bg-muted text-muted-foreground'
    }`}>
      <Calendar size={12} />
      <span className="hidden sm:inline">{isCoach ? 'Próxima clase:' : 'Tu próxima:'}</span>
      <span className="font-bold">{dateLabel}</span>
      <Clock size={12} />
      <span>{format(sessionDate, 'HH:mm')}</span>
      <span className="hidden md:inline text-muted-foreground/70">
        · {nextSession.title || nextSession.session_type}
      </span>
    </div>
  );
}