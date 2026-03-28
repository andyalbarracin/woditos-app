/**
 * Archivo: CoachDashboardView.tsx
 * Ruta: src/components/dashboard/CoachDashboardView.tsx
 * Última modificación: 2026-03-28
 * Descripción: Vista del dashboard para coaches y super_admin.
 *   Muestra sus sesiones próximas, sesiones sin coach, y stats.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Users, ClipboardCheck, Dumbbell, ChevronRight, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import CreateSessionDialog from '@/components/CreateSessionDialog';

const SESSION_COLORS: Record<string, string> = {
  running: 'bg-secondary', functional: 'bg-primary', amrap: 'bg-primary',
  emom: 'bg-accent', hiit: 'bg-destructive', technique: 'bg-info',
};

interface CoachDashboardViewProps {
  stats: any;
}

export default function CoachDashboardView({ stats }: CoachDashboardViewProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [claimingSessionId, setClaimingSessionId] = useState<string | null>(null);

  const { data: coachStats } = useQuery({
    queryKey: ['coach-dashboard-stats', user?.id],
    queryFn: async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count: sessionsThisMonth } = await supabase
        .from('sessions').select('id', { count: 'exact', head: true })
        .eq('coach_id', user!.id).gte('start_time', monthStart);
      const { data: sessionIds } = await supabase
        .from('sessions').select('id')
        .eq('coach_id', user!.id).gte('start_time', monthStart);
      let uniqueStudents = 0;
      if (sessionIds?.length) {
        const { data: att } = await supabase.from('attendance').select('user_id')
          .in('session_id', sessionIds.map(s => s.id)).eq('attendance_status', 'present');
        uniqueStudents = new Set(att?.map(a => a.user_id) || []).size;
      }
      return { sessionsThisMonth: sessionsThisMonth || 0, uniqueStudents };
    },
    enabled: !!user?.id,
  });

  const { data: myCoachSessions } = useQuery({
    queryKey: ['my-coach-sessions', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('sessions')
        .select('*, groups(name), reservations(id, user_id, reservation_status)')
        .eq('coach_id', user!.id)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(5);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: unassignedSessions } = useQuery({
    queryKey: ['unassigned-sessions'],
    queryFn: async () => {
      const { data } = await supabase.from('sessions')
        .select('*, groups(name), reservations(id, user_id, reservation_status)')
        .is('coach_id', null)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(3);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const claimMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      setClaimingSessionId(sessionId);
      const { error } = await supabase.from('sessions')
        .update({ coach_id: user!.id }).eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-coach-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['next-session'] });
      toast.success('Sesión asignada a vos');
    },
    onError: () => { setClaimingSessionId(null); toast.error('No se pudo asignar la sesión'); },
  });

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Users,          label: 'Alumnos este mes', value: `${coachStats?.uniqueStudents || 0}`,    color: 'text-primary' },
          { icon: Calendar,       label: 'Sesiones/mes',     value: `${coachStats?.sessionsThisMonth || 0}`, color: 'text-secondary' },
          { icon: ClipboardCheck, label: 'Asistencia',       value: `${stats?.attendance_percentage || 0}%`, color: 'text-accent' },
          { icon: Dumbbell,       label: 'Mis sesiones',     value: `${myCoachSessions?.length || 0}`,       color: 'text-info' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 space-y-2">
            <Icon size={18} className={color} />
            <p className="text-2xl font-display font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* Mis próximas sesiones */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-foreground">Mis Próximas Sesiones</h2>
          <button onClick={() => navigate('/agenda')}
            className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
            Ver todas <ChevronRight size={14} />
          </button>
        </div>
        <div className="space-y-3">
          {myCoachSessions && myCoachSessions.length > 0 ? myCoachSessions.map((s: any) => {
            const confirmed = s.reservations?.filter((r: any) => r.reservation_status === 'confirmed') || [];
            return (
              <div key={s.id}
                onClick={() => navigate('/asistencia', { state: { preselectedDate: new Date(s.start_time).toISOString(), preselectedSessionId: s.id } })}
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors cursor-pointer">
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
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                    {s.session_type}
                  </span>
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

      {/* Sesiones sin coach */}
      {unassignedSessions && unassignedSessions.length > 0 && (
        <div>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">Sesiones sin coach asignado</h2>
          <div className="space-y-3">
            {unassignedSessions.map((s: any) => {
              const isThisOne = claimingSessionId === s.id;
              const justClaimed = isThisOne && !claimMutation.isPending;
              return (
                <div key={s.id} className="bg-card border border-dashed border-border rounded-xl p-4 flex items-center gap-4">
                  <div className={`w-1.5 h-12 rounded-full ${SESSION_COLORS[s.session_type] || 'bg-primary'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{s.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(s.start_time), "EEEE d MMM · HH:mm", { locale: es })}
                      {s.groups?.name && ` · ${s.groups.name}`}
                    </p>
                  </div>
                  {justClaimed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" disabled variant="outline"
                          className="bg-secondary/20 text-secondary border border-secondary/40 gap-1.5 cursor-default">
                          <Check size={13} /> Asignada
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">Asignada a {profile?.full_name || 'vos'}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button size="sm" onClick={() => claimMutation.mutate(s.id)}
                      disabled={claimMutation.isPending} className="gradient-primary text-primary-foreground">
                      {claimMutation.isPending && isThisOne ? 'Asignando...' : 'Tomar'}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <CreateSessionDialog open={showCreateSession} onOpenChange={setShowCreateSession} />
    </>
  );
}