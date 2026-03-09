/**
 * Archivo: ExerciseDetail.tsx
 * Ruta: src/pages/ExerciseDetail.tsx
 * Última modificación: 2025-03-09
 * Descripción: Página de detalle de un ejercicio. Muestra descripción completa,
 *              diagrama SVG de músculos trabajados, técnica, errores comunes
 *              y contraindicaciones. Navegación con botón de retroceso.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Target, AlertTriangle, CheckCircle, XCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MuscleDiagram from '@/components/library/MuscleDiagram';

/** Mapeo de dificultad a colores semánticos */
const DIFFICULTY_COLORS: Record<string, string> = {
  basic:        'bg-secondary/15 text-secondary',
  intermediate: 'bg-accent/15 text-accent',
  advanced:     'bg-destructive/15 text-destructive',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  basic: 'Básico', intermediate: 'Intermedio', advanced: 'Avanzado',
};

export default function ExerciseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  /** Carga el ejercicio por ID */
  const { data: exercise, isLoading } = useQuery({
    queryKey: ['exercise', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('exercise_wiki')
        .select('*')
        .eq('id', id!)
        .single();
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-muted-foreground">Ejercicio no encontrado</p>
        <Button variant="ghost" onClick={() => navigate('/biblioteca')} className="mt-4">
          <ArrowLeft size={16} className="mr-2" /> Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* Header con botón back */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/biblioteca')}>
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-extrabold text-foreground">{exercise.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${DIFFICULTY_COLORS[exercise.difficulty_level]}`}>
              {DIFFICULTY_LABELS[exercise.difficulty_level] || exercise.difficulty_level}
            </span>
            {exercise.category && <Badge variant="outline" className="text-xs">{exercise.category}</Badge>}
            {exercise.muscle_group && (
              <Badge variant="outline" className="text-xs">
                <Target size={10} className="mr-1" />{exercise.muscle_group}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Diagrama muscular SVG */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
          <Zap size={18} className="text-primary" /> Músculos trabajados
        </h2>
        <MuscleDiagram muscleGroup={exercise.muscle_group} category={exercise.category} />
      </div>

      {/* Descripción */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-display font-bold text-foreground mb-2">Descripción</h2>
        <p className="text-foreground/80 leading-relaxed">{exercise.description}</p>
      </div>

      {/* Objetivo */}
      {exercise.goal && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-display font-bold text-foreground mb-2 flex items-center gap-2">
            <Target size={16} className="text-secondary" /> Objetivo
          </h2>
          <p className="text-foreground/80 leading-relaxed">{exercise.goal}</p>
        </div>
      )}

      {/* Técnica paso a paso */}
      {exercise.technique && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-secondary" /> Técnica correcta
          </h2>
          <div className="space-y-2">
            {exercise.technique.split(/\d+\.|\./).filter((s: string) => s.trim()).map((step: string, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary/20 text-secondary text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-foreground/80 leading-relaxed">{step.trim()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errores comunes */}
      {exercise.common_mistakes && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5">
          <h2 className="font-display font-bold text-destructive mb-3 flex items-center gap-2">
            <XCircle size={16} /> Errores comunes
          </h2>
          <p className="text-sm text-foreground/80 leading-relaxed">{exercise.common_mistakes}</p>
        </div>
      )}

      {/* Contraindicaciones */}
      {exercise.contraindications && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5">
          <h2 className="font-display font-bold text-destructive mb-2 flex items-center gap-2">
            <AlertTriangle size={16} /> Contraindicaciones
          </h2>
          <p className="text-sm text-foreground/80 leading-relaxed">{exercise.contraindications}</p>
        </div>
      )}

      {/* Tags */}
      {exercise.tags && exercise.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-4">
          {exercise.tags.map((tag: string) => (
            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}
