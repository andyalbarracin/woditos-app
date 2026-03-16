/**
 * Archivo: Dashboard.tsx
 * Ruta: src/pages/Dashboard.tsx
 * Última modificación: 2026-03-16
 * Descripción: Dashboard diferenciado por rol.
 *   - Miembros ven sesiones confirmadas + disponibles para reservar
 *   - Coaches ven sus sesiones + analytics del mes + crear sesión
 */
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Flame, TrendingUp, Users, ChevronRight, Check, ClipboardCheck, Dumbbell, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import CreateSessionDialog from '@/components/CreateSessionDialog';

const SESSION_COLORS: Record<string, string> = {
  running: 'bg-secondary',
  functional: 'bg-primary',
  amrap: 'bg-primary',
  emom: 'bg-accent',
  hiit: 'bg-destructive',
  technique: 'bg-info',
};

export default function Dashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isCoach = user?.role === 'coach' || user?.role === 'super_admin';
  const [showCreateSession, setShowCreateSession] = useState(false);

  // All upcoming sessions with reservations
  const { data: upcomingSessions } = useQuery({
    queryKey: ['upcoming-sessions-dashboard'],
    queryFn: async () => {
      const { data } = await supabase
        .from('sessions')
        .select('*, groups(name), reservations(id, user_id, reservation_status)')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(10);
      return data || [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['member-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.rpc('get_member_stats', { p_user_id: user.id });
      return data as any;
    },
    enabled: !!user?.id,
  });

  const { data: coachStats } = useQuery({
    queryKey: ['coach-dashboard-stats', user?.id],
    queryFn: async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const { count: sessionsThisMonth } = await supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('coach_id', user!.id)
        .gte('start_time', monthStart);

      const { data: sessionIds } = await supabase
        .from('sessions')
        .select('id')
        .eq('coach_id', user!.id)
        .gte('start_time', monthStart);

      let uniqueStudents = 0;
      if (sessionIds && sessionIds.length > 0) {
        const ids = sessionIds.map(s => s.id);
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('user_id')
          .in('session_id', ids)
          .eq('attendance_status', 'present');
        uniqueStudents = new Set(attendanceData?.map(a => a.user_id) || []).size;
      }

      return { sessionsThisMonth: sessionsThisMonth || 0, uniqueStudents };
    },
    enabled: !!user?.id && isCoach,
  });

  const { data: recentPosts } = useQuery({
    queryKey: ['recent-posts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('posts')
        .select('*, users!author_user_id(id, profiles(full_name, avatar_url))')
        .order('created_at', { ascending: false })
        .limit(3);
      return data || [];
    },
  });

  const bookMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.from('reservations').insert({
        session_id: sessionId,
        user_id: user!.id,
        reservation_status: 'confirmed',
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
      toast.success('Reserva cancelada');
    },
    onError: () => toast.error('No se pudo cancelar'),
  });

  const claimMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.from('sessions')
        .update({ coach_id: user!.id })
        .eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-sessions-dashboard'] });
      toast.success('Sesión asignada a vos');
    },
    onError: () => toast.error('No se pudo asignar la sesión'),
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const myReservedSessions = upcomingSessions?.filter((s: any) => {
    const confirmed = s.reservations?.filter((r: any) => r.reservation_status === 'confirmed') || [];
    return confirmed.some((r: any) => r.user_id === user?.id);
  }) || [];

  const otherSessions = upcomingSessions?.filter((s: any) => {
    const confirmed = s.reservations?.filter((r: any) => r.reservation_status === 'confirmed') || [];
    return !confirmed.some((r: any) => r.user_id === user?.id);
  }) || [];

  const myCoachSessions = upcomingSessions?.filter((s: any) => s.coach_id === user?.id) || [];
  const unassignedSessions = upcomingSessions?.filter((s: any) => !s.coach_id) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-muted-foreground text-sm">{greeting()}</p>
        <h1 className="font-display text-3xl font-extrabold text-foreground">
          {profile?.full_name || 'Atleta'} {isCoach ? '💪' : '🏃'}
        </h1>
      </div>

      {/* Stats */}
      {isCoach ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Users,          label: 'Alumnos este mes', value: `${coachStats?.uniqueStudents || 0}`, color: 'text-primary' },
            { icon: Calendar,       label: 'Sesiones/mes',     value: `${coachStats?.sessionsThisMonth || 0}`, color: 'text-secondary' },
            { icon: ClipboardCheck, label: 'Asistencia',       value: `${stats?.attendance_percentage || 0}%`, color: 'text-accent' },
            { icon: Dumbbell,       label: 'Mis sesiones',     value: `${myCoachSessions.length}`, color: 'text-info' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4 space-y-2">
              <Icon size={18} className={color} />
              <p className="text-2xl font-display font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Flame,      label: 'Racha',      value: `${stats?.current_streak || 0} días`, color: 'text-primary' },
            { icon: Calendar,   label: 'Sesiones',   value: `${stats?.total_sessions || 0}`, color: 'text-secondary' },
            { icon: TrendingUp, label: 'Asistencia', value: `${stats?.attendance_percentage || 0}%`, color: 'text-accent' },
            { icon: Users,      label: 'Presentes',  value: `${stats?.present_sessions || 0}`, color: 'text-info' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4 space-y-2">
              <Icon size={18} className={color} />
              <p className="text-2xl font-display font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sessions */}
      {isCoach ? (
        <>
          {/* Coach: My Sessions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-foreground">Mis Próximas Sesiones</h2>
              <button onClick={() => navigate('/agenda')} className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
                Ver todas <ChevronRight size={14} />
              </button>
            </div>
            <div className="space-y-3">
              {myCoachSessions.length > 0 ? myCoachSessions.slice(0, 5).map((s: any) => {
                const confirmed = s.reservations?.filter((r: any) => r.reservation_status === 'confirmed') || [];
                return (
                  <div key={s.id} onClick={() => navigate('/asistencia')} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors cursor-pointer">
                    <div className={`w-1.5 h-12 rounded-full ${SESSION_COLORS[s.session_type] || 'bg-primary'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{s.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(s.start_time), "EEEE d MMM · HH:mm", { locale: es })}
                        {s.groups?.name && ` · ${s.groups.name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{confirmed.length}/{s.capacity}</Badge>
                      <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-muted text-muted-foreground">{s.session_type}</span>
                    </div>
                  </div>
                );
              }) : (
                <div className="bg-card border border-border rounded-xl p-8 text-center space-y-3">
                  <Calendar size={32} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No tenés sesiones próximas asignadas</p>
                  <Button onClick={() => setShowCreateSession(true)} variant="outline" className="gap-2">
                    <Plus size={14} /> Crear nueva sesión
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Unassigned sessions */}
          {unassignedSessions.length > 0 && (
            <div>
              <h2 className="font-display text-xl font-bold text-foreground mb-4">Sesiones sin coach asignado</h2>
              <div className="space-y-3">
                {unassignedSessions.slice(0, 3).map((s: any) => (
                  <div key={s.id} className="bg-card border border-dashed border-border rounded-xl p-4 flex items-center gap-4">
                    <div className={`w-1.5 h-12 rounded-full ${SESSION_COLORS[s.session_type] || 'bg-primary'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{s.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(s.start_time), "EEEE d MMM · HH:mm", { locale: es })}
                        {s.groups?.name && ` · ${s.groups.name}`}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => claimMutation.mutate(s.id)} disabled={claimMutation.isPending} className="gradient-primary text-primary-foreground">
                      Tomar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Member: My confirmed sessions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-foreground">Mis Sesiones Confirmadas</h2>
              <button onClick={() => navigate('/agenda')} className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
                Ver todas <ChevronRight size={14} />
              </button>
            </div>
            <div className="space-y-3">
              {myReservedSessions.length > 0 ? myReservedSessions.slice(0, 5).map((s: any) => {
                const userReservation = s.reservations?.find((r: any) => r.user_id === user?.id && r.reservation_status === 'confirmed');
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
                        {s.groups?.name && ` · ${s.groups.name}`}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => userReservation && cancelMutation.mutate(userReservation.id)} disabled={cancelMutation.isPending} className="border-destructive/50 text-destructive hover:bg-destructive/10 text-xs">
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

          {/* Available sessions to book */}
          {otherSessions.length > 0 && (
            <div>
              <h2 className="font-display text-xl font-bold text-foreground mb-4">Sesiones Disponibles</h2>
              <div className="space-y-3">
                {otherSessions.slice(0, 5).map((s: any) => {
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
                          {s.groups?.name && ` · ${s.groups.name}`}
                          {!isFull && ` · ${spots} lugares`}
                        </p>
                      </div>
                      <Button size="sm" onClick={() => bookMutation.mutate(s.id)} disabled={isFull || bookMutation.isPending} className={isFull ? '' : 'gradient-primary text-primary-foreground'}>
                        {isFull ? 'Lleno' : 'Reservar'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Activity Feed Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-foreground">Actividad Reciente</h2>
          <button onClick={() => navigate('/comunidad')} className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
            Ver más <ChevronRight size={14} />
          </button>
        </div>
        <div className="space-y-3">
          {recentPosts && recentPosts.length > 0 ? (
            recentPosts.map((p: any) => (
              <div key={p.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {p.users?.profiles?.full_name?.slice(0, 2).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.users?.profiles?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(p.created_at), "d MMM · HH:mm", { locale: es })}</p>
                  </div>
                </div>
                <p className="text-sm text-foreground/80">{p.content_text}</p>
              </div>
            ))
          ) : (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Users size={32} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Sin actividad reciente</p>
            </div>
          )}
        </div>
      </div>

      <CreateSessionDialog
        open={showCreateSession}
        onOpenChange={setShowCreateSession}
      />
    </div>
  );
}
