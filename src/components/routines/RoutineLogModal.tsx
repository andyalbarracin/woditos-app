/**
 * Archivo: RoutineLogModal.tsx
 * Ruta: src/components/routines/RoutineLogModal.tsx
 * Última modificación: 2026-04-03
 * Descripción: Modal para registrar resultado de una rutina completada.
 *   Usa `db` (supabase as any) para tablas v2 hasta regenerar tipos.
 */

import { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';

const db = supabase as any;

interface ExerciseLog {
  routineExerciseId: string;
  exerciseName: string;
  setsCompleted: number | '';
  repsCompleted: number | '';
  weightUsedKg: number | '';
  notes: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  routineId: string;
  routineName: string;
  sessionId?: string;
  assignmentId?: string;
  exercises: {
    id: string;
    exercise_name: string;
    sets: number | null;
    reps: number | null;
    weight_kg: number | null;
  }[];
}

const FEELING_EMOJIS = ['😓', '😕', '😐', '😊', '🔥'];
const FEELING_LABELS = ['Muy difícil', 'Difícil', 'Normal', 'Bien', '¡Excelente!'];

export default function RoutineLogModal({
  open, onClose, routineId, routineName, sessionId, assignmentId, exercises,
}: Props) {
  const { user }  = useAuth();
  const { toast } = useToast();
  const qc        = useQueryClient();

  const [feeling, setFeeling]           = useState(3);
  const [rpe, setRpe]                   = useState(7);
  const [totalMinutes, setTotalMinutes] = useState<number | ''>('');
  const [notes, setNotes]               = useState('');
  const [exLogs, setExLogs]             = useState<ExerciseLog[]>(
    exercises.map(e => ({
      routineExerciseId: e.id,
      exerciseName:      e.exercise_name,
      setsCompleted:     e.sets ?? '',
      repsCompleted:     e.reps ?? '',
      weightUsedKg:      e.weight_kg ?? '',
      notes:             '',
    }))
  );

  const updateExLog = (idx: number, patch: Partial<ExerciseLog>) =>
    setExLogs(prev => prev.map((e, i) => i === idx ? { ...e, ...patch } : e));

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No autenticado');

      const { data: result, error: resErr } = await db
        .from('routine_results')
        .insert({
          routine_id:         routineId,
          assignment_id:      assignmentId ?? null,
          user_id:            user.id,
          session_id:         sessionId ?? null,
          feeling,
          rpe,
          total_time_seconds: totalMinutes !== '' ? Number(totalMinutes) * 60 : null,
          notes:              notes.trim() || null,
        })
        .select('id').single();
      if (resErr) throw resErr;

      const resultId = result.id;

      const exPayload = exLogs
        .filter(e => e.setsCompleted !== '' || e.repsCompleted !== '' || e.weightUsedKg !== '')
        .map(e => ({
          routine_result_id:   resultId,
          routine_exercise_id: e.routineExerciseId,
          exercise_name:       e.exerciseName,
          sets_completed:      e.setsCompleted !== '' ? Number(e.setsCompleted) : null,
          reps_completed:      e.repsCompleted !== '' ? Number(e.repsCompleted) : null,
          weight_used_kg:      e.weightUsedKg !== '' ? Number(e.weightUsedKg) : null,
          notes:               e.notes || null,
        }));

      if (exPayload.length > 0) {
        const { error } = await db.from('exercise_results').insert(exPayload);
        if (error) throw error;
      }

      if (assignmentId) {
        await db.from('routine_assignments').update({ status: 'completed' }).eq('id', assignmentId);
      }
    },
    onSuccess: () => {
      toast({ title: '¡Rutina registrada!', description: FEELING_LABELS[feeling - 1] });
      qc.invalidateQueries({ queryKey: ['routine-results'] });
      qc.invalidateQueries({ queryKey: ['my-assignments'] });
      onClose();
    },
    onError: (err: Error) =>
      toast({ title: 'Error al guardar', description: err.message, variant: 'destructive' }),
  });

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md flex flex-col p-0 gap-0 h-[88vh]">
        <DialogHeader className="px-4 pt-4 pb-3 border-b shrink-0">
          <DialogTitle className="text-base font-semibold truncate">
            Registrar: {routineName}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4">
          <div className="py-4 space-y-6">
            {/* Feeling */}
            <div>
              <Label className="text-sm font-medium">¿Cómo te fue?</Label>
              <div className="flex gap-2 mt-2 justify-between">
                {FEELING_EMOJIS.map((emoji, i) => (
                  <button key={i} onClick={() => setFeeling(i + 1)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg flex-1 transition-all ${
                      feeling === i + 1 ? 'bg-primary/10 ring-2 ring-primary scale-105' : 'hover:bg-muted'
                    }`}>
                    <span className="text-2xl">{emoji}</span>
                    <span className="text-[10px] text-muted-foreground text-center leading-tight">
                      {FEELING_LABELS[i]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* RPE */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-sm font-medium">Esfuerzo percibido (RPE)</Label>
                <span className="text-2xl font-bold text-primary">{rpe}</span>
              </div>
              <Slider value={[rpe]} onValueChange={([v]) => setRpe(v)} min={1} max={10} step={1} />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Muy fácil</span><span>Máximo esfuerzo</span>
              </div>
            </div>

            {/* Tiempo */}
            <div>
              <Label className="text-sm font-medium">Tiempo total (minutos)</Label>
              <Input type="number" min={1} placeholder="Ej: 35" value={totalMinutes}
                onChange={e => setTotalMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                className="mt-1" />
            </div>

            {/* Log por ejercicio */}
            {exLogs.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Log por ejercicio (opcional)</Label>
                <div className="space-y-3 mt-2">
                  {exLogs.map((ex, idx) => (
                    <div key={ex.routineExerciseId} className="rounded-lg border p-3 space-y-2">
                      <p className="text-sm font-medium">{ex.exerciseName}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Series', key: 'setsCompleted' as const },
                          { label: 'Reps',   key: 'repsCompleted' as const },
                          { label: 'Kg',     key: 'weightUsedKg'  as const },
                        ].map(f => (
                          <div key={f.key}>
                            <Label className="text-xs text-muted-foreground">{f.label}</Label>
                            <Input type="number" min={0} placeholder="—"
                              value={ex[f.key]}
                              onChange={e => updateExLog(idx, {
                                [f.key]: e.target.value === '' ? '' : Number(e.target.value),
                              })}
                              className="h-7 text-sm mt-0.5" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notas */}
            <div>
              <Label className="text-sm font-medium">Notas (opcional)</Label>
              <Textarea placeholder="Cómo te sentiste, qué mejorar…"
                value={notes} onChange={e => setNotes(e.target.value)}
                rows={2} className="mt-1 resize-none" />
            </div>
          </div>
        </ScrollArea>

        <div className="px-4 py-3 border-t shrink-0 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending
              ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
              : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}