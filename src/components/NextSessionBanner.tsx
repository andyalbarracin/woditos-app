/**
 * Archivo: NextSessionBanner.tsx
 * Ruta: src/components/NextSessionBanner.tsx
 * Última modificación: 2026-03-29
 * Descripción: Banner que muestra la próxima sesión del usuario.
 *   - Para coaches: próxima sesión que imparten
 *   - Para members: próxima reserva confirmada con sesión futura
 *   - variant="header" (default): pill compacta para el header desktop
 *   - variant="mobile-float": chip flotante con contenido completo + botón cerrar
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Clock, X } from 'lucide-react';
import { format, isToday, isTomorrow, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';

interface NextSessionBannerProps {
  /** "header" = pill compacta desktop | "mobile-float" = chip completo con X */
  variant?: 'header' | 'mobile-float';
  /** Callback al cerrar (solo aplica a mobile-float) */
  onDismiss?: () => void;
}

export default function NextSessionBanner({
  variant = 'header',
  onDismiss,
}: NextSessionBannerProps) {
  const { user } = useAuth();
  const isCoach = user?.role === 'coach' || user?.role === 'super_admin';

  const { data: nextSession } = useQuery({
    queryKey: ['next-session', user?.id, isCoach],
    queryFn: async () => {
      if (!user?.id) return null;
      const now = new Date().toISOString();

      if (isCoach) {
        /* ── Coach: query directa a sessions ───────────────────── */
        const { data, error } = await supabase
          .from('sessions')
          .select('*, groups(name)')
          .eq('coach_id', user.id)
          .gte('start_time', now)
          .order('start_time', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('NextSessionBanner coach query error:', error);
          return null;
        }
        return data;
      } else {
        /* ── Member: reservas confirmadas → sesiones futuras ──── */
        /* Se evita .order() en columna de tabla referenciada      */
        /* (dot-notation 'sessions.start_time' puede fallar        */
        /* silenciosamente en algunas versiones de PostgREST).     */
        /* En su lugar, traemos las reservas y ordenamos client-side */
        const { data, error } = await supabase
          .from('reservations')
          .select('sessions!inner(id, title, start_time, session_type, groups(name))')
          .eq('user_id', user.id)
          .eq('reservation_status', 'confirmed')
          .gte('sessions.start_time', now);

        if (error) {
          console.error('NextSessionBanner member query error:', error);
          return null;
        }
        if (!data || data.length === 0) return null;

        /* Ordenar por start_time ascendente y tomar la más próxima */
        data.sort((a: any, b: any) =>
          new Date(a.sessions.start_time).getTime() -
          new Date(b.sessions.start_time).getTime()
        );

        return (data[0] as any)?.sessions || null;
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

  const sessionTitle = nextSession.title || nextSession.session_type;

  /* ── Variante mobile-float: chip completo con X ──────────────── */
  if (variant === 'mobile-float') {
    return (
      <div className="flex items-center gap-2 bg-card border border-border rounded-2xl shadow-lg pl-3 pr-1.5 py-2 animate-in slide-in-from-right-5 fade-in duration-300">
        <div className={`flex items-center gap-2 text-xs font-medium ${
          isUrgent
            ? 'text-primary'
            : isSoon
              ? 'text-secondary'
              : 'text-muted-foreground'
        }`}>
          <Calendar size={13} className="shrink-0" />
          <span className="font-bold">{dateLabel}</span>
          <Clock size={13} className="shrink-0" />
          <span>{format(sessionDate, 'HH:mm')}</span>
          <span className="text-foreground/70 truncate max-w-[120px]">
            · {sessionTitle}
          </span>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex items-center justify-center h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 ml-1"
          >
            <X size={14} />
          </button>
        )}
      </div>
    );
  }

  /* ── Variante header: pill compacta (comportamiento original) ── */
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
        · {sessionTitle}
      </span>
    </div>
  );
}