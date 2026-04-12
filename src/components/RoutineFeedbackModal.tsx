/**
 * Archivo: RoutineFeedbackModal.tsx
 * Ruta: src/components/RoutineFeedbackModal.tsx
 * Última modificación: 2026-04-12
 * Descripción: Modal de feedback post-rutina para alumnos.
 *   Mismo estilo que SessionFeedbackModal.
 *   Al enviar: inserta en routine_results, marca assignment como completado
 *   y envía notificación al coach que asignó la rutina.
 *   v1.1: prop assignedBy para notificar al coach.
 */
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const db = supabase as any;

interface RoutineFeedbackModalProps {
  open: boolean;
  onClose: () => void;
  routineId: string;
  routineName: string;
  assignmentId: string;
  assignedBy?: string | null;   // user_id del coach — para enviar notificación
  memberName?: string | null;   // nombre del alumno para la notificación
}

const FEELINGS = [
  { value: 1, emoji: '😞', label: 'Muy mal' },
  { value: 2, emoji: '😕', label: 'Mal' },
  { value: 3, emoji: '😐', label: 'Regular' },
  { value: 4, emoji: '😊', label: 'Bien' },
  { value: 5, emoji: '🤩', label: 'Excelente' },
];

const RPE_OPTIONS = [
  { value: 3, emoji: '🟢', label: 'Fácil',    sub: 'Podría hacer más' },
  { value: 6, emoji: '🟡', label: 'Moderado', sub: 'Esfuerzo justo' },
  { value: 9, emoji: '🔴', label: 'Duro',     sub: 'Al límite' },
];

const FEELING_LABEL: Record<number, string> = { 1: 'Muy mal', 2: 'Mal', 3: 'Regular', 4: 'Bien', 5: 'Excelente' };
const RPE_LABEL: Record<number, string>     = { 3: 'Fácil', 6: 'Moderado', 9: 'Duro' };

export default function RoutineFeedbackModal({
  open, onClose, routineId, routineName, assignmentId, assignedBy, memberName,
}: RoutineFeedbackModalProps) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const [step, setStep]       = useState<'feeling' | 'rpe' | 'notes'>('feeling');
  const [feeling, setFeeling] = useState<number | null>(null);
  const [rpe, setRpe]         = useState<number | null>(null);
  const [notes, setNotes]     = useState('');
  const [saving, setSaving]   = useState(false);

  const handleFeeling = (value: number) => {
    setFeeling(value);
    setStep('rpe');
  };

  const handleRpe = (value: number) => {
    setRpe(value);
    setStep('notes');
  };

  const handleSubmit = async () => {
    if (!feeling || !rpe || !user?.id) return;
    setSaving(true);

    try {
      // 1. Insertar resultado de la rutina
      const { error: resultError } = await db.from('routine_results').insert({
        routine_id:    routineId,
        assignment_id: assignmentId,
        user_id:       user.id,
        feeling,
        rpe,
        notes:         notes.trim() || null,
        completed_at:  new Date().toISOString(),
      });
      if (resultError) throw resultError;

      // 2. Marcar el assignment como completado
      const { error: assignError } = await db
        .from('routine_assignments')
        .update({ status: 'completed' })
        .eq('id', assignmentId);
      if (assignError) throw assignError;

      // 3. Notificar al coach si hay assignedBy
      if (assignedBy && assignedBy !== user.id) {
        const alumnoNombre = memberName || profile?.full_name || 'Un alumno';
        const feelingText  = FEELING_LABEL[feeling] || '';
        const rpeText      = RPE_LABEL[rpe] || '';
        await supabase.from('notifications').insert({
          user_id: assignedBy,
          title:   `✅ Rutina completada`,
          message: `${alumnoNombre} completó "${routineName}" — Sensación: ${feelingText}, Esfuerzo: ${rpeText}${notes.trim() ? ` · "${notes.trim()}"` : ''}`,
          type:    'routine',
        });
      }

      // 4. Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['my-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['my-routine-results'] });
      queryClient.invalidateQueries({ queryKey: ['routine-completions'] });

      toast.success('¡Rutina completada! 💪');
      onClose();
    } catch {
      toast.error('No se pudo guardar el feedback');
    } finally {
      setSaving(false);
    }
  };

  const selectedFeeling = FEELINGS.find(f => f.value === feeling);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-center">¿Cómo te fue?</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="text-center">
            <p className="font-semibold text-foreground truncate px-2">{routineName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Contanos cómo salió</p>
          </div>

          {/* Step 1: Feeling */}
          <div>
            <p className="text-sm text-center text-muted-foreground mb-3">
              ¿Cómo te sentiste haciendo la rutina?
            </p>
            <div className="flex justify-center gap-2">
              {FEELINGS.map(({ value, emoji, label }) => (
                <button key={value} onClick={() => handleFeeling(value)} title={label}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-xl transition-all',
                    feeling === value
                      ? 'bg-primary/15 scale-110 ring-2 ring-primary/40'
                      : 'hover:bg-muted/50'
                  )}>
                  <span className="text-3xl">{emoji}</span>
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: RPE */}
          {step !== 'feeling' && (
            <div className="animate-fade-in">
              <p className="text-sm text-center text-muted-foreground mb-3">
                ¿Qué tan exigente fue?
              </p>
              <div className="grid grid-cols-3 gap-2">
                {RPE_OPTIONS.map(({ value, emoji, label, sub }) => (
                  <button key={value} onClick={() => handleRpe(value)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-xl border transition-all',
                      rpe === value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/40 hover:bg-muted/30'
                    )}>
                    <span className="text-2xl">{emoji}</span>
                    <span className="text-xs font-medium text-foreground">{label}</span>
                    <span className="text-[10px] text-muted-foreground text-center leading-tight">{sub}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Notas */}
          {step === 'notes' && (
            <div className="animate-fade-in space-y-2">
              <p className="text-sm text-muted-foreground text-center">
                ¿Algo que quieras comentar? <span className="text-xs">(opcional)</span>
              </p>
              <Textarea
                placeholder="Ej: Me costó el último ejercicio pero terminé todo. La próxima lo hago más rápido."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="bg-background border-border resize-none text-sm min-h-[70px]"
                maxLength={300}
              />
            </div>
          )}

          {/* Botones */}
          {step === 'notes' && feeling && rpe && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}
                className="flex-1 text-muted-foreground">
                Omitir
              </Button>
              <Button onClick={handleSubmit} disabled={saving}
                className="flex-1 gradient-primary text-primary-foreground">
                {saving ? 'Guardando...' : `Completar ${selectedFeeling?.emoji || '💪'}`}
              </Button>
            </div>
          )}

          {step === 'feeling' && (
            <button onClick={onClose}
              className="w-full text-xs text-muted-foreground hover:text-foreground text-center">
              Omitir por ahora
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}