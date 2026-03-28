/**
 * Archivo: MemberDashboardView.tsx
 * Ruta: src/components/dashboard/MemberDashboardView.tsx
 * Última modificación: 2026-03-28
 * Descripción: Vista del dashboard para miembros.
 *   Muestra sesiones confirmadas, sesiones disponibles con barra de progreso y nombre del coach.
 */
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Flame, TrendingUp, Users, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const SESSION_COLORS: Record<string, string> = {
  running: 'bg-secondary', functional: 'bg-primary', amrap: 'bg-primary',
  emom: 'bg-accent', hiit: 'bg-destructive', technique: 'bg-info',
};

interface MemberDashboardViewProps {
  stats: any;
  achievements: any[];
}

export default function MemberDashboardView({ stats, achievements }: MemberDashboardViewProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: upcomingSessions } = useQuery({
    queryKey: ['upcoming-sessions-dashboard'],
    queryFn: async () => {
      const { data } = await supabase
        .from('sessions')
        .select('*, groups(name), reservations(id, user_id, reservation_status), users!coach_id(profiles(full_name))')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(15);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const bookMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.from('reservations').insert({
        session_id: sessionId, user_id: user!.id, reservation_status: 'confirmed',
      });
      if (error) throw error;
      const session = upcomingSessions?.find((s: any) => s.id === sessionId);
      if (session?.coach_id && session.coach_id !== user!.id) {
        await supabase.from('notifications').insert({
          user_id: session.coach_id,
          title: '🏋️ Nueva reserva',
          message: `${profile?.full_name || 'Un miembro'} se inscribió en "${session.title}"`,
          type: 'reservation',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-sessions-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['next-session'] });
      toast.success('¡Reserva confirmada!');
    },
    onError: () => toast.error('No se pudo hacer la reserva'),
  });

  const cancelMutation = useMutation({
    mutationFn: async (reservationId: string) => {
      const { error } = await supabase.from('reservations')
        .update({ reservation_status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', reservationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-sessions-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['next-session'] });
      toast.success('Reserva cancelada');
    },
    onError: () => toast.error('No se pudo cancelar'),
  });

  const myReservedSessions = upcomingSessions?.filter((s: any) =>
    s.reservations?.some((r: any) => r.user_id === user?.id && r.reservation_status === 'confirmed')
  ) || [];

  const availableSessions = upcomingSessions?.filter((s: any) =>
    !s.reservations?.some((r: any) => r.user_id === user?.id && r.reservation_status === 'confirmed')
  ) || [];

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Flame,      label: 'Racha',      value: `${stats?.current_streak || 0} días`,      color: 'text-primary' },
          { icon: Calendar,   label: 'Sesiones',   value: `${stats?.total_sessions || 0}`,            color: 'text-secondary' },
          { icon: TrendingUp, label: 'Asistencia', value: `${stats?.attendance_percentage || 0}%`,    color: 'text-accent' },
          { icon: Users,      label: 'Presentes',  value: `${stats?.present_sessions || 0}`,          color: 'text-info' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 space-y-2">
            <Icon size={18} className={color} />
            <p className="text-2xl font-display font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* Sesiones confirmadas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-foreground">Mis Sesiones Confirmadas</h2>
          <button onClick={() => navigate('/agenda')}
            className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
            Ver todas <ChevronRight size={14} />
          </button>
        </div>
        <div className="space-y-3">
          {myReservedSessions.length > 0 ? myReservedSessions.slice(0, 5).map((s: any) => {
            const userReservation = s.reservations?.find(
              (r: any) => r.user_id === user?.id && r.reservation_status === 'confirmed'
            );
            return (
              <div key={s.id} className="bg-card border border-secondary/30 rounded-xl p-4 flex items-center gap-4">
                <div className={`w-1.5 h-12 rounded-full ${SESSION_COLORS[s.session_type] || 'bg-primary'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">{s.title}</p>
                    <Badge variant="outline" className="text-xs bg-secondary/10 text-secondary border-secondary/30">
                      <Check size={10} className="mr-1" /> Confirmado
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(s.start_time), "EEEE d MMM · HH:mm", { locale: es })}
                    {' — '}{format(new Date(s.end_time), 'HH:mm', { locale: es })}
                    {s.groups?.name && ` · ${s.groups.name}`}
                  </p>
                  {s.users?.profiles?.full_name && (
                    <p className="text-xs text-muted-foreground mt-0.5">🏃 Coach: {s.users.profiles.full_name}</p>
                  )}
                </div>
                <Button variant="outline" size="sm"
                  onClick={() => userReservation && cancelMutation.mutate(userReservation.id)}
                  disabled={cancelMutation.isPending}
                  className="border-destructive/50 text-destructive hover:bg-destructive/10 text-xs">
                  Cancelar
                </Button>
              </div>
            );
          }) : (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Calendar size={32} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No tenés sesiones reservadas</p>
              <p className="text-sm text-muted-foreground mt-1">Reservá tu lugar en una sesión debajo</p>
            </div>
          )}
        </div>
      </div>

      {/* Sesiones disponibles */}
      {availableSessions.length > 0 && (
        <div>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">Sesiones Disponibles</h2>
          <div className="space-y-3">
            {availableSessions.slice(0, 5).map((s: any) => {
              const confirmed = s.reservations?.filter((r: any) => r.reservation_status === 'confirmed') || [];
              const isFull = confirmed.length >= s.capacity;
              const spots = s.capacity - confirmed.length;
              return (
                <div key={s.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                  <div className={`w-1.5 h-12 rounded-full ${SESSION_COLORS[s.session_type] || 'bg-primary'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{s.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(s.start_time), "EEEE d MMM · HH:mm", { locale: es })}
                      {' — '}{format(new Date(s.end_time), 'HH:mm', { locale: es })}
                      {s.groups?.name && ` · ${s.groups.name}`}
                    </p>
                    {s.users?.profiles?.full_name && (
                      <p className="text-xs text-muted-foreground mt-0.5">🏃 Coach: {s.users.profiles.full_name}</p>
                    )}
                    {!isFull && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[80px]">
                          <div className="h-full rounded-full transition-all" style={{
                            width: `${Math.round((confirmed.length / s.capacity) * 100)}%`,
                            backgroundColor: spots <= 3
                              ? 'hsl(var(--destructive))'
                              : spots <= 8 ? 'hsl(var(--accent))' : 'hsl(var(--secondary))',
                          }} />
                        </div>
                        <span className={`text-xs font-medium ${spots <= 3 ? 'text-destructive' : spots <= 8 ? 'text-accent' : 'text-secondary'}`}>
                          {spots <= 3 ? `¡Solo ${spots} lugar${spots === 1 ? '' : 'es'}!` : `${spots} lugares`}
                        </span>
                      </div>
                    )}
                  </div>
                  <Button size="sm"
                    onClick={() => bookMutation.mutate(s.id)}
                    disabled={isFull || bookMutation.isPending}
                    className={isFull ? '' : 'gradient-primary text-primary-foreground'}>
                    {isFull ? 'Lleno' : 'Reservar'}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}