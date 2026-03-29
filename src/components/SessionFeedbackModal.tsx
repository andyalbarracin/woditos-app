/**
 * Archivo: SessionFeedbackModal.tsx
 * Ruta: src/components/SessionFeedbackModal.tsx
 * Última modificación: 2026-03-28
 * Descripción: Modal de feedback post-sesión para miembros.
 *   - Al enviar: elimina la notificación (no vuelve a aparecer)
 *   - Al omitir: marca como leída (puede reabrirse desde campana)
 */
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SessionFeedbackModalProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  sessionTitle: string;
  sessionLocation?: string | null;
  notificationId?: string;
}

const EMOJIS = [
  { rating: 1, emoji: '😞', label: 'Muy mal' },
  { rating: 2, emoji: '😕', label: 'Mal' },
  { rating: 3, emoji: '😐', label: 'Regular' },
  { rating: 4, emoji: '😊', label: 'Bien' },
  { rating: 5, emoji: '🤩', label: 'Excelente' },
];

const DISCOMFORTS = [
  { key: 'legs',    emoji: '🦵', label: 'Piernas' },
  { key: 'body',    emoji: '💪', label: 'Cuerpo' },
  { key: 'weather', emoji: '🌧️', label: 'Clima' },
  { key: 'shoes',   emoji: '👟', label: 'Zapatillas' },
  { key: 'vibe',    emoji: '😶', label: 'Ambiente' },
  { key: 'crew',    emoji: '👥', label: 'Crew' },
];

export default function SessionFeedbackModal({
  open, onClose, sessionId, sessionTitle, sessionLocation, notificationId
}: SessionFeedbackModalProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState<number | null>(null);
  const [selectedDiscomforts, setSelectedDiscomforts] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<'rating' | 'discomfort' | 'note'>('rating');

  const handleRating = (r: number) => {
    setRating(r);
    setStep(r < 3 ? 'discomfort' : 'note');
  };

  const toggleDiscomfort = (key: string) => {
    setSelectedDiscomforts(prev =>
      prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key]
    );
  };

  const handleSubmit = async () => {
    if (!rating || !user?.id) return;
    setSaving(true);

    // Intentar insertar. Si ya existe (UNIQUE constraint), actualizar.
    const { error } = await supabase.from('session_feedback').upsert({
      session_id: sessionId,
      user_id: user.id,
      rating,
      discomforts: selectedDiscomforts.length > 0 ? selectedDiscomforts : [],
      note: note.trim() || null,
    }, { onConflict: 'session_id,user_id' });

    if (error) {
      toast.error('No se pudo guardar el feedback');
      setSaving(false);
      return;
    }

    // Eliminar la notificación — ya no debe volver a aparecer
    if (notificationId) {
      await supabase.from('notifications').delete().eq('id', notificationId);
    }

    setSaving(false);
    toast.success('¡Gracias por tu feedback!');
    onClose();
  };

  // Al omitir: solo marcar como leída (puede reabrirse desde campana)
  const handleSkip = async () => {
    if (notificationId) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
    }
    onClose();
  };

  const selectedEmoji = EMOJIS.find(e => e.rating === rating);

  return (
    <Dialog open={open} onOpenChange={handleSkip}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-center">¿Cómo te fue?</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="text-center">
            <p className="font-semibold text-foreground">{sessionTitle}</p>
            {sessionLocation && (
              <p className="text-xs text-muted-foreground mt-0.5">📍 {sessionLocation}</p>
            )}
          </div>

          {/* Step 1: Rating */}
          <div>
            <p className="text-sm text-center text-muted-foreground mb-3">
              Calificá tu experiencia en la sesión
            </p>
            <div className="flex justify-center gap-2">
              {EMOJIS.map(({ rating: r, emoji, label }) => (
                <button
                  key={r}
                  onClick={() => handleRating(r)}
                  title={label}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-xl transition-all',
                    rating === r
                      ? 'bg-primary/15 scale-110 ring-2 ring-primary/40'
                      : 'hover:bg-muted/50'
                  )}
                >
                  <span className="text-3xl">{emoji}</span>
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Incomodidades */}
          {step === 'discomfort' && rating !== null && rating < 3 && (
            <div className="animate-fade-in">
              <p className="text-sm text-center text-muted-foreground mb-3">
                ¿Qué te molestó más?
                <span className="text-xs block mt-0.5">(podés elegir varios)</span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                {DISCOMFORTS.map(({ key, emoji, label }) => (
                  <button
                    key={key}
                    onClick={() => toggleDiscomfort(key)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-xl border transition-all text-xs',
                      selectedDiscomforts.includes(key)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-border/60'
                    )}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep('note')}
                className="w-full mt-3 text-xs text-primary hover:underline text-center"
              >
                Continuar →
              </button>
            </div>
          )}

          {/* Step 3: Nota opcional */}
          {(step === 'note' || (step === 'discomfort' && rating !== null && rating >= 3)) && rating !== null && (
            <div className="animate-fade-in space-y-2">
              <p className="text-sm text-muted-foreground text-center">
                ¿Algo más que quieras comentar? <span className="text-xs">(opcional)</span>
              </p>
              <Textarea
                placeholder="Ej: Me costó el calor pero lo terminé. El ritmo estuvo bueno."
                value={note}
                onChange={e => setNote(e.target.value)}
                className="bg-background border-border resize-none text-sm min-h-[70px]"
                maxLength={300}
              />
            </div>
          )}

          {/* Botones */}
          {rating !== null && step !== 'discomfort' && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleSkip}
                className="flex-1 text-muted-foreground">
                Omitir
              </Button>
              <Button onClick={handleSubmit} disabled={saving}
                className="flex-1 gradient-primary text-primary-foreground">
                {saving ? 'Guardando...' : `Enviar ${selectedEmoji?.emoji || ''}`}
              </Button>
            </div>
          )}

          {rating === null && (
            <button onClick={handleSkip}
              className="w-full text-xs text-muted-foreground hover:text-foreground text-center">
              Omitir por ahora
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}