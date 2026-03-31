/**
 * Archivo: CoachDashboard.tsx
 * Ruta: src/pages/CoachDashboard.tsx
 * Última modificación: 2026-03-29
 * Descripción: Panel exclusivo para coaches y super_admin.
 *   - Tab Hoy: calendario + detalle de sesiones del día (con Soltar/Eliminar)
 *   - Gestión de miembros por crew
 *   - Analytics de asistencia y sesiones
 *   - Tab de invitaciones de coach
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Users, Calendar, TrendingUp, Plus, Check, X, Clock,
  UserCheck, BarChart3, Activity, Link, Trash2, UserMinus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar as CalendarWidget } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import CreateSessionDialog from '@/components/CreateSessionDialog';
import InviteCoach from '@/components/InviteCoach';

const PIE_COLORS = ['hsl(165,100%,39%)', 'hsl(17,81%,52%)', 'hsl(45,100%,60%)', 'hsl(217,47%,55%)'];

export default function CoachDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [sessionToDelete, setSessionToDelete] = useState<any>(null);

  const isCoach = user?.role === 'coach' || user?.role === 'super_admin';

  const { data: groups } = useQuery({
    queryKey: ['coach-groups'],
    queryFn: async () => {
      const { data } = await supabase.from('groups').select('*').order('name');
      return data || [];
    },
  });

  const { data: monthSessions } = useQuery({
    queryKey: ['coach-month-sessions', selectedDay.getMonth(), selectedDay.getFullYear()],
    queryFn: async () => {
      const start = startOfMonth(selectedDay);
      const end = endOfMonth(selectedDay);
      const { data } = await supabase
        .from('sessions')
        .select('id, start_time')
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .eq('coach_id', user!.id);
      return data || [];
    },
  });

  const { data: daySessions } = useQuery({
    queryKey: ['coach-day-sessions', selectedDay.toDateString()],
    queryFn: async () => {
      const dayStart = new Date(selectedDay);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const { data } = await supabase.from('sessions')
        .select('*, groups(name), reservations(id, user_id, reservation_status, users!user_id(id, profiles(full_name, avatar_url))), attendance(id, user_id, attendance_status)')
        .gte('start_time', dayStart.toISOString())
        .lt('start_time', dayEnd.toISOString())
        .eq('coach_id', user!.id)
        .order('start_time');
      return data || [];
    },
  });

  const daysWithSessions = useMemo(() => {
    if (!monthSessions) return [];
    return monthSessions.map((s: any) => new Date(s.start_time));
  }, [monthSessions]);

  const { data: members } = useQuery({
    queryKey: ['coach-members', selectedGroup],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data: myClub } = await supabase
        .from('club_memberships')
        .select('club_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();
      if (!myClub) return [];

      let query = supabase.from('club_memberships')
        .select('*, users!user_id(id, email, role, status, profiles(full_name, avatar_url, experience_level))')
        .eq('club_id', myClub.club_id)
        .eq('status', 'active');
      const { data } = await query;
      return data || [];
    },
  });

  const { data: allSessions } = useQuery({
    queryKey: ['coach-all-sessions'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data } = await supabase.from('sessions')
        .select('*, attendance(attendance_status), reservations(reservation_status)')
        .gte('start_time', thirtyDaysAgo.toISOString())
        .order('start_time');
      return data || [];
    },
  });

  const { data: allAttendance } = useQuery({
    queryKey: ['coach-attendance-stats'],
    queryFn: async () => {
      const { data } = await supabase.from('attendance').select('attendance_status');
      return data || [];
    },
  });

  /* ── Helpers compartidos ─────────────────────────────────────── */
  const invalidateSessionQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['coach-day-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['coach-month-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['coach-all-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['coach-attendance-stats'] });
    queryClient.invalidateQueries({ queryKey: ['my-coach-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['unassigned-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['next-session'] });
    queryClient.invalidateQueries({ queryKey: ['upcoming-sessions-dashboard'] });
  };

  const notifyMembers = async (session: any, title: string, message: string) => {
    const confirmed = session.reservations?.filter(
      (r: any) => r.reservation_status === 'confirmed'
    ) || [];
    if (confirmed.length === 0) return;
    await supabase.from('notifications').insert(
      confirmed.map((r: any) => ({
        user_id: r.user_id,
        title,
        message,
        type: 'session',
      }))
    );
  };

  const canDelete = (s: any) =>
    s.created_by === user?.id
    || (!s.created_by && s.coach_id === user?.id)
    || user?.role === 'super_admin';

  const confirmedCount = (s: any) =>
    s.reservations?.filter((r: any) => r.reservation_status === 'confirmed')?.length || 0;

  /* ── Mutations ───────────────────────────────────────────────── */
  const unclaimMutation = useMutation({
    mutationFn: async (session: any) => {
      await notifyMembers(
        session,
        '📋 Coach desasignado',
        `El coach se desasignó de "${session.title}" del ${format(new Date(session.start_time), "d MMM 'a las' HH:mm", { locale: es })}. Puede ser tomada por otro coach.`
      );
      const { error } = await supabase.from('sessions')
        .update({ coach_id: null }).eq('id', session.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateSessionQueries();
      toast.success('Sesión soltada — vuelve a "sin coach"');
    },
    onError: () => toast.error('No se pudo soltar la sesión'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (session: any) => {
      await notifyMembers(
        session,
        '❌ Sesión cancelada',
        `La sesión "${session.title}" del ${format(new Date(session.start_time), "d MMM 'a las' HH:mm", { locale: es })} fue cancelada por el coach.`
      );
      const { error } = await (supabase.rpc as any)('delete_session_cascade', {
          p_session_id: session.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setSessionToDelete(null);
      invalidateSessionQueries();
      toast.success('Sesión eliminada');
    },
    onError: (err: any) => {
      toast.error('No se pudo eliminar: ' + (err.message || 'Error desconocido'));
    },
  });

  const markAttendance = useMutation({
    mutationFn: async ({
      sessionId, userId, status, currentStatus,
    }: {
      sessionId: string; userId: string;
      status: 'present' | 'late' | 'absent'; currentStatus?: string | null;
    }) => {
      if (currentStatus === status) {
        const { error } = await supabase.from('attendance').delete()
          .eq('session_id', sessionId).eq('user_id', userId);
        if (error) throw error;
        return { cleared: true };
      }
      const { error } = await supabase.from('attendance').upsert({
        session_id: sessionId, user_id: userId, attendance_status: status,
        checkin_time: status === 'present' ? new Date().toISOString() : null,
      }, { onConflict: 'session_id,user_id' });
      if (error) throw error;
      return { cleared: false };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['coach-day-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['coach-attendance-stats'] });
      toast.success(result.cleared ? 'Asistencia desmarcada' : '¡Asistencia guardada!');
    },
    onError: (err: any) => toast.error('No se pudo registrar la asistencia: ' + err.message),
  });

  /* ── Datos para analytics ────────────────────────────────────── */
  const sessionsByType = allSessions?.reduce((acc: any[], s: any) => {
    const existing = acc.find(x => x.tipo === s.session_type);
    if (existing) existing.cantidad++;
    else acc.push({ tipo: s.session_type, cantidad: 1 });
    return acc;
  }, []) || [];

  const attendancePie = allAttendance?.reduce((acc: any[], a: any) => {
    const label = a.attendance_status === 'present' ? 'Presente' :
      a.attendance_status === 'late' ? 'Tarde' :
      a.attendance_status === 'absent' ? 'Ausente' : 'Excusado';
    const existing = acc.find(x => x.name === label);
    if (existing) existing.value++;
    else acc.push({ name: label, value: 1 });
    return acc;
  }, []) || [];

  const weeklyData = allSessions?.reduce((acc: any[], s: any) => {
    const week = format(new Date(s.start_time), "'Sem' w", { locale: es });
    const existing = acc.find(x => x.semana === week);
    const attended = s.attendance?.filter((a: any) => a.attendance_status === 'present').length || 0;
    if (existing) { existing.sesiones++; existing.asistentes += attended; }
    else acc.push({ semana: week, sesiones: 1, asistentes: attended });
    return acc;
  }, []) || [];

  const totalMembers = members?.length || 0;
  const totalSessions30d = allSessions?.length || 0;
  const avgAttendance = allAttendance?.length
    ? Math.round((allAttendance.filter((a: any) => a.attendance_status === 'present').length / allAttendance.length) * 100)
    : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
          <h1 className="font-display text-3xl font-extrabold text-foreground">Coach Panel</h1>
          <p className="text-sm text-muted-foreground">Gestiona tus crews y sesiones</p>
        </div>
        <Button onClick={() => setShowCreateSession(true)} className="gradient-primary text-primary-foreground gap-2">
          <Plus size={16} /> Nueva Sesión
        </Button>
        <CreateSessionDialog open={showCreateSession} onOpenChange={setShowCreateSession} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Users, label: 'Miembros', value: totalMembers, color: 'text-secondary' },
          { icon: Calendar, label: 'Sesiones (30d)', value: totalSessions30d, color: 'text-primary' },
          { icon: TrendingUp, label: 'Asistencia', value: `${avgAttendance}%`, color: 'text-accent' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <Icon size={18} className={`${color} mb-2`} />
            <p className="text-2xl font-display font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="today">
<TabsList className="bg-card border border-border grid grid-cols-2 sm:grid-cols-4 h-auto gap-1 p-1">          <TabsTrigger value="today" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Calendar size={16} /> Agenda
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
            <Users size={16} /> Miembros
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <BarChart3 size={16} /> Analytics
          </TabsTrigger>
          {isCoach && (
            <TabsTrigger value="invites" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Link size={16} /> Invitar Coach
            </TabsTrigger>
          )}
        </TabsList>

        {/* TAB HOY — dos columnas: calendario + detalle */}
        <TabsContent value="today" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Columna izquierda: calendario */}
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-3">
                Seleccioná un día
              </p>
              <CalendarWidget
                mode="single"
                selected={selectedDay}
                onSelect={(d) => { if (d) setSelectedDay(d); }}
                locale={es}
                className="rounded-md border-0 pointer-events-auto w-full"
                classNames={{
                  months: "flex flex-col w-full",
                  month: "space-y-3 w-full",
                  table: "w-full border-collapse",
                  head_row: "flex w-full",
                  head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-[0.75rem] text-center",
                  row: "flex w-full mt-1",
                  cell: "flex-1 h-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                  day: "h-9 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-muted rounded-md transition-colors",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent/20 text-accent font-bold",
                  day_outside: "text-muted-foreground opacity-40",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-border rounded-md inline-flex items-center justify-center",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  caption: "flex justify-center pt-1 relative items-center mb-2",
                  caption_label: "text-sm font-medium",
                }}
                modifiers={{ hasSessions: daysWithSessions }}
                modifiersClassNames={{ hasSessions: 'font-bold after:block after:w-1 after:h-1 after:rounded-full after:bg-primary after:mx-auto after:mt-0.5' }}
              />
            </div>

            {/* Columna derecha: sesiones del día */}
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                {format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}
              </p>

              {daySessions && daySessions.length > 0 ? (
                daySessions.map((s: any) => {
                  const confirmed = s.reservations?.filter((r: any) => r.reservation_status === 'confirmed') || [];
                  return (
                    <div key={s.id} className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1 min-w-0 mr-2">
                          <h3 className="font-display font-bold text-foreground text-sm">{s.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(s.start_time), 'HH:mm')} - {format(new Date(s.end_time), 'HH:mm')}
                            {s.groups?.name && ` · ${s.groups.name}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Soltar / Eliminar — solo si el coach está asignado */}
                          {s.coach_id === user?.id && (
                            <>
                              <Button variant="ghost" size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                title="Soltar sesión"
                                disabled={unclaimMutation.isPending}
                                onClick={() => unclaimMutation.mutate(s)}>
                                <UserMinus size={14} />
                              </Button>
                              {canDelete(s) && (
                                <Button variant="ghost" size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  title="Eliminar sesión"
                                  onClick={() => setSessionToDelete(s)}>
                                  <Trash2 size={14} />
                                </Button>
                              )}
                            </>
                          )}
                          <div className="flex items-center gap-1.5 text-xs ml-1">
                            <UserCheck size={13} className="text-secondary" />
                            <span className="text-foreground font-medium">{confirmed.length}/{s.capacity}</span>
                          </div>
                        </div>
                      </div>
                      {confirmed.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Asistencia</p>
                          {confirmed.map((r: any) => {
                            const att = s.attendance?.find((a: any) => a.user_id === r.user_id);
                            const participantName = r.users?.profiles?.full_name || 'Sin nombre';
                            return (
                              <div key={r.id} className="flex items-center justify-between py-1">
                                <span className="text-sm text-foreground truncate flex-1 mr-2">{participantName}</span>
                                <div className="flex gap-1 shrink-0">
                                  {(['present', 'late', 'absent'] as const).map((status) => (
                                    <Button
                                      key={status}
                                      variant={att?.attendance_status === status ? 'default' : 'outline'}
                                      size="sm"
                                      className={`text-xs h-7 w-7 p-0 ${att?.attendance_status === status ?
                                        status === 'present' ? 'bg-secondary text-secondary-foreground' :
                                        status === 'late' ? 'bg-accent text-accent-foreground' :
                                        'bg-destructive text-destructive-foreground' : ''}`}
                                      onClick={() => markAttendance.mutate({
                                        sessionId: s.id, userId: r.user_id, status,
                                        currentStatus: att?.attendance_status || null,
                                      })}
                                    >
                                      {status === 'present' ? <Check size={11} /> : status === 'late' ? <Clock size={11} /> : <X size={11} />}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {confirmed.length === 0 && (
                        <p className="text-xs text-muted-foreground">Sin reservas aún</p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="bg-card border border-dashed border-border rounded-xl p-6 text-center flex flex-col items-center gap-3">
                  <Calendar size={24} className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No hay sesiones este día</p>
                  <Button variant="outline" size="sm" className="gap-1"
                    onClick={() => setShowCreateSession(true)}>
                    <Plus size={13} /> Crear sesión
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <div className="mb-4">
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="w-64 bg-card border-border">
                <SelectValue placeholder="Filtrar por crew" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los crews</SelectItem>
                {groups?.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider font-bold">Miembro</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider font-bold">Nivel</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider font-bold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {members && members.length > 0 ? (
                  members.map((m: any) => {
                    const mp = m.users?.profiles;
                    return (
                      <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                              {mp?.full_name?.slice(0, 2).toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{mp?.full_name || 'Sin nombre'}</p>
                              <p className="text-xs text-muted-foreground">{m.users?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs capitalize text-muted-foreground">{mp?.experience_level || '-'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs capitalize text-secondary">{m.membership_status}</span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No hay miembros</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4 space-y-6">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Activity size={18} className="text-primary" /> Sesiones por Tipo (30 días)
            </h3>
            {sessionsByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={sessionsByType}>
                  <XAxis dataKey="tipo" tick={{ fill: 'hsl(250,10%,55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(250,10%,55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(230,20%,9%)', border: '1px solid hsl(240,12%,18%)', borderRadius: '8px', color: 'hsl(250,20%,96%)' }} />
                  <Bar dataKey="cantidad" fill="hsl(16,100%,58%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">Sin datos aún</p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-display font-bold text-foreground mb-4">Distribución de Asistencia</h3>
              {attendancePie.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={attendancePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {attendancePie.map((_: any, i: number) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">Sin datos — marcá asistencia primero</p>
              )}
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-display font-bold text-foreground mb-4">Actividad Semanal</h3>
              {weeklyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={weeklyData}>
                    <XAxis dataKey="semana" tick={{ fill: 'hsl(250,10%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'hsl(250,10%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(230,20%,9%)', border: '1px solid hsl(240,12%,18%)', borderRadius: '8px', color: 'hsl(250,20%,96%)' }} />
                    <Bar dataKey="sesiones" fill="hsl(16,100%,58%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="asistentes" fill="hsl(165,100%,39%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">Sin datos aún</p>
              )}
            </div>
          </div>
        </TabsContent>

        {isCoach && (
          <TabsContent value="invites" className="mt-4">
            <InviteCoach />
          </TabsContent>
        )}
      </Tabs>

      {/* ── Dialog de confirmación para eliminar sesión ───────────── */}
      <Dialog open={!!sessionToDelete} onOpenChange={(open) => { if (!open) setSessionToDelete(null); }}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-destructive">Eliminar sesión</DialogTitle>
          </DialogHeader>
          {sessionToDelete && (
            <div className="space-y-4">
              <p className="text-sm text-foreground">
                ¿Estás seguro de que querés eliminar <strong>"{sessionToDelete.title}"</strong>?
              </p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(sessionToDelete.start_time), "EEEE d 'de' MMMM · HH:mm", { locale: es })}
              </p>
              {confirmedCount(sessionToDelete) > 0 && (
                <p className="text-sm text-destructive/80 bg-destructive/10 rounded-lg px-3 py-2">
                  Se notificará a {confirmedCount(sessionToDelete)} inscripto{confirmedCount(sessionToDelete) !== 1 ? 's' : ''} que la sesión fue cancelada.
                </p>
              )}
              <p className="text-xs text-muted-foreground">Esta acción no se puede deshacer.</p>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setSessionToDelete(null)}>
                  Cancelar
                </Button>
                <Button variant="destructive" disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(sessionToDelete)}>
                  {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}