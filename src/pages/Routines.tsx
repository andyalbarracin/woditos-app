/**
 * Archivo: Routines.tsx
 * Ruta: src/pages/Routines.tsx
 * Última modificación: 2026-04-12
 * Descripción: Página principal del módulo de rutinas.
 *   Coach: lista rutinas, crea nuevas, asigna a sesiones con CalendarWidget.
 *   Alumno: ve rutinas asignadas, marca como completadas con RoutineLogModal
 *           (modal detallado con feeling, RPE, tiempo, log por ejercicio).
 *   v2.3: usa RoutineLogModal en lugar de RoutineFeedbackModal para el botón
 *         "Completar" — mismo modal que "Registrar resultado" en RoutineDetail.
 *         Pasa assigned_by para notificar al coach al completar.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Plus, ListChecks, Clock, Target, ChevronRight,
  Zap, Loader2, ClipboardList, Calendar as CalendarIcon, X,
  CheckCircle2, History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarWidget } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ROUTINE_TYPES, ROUTINE_LEVELS } from '@/lib/exerciseTranslations';
import RoutineLogModal from '@/components/routines/RoutineLogModal';

const db = supabase as any;

interface Routine {
  id: string; name: string; type: string; level: string;
  estimated_minutes: number; description: string | null;
  created_at: string; routine_exercises: { id: string }[];
}
interface SessionOption { id: string; title: string; start_time: string; }
interface Assignment {
  id: string; status: string; assigned_at: string;
  assigned_by: string | null;
  routines: {
    id: string; name: string; type: string; estimated_minutes: number; level: string;
    routine_exercises: { id: string; exercise_name: string; sets: number | null; reps: number | null; weight_kg: number | null }[];
  };
}
interface RoutineResult {
  id: string; feeling: number; rpe: number; notes: string | null;
  completed_at: string; total_time_seconds: number | null;
  routines: { id: string; name: string; type: string; estimated_minutes: number };
}

const TYPE_LABEL: Record<string, string> = Object.fromEntries(ROUTINE_TYPES.map(t => [t.value, t.label]));
const LEVEL_LABEL: Record<string, string> = Object.fromEntries(ROUTINE_LEVELS.map(l => [l.value, l.label]));
const LEVEL_COLOR: Record<string, string> = {
  beginner:     'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  advanced:     'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};
const FEELING_EMOJI: Record<number, string> = { 1: '😓', 2: '😐', 3: '😐', 4: '😊', 5: '🔥' };
const RPE_COLOR = (rpe: number) => rpe <= 4 ? 'text-secondary' : rpe <= 7 ? 'text-accent' : 'text-destructive';

export default function Routines() {
  const navigate = useNavigate();
  const { user, profile, clubMembership } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const role    = user?.role as string | undefined;
  const isCoach = role === 'coach' || role === 'super_admin' || role === 'club_admin';
  const clubId  = clubMembership?.club_id;

  const [assignDialog, setAssignDialog]       = useState<{ routineId: string; name: string } | null>(null);
  const [calendarDay, setCalendarDay]         = useState<Date>(new Date());
  const [selectedSession, setSelectedSession] = useState('');
  const [activeTab, setActiveTab]             = useState<'assigned' | 'history'>('assigned');

  // Target para el RoutineLogModal (reemplaza RoutineFeedbackModal)
  const [logTarget, setLogTarget] = useState<{
    assignmentId: string;
    routineId: string;
    routineName: string;
    assignedBy: string | null;
    exercises: Assignment['routines']['routine_exercises'];
  } | null>(null);

  // ── Rutinas del coach ─────────────────────────────────────────
  const routinesQuery = useQuery<Routine[]>({
    queryKey: ['routines', clubId],
    queryFn: async () => {
      const { data, error } = await db
        .from('routines').select('*, routine_exercises(id)')
        .eq('club_id', clubId).eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!clubId && isCoach,
  });

  // ── Sesiones del mes ──────────────────────────────────────────
  const monthSessionsQuery = useQuery({
    queryKey: ['routines-month-sessions', calendarDay.getMonth(), calendarDay.getFullYear(), user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('sessions')
        .select('id, start_time').eq('coach_id', user!.id)
        .gte('start_time', startOfMonth(calendarDay).toISOString())
        .lte('start_time', endOfMonth(calendarDay).toISOString());
      return data ?? [];
    },
    enabled: !!user?.id && isCoach && !!assignDialog,
  });

  const daysWithSessions = useMemo(() =>
    (monthSessionsQuery.data ?? []).map((s: any) => new Date(s.start_time)),
  [monthSessionsQuery.data]);

  // ── Sesiones del día ──────────────────────────────────────────
  const daySessionsQuery = useQuery<SessionOption[]>({
    queryKey: ['routines-day-sessions', calendarDay.toDateString(), user?.id],
    queryFn: async () => {
      const dayStart = new Date(calendarDay); dayStart.setHours(0,0,0,0);
      const dayEnd   = new Date(dayStart);    dayEnd.setDate(dayEnd.getDate() + 1);
      const { data } = await supabase.from('sessions')
        .select('id, title, start_time').eq('coach_id', user!.id)
        .gte('start_time', dayStart.toISOString()).lt('start_time', dayEnd.toISOString())
        .order('start_time');
      return (data ?? []) as SessionOption[];
    },
    enabled: !!user?.id && isCoach && !!assignDialog,
  });

  // ── Chips de asignaciones a sesiones ─────────────────────────
  const routineIds = useMemo(() =>
    (routinesQuery.data ?? []).map(r => r.id), [routinesQuery.data]);

  const assignmentsQuery = useQuery({
    queryKey: ['routine-session-assignments-page', routineIds.join(',')],
    queryFn: async () => {
      if (!routineIds.length) return [];
      const { data } = await db
        .from('routine_assignments')
        .select('id, routine_id, session_id, sessions(id, title, start_time)')
        .in('routine_id', routineIds).not('session_id', 'is', null);
      return data ?? [];
    },
    enabled: routineIds.length > 0 && isCoach,
  });

  const assignmentsByRoutine = useMemo(() => {
    const map: Record<string, any[]> = {};
    (assignmentsQuery.data ?? []).forEach((a: any) => {
      if (!map[a.routine_id]) map[a.routine_id] = [];
      map[a.routine_id].push(a);
    });
    return map;
  }, [assignmentsQuery.data]);

  // ── Alumno: rutinas pendientes (incluye ejercicios para el modal) ──
  const assignedQuery = useQuery<Assignment[]>({
    queryKey: ['my-assignments', user?.id],
    queryFn: async () => {
      const { data, error } = await db
        .from('routine_assignments')
        .select(`
          id, status, assigned_at, assigned_by,
          routines(
            id, name, type, estimated_minutes, level,
            routine_exercises(id, exercise_name, sets, reps, weight_kg)
          )
        `)
        .eq('assigned_to', user!.id)
        .eq('status', 'pending')
        .is('session_id', null)
        .order('assigned_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id && !isCoach,
  });

  // ── Alumno: historial ─────────────────────────────────────────
  const historyQuery = useQuery<RoutineResult[]>({
    queryKey: ['my-routine-results', user?.id],
    queryFn: async () => {
      const { data, error } = await db
        .from('routine_results')
        .select('id, feeling, rpe, notes, completed_at, total_time_seconds, routines(id, name, type, estimated_minutes)')
        .eq('user_id', user!.id)
        .order('completed_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id && !isCoach && activeTab === 'history',
  });

  // ── Asignar rutina a sesión ───────────────────────────────────
  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSession || !assignDialog || !user?.id) throw new Error('Faltan datos');
      const { error } = await db.from('routine_assignments').insert({
        routine_id: assignDialog.routineId, session_id: selectedSession,
        assigned_by: user.id, status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Rutina asignada a la sesión' });
      qc.invalidateQueries({ queryKey: ['routine-session-assignments-page'] });
      qc.invalidateQueries({ queryKey: ['session-routines'] });
      setAssignDialog(null); setSelectedSession('');
    },
    onError: (err: Error) =>
      toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const removeAssignment = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await db.from('routine_assignments').delete().eq('id', assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routine-session-assignments-page'] });
      qc.invalidateQueries({ queryKey: ['session-routines'] });
      toast({ title: 'Asignación eliminada' });
    },
  });

  // ─── Vista Coach ──────────────────────────────────────────────
  if (isCoach) return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <ListChecks className="h-5 w-5" /> Rutinas
          </h1>
          <p className="text-sm text-muted-foreground">
            {routinesQuery.data?.length ?? 0} rutina{routinesQuery.data?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => navigate('/rutinas/nueva')}>
          <Plus className="h-4 w-4 mr-2" /> Nueva
        </Button>
      </div>

      {routinesQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : routinesQuery.data?.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground space-y-3">
          <ClipboardList className="h-10 w-10 mx-auto opacity-30" />
          <p className="text-sm">Todavía no creaste ninguna rutina.</p>
          <Button variant="outline" onClick={() => navigate('/rutinas/nueva')}>
            <Plus className="h-4 w-4 mr-2" /> Crear primera rutina
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {routinesQuery.data?.map(r => {
            const sessionAssignments = assignmentsByRoutine[r.id] ?? [];
            return (
              <div key={r.id} className="rounded-xl border bg-card hover:shadow-sm transition-shadow">
                <div className="p-4 cursor-pointer" onClick={() => navigate(`/rutinas/${r.id}`)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{r.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="secondary" className="text-xs">{TYPE_LABEL[r.type] ?? r.type}</Badge>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${LEVEL_COLOR[r.level]}`}>
                          {LEVEL_LABEL[r.level] ?? r.level}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" /> {r.routine_exercises?.length ?? 0} ejercicios
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {r.estimated_minutes} min
                    </span>
                  </div>
                </div>

                {sessionAssignments.length > 0 && (
                  <div className="px-4 pb-2.5 flex flex-wrap gap-1.5">
                    <span className="text-xs text-muted-foreground w-full -mb-0.5">Asignada a:</span>
                    {sessionAssignments.map((a: any) => (
                      <div key={a.id}
                        className="flex items-center gap-1.5 bg-primary/5 border border-primary/15 text-xs px-2.5 py-1 rounded-full">
                        <CalendarIcon className="h-3 w-3 text-primary/60 shrink-0" />
                        <span className="text-foreground/80 max-w-[110px] truncate">
                          {a.sessions?.title ?? '—'}
                        </span>
                        {a.sessions?.start_time && (
                          <span className="text-muted-foreground shrink-0">
                            {format(new Date(a.sessions.start_time), 'd/M HH:mm', { locale: es })}
                          </span>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); removeAssignment.mutate(a.id); }}
                          className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t px-4 py-2 flex gap-2">
                  <Button size="sm" variant="ghost" className="text-xs h-7"
                    onClick={() => navigate(`/rutinas/${r.id}/editar`)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs h-7 text-primary"
                    onClick={() => {
                      setCalendarDay(new Date()); setSelectedSession('');
                      setAssignDialog({ routineId: r.id, name: r.name });
                    }}>
                    <Zap className="h-3 w-3 mr-1" /> Asignar a sesión
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog asignación */}
      <Dialog open={!!assignDialog} onOpenChange={v => !v && setAssignDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Asignar a sesión</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground truncate -mt-2">{assignDialog?.name}</p>
          <div className="rounded-xl border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2">Elegí un día</p>
            <CalendarWidget
              mode="single" selected={calendarDay} locale={es}
              onSelect={d => { if (d) { setCalendarDay(d); setSelectedSession(''); } }}
              className="rounded-md border-0 pointer-events-auto w-full"
              classNames={{
                months: "flex flex-col w-full", month: "space-y-2 w-full",
                table: "w-full border-collapse", head_row: "flex w-full",
                head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-[0.7rem] text-center",
                row: "flex w-full mt-1",
                cell: "flex-1 h-8 text-center text-sm p-0 relative",
                day: "h-8 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-muted rounded-md transition-colors text-sm",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary",
                day_today: "bg-accent/20 text-accent font-bold",
                day_outside: "text-muted-foreground opacity-40",
                nav: "space-x-1 flex items-center",
                nav_button: "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100 border border-border rounded-md inline-flex items-center justify-center",
                nav_button_previous: "absolute left-1", nav_button_next: "absolute right-1",
                caption: "flex justify-center pt-1 relative items-center mb-1",
                caption_label: "text-xs font-medium",
              }}
              modifiers={{ hasSessions: daysWithSessions }}
              modifiersClassNames={{ hasSessions: 'font-bold after:block after:w-1 after:h-1 after:rounded-full after:bg-primary after:mx-auto' }}
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Sesiones del {format(calendarDay, "d 'de' MMMM", { locale: es })}
            </p>
            {daySessionsQuery.isLoading ? (
              <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
            ) : daySessionsQuery.data?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3 border border-dashed rounded-lg">
                No hay sesiones este día
              </p>
            ) : (
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger><SelectValue placeholder="Elegí una sesión…" /></SelectTrigger>
                <SelectContent>
                  {daySessionsQuery.data?.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {format(new Date(s.start_time), 'HH:mm')} · {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setAssignDialog(null)}>Cancelar</Button>
            <Button className="flex-1" disabled={!selectedSession || assignMutation.isPending}
              onClick={() => assignMutation.mutate()}>
              {assignMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Asignar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  // ─── Vista Alumno ─────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-xl font-semibold flex items-center gap-2">
        <ListChecks className="h-5 w-5" /> Mis Rutinas
      </h1>

      <div className="flex rounded-lg border overflow-hidden">
        <button onClick={() => setActiveTab('assigned')}
          className={`flex-1 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'assigned' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}>
          <ListChecks className="h-3.5 w-3.5" />
          Pendientes
          {(assignedQuery.data?.length ?? 0) > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === 'assigned'
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-primary/15 text-primary'
            }`}>{assignedQuery.data?.length}</span>
          )}
        </button>
        <button onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'history' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}>
          <History className="h-3.5 w-3.5" />
          Completadas
        </button>
      </div>

      {/* Tab: Pendientes */}
      {activeTab === 'assigned' && (
        <>
          {assignedQuery.isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : assignedQuery.data?.length === 0 ? (
            <div className="text-center py-14 text-muted-foreground">
              <ClipboardList className="h-10 w-10 mx-auto opacity-30 mb-3" />
              <p className="text-sm">No tenés rutinas pendientes.</p>
              <p className="text-xs mt-1">Tu coach te asignará rutinas para hacer.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedQuery.data?.map(a => (
                <div key={a.id} className="rounded-xl border bg-card overflow-hidden">
                  <div className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => navigate(`/rutinas/${a.routines.id}`)}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{a.routines.name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {TYPE_LABEL[a.routines.type] ?? a.routines.type}
                          </Badge>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${LEVEL_COLOR[a.routines.level]}`}>
                            {LEVEL_LABEL[a.routines.level] ?? a.routines.level}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {a.routines.estimated_minutes} min
                          </span>
                          <span>Asignada {format(new Date(a.assigned_at), "d 'de' MMMM", { locale: es })}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </div>
                  <div className="border-t px-4 py-2.5 flex gap-2">
                    <Button size="sm" variant="ghost" className="text-xs h-7"
                      onClick={() => navigate(`/rutinas/${a.routines.id}`)}>
                      Ver ejercicios
                    </Button>
                    <Button size="sm"
                      className="text-xs h-7 gradient-primary text-primary-foreground gap-1 ml-auto"
                      onClick={() => setLogTarget({
                        assignmentId: a.id,
                        routineId:    a.routines.id,
                        routineName:  a.routines.name,
                        assignedBy:   a.assigned_by,
                        exercises:    a.routines.routine_exercises ?? [],
                      })}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Completar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab: Historial */}
      {activeTab === 'history' && (
        <>
          {historyQuery.isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : historyQuery.data?.length === 0 ? (
            <div className="text-center py-14 text-muted-foreground">
              <History className="h-10 w-10 mx-auto opacity-30 mb-3" />
              <p className="text-sm">Completá una rutina para ver tu historial acá.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyQuery.data?.map(r => {
                const minutes = r.total_time_seconds ? Math.round(r.total_time_seconds / 60) : null;
                return (
                  <div key={r.id}
                    className="rounded-xl border bg-card p-4 cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => navigate(`/rutinas/${r.routines.id}`)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{FEELING_EMOJI[r.feeling] || '😐'}</span>
                          <p className="font-medium truncate">{r.routines.name}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span>{TYPE_LABEL[r.routines.type] ?? r.routines.type}</span>
                          <span>·</span>
                          <span className={`font-medium ${RPE_COLOR(r.rpe)}`}>RPE {r.rpe}</span>
                          {minutes && <span>· {minutes} min</span>}
                        </div>
                        {r.notes && (
                          <p className="text-xs text-foreground/70 mt-1.5 italic line-clamp-2">"{r.notes}"</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(r.completed_at), "d MMM", { locale: es })}
                        </p>
                        <CheckCircle2 className="h-4 w-4 text-secondary mt-1 ml-auto" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* RoutineLogModal — modal detallado (mismo que en RoutineDetail) */}
      {logTarget && (
        <RoutineLogModal
          open={!!logTarget}
          onClose={() => setLogTarget(null)}
          routineId={logTarget.routineId}
          routineName={logTarget.routineName}
          exercises={logTarget.exercises}
          assignmentId={logTarget.assignmentId}
          assignedBy={logTarget.assignedBy}
          memberName={profile?.full_name}
        />
      )}
    </div>
  );
}