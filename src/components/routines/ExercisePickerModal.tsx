/**
 * Archivo: ExercisePickerModal.tsx
 * Ruta: src/components/routines/ExercisePickerModal.tsx
 * Última modificación: 2026-04-23
 * Descripción: Modal para buscar y agregar ejercicios al builder.
 *   Fuentes de datos:
 *   1. free-exercise-db (GitHub CDN) — ~870 ejercicios globales con GIFs
 *   2. exercise_library (Supabase) — ejercicios wiki migrados + custom del club
 *   Ambas fuentes se mergean y se muestran juntas con filtros por bodyPart.
 *   v2.1: agrega Supabase query para wiki + coach exercises.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, X, Plus, Loader2, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useExercises, useExerciseSearch } from '@/hooks/useExerciseDB';
import {
  BODY_PARTS_OPTIONS,
  type ExerciseDBItem,
} from '@/lib/exerciseTranslations';

const db = supabase as any;

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: ExerciseDBItem) => void;
  selectedIds?: string[];
}

const BODY_PART_COLORS: Record<string, string> = {
  waist:        'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  back:         'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  chest:        'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  shoulders:    'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'upper arms': 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  'lower arms': 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'upper legs': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  'lower legs': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  cardio:       'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  neck:         'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const BODY_PART_ES: Record<string, string> = {
  'back': 'Espalda', 'cardio': 'Cardio', 'chest': 'Pecho',
  'lower arms': 'Antebrazos', 'lower legs': 'Piernas (inf.)',
  'neck': 'Cuello', 'shoulders': 'Hombros', 'upper arms': 'Brazos',
  'upper legs': 'Piernas (sup.)', 'waist': 'Abdomen',
};

const EQUIPMENT_ES: Record<string, string> = {
  'body only': 'Peso corporal', 'barbell': 'Barra', 'dumbbell': 'Mancuernas',
  'cable': 'Polea', 'machine': 'Máquina', 'kettlebells': 'Kettlebells',
  'bands': 'Bandas', 'medicine ball': 'Pelota medicinal',
  'exercise ball': 'Pelota fitball', 'foam roll': 'Foam roller', 'other': 'Otro',
};

const PAGE_SIZE = 30;

export default function ExercisePickerModal({ open, onClose, onSelect, selectedIds = [] }: Props) {
  const { clubMembership } = useAuth();
  const clubId = clubMembership?.club_id;

  const [search, setSearch]           = useState('');
  const [activeBodyPart, setActive]   = useState<string | null>(null);
  const [imgErrors, setImgErrors]     = useState<Set<string>>(new Set());
  const [visibleCount, setVisible]    = useState(PAGE_SIZE);

  useEffect(() => {
    if (!open) { setSearch(''); setActive(null); setVisible(PAGE_SIZE); }
  }, [open]);

  const isSearching = search.length >= 2;

  // ── Fuente 1: CDN (free-exercise-db) ──────────────────────
  const listQuery   = useExercises({ bodyPart: activeBodyPart ?? undefined, enabled: open });
  const searchQuery = useExerciseSearch(search);

  const cdnItems: ExerciseDBItem[] = useMemo(() => {
    if (isSearching) return searchQuery.data ?? [];
    return listQuery.data?.pages.flat() ?? [];
  }, [isSearching, searchQuery.data, listQuery.data]);

  // ── Fuente 2: Supabase (wiki migrados + coach custom) ─────
  const supabaseQuery = useQuery({
    queryKey: ['exercise-library-picker', clubId],
    queryFn: async () => {
      // club_id NOT NULL → coach exercises
      // gif_url IS NULL  → wiki exercises (CDN ones always have gif_url)
      const { data, error } = await db
        .from('exercise_library')
        .select('id, name, name_en, body_part, equipment, target, gif_url, image_start_url, is_global, club_id, instructions')
        .or('club_id.not.is.null,gif_url.is.null')
        .order('name');
      if (error) throw error;
      return (data ?? []).map((ex: any): ExerciseDBItem => ({
        id:               `lib-${ex.id}`,
        name:             ex.name_en || ex.name,
        nameES:           ex.name,
        gifUrl:           ex.image_start_url || ex.gif_url || '',
        bodyPart:         ex.body_part || 'other',
        bodyPartES:       BODY_PART_ES[ex.body_part] || ex.body_part || 'Otro',
        equipment:        ex.equipment || 'other',
        equipmentES:      EQUIPMENT_ES[ex.equipment] || ex.equipment || 'Otro',
        target:           ex.target || ex.body_part || '',
        targetES:         ex.target || BODY_PART_ES[ex.body_part] || '',
        secondaryMuscles: [],
        instructions:     ex.instructions ?? [],
      }));
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const supabaseItems: ExerciseDBItem[] = supabaseQuery.data ?? [];

  // ── Merge + filtros ───────────────────────────────────────
  const allItems = useMemo(() => {
    // Combinar CDN + Supabase, evitando duplicados por nombre
    const cdnNames = new Set(cdnItems.map(e => e.nameES.toLowerCase()));
    const extras = supabaseItems.filter(e => !cdnNames.has(e.nameES.toLowerCase()));
    return [...extras, ...cdnItems];
    }, [cdnItems, supabaseItems]);

  // Filtro por bodyPart y búsqueda corta
  const filtered = useMemo(() => {
    let items = allItems;

    // Cuando no hay búsqueda larga pero sí filtro de body part,
    // los items del CDN ya vienen filtrados por el hook.
    // Pero los de Supabase no, así que los filtramos aquí.
    if (activeBodyPart && !isSearching) {
      items = items.filter(ex =>
        ex.bodyPart === activeBodyPart ||
        // Los CDN ya vienen filtrados, así que solo filtramos los extras
        (!ex.id.startsWith('lib-'))
      );
      // Re-filtrar para que TODOS respeten el bodyPart
      items = items.filter(ex => ex.bodyPart === activeBodyPart);
    }

    // Búsqueda corta (1 char) — filtro client-side
    if (search.length > 0 && !isSearching) {
      const lower = search.toLowerCase();
      items = items.filter(
        ex => ex.nameES.toLowerCase().includes(lower) || ex.name.toLowerCase().includes(lower)
      );
    }

    // Búsqueda larga — CDN ya viene filtrado, pero filtrar Supabase extras
    if (isSearching) {
      const lower = search.toLowerCase();
      // CDN items ya filtrados por searchQuery, sumar los extras que matcheen
      const cdnFiltered = cdnItems.filter(() => true); // ya filtrados
      const cdnNames = new Set(cdnFiltered.map(e => e.nameES.toLowerCase()));
      const extraFiltered = supabaseItems.filter(e =>
        !cdnNames.has(e.nameES.toLowerCase()) &&
        (e.nameES.toLowerCase().includes(lower) || e.name.toLowerCase().includes(lower))
      );
      items = [...cdnFiltered, ...extraFiltered];
    }

    return items;
  }, [allItems, activeBodyPart, search, isSearching, cdnItems, supabaseItems]);

  const displayed = filtered.slice(0, visibleCount);
  const hasMore   = filtered.length > visibleCount;
  const isLoading = listQuery.isLoading;

  const handleImgError = useCallback((id: string) => {
    setImgErrors(prev => new Set(prev).add(id));
  }, []);

  const handleBodyPartToggle = (value: string) => {
    setSearch('');
    setVisible(PAGE_SIZE);
    setActive(prev => (prev === value ? null : value));
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl h-[82vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-3 border-b shrink-0">
          <DialogTitle className="text-base font-semibold">Agregar ejercicio</DialogTitle>

          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => { setSearch(e.target.value); setVisible(PAGE_SIZE); }}
              placeholder="Buscar por nombre (ej: sentadilla, burpee, plancha…)"
              className="pl-9 pr-9"
              autoFocus
            />
            {search && (
              <button onClick={() => { setSearch(''); setVisible(PAGE_SIZE); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {!isSearching && (
            <div className="flex gap-1.5 flex-wrap mt-2">
              {BODY_PARTS_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => handleBodyPartToggle(opt.value)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    activeBodyPart === opt.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:bg-muted'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1 px-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">Cargando biblioteca de ejercicios…</p>
              <p className="text-xs">Primera carga: ~2 segundos</p>
            </div>
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <p className="text-sm">No se encontraron ejercicios.</p>
              <p className="text-xs mt-1">
                {search.length > 0
                  ? 'Probá con otro término o en inglés.'
                  : 'Seleccioná un filtro de zona muscular.'}
              </p>
            </div>
          ) : (
            <div className="divide-y py-2">
              {displayed.map(ex => {
                const alreadyAdded = selectedIds.includes(ex.id);
                const imgFailed    = imgErrors.has(ex.id);
                const bpColor      = BODY_PART_COLORS[ex.bodyPart] ?? 'bg-muted text-muted-foreground';
                const isFromLib    = ex.id.startsWith('lib-');

                return (
                  <div key={ex.id}
                    className="flex items-center gap-3 py-3 hover:bg-muted/40 rounded-lg px-1">
                    <div className="h-14 w-14 shrink-0 rounded-md bg-muted overflow-hidden flex items-center justify-center">
                      {ex.gifUrl && !imgFailed ? (
                        <img src={ex.gifUrl} alt={ex.nameES}
                          className="h-full w-full object-cover"
                          onError={() => handleImgError(ex.id)}
                          loading="lazy" />
                      ) : (
                        <span className="text-2xl">🏋️</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium truncate">{ex.nameES}</p>
                        {isFromLib && (
                          <Building2 size={11} className="text-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate italic">{ex.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${bpColor}`}>
                          {ex.bodyPartES}
                        </span>
                        <span className="text-xs text-muted-foreground">· {ex.equipmentES}</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={alreadyAdded ? 'outline' : 'default'}
                      onClick={() => onSelect(ex)}
                      className="shrink-0">
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar
                    </Button>
                  </div>
                );
              })}

              {hasMore && (
                <div className="flex justify-center py-4">
                  <Button variant="outline" size="sm"
                    onClick={() => setVisible(v => v + PAGE_SIZE)}>
                    Ver más ({filtered.length - visibleCount} restantes)
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="px-4 py-3 border-t shrink-0 flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            {isLoading
              ? 'Cargando…'
              : `${filtered.length} ejercicio${filtered.length !== 1 ? 's' : ''}${
                  activeBodyPart ? ` · ${BODY_PARTS_OPTIONS.find(o => o.value === activeBodyPart)?.label}` : ''
                }${isSearching ? ` · "${search}"` : ''}`
            }
          </p>
          <Button variant="ghost" size="sm" onClick={onClose}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}