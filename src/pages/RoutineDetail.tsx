/**
 * Archivo: RoutineDetail.tsx
 * Ruta: src/pages/RoutineDetail.tsx
 * Última modificación: 2026-04-12
 * Descripción: Vista detallada de una rutina.
 *   Coach: estadísticas vía RPC. Ambos roles: ejercicios con GIF.
 *   Miembro: botón sticky para registrar resultado.
 *   v2.1: cada ejercicio tiene botón "Ver en Wiki" si tiene exercise_db_id.
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Clock, Target, ChevronRight, Loader2,
  BarChart3, CheckCircle2, Edit, Dumbbell, BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ROUTINE_TYPES, ROUTINE_LEVELS } from '@/lib/exerciseTranslations';
import RoutineLogModal from '@/components/routines/RoutineLogModal';

const db = supabase as any;

interface RoutineExercise {
  id: string;
  exercise_db_id: string | null;
  exercise_name: string;
  exercise_gif_url: string | null;
  exercise_body_part: string | null;
  sets: number | null;
  reps: number | null;
  duration_seconds: number | null;
  rest_seconds: number | null;
  weight_kg: number | null;
  notes: string | null;
  order_index: number;
}

interface RoutineData {
  id: string;
  name: string;
  description: string | null;
  type: string;
  level: string;
  estimated_minutes: number;
  coach_id: string;
  routine_exercises: RoutineExercise[];
}

interface RoutineStats {
  total_completions: number;
  avg_rpe: number | null;
  avg_time_minutes: number | null;
  avg_feeling: number | null;
}

const TYPE_LABEL: Record<string, string> = Object.fromEntries(ROUTINE_TYPES.map(t => [t.value, t.label]));
const LEVEL_LABEL: Record<string, string> = Object.fromEntries(ROUTINE_LEVELS.map(l => [l.value, l.label]));
const LEVEL_COLOR: Record<string, string> = {
  beginner:     'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  advanced:     'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

function formatSpec(ex: RoutineExercise): string {
  const parts: string[] = [];
  if (ex.sets)             parts.push(`${ex.sets} series`);
  if (ex.reps)             parts.push(`${ex.reps} reps`);
  if (ex.duration_seconds) parts.push(`${ex.duration_seconds}s`);
  if (ex.weight_kg)        parts.push(`${ex.weight_kg} kg`);
  if (ex.rest_seconds)     parts.push(`${ex.rest_seconds}s descanso`);
  return parts.join(' · ') || 'Sin especificación';
}

export default function RoutineDetail() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [expandedEx, setExpandedEx] = useState<Set<string>>(new Set());
  const [logOpen, setLogOpen]       = useState(false);
  const [imgErrors, setImgErrors]   = useState<Set<string>>(new Set());

  const role    = user?.role as string | undefined;
  const isCoach = role === 'coach' || role === 'super_admin' || role === 'club_admin';

  const detailQuery = useQuery<RoutineData>({
    queryKey: ['routine', id],
    queryFn: async () => {
      const { data, error } = await db
        .from('routines')
        .select('*, routine_exercises(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      const d = data as RoutineData;
      d.routine_exercises = (d.routine_exercises ?? []).sort(
        (a: RoutineExercise, b: RoutineExercise) => a.order_index - b.order_index
      );
      return d;
    },
    enabled: !!id,
  });

  const statsQuery = useQuery<RoutineStats>({
    queryKey: ['routine-stats', id],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_routine_stats', { p_routine_id: id });
      if (error) throw error;
      return data as RoutineStats;
    },
    enabled: !!id && isCoach,
  });

  if (detailQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const routine = detailQuery.data;
  if (!routine) return null;

  const toggleEx = (exId: string) =>
    setExpandedEx(prev => {
      const s = new Set(prev);
      s.has(exId) ? s.delete(exId) : s.add(exId);
      return s;
    });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/rutinas')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold truncate">{routine.name}</h1>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <Badge variant="secondary" className="text-xs">{TYPE_LABEL[routine.type] ?? routine.type}</Badge>
            <span className={`text-xs px-2 py-0.5 rounded-full ${LEVEL_COLOR[routine.level]}`}>
              {LEVEL_LABEL[routine.level] ?? routine.level}
            </span>
          </div>
        </div>
        {isCoach && (
          <Button variant="ghost" size="icon" onClick={() => navigate(`/rutinas/${id}/editar`)}>
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4" /> {routine.estimated_minutes} min
        </span>
        <span className="flex items-center gap-1">
          <Target className="h-4 w-4" />
          {routine.routine_exercises.length} ejercicio{routine.routine_exercises.length !== 1 ? 's' : ''}
        </span>
      </div>

      {routine.description && (
        <p className="text-sm text-muted-foreground leading-relaxed">{routine.description}</p>
      )}

      {/* Stats del coach */}
      {isCoach && statsQuery.data && statsQuery.data.total_completions > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">Estadísticas del club</h2>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold">{statsQuery.data.total_completions}</p>
              <p className="text-xs text-muted-foreground">Completadas</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{statsQuery.data.avg_rpe ?? '—'}</p>
              <p className="text-xs text-muted-foreground">RPE promedio</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {statsQuery.data.avg_time_minutes ? `${statsQuery.data.avg_time_minutes}m` : '—'}
              </p>
              <p className="text-xs text-muted-foreground">Tiempo prom.</p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de ejercicios */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Ejercicios</h2>
        {routine.routine_exercises.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm border rounded-xl">
            Esta rutina no tiene ejercicios cargados.
          </div>
        ) : (
          routine.routine_exercises.map((ex, idx) => {
            const isExpanded = expandedEx.has(ex.id);
            const imgFailed  = imgErrors.has(ex.id);
            return (
              <div key={ex.id} className="rounded-xl border bg-card overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/40 transition-colors"
                  onClick={() => toggleEx(ex.id)}>
                  <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                    {idx + 1}
                  </span>
                  <div className="h-10 w-10 shrink-0 rounded-md bg-muted overflow-hidden">
                    {ex.exercise_gif_url && !imgFailed ? (
                      <img src={ex.exercise_gif_url} alt={ex.exercise_name}
                        className="h-full w-full object-cover"
                        onError={() => setImgErrors(p => new Set(p).add(ex.id))}
                        loading="lazy" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Dumbbell className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ex.exercise_name}</p>
                    <p className="text-xs text-muted-foreground">{formatSpec(ex)}</p>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>

                {isExpanded && (
                  <div className="border-t px-4 py-3 space-y-3">
                    {ex.exercise_body_part && (
                      <p className="text-xs text-muted-foreground">
                        Zona: <span className="text-foreground">{ex.exercise_body_part}</span>
                      </p>
                    )}
                    {ex.notes && (
                      <div className="bg-muted/50 rounded-lg px-3 py-2">
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Nota del coach</p>
                        <p className="text-sm">{ex.notes}</p>
                      </div>
                    )}
                    {ex.exercise_gif_url && !imgFailed && (
                      <img src={ex.exercise_gif_url} alt={ex.exercise_name}
                        className="w-full max-w-xs mx-auto rounded-lg" />
                    )}
                    {/* Link a la Wiki — solo si tiene exercise_db_id */}
                    {ex.exercise_db_id && (
                      <button
                        onClick={() => navigate(`/biblioteca/libreria/${ex.exercise_db_id}`)}
                        className="flex items-center gap-2 text-xs text-primary hover:underline mt-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        Ver instrucciones completas en la Wiki
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* CTA miembro */}
      {!isCoach && routine.routine_exercises.length > 0 && (
        <div className="pt-4">
          <Button className="w-full shadow-lg" size="lg" onClick={() => setLogOpen(true)}>
            <CheckCircle2 className="h-5 w-5 mr-2" /> Registrar resultado
          </Button>
        </div>
      )}

      {logOpen && (
        <RoutineLogModal
          open={logOpen}
          onClose={() => setLogOpen(false)}
          routineId={routine.id}
          routineName={routine.name}
          exercises={routine.routine_exercises.map(e => ({
            id:            e.id,
            exercise_name: e.exercise_name,
            sets:          e.sets,
            reps:          e.reps,
            weight_kg:     e.weight_kg,
          }))}
        />
      )}
    </div>
  );
}