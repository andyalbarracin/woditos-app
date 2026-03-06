import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Users, Calendar, TrendingUp, Plus, Check, X, Clock, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function CoachDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    title: '', session_type: 'running', start_time: '', end_time: '', location: '', capacity: '20', notes: '',
  });
  const [selectedGroup, setSelectedGroup] = useState<string>('');

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
      if (selectedGroup) query = query.eq('group_id', selectedGroup);
      const { data } = await query;
      return data || [];
    },
    enabled: true,
  });

  const createSession = useMutation({
    mutationFn: async () => {
      if (!selectedGroup) throw new Error('Selecciona un grupo');
      const { error } = await supabase.from('sessions').insert({
        group_id: selectedGroup,
        coach_id: user!.id,
        title: sessionForm.title,
        session_type: sessionForm.session_type,
        start_time: sessionForm.start_time,
        end_time: sessionForm.end_time,
        location: sessionForm.location || null,
        capacity: parseInt(sessionForm.capacity),
        notes: sessionForm.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-today-sessions'] });
      setShowCreateSession(false);
      setSessionForm({ title: '', session_type: 'running', start_time: '', end_time: '', location: '', capacity: '20', notes: '' });
      toast.success('Sesión creada');
    },
    onError: (err: any) => toast.error(err.message),
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

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold text-foreground">Coach Panel</h1>
        <Dialog open={showCreateSession} onOpenChange={setShowCreateSession}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground gap-2">
              <Plus size={16} /> Nueva Sesión
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-display">Crear Sesión</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Grupo</Label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Seleccionar grupo" /></SelectTrigger>
                  <SelectContent>
                    {groups?.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={sessionForm.title} onChange={e => setSessionForm(f => ({ ...f, title: e.target.value }))} className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={sessionForm.session_type} onValueChange={v => setSessionForm(f => ({ ...f, session_type: v }))}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['running', 'functional', 'amrap', 'emom', 'hiit', 'technique'].map(t => (
                      <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Inicio</Label>
                  <Input type="datetime-local" value={sessionForm.start_time} onChange={e => setSessionForm(f => ({ ...f, start_time: e.target.value }))} className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Fin</Label>
                  <Input type="datetime-local" value={sessionForm.end_time} onChange={e => setSessionForm(f => ({ ...f, end_time: e.target.value }))} className="bg-background border-border" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Ubicación</Label>
                  <Input value={sessionForm.location} onChange={e => setSessionForm(f => ({ ...f, location: e.target.value }))} className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Capacidad</Label>
                  <Input type="number" value={sessionForm.capacity} onChange={e => setSessionForm(f => ({ ...f, capacity: e.target.value }))} className="bg-background border-border" />
                </div>
              </div>
              <Button onClick={() => createSession.mutate()} disabled={createSession.isPending} className="w-full gradient-primary text-primary-foreground">
                Crear Sesión
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="today">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="today" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Calendar size={16} /> Hoy
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
            <Users size={16} /> Miembros
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
              <SelectTrigger className="w-64 bg-card border-border"><SelectValue placeholder="Filtrar por grupo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los grupos</SelectItem>
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
      </Tabs>
    </div>
  );
}
