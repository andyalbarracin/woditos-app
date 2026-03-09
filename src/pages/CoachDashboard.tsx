/**
 * Archivo: CoachDashboard.tsx
 * Ruta: src/pages/CoachDashboard.tsx
 * Última modificación: 2026-03-09
 * Descripción: Panel exclusivo para coaches y super_admin.
 *   - Resumen diario de sesiones
 *   - Gestión de miembros por crew
 *   - Analytics de asistencia y sesiones
 *   - Formulario mejorado para crear sesiones:
 *       * Crear nuevo crew inline sin salir del form
 *       * Tipo de sesión como texto libre
 *       * Fecha única (date) + hora de inicio y fin separadas (time input nativo)
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Users, Calendar, TrendingUp, Plus, Check, X, Clock, UserCheck, BarChart3, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PIE_COLORS = ['hsl(165,100%,39%)', 'hsl(17,81%,52%)', 'hsl(45,100%,60%)', 'hsl(217,47%,55%)'];

export default function CoachDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateSession, setShowCreateSession] = useState(false);

  /** Estado del formulario de nueva sesión */
  const [sessionForm, setSessionForm] = useState({
    title: '',
    session_type: '',        // texto libre — el coach escribe el tipo
    session_date: '',        // fecha única (YYYY-MM-DD)
    start_time: '',          // hora inicio (HH:mm) — input type="time" nativo
    end_time: '',            // hora fin (HH:mm)
    location: '',
    capacity: '20',
    notes: '',
  });

  /** ID del crew seleccionado para la sesión (puede ser uno existente o recién creado) */
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  /** Modo de crew: 'existing' | 'new' */
  const [crewMode, setCrewMode] = useState<'existing' | 'new'>('existing');

  /** Datos del nuevo crew a crear inline */
  const [newCrewForm, setNewCrewForm] = useState({
    name: '',
    group_type: 'functional',
    location: '',
    capacity: '20',
  });

  const { data: groups } = useQuery({
    queryKey: ['coach-groups'],
    queryFn: async () => {
      const { data } = await supabase.from('groups').select('*').order('name');
      return data || [];
    },
  });

  const { data: todaySessions } = useQuery({
    queryKey: ['coach-today-sessions'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const { data } = await supabase.from('sessions')
        .select('*, groups(name), reservations(id, user_id, reservation_status), attendance(id, user_id, attendance_status)')
        .gte('start_time', today.toISOString())
        .lt('start_time', tomorrow.toISOString())
        .order('start_time');
      return data || [];
    },
  });

  const { data: members } = useQuery({
    queryKey: ['coach-members', selectedGroup],
    queryFn: async () => {
      let query = supabase.from('group_memberships')
        .select('*, users(email, role, status), profiles!user_id(full_name, avatar_url, experience_level)')
        .eq('membership_status', 'active');
      if (selectedGroup && selectedGroup !== 'all') query = query.eq('group_id', selectedGroup);
      const { data } = await query;
      return data || [];
    },
  });

  // Analytics data
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

  // Build analytics charts data
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

  /**
   * Mutación para crear una nueva sesión.
   * Si crewMode='new', primero crea el crew nuevo y luego lo usa como group_id.
   * Combina session_date + start_time/end_time en timestamps ISO completos.
   */
  const createSession = useMutation({
    mutationFn: async () => {
      let groupId = selectedGroup;

      // Si el coach quiere crear un crew nuevo inline
      if (crewMode === 'new') {
        if (!newCrewForm.name.trim()) throw new Error('El nombre del crew es obligatorio');
        const { data: newGroup, error: groupError } = await supabase.from('groups').insert({
          name: newCrewForm.name.trim(),
          group_type: newCrewForm.group_type || 'functional',
          location: newCrewForm.location || null,
          capacity: parseInt(newCrewForm.capacity) || 20,
          coach_id: user!.id,
        }).select('id').single();
        if (groupError) throw groupError;
        groupId = newGroup.id;
      }

      if (!groupId) throw new Error('Selecciona o creá un crew');
      if (!sessionForm.session_date) throw new Error('La fecha es obligatoria');
      if (!sessionForm.start_time) throw new Error('La hora de inicio es obligatoria');

      // Construir timestamps ISO combinando fecha + hora
      const startISO = `${sessionForm.session_date}T${sessionForm.start_time || '08:00'}:00`;
      const endISO = sessionForm.end_time
        ? `${sessionForm.session_date}T${sessionForm.end_time}:00`
        : `${sessionForm.session_date}T${sessionForm.start_time.split(':').map((v, i) => i === 0 ? String(Number(v) + 1).padStart(2, '0') : v).join(':')}:00`;

      const { error } = await supabase.from('sessions').insert({
        group_id: groupId,
        coach_id: user!.id,
        title: sessionForm.title || 'Sesión',
        session_type: sessionForm.session_type || 'general',
        start_time: startISO,
        end_time: endISO,
        location: sessionForm.location || null,
        capacity: parseInt(sessionForm.capacity) || 20,
        notes: sessionForm.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-today-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['coach-groups'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-all-sessions'] });
      setShowCreateSession(false);
      setSessionForm({ title: '', session_type: '', session_date: '', start_time: '', end_time: '', location: '', capacity: '20', notes: '' });
      setCrewMode('existing');
      setNewCrewForm({ name: '', group_type: 'functional', location: '', capacity: '20' });
      toast.success('¡Sesión creada exitosamente!');
    },
    onError: (err: any) => toast.error('No se pudo crear la sesión. Verificá los datos ingresados.'),
  });

  const markAttendance = useMutation({
    mutationFn: async ({ sessionId, userId, status }: { sessionId: string; userId: string; status: string }) => {
      const { error } = await supabase.from('attendance').upsert({
        session_id: sessionId,
        user_id: userId,
        attendance_status: status,
        checkin_time: status === 'present' ? new Date().toISOString() : null,
      }, { onConflict: 'session_id,user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-today-sessions'] });
      toast.success('Asistencia registrada');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const totalMembers = members?.length || 0;
  const totalSessions30d = allSessions?.length || 0;
  const avgAttendance = allAttendance?.length
    ? Math.round((allAttendance.filter((a: any) => a.attendance_status === 'present').length / allAttendance.length) * 100)
    : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-foreground">Coach Panel</h1>
          <p className="text-sm text-muted-foreground">Gestiona tus crews y sesiones</p>
        </div>
        <Dialog open={showCreateSession} onOpenChange={setShowCreateSession}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground gap-2">
              <Plus size={16} /> Nueva Sesión
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">Crear Sesión</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">

              {/* ─── Crew: seleccionar existente o crear nuevo ─── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Crew</Label>
                  <button
                    type="button"
                    onClick={() => setCrewMode(m => m === 'existing' ? 'new' : 'existing')}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    {crewMode === 'existing' ? '+ Crear nuevo crew' : 'Elegir crew existente'}
                  </button>
                </div>
                {crewMode === 'existing' ? (
                  <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Seleccionar crew" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups?.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-2 p-3 border border-dashed border-primary/30 rounded-lg bg-primary/5">
                    <Input
                      placeholder="Nombre del nuevo crew"
                      value={newCrewForm.name}
                      onChange={e => setNewCrewForm(f => ({ ...f, name: e.target.value }))}
                      className="bg-background border-border"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Tipo (ej: functional)"
                        value={newCrewForm.group_type}
                        onChange={e => setNewCrewForm(f => ({ ...f, group_type: e.target.value }))}
                        className="bg-background border-border text-sm"
                      />
                      <Input
                        placeholder="Ubicación"
                        value={newCrewForm.location}
                        onChange={e => setNewCrewForm(f => ({ ...f, location: e.target.value }))}
                        className="bg-background border-border text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Título */}
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  placeholder="Ej: AMRAP 20min"
                  value={sessionForm.title}
                  onChange={e => setSessionForm(f => ({ ...f, title: e.target.value }))}
                  className="bg-background border-border"
                />
              </div>

              {/* Tipo de sesión: Select con valores válidos del constraint */}
              <div className="space-y-2">
                <Label>Tipo de sesión</Label>
                <Select
                  value={sessionForm.session_type}
                  onValueChange={(v) => setSessionForm(f => ({ ...f, session_type: v }))}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Elegir tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="functional">Funcional</SelectItem>
                    <SelectItem value="amrap">AMRAP</SelectItem>
                    <SelectItem value="emom">EMOM</SelectItem>
                    <SelectItem value="hiit">HIIT</SelectItem>
                    <SelectItem value="technique">Técnica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fecha única */}
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={sessionForm.session_date}
                  onChange={e => setSessionForm(f => ({ ...f, session_date: e.target.value }))}
                  className="bg-background border-border"
                />
              </div>

              {/* Hora inicio + hora fin separadas — usa selector nativo del OS (rueda en iOS) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Hora inicio</Label>
                  <Input
                    type="time"
                    value={sessionForm.start_time}
                    onChange={e => setSessionForm(f => ({ ...f, start_time: e.target.value }))}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora fin</Label>
                  <Input
                    type="time"
                    value={sessionForm.end_time}
                    onChange={e => setSessionForm(f => ({ ...f, end_time: e.target.value }))}
                    className="bg-background border-border"
                  />
                </div>
              </div>

              {/* Ubicación + Capacidad */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Ubicación</Label>
                  <Input
                    placeholder="Ej: Palermo Rosedal"
                    value={sessionForm.location}
                    onChange={e => setSessionForm(f => ({ ...f, location: e.target.value }))}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Capacidad</Label>
                  <Input
                    type="number"
                    value={sessionForm.capacity}
                    onChange={e => setSessionForm(f => ({ ...f, capacity: e.target.value }))}
                    className="bg-background border-border"
                  />
                </div>
              </div>

              <Button
                onClick={() => createSession.mutate()}
                disabled={createSession.isPending}
                className="w-full gradient-primary text-primary-foreground"
              >
                {createSession.isPending ? 'Creando...' : 'Crear Sesión'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <Users size={18} className="text-secondary mb-2" />
          <p className="text-2xl font-display font-bold text-foreground">{totalMembers}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Miembros</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <Calendar size={18} className="text-primary mb-2" />
          <p className="text-2xl font-display font-bold text-foreground">{totalSessions30d}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Sesiones (30d)</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <TrendingUp size={18} className="text-accent mb-2" />
          <p className="text-2xl font-display font-bold text-foreground">{avgAttendance}%</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Asistencia</p>
        </div>
      </div>

      <Tabs defaultValue="today">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="today" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Calendar size={16} /> Hoy
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
            <Users size={16} /> Miembros
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <BarChart3 size={16} /> Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4 space-y-4">
          {todaySessions && todaySessions.length > 0 ? (
            todaySessions.map((s: any) => {
              const confirmed = s.reservations?.filter((r: any) => r.reservation_status === 'confirmed') || [];
              return (
                <div key={s.id} className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-display font-bold text-foreground">{s.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(s.start_time), 'HH:mm')} - {format(new Date(s.end_time), 'HH:mm')}
                        {s.groups?.name && ` · ${s.groups.name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <UserCheck size={14} className="text-secondary" />
                      <span className="text-foreground font-medium">{confirmed.length}/{s.capacity}</span>
                    </div>
                  </div>
                  {confirmed.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Asistencia</p>
                      {confirmed.map((r: any) => {
                        const att = s.attendance?.find((a: any) => a.user_id === r.user_id);
                        return (
                          <div key={r.id} className="flex items-center justify-between py-1.5">
                            <span className="text-sm text-foreground">{r.user_id.slice(0, 8)}...</span>
                            <div className="flex gap-1">
                              {['present', 'late', 'absent'].map(status => (
                                <Button
                                  key={status}
                                  variant={att?.attendance_status === status ? 'default' : 'outline'}
                                  size="sm"
                                  className={`text-xs h-7 ${att?.attendance_status === status ?
                                    status === 'present' ? 'bg-secondary text-secondary-foreground' :
                                    status === 'late' ? 'bg-accent text-accent-foreground' :
                                    'bg-destructive text-destructive-foreground' : ''}`}
                                  onClick={() => markAttendance.mutate({ sessionId: s.id, userId: r.user_id, status })}
                                >
                                  {status === 'present' ? <Check size={12} /> : status === 'late' ? <Clock size={12} /> : <X size={12} />}
                                </Button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Calendar size={32} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No hay sesiones hoy</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <div className="mb-4">
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="w-64 bg-card border-border"><SelectValue placeholder="Filtrar por crew" /></SelectTrigger>
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
                  members.map((m: any) => (
                    <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {m.profiles?.full_name?.slice(0, 2).toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{m.profiles?.full_name || 'Sin nombre'}</p>
                            <p className="text-xs text-muted-foreground">{m.users?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs capitalize text-muted-foreground">{m.profiles?.experience_level || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs capitalize text-secondary">{m.membership_status}</span>
                      </td>
                    </tr>
                  ))
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
          {/* Sessions by Type */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Activity size={18} className="text-primary" /> Sesiones por Tipo (30 días)
            </h3>
            {sessionsByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={sessionsByType}>
                  <XAxis dataKey="tipo" tick={{ fill: 'hsl(250,10%,55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(250,10%,55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(230,20%,9%)', border: '1px solid hsl(240,12%,18%)', borderRadius: '8px', color: 'hsl(250,20%,96%)' }} />
                  <Bar dataKey="cantidad" fill="hsl(16,100%,58%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">Sin datos aún</p>
            )}
          </div>

          {/* Attendance Pie */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-display font-bold text-foreground mb-4">Distribución de Asistencia</h3>
              {attendancePie.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={attendancePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {attendancePie.map((_: any, i: number) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">Sin datos aún</p>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-display font-bold text-foreground mb-4">Actividad Semanal</h3>
              {weeklyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={weeklyData}>
                    <XAxis dataKey="semana" tick={{ fill: 'hsl(250,10%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'hsl(250,10%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(230,20%,9%)', border: '1px solid hsl(240,12%,18%)', borderRadius: '8px', color: 'hsl(250,20%,96%)' }} />
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
      </Tabs>
    </div>
  );
}
