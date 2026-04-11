/**
 * Archivo: useExerciseDB.ts
 * Ruta: src/hooks/useExerciseDB.ts
 * Última modificación: 2026-04-08
 * Descripción: Hooks para ejercicios.
 *   - CDN (free-exercise-db): nombres/imágenes, client-side
 *   - exercise_library (Supabase): instrucciones en español, persistido en DB
 *   useExerciseLibraryItem: busca por id en exercise_library (instrucciones ES)
 *   useExerciseLibrarySearch: búsqueda en exercise_library
 *   useExerciseLibraryByBodyPart: filtro por body_part
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { normalizeExercise, translateBodyPart, translateEquipment, type ExerciseDBItem } from '@/lib/exerciseTranslations';
import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;

const EXERCISES_JSON_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMAGES_BASE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

const STALE_MS = 24 * 60 * 60 * 1000;

// ─── Mapeo muscles → bodyPart ─────────────────────────────────
const MUSCLE_TO_BODYPART: Record<string, string> = {
  abdominals:          'waist',
  obliques:            'waist',
  hamstrings:          'upper legs',
  quadriceps:          'upper legs',
  glutes:              'upper legs',
  adductors:           'upper legs',
  abductors:           'upper legs',
  calves:              'lower legs',
  chest:               'chest',
  pectorals:           'chest',
  biceps:              'upper arms',
  triceps:             'upper arms',
  forearms:            'lower arms',
  lats:                'back',
  'middle back':       'back',
  'lower back':        'back',
  traps:               'back',
  rhomboids:           'back',
  shoulders:           'shoulders',
  'front deltoids':    'shoulders',
  neck:                'neck',
  // cardiovascular system → cardio (pero la prioridad de categoria lo cubre mejor)
  'cardiovascular system': 'cardio',
};

// Mapeo categoría → bodyPart (para cuando no hay primaryMuscles claro)
const CATEGORY_TO_BODYPART: Record<string, string> = {
  cardio:      'cardio',
  stretching:  'waist',
  plyometrics: 'upper legs',
  powerlifting: 'back',
  strongman:   'back',
  olympic_weightlifting: 'upper legs',
};

function normalizeFreeExercise(raw: Record<string, unknown>, index: number): ExerciseDBItem {
  const name      = String(raw.name ?? '');
  const muscles   = (raw.primaryMuscles as string[]) ?? [];
  const equipment = String(raw.equipment ?? 'body only');
  const category  = String(raw.category ?? '').toLowerCase().trim();
  const images    = (raw.images as string[]) ?? [];
  const instructions = (raw.instructions as string[]) ?? [];

  // ── FIX: Derivar bodyPart con prioridad correcta ──────────────
  // 1. Si la categoría es "cardio", asignar directamente → evita que cardio quede
  //    mapeado a 'waist' cuando los primaryMuscles no tienen 'cardiovascular system'
  // 2. Si hay primaryMuscles[0] en el mapa, usarlo
  // 3. Fallback al mapeo de categoría
  // 4. Default: 'waist'
  let bodyPart: string;

  if (category === 'cardio') {
    bodyPart = 'cardio';                                        // FIX principal
  } else if (muscles.length > 0 && MUSCLE_TO_BODYPART[muscles[0].toLowerCase()]) {
    bodyPart = MUSCLE_TO_BODYPART[muscles[0].toLowerCase()];
  } else {
    bodyPart = CATEGORY_TO_BODYPART[category] ?? 'waist';
  }

  const gifUrl = images.length > 0 ? `${IMAGES_BASE}${images[0]}` : '';
  // FIX: sanitizar ID para que sea URL-safe (sin / . ' ni otros chars especiales)
  const safeSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 20);
  const id = `fex-${index}-${safeSlug}`;

  return normalizeExercise({
    id,
    name,
    bodyPart,
    equipment: equipment.toLowerCase(),
    target:    muscles[0] ?? 'abdominals',
    gifUrl,
    secondaryMuscles: (raw.secondaryMuscles as string[]) ?? [],
    instructions,
  });
}

// ─── Hook base ────────────────────────────────────────────────

function useAllExercises() {
  return useQuery<ExerciseDBItem[]>({
    queryKey: ['freeexercises', 'all'],
    queryFn: async () => {
      const res = await fetch(EXERCISES_JSON_URL);
      if (!res.ok) throw new Error(`Error cargando ejercicios: ${res.status}`);
      const raw: Record<string, unknown>[] = await res.json();
      return raw.map((item, i) => normalizeFreeExercise(item, i));
    },
    staleTime: STALE_MS,
    retry: 2,
  });
}

// ─── Hooks públicos ───────────────────────────────────────────

interface UseExercisesResult {
  data: { pages: ExerciseDBItem[][] } | undefined;
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export function useExercises(opts: { bodyPart?: string; enabled?: boolean } = {}): UseExercisesResult {
  const { bodyPart, enabled = true } = opts;
  const base = useAllExercises();

  const filtered = useMemo(() => {
    if (!base.data) return undefined;
    const list = bodyPart
      ? base.data.filter(ex => ex.bodyPart === bodyPart)
      : base.data;
    return { pages: [list] };
  }, [base.data, bodyPart]);

  return {
    data:               filtered,
    isLoading:          enabled ? base.isLoading : false,
    hasNextPage:        false,
    isFetchingNextPage: false,
    fetchNextPage:      () => {},
  };
}

export function useExerciseSearch(query: string) {
  const base = useAllExercises();

  const results = useMemo(() => {
    if (!base.data || query.trim().length < 2) return [];
    const lower = query.toLowerCase();
    return base.data.filter(
      ex =>
        ex.nameES.toLowerCase().includes(lower) ||
        ex.name.toLowerCase().includes(lower)
    );
  }, [base.data, query]);

  return { data: results, isLoading: base.isLoading };
}

export function useExerciseById(id: string | null) {
  const base = useAllExercises();
  const exercise = useMemo(() => {
    if (!base.data || !id) return undefined;
    return base.data.find(ex => ex.id === id);
  }, [base.data, id]);
  return { data: exercise, isLoading: base.isLoading };
}

export function useBodyPartList() {
  const base = useAllExercises();
  const parts = useMemo(() => {
    if (!base.data) return [];
    const set = new Set(base.data.map(ex => ex.bodyPart));
    return Array.from(set);
  }, [base.data]);
  return { data: parts, isLoading: base.isLoading };
}

export function useExercisesByTarget(target: string | null) {
  const base = useAllExercises();
  const results = useMemo(() => {
    if (!base.data || !target) return [];
    return base.data.filter(ex => ex.target.toLowerCase() === target.toLowerCase());
  }, [base.data, target]);
  return { data: results, isLoading: base.isLoading };
}

// ─── Hooks de exercise_library (Supabase) — instrucciones EN ESPAÑOL ──────────
// Estos hooks usan la tabla exercise_library poblada por el Import Tool.
// Se usan en LibraryExerciseDetail y como fuente primaria en Library/Picker.

/** Tipado de un ejercicio de exercise_library */
export interface LibraryExercise {
  id: string;
  name: string;          // español
  name_en: string;       // inglés
  body_part: string;
  equipment: string;
  target: string;
  gif_url: string;
  instructions: string[]; // ya en español
  is_global: boolean;
}

/** Busca un ejercicio en exercise_library por ID (instrucciones en español) */
export function useExerciseLibraryItem(id: string | null) {
  return useQuery<LibraryExercise | null>({
    queryKey: ['exercise_library_item', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await db
        .from('exercise_library')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!id,
    staleTime: 24 * 60 * 60 * 1000,
  });
}

/** Lista ejercicios de exercise_library con filtro opcional de body_part */
export function useExerciseLibrary(opts: { bodyPart?: string; search?: string } = {}) {
  const { bodyPart, search } = opts;
  return useQuery<LibraryExercise[]>({
    queryKey: ['exercise_library', bodyPart, search],
    queryFn: async () => {
      let query = db.from('exercise_library')
        .select('id, name, name_en, body_part, equipment, target, gif_url, is_global')
        .eq('is_global', true);
      if (bodyPart) query = query.eq('body_part', bodyPart);
      if (search && search.length >= 2) {
        query = query.or(`name.ilike.%${search}%,name_en.ilike.%${search}%`);
      }
      const { data, error } = await query.order('name').limit(500);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 24 * 60 * 60 * 1000,
  });
}

/** Verifica si exercise_library está poblada (para saber si usar DB o CDN) */
export function useExerciseLibraryPopulated() {
  return useQuery<boolean>({
    queryKey: ['exercise_library_populated'],
    queryFn: async () => {
      const { count } = await db
        .from('exercise_library')
        .select('id', { count: 'exact', head: true })
        .eq('is_global', true);
      return (count || 0) > 0;
    },
    staleTime: 5 * 60 * 1000,
  });
}