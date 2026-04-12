/**
 * Archivo: RoutineLogModal.tsx
 * Ruta: src/components/routines/RoutineLogModal.tsx
 * Última modificación: 2026-04-12
 * Descripción: Modal detallado para registrar resultado de una rutina.
 *   Feeling, RPE slider, tiempo total, log por ejercicio, notas.
 *   v2.0: acepta assignmentId opcional — si se pasa, marca el assignment
 *         como completado y notifica al coach (assigned_by).
 *         Usado tanto desde RoutineDetail (sin assignment) como desde
 *         Routines.tsx (con assignment, al completar una rutina asignada).
 */
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';

const db = supabase as any;

interface Exercise {
  id: string;
  exercise_name: string;
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
}

interface ExerciseLog {
  sets: string;
  reps: string;
  weight_kg: string;
}

interface RoutineLogModalProps {
  open: boolean;
  onClose: () => void;
  routineId: string;
  routineName: string;
  exercises: Exercise[];
  // Opcionales — presentes cuando se completa una asignación directa
  assignmentId?: string | null;
  assignedBy?: string | null;    // user_id del coach para notificación
  memberName?: string | null;    // nombre del alumno para la notificación
}

const FEELINGS = [
  { value: 1, emoji: '😓', label: 'Muy difícil' },
  { value: 2, emoji: '😐', label: 'Difícil' },
  { value: 3, emoji: '😐', label: 'Normal' },
  { value: 4, emoji: '😊', label: 'Bien' },
  { value: 5, emoji: '🔥', label: '¡Excelente!' },
];

const FEELING_LABEL: Record<number, string> = {
  1: 'Muy difícil', 2: 'Difícil', 3: 'Normal', 4: 'Bien', 5: '¡Excelente!',
};
const RPE_LABEL_SHORT: Record<number, string> = {
  1: 'Muy fácil', 3: 'Fácil', 5: 'Moderado', 7: 'Duro', 9: 'Muy duro', 10: 'Máximo',
};

function getRpeLabel(value: number): string {
  if (value <= 2) return 'Muy fácil';
  if (value <= 4) return 'Fácil';
  if (value <= 6) return 'Moderado';
  if (value <= 8) return 'Duro';
  return 'Máximo esfuerzo';
}

export default function RoutineLogModal({
  open, onClose, routineId, routineName, exercises,
  assignmentId, assignedBy, memberName,
}: RoutineLogModalProps) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const [feeling, setFeeling]     = useState<number | null>(null);
  const [rpe, setRpe]             = useState<number>(5);
  const [totalMinutes, setTotalMinutes] = useState('');
  const [notes, setNotes]         = useState('');
  const [saving, setSaving]       = useState(false);
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, ExerciseLog>>(
    Object.fromEntries(exercises.map(e => [e.id, {
      sets:      e.sets?.toString()      ?? '',
      reps:      e.reps?.toString()      ?? '',
      weight_kg: e.weight_kg?.toString() ?? '',
    }]))
  );

  const updateExLog = (exId: string, field: keyof ExerciseLog, value: string) =>
    setExerciseLogs(p => ({ ...p, [exId]: { ...p[exId], [field]: value } }));

  const handleSave = async () => {
    if (!feeling) { toast.error('Seleccioná cómo te fue'); return; }
    if (!user?.id) return;
    setSaving(true);

    try {
      const totalSeconds = totalMinutes ? Math.round(parseFloat(totalMinutes) * 60) : null;

      // 1. Guardar resultado de la rutina
      const { error: resultError } = await db.from('routine_results').insert({
        routine_id:          routineId,
        assignment_id:       assignmentId || null,
        user_id:             user.id,
        feeling,
        rpe,
        total_time_seconds:  totalSeconds,
        notes:               notes.trim() || null,
        completed_at:        new Date().toISOString(),
      });
      if (resultError) throw resultError;

      // 2. Si es una asignación directa, marcarla como completada
      if (assignmentId) {
        const { error: assignError } = await db
          .from('routine_assignments')
          .update({ status: 'completed' })
          .eq('id', assignmentId);
        if (assignError) throw assignError;
      }

      // 3. Notificar al coach si corresponde
      if (assignedBy && assignedBy !== user.id && assignmentId) {
        const alumno    = memberName || profile?.full_name || 'Un alumno';
        const feelLabel = FEELING_LABEL[feeling] || '';
        const rpeLabel  = getRpeLabel(rpe);
        const timeStr   = totalMinutes ? ` · ${totalMinutes} min` : '';
        await supabase.from('notifications').insert({
          user_id: assignedBy,
          title:   '✅ Rutina completada',
          message: `${alumno} completó "${routineName}" — ${feelLabel}, RPE ${rpe} (${rpeLabel})${timeStr}${notes.trim() ? ` · "${notes.trim()}"` : ''}`,
          type:    'routine',
        });
      }

      // 4. Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: ['my-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['my-routine-results'] });
      queryClient.invalidateQueries({ queryKey: ['routine-completions'] });
      queryClient.invalidateQueries({ queryKey: ['member-routine-stats'] });

      toast.success('¡Resultado guardado! 💪');
      onClose();
    } catch (err: any) {
      toast.error('No se pudo guardar: ' + (err?.message || 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Registrar: {routineName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">

          {/* Feeling */}
          <div>
            <p className="text-sm font-medium mb-3">¿Cómo te fue?</p>
            <div className="flex justify-between gap-1">
              {FEELINGS.map(f => (
                <button key={f.value} onClick={() => setFeeling(f.value)}
                  className={`flex flex-col items-center gap-1 flex-1 p-2 rounded-xl border transition-all ${
                    feeling === f.value
                      ? 'border-primary bg-primary/10 scale-105'
                      : 'border-border hover:border-primary/40'
                  }`}>
                  <span className="text-2xl">{f.emoji}</span>
                  <span className="text-[9px] text-muted-foreground text-center leading-tight">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* RPE slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Esfuerzo percibido (RPE)</p>
              <span className="text-lg font-bold text-primary">{rpe}</span>
            </div>
            <Slider
              value={[rpe]}
              onValueChange={([v]) => setRpe(v)}
              min={1} max={10} step={1}
              className="my-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Muy fácil</span>
              <span className="font-medium text-foreground">{getRpeLabel(rpe)}</span>
              <span>Máximo esfuerzo</span>
            </div>
          </div>

          {/* Tiempo total */}
          <div>
            <Label className="text-sm">Tiempo total (minutos)</Label>
            <Input
              type="number"
              placeholder="Ej: 35"
              value={totalMinutes}
              onChange={e => setTotalMinutes(e.target.value)}
              className="bg-background border-border mt-1"
              min={1} max={300}
            />
          </div>

          {/* Log por ejercicio */}
          {exercises.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Log por ejercicio (opcional)</p>
              <div className="space-y-2">
                {exercises.map(ex => {
                  const log = exerciseLogs[ex.id] ?? { sets: '', reps: '', weight_kg: '' };
                  return (
                    <div key={ex.id} className="bg-muted/40 rounded-xl p-3">
                      <p className="text-sm font-medium text-foreground mb-2">{ex.exercise_name}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { field: 'sets' as const,      label: 'Series' },
                          { field: 'reps' as const,      label: 'Reps' },
                          { field: 'weight_kg' as const, label: 'Kg' },
                        ].map(({ field, label }) => (
                          <div key={field}>
                            <p className="text-xs text-muted-foreground mb-1">{label}</p>
                            <Input
                              type="number"
                              value={log[field]}
                              onChange={e => updateExLog(ex.id, field, e.target.value)}
                              placeholder="—"
                              className="bg-background border-border text-sm h-8"
                              min={0}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notas */}
          <div>
            <Label className="text-sm">Notas (opcional)</Label>
            <Textarea
              placeholder="Cómo te sentiste, qué mejorar..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="bg-background border-border resize-none mt-1"
              rows={3}
              maxLength={400}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              className="flex-1 gradient-primary text-primary-foreground gap-2"
              onClick={handleSave}
              disabled={saving || !feeling}>
              <CheckCircle2 size={16} />
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}