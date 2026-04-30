/**
 * Archivo: LibraryExerciseDetail.tsx
 * Ruta: src/pages/LibraryExerciseDetail.tsx
 * Última modificación: 2026-04-08
 * Descripción: Detalle de ejercicio de la librería.
 *   Usa exercise_library (Supabase) cuando está disponible → instrucciones en español.
 *   Fallback al CDN cuando el ejercicio viene del picker y no está en la DB aún.
 *   Rutas: /biblioteca/libreria/:id (CDN id) o /biblioteca/libreria-db/:id (DB uuid)
 */

import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Target, Dumbbell, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useExerciseById, useExerciseLibraryItem } from '@/hooks/useExerciseDB';
import { translateTarget, translateBodyPart, translateEquipment } from '@/lib/exerciseTranslations';
import { useState } from 'react';

const IMAGES_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

export default function LibraryExerciseDetail() {
  const { id, source } = useParams<{ id: string; source?: string }>();
  const navigate = useNavigate();

  // Determinar si el ID es un UUID de exercise_library o un ID del CDN (fex-...)
  const isDbId = id ? /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(id) : false;

  // Hook para exercise_library (instrucciones en español)
  const dbItem   = useExerciseLibraryItem(isDbId ? id ?? null : null);

  // Hook para CDN (fallback o para ids fex-...)
  const cdnItem  = useExerciseById(!isDbId ? id ?? null : null);

  const [imgFailed, setImgFailed] = useState(false);

  const isLoading = isDbId ? dbItem.isLoading : cdnItem.isLoading;

  // Normalizar datos de ambas fuentes al mismo formato de display
  const data = (() => {
    if (isDbId && dbItem.data) {
      const d = dbItem.data;
      return {
        name:             d.name,
        nameEN:           d.name_en,
        bodyPartES:       translateBodyPart(d.body_part),
        equipmentES:      translateEquipment(d.equipment),
        targetES:         translateTarget(d.target) || d.target,
        gifUrl:           d.gif_url,
        secondaryMuscles: [] as string[],
        instructions:     d.instructions,    // ya en español ✓
        fromDB:           true,
      };
    }
    if (!isDbId && cdnItem.data) {
      const c = cdnItem.data;
      return {
        name:             c.nameES,
        nameEN:           c.name,
        bodyPartES:       c.bodyPartES,
        equipmentES:      c.equipmentES,
        targetES:         translateTarget(c.target) || c.targetES,
        gifUrl:           c.gifUrl,
        secondaryMuscles: c.secondaryMuscles,
        instructions:     c.instructions,    // en inglés (sin importar aún)
        fromDB:           false,
      };
    }
    return null;
  })();

  const getAltImageUrl = (url: string) => url.replace('/0.jpg', '/1.jpg');

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (!data) return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <p className="text-muted-foreground">Ejercicio no encontrado</p>
      <Button variant="ghost" onClick={() => navigate('/biblioteca')} className="mt-4">
        <ArrowLeft size={16} className="mr-2" /> Volver
      </Button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in pb-8">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/biblioteca')}>
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-extrabold text-foreground">{data.name}</h1>
          {data.nameEN && data.nameEN !== data.name && (
            <p className="text-sm text-muted-foreground italic">{data.nameEN}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant="outline" className="text-xs bg-primary/5">
              <Target size={10} className="mr-1" />{data.bodyPartES}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Dumbbell size={10} className="mr-1" />{data.equipmentES}
            </Badge>
            {data.fromDB && (
              <span className="text-xs text-secondary">✓ Instrucciones en español</span>
            )}
          </div>
        </div>
      </div>

      {/* Imágenes */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {data.gifUrl && !imgFailed ? (
          <div className="flex flex-col sm:flex-row">
            <div className="relative sm:w-1/2">
              <img src={data.gifUrl} alt={`${data.name} — inicio`}
                className="w-full object-cover"
                style={{ height: '260px' }}
                onError={() => setImgFailed(true)} />
              <span className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded">
                Inicio
              </span>
            </div>
            <div className="relative bg-muted sm:w-1/2">
              <img src={getAltImageUrl(data.gifUrl)} alt={`${data.name} — final`}
                className="w-full object-cover"
                style={{ height: '260px' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <span className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded">
                Final
              </span>
            </div>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center bg-muted">
            <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
              <Dumbbell size={40} />
              <p className="text-sm">Sin imagen disponible</p>
            </div>
          </div>
        )}
      </div>

      {/* Músculo objetivo */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
          <Target size={16} className="text-primary" /> Músculo objetivo
        </h2>
        <p className="text-foreground/80">{data.targetES}</p>
        {data.secondaryMuscles.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2">
              Músculos secundarios
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data.secondaryMuscles.map(m => (
                <Badge key={m} variant="outline" className="text-xs">
                  {translateTarget(m) || m}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Instrucciones */}
      {data.instructions.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-secondary" /> Instrucciones
            {!data.fromDB && (
              <span className="text-xs text-muted-foreground font-normal ml-1">(importá la librería para verlas en español)</span>
            )}
          </h2>
          <div className="space-y-2">
            {data.instructions.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary/20 text-secondary text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-foreground/80 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-muted/40 border border-border rounded-xl p-4">
        <p className="text-xs text-muted-foreground">
          {data.fromDB
            ? 'Ejercicio de la Wiki de Woditos · Instrucciones traducidas desde el inglés'
            : 'Ejercicio de la Librería · ' + data.bodyPartES + ' · ' + data.equipmentES}
        </p>
      </div>
    </div>
  );
}