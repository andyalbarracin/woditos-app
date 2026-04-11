/**
 * Archivo: SessionDetail.tsx
 * Ruta: src/pages/SessionDetail.tsx
 * Última modificación: 2026-04-07
 * Descripción: Detalle completo de una sesión para coaches.
 *   3 tabs: Asistencia (marcar presente/tarde/ausente),
 *   Rutinas asignadas (ver y desasignar), Notas del coach (observaciones privadas).
 *   Accesible desde Agenda (click de coach) y CoachDashboard.
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft, Check, Clock, X, Users, MapPin,
  ListChecks, FileText, ClipboardCheck, Loader2,
  ChevronRight, Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

// Para tablas v2 — workaround hasta regenerar tipos
const db = supabase as any;

const TYPE_LABELS: Record<string, string> = {
  running: 'Running', functional: 'Funcional', amrap: 'AMRAP',
  emom: 'EMOM', hiit: 'HIIT', technique: 'Técnica',
};

const TYPE_COLORS: Record<string, string> = {
  running:    'bg-secondary/20 text-secondary border-secondary/30',
  functional: 'bg-primary/20 text-primary border-primary/30',
  amrap:      'bg-primary/20 text-primary border-primary/30',
  emom:       'bg-accent/20 text-accent border-accent/30',
  hiit:       'bg-destructive/20 text-destructive border-destructive/30',
  technique:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200',
};

// ─── Types ───────────────────────────────────────────────────────

interface Attendee {
  userId:        string;
  reservationId: string;
  fullName:      string;
  avatarUrl:     string | null;
  status:        string | null;
}

// ─── Component ───────────────────────────────────────────────────

export default function SessionDetail() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc       = useQueryClient();

  const [observations, setObservations] = useState('');
  const [obsLoaded, setObsLoaded]       = useState(false);
  const [savingObs, setSavingObs]       = useState(false);

  // ── Sesión ────────────────────────────────────────────────────

  const { data: session, isLoading } = useQuery({
    queryKey: ['session-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*, groups(name), users!coach_id(profiles(full_name))')
        .eq('id', id!)
        .single();
      if (error) throw error;
      // Cargar observaciones solo una vez
      if (!obsLoaded) {
        setObservations((data as any).coach_observations ?? '');
        setObsLoaded(true);
      }
      return data;
    },
    enabled: !!id,
  });

  // ── Asistentes ────────────────────────────────────────────────

  const { data: attendees, isLoading: loadingAttendees } = useQuery<Attendee[]>({
    queryKey: ['session-attendees', id],
    queryFn: async () => {
      const { data: reservations } = await supabase
        .from('reservations')
        .select('id, user_id, users!user_id(id, profiles(full_name, avatar_url))')
        .eq('session_id', id!)
        .eq('reservation_status', 'confirmed');

      const { data: attendance } = await supabase
        .from('attendance')
        .select('user_id, attendance_status')
        .eq('session_id', id!);

      const attMap: Record<string, string> = {};
      (attendance ?? []).forEach((a: any) => { attMap[a.user_id] = a.attendance_status; });

      return (reservations ?? []).map((r: any) => ({
        userId:        r.user_id,
        reservationId: r.id,
        fullName:      r.users?.profiles?.full_name ?? 'Sin nombre',
        avatarUrl:     r.users?.profiles?.avatar_url ?? null,
        status:        attMap[r.user_id] ?? null,
      }));
    },
    enabled: !!id,
  });

  // ── Rutinas asignadas ─────────────────────────────────────────

  const { data: assignedRoutines } = useQuery({
    queryKey: ['session-routines', id],
    queryFn: async () => {
      const { data } = await db
        .from('routine_assignments')
        .select('id, routine_id, routines(id, name, type, level, estimated_minutes)')
        .eq('session_id', id!)
        .not('routine_id', 'is', null);
      return data ?? [];
    },
    enabled: !!id,
  });

  // ── Mutations ─────────────────────────────────────────────────

  const markAttendance = useMutation({
    mutationFn: async ({ userId, status, current }: {
      userId: string; status: string; current: string | null;
    }) => {
      if (current === status) {
        await supabase.from('attendance').delete()
          .eq('session_id', id!).eq('user_id', userId);
        return { cleared: true };
      }
      await supabase.from('attendance').upsert(
        { session_id: id, user_id: userId, attendance_status: status,
          checkin_time: status === 'present' ? new Date().toISOString() : null },
        { onConflict: 'session_id,user_id' }
      );
      return { cleared: false };
    },
    onSuccess: res => {
      qc.invalidateQueries({ queryKey: ['session-attendees', id] });
      qc.invalidateQueries({ queryKey: ['coach-attendance-stats'] });
      toast.success(res.cleared ? 'Asistencia desmarcada' : '¡Asistencia guardada!');
    },
    onError: () => toast.error('No se pudo guardar la asistencia'),
  });

  const removeRoutine = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await db.from('routine_assignments').delete().eq('id', assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session-routines', id] });
      toast.success('Rutina desasignada de la sesión');
    },
    onError: () => toast.error('No se pudo desasignar la rutina'),
  });

  const handleSaveObservations = async () => {
    setSavingObs(true);
    const { error } = await supabase.from('sessions')
      .update({ coach_observations: observations.trim() || null } as any)
      .eq('id', id!);
    setSavingObs(false);
    if (error) toast.error('No se pudo guardar');
    else { toast.success('Notas guardadas'); qc.invalidateQueries({ queryKey: ['session-detail', id] }); }
  };

  // ── Stats ─────────────────────────────────────────────────────

  const total   = attendees?.length ?? 0;
  const present = attendees?.filter(a => a.status === 'present').length ?? 0;
  const late    = attendees?.filter(a => a.status === 'late').length ?? 0;
  const absent  = attendees?.filter(a => a.status === 'absent').length ?? 0;

  // ── Loading ───────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!session) return null;

  const isPast     = new Date((session as any).end_time) < new Date();
  const typeColor  = TYPE_COLORS[(session as any).session_type] ?? 'bg-muted text-muted-foreground border-border';
  const typeLabel  = TYPE_LABELS[(session as any).session_type] ?? (session as any).session_type;
  const coachName  = (session as any).users?.profiles?.full_name;
  const groupName  = (session as any).groups?.name;
  const routineCount = assignedRoutines?.length ?? 0;

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in pb-8">

      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" className="shrink-0 mt-0.5" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-2xl font-extrabold text-foreground">
              {(session as any).title}
            </h1>
            {isPast && (
              <Badge variant="outline" className="text-xs text-muted-foreground">Finalizada</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap text-sm text-muted-foreground">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${typeColor}`}>
              {typeLabel}
            </span>
            <span>{format(new Date((session as any).start_time), "EEEE d 'de' MMMM", { locale: es })}</span>
            <span>·</span>
            <span className="font-medium text-foreground">
              {format(new Date((session as any).start_time), 'HH:mm')} — {format(new Date((session as any).end_time), 'HH:mm')}
            </span>
            {(session as any).location && (
              <span className="flex items-center gap-1">
                <MapPin size={12} />{(session as any).location}
              </span>
            )}
            {groupName && <span>· {groupName}</span>}
            {coachName && <span>· Coach: {coachName}</span>}
          </div>
        </div>
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Inscriptos', value: total,   color: 'text-foreground' },
          { label: 'Presentes',  value: present, color: 'text-secondary' },
          { label: 'Tarde',      value: late,    color: 'text-accent' },
          { label: 'Ausentes',   value: absent,  color: 'text-destructive' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="attendance">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="attendance"
            className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <ClipboardCheck size={14} /> Asistencia
            {total > 0 && <span className="ml-0.5 text-[10px]">({total})</span>}
          </TabsTrigger>
          <TabsTrigger value="routines"
            className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <ListChecks size={14} /> Rutinas
            {routineCount > 0 && <span className="ml-0.5 text-[10px]">({routineCount})</span>}
          </TabsTrigger>
          <TabsTrigger value="notes"
            className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <FileText size={14} /> Notas
            {observations.trim() && <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-primary inline-block" />}
          </TabsTrigger>
        </TabsList>

        {/* ── ASISTENCIA ─────────────────────────────────────────── */}
        <TabsContent value="attendance" className="mt-4 space-y-2">
          {loadingAttendees ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !attendees?.length ? (
            <div className="text-center py-12 bg-card border border-dashed border-border rounded-xl text-muted-foreground">
              <Users size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Sin inscriptos confirmados</p>
              <p className="text-xs mt-1 text-muted-foreground/60">
                Los miembros se inscriben desde la Agenda o el Inicio.
              </p>
            </div>
          ) : (
            attendees.map(attendee => (
              <div key={attendee.userId}
                className={`bg-card border rounded-xl p-3 flex items-center gap-3 ${
                  attendee.status ? 'border-border' : 'border-dashed border-border'
                }`}>
                <Avatar className="h-9 w-9 shrink-0">
                  {attendee.avatarUrl && <AvatarImage src={attendee.avatarUrl} />}
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                    {attendee.fullName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{attendee.fullName}</p>
                  {attendee.status && (
                    <span className={`text-xs ${
                      attendee.status === 'present' ? 'text-secondary'
                      : attendee.status === 'late' ? 'text-accent'
                      : 'text-destructive'
                    }`}>
                      {attendee.status === 'present' ? '✓ Presente'
                       : attendee.status === 'late' ? '⏱ Tarde'
                       : '✕ Ausente'}
                    </span>
                  )}
                </div>

                <div className="flex gap-1 shrink-0">
                  {(['present', 'late', 'absent'] as const).map(s => (
                    <button key={s}
                      onClick={() => markAttendance.mutate({
                        userId: attendee.userId, status: s, current: attendee.status,
                      })}
                      className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                        attendee.status === s
                          ? s === 'present' ? 'bg-secondary/20 border-secondary text-secondary scale-110'
                            : s === 'late' ? 'bg-accent/20 border-accent text-accent scale-110'
                            : 'bg-destructive/20 border-destructive text-destructive scale-110'
                          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      }`}>
                      {s === 'present' ? <Check size={13} />
                       : s === 'late' ? <Clock size={13} />
                       : <X size={13} />}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* ── RUTINAS ────────────────────────────────────────────── */}
        <TabsContent value="routines" className="mt-4 space-y-2">
          {!assignedRoutines?.length ? (
            <div className="text-center py-12 bg-card border border-dashed border-border rounded-xl text-muted-foreground">
              <ListChecks size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Sin rutinas asignadas a esta sesión</p>
              <p className="text-xs mt-1 text-muted-foreground/60">
                Asignalas desde la sección Rutinas → ⚡ Asignar a sesión
              </p>
            </div>
          ) : (
            assignedRoutines.map((a: any) => {
              const r = a.routines;
              if (!r) return null;
              return (
                <div key={a.id}
                  className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.type} · {r.level} · {r.estimated_minutes} min
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="text-xs h-7 gap-1"
                      onClick={() => navigate(`/rutinas/${r.id}`)}>
                      Ver detalle <ChevronRight size={11} />
                    </Button>
                    <Button variant="ghost" size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeRoutine.mutate(a.id)}>
                      <X size={13} />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        {/* ── NOTAS ──────────────────────────────────────────────── */}
        <TabsContent value="notes" className="mt-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground">Observaciones del coach</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Notas privadas — solo vos las ves. Desempeño del grupo, clima, equipamiento, etc.
              </p>
            </div>
            <Textarea
              placeholder="Ej: El grupo llegó con muy buena energía. Los sprints finales costaron más de lo esperado. Próxima vez aumentar 50m. Sofia destacó en la parte de core."
              value={observations}
              onChange={e => setObservations(e.target.value)}
              rows={7}
              className="resize-none bg-background"
            />
            <Button onClick={handleSaveObservations} disabled={savingObs} className="gap-2">
              {savingObs
                ? <Loader2 size={14} className="animate-spin" />
                : <Save size={14} />}
              Guardar notas
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}