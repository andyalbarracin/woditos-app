/**
 * Archivo: Library.tsx
 * Ruta: src/pages/Library.tsx
 * Última modificación: 2026-04-09
 * Descripción: Biblioteca: ejercicios manuales (exercise_wiki), librería completa
 *   de ejercicios (exercise_library Supabase ~870 ej. con instrucciones en español) y nutrición.
 *   v2.3: usa exercise_library (Supabase) en vez del CDN → instrucciones en español.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Search, Dumbbell, Apple, ArrowRight, Zap, Target, AlertTriangle, BookOpen, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useExerciseLibrary } from '@/hooks/useExerciseDB';
import { translateBodyPart, translateEquipment, BODY_PARTS_OPTIONS } from '@/lib/exerciseTranslations';
import type { LibraryExercise } from '@/hooks/useExerciseDB';

// ─── Helpers ─────────────────────────────────────────────────────

const DIFFICULTY_COLORS: Record<string, string> = {
  basic:        'bg-secondary/15 text-secondary border-secondary/30',
  intermediate: 'bg-accent/15 text-accent border-accent/30',
  advanced:     'bg-destructive/15 text-destructive border-destructive/30',
};
const DIFFICULTY_LABELS: Record<string, string> = {
  basic: 'Básico', intermediate: 'Intermedio', advanced: 'Avanzado',
};
const FOOD_CATEGORY_COLORS: Record<string, string> = {
  proteinas:     'bg-primary/15 text-primary',
  carbohidratos: 'bg-accent/15 text-accent',
  grasas:        'bg-secondary/15 text-secondary',
  hidratacion:   'bg-info/15 text-info',
  suplementos:   'bg-muted text-muted-foreground',
};

const PAGE_SIZE = 24;

// ─── Subcomponente: Librería de ejercicios (exercise_library Supabase) ────

function ExerciseLibrary() {
  const navigate = useNavigate();
  const [search, setSearch]         = useState('');
  const [activeBodyPart, setActive] = useState<string | null>(null);
  const [imgErrors, setImgErrors]   = useState<Set<string>>(new Set());
  const [visibleCount, setVisible]  = useState(PAGE_SIZE);

  // Usa exercise_library de Supabase → IDs son UUIDs → instrucciones en español
  const { data: allExercises, isLoading } = useExerciseLibrary({
    bodyPart: activeBodyPart ?? undefined,
    search:   search.length >= 2 ? search : undefined,
  });

  // Reset paginación al cambiar filtro o búsqueda
  useEffect(() => { setVisible(PAGE_SIZE); }, [activeBodyPart, search]);

  const items: LibraryExercise[] = allExercises ?? [];
  const displayed  = items.slice(0, visibleCount);
  const hasMore    = items.length > visibleCount;

  const handleImgError = useCallback((id: string) => {
    setImgErrors(prev => new Set(prev).add(id));
  }, []);

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => { setSearch(e.target.value); setVisible(PAGE_SIZE); }}
          placeholder="Buscar ejercicio (ej: sentadilla, plancha, curl…)"
          className="pl-9 pr-9 bg-card"
        />
        {search && (
          <button onClick={() => { setSearch(''); setVisible(PAGE_SIZE); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X size={15} />
          </button>
        )}
      </div>

      {/* Filtros bodyPart */}
      {search.length < 2 && (
        <div className="flex flex-wrap gap-1.5">
          {BODY_PARTS_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => {
              setVisible(PAGE_SIZE);
              setActive(prev => prev === opt.value ? null : opt.value);
            }}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                activeBodyPart === opt.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:bg-muted'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Lista de ejercicios */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Cargando biblioteca de ejercicios…</p>
          <p className="text-xs opacity-60">Primera carga: ~2 segundos</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
          <Dumbbell size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">
            {search ? `Sin resultados para "${search}"` : 'Seleccioná una zona muscular o buscá un ejercicio'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {displayed.map(ex => {
              const imgFailed = imgErrors.has(ex.id);
              return (
                <button key={ex.id}
                  onClick={() => navigate(`/biblioteca/libreria/${ex.id}`)}
                  className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all text-left group">
                  {/* Imagen */}
                  <div className="h-36 bg-muted overflow-hidden flex items-center justify-center">
                    {ex.gif_url && !imgFailed ? (
                      <img src={ex.gif_url} alt={ex.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => handleImgError(ex.id)}
                        loading="lazy" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
                        <Dumbbell size={32} />
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                      {ex.name}
                    </p>
                    <p className="text-xs text-muted-foreground italic truncate">{ex.name_en}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-xs bg-primary/8 text-primary px-2 py-0.5 rounded-full">
                        {translateBodyPart(ex.body_part)}
                      </span>
                      <span className="text-xs text-muted-foreground">· {translateEquipment(ex.equipment)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer con conteo y cargar más */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>
              {items.length} ejercicio{items.length !== 1 ? 's' : ''}
              {activeBodyPart && ` · ${BODY_PARTS_OPTIONS.find(o => o.value === activeBodyPart)?.label}`}
              {search.length >= 2 && ` · "${search}"`}
            </span>
            {hasMore && (
              <Button variant="outline" size="sm" onClick={() => setVisible(v => v + PAGE_SIZE)}>
                Ver más ({items.length - visibleCount} restantes)
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────

export default function Library() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const { data: exercises, isLoading: loadingEx } = useQuery({
    queryKey: ['exercises', search],
    queryFn: async () => {
      let query = supabase.from('exercise_wiki').select('*').order('name');
      if (search) query = query.ilike('name', `%${search}%`);
      const { data } = await query;
      return data || [];
    },
  });

  const { data: foods, isLoading: loadingFood } = useQuery({
    queryKey: ['foods', search],
    queryFn: async () => {
      let query = supabase.from('food_wiki').select('*').order('name');
      if (search) query = query.ilike('name', `%${search}%`);
      const { data } = await query;
      return data || [];
    },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-foreground">Biblioteca</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ejercicios, librería completa y nutrición para tu entrenamiento
        </p>
      </div>

      <Tabs defaultValue="library">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="library"
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BookOpen size={16} /> Librería
          </TabsTrigger>
          <TabsTrigger value="exercises"
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Dumbbell size={16} /> Wiki
          </TabsTrigger>
          <TabsTrigger value="foods"
            className="gap-2 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
            <Apple size={16} /> Nutrición
          </TabsTrigger>
        </TabsList>

        {/* ── TAB LIBRERÍA (exercise_library Supabase) ──────────── */}
        <TabsContent value="library" className="mt-4">
          <ExerciseLibrary />
        </TabsContent>

        {/* ── TAB WIKI (exercise_wiki manual) ───────────────────── */}
        <TabsContent value="exercises" className="mt-4">
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar en la wiki…" value={search}
              onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
          </div>

          {loadingEx ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse h-40" />
              ))}
            </div>
          ) : exercises && exercises.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {exercises.map((ex: any) => (
                <button key={ex.id} onClick={() => navigate(`/biblioteca/ejercicio/${ex.id}`)}
                  className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all text-left group cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-foreground group-hover:text-primary transition-colors">
                        {ex.name}
                      </h3>
                      {ex.muscle_group && (
                        <p className="text-xs text-muted-foreground mt-0.5">{ex.muscle_group}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[ex.difficulty_level] || 'bg-muted text-muted-foreground'}`}>
                        {DIFFICULTY_LABELS[ex.difficulty_level] || ex.difficulty_level}
                      </span>
                      <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{ex.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ex.category && (
                      <Badge variant="outline" className="text-xs">
                        <Target size={10} className="mr-1" />{ex.category}
                      </Badge>
                    )}
                    {ex.tags?.slice(0, 2).map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                  {ex.contraindications && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-destructive">
                      <AlertTriangle size={11} />
                      <span>Tiene contraindicaciones</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Dumbbell size={32} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No hay ejercicios en la wiki</p>
            </div>
          )}
        </TabsContent>

        {/* ── TAB NUTRICIÓN ─────────────────────────────────────── */}
        <TabsContent value="foods" className="mt-4">
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar alimentos…" value={search}
              onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
          </div>

          {loadingFood ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse h-36" />
              ))}
            </div>
          ) : foods && foods.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {foods.map((food: any) => (
                <button key={food.id} onClick={() => navigate(`/biblioteca/nutricion/${food.id}`)}
                  className="bg-card border border-border rounded-xl p-5 hover:border-secondary/40 hover:shadow-lg transition-all text-left group cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-display font-bold text-foreground group-hover:text-secondary transition-colors">
                        {food.name}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${FOOD_CATEGORY_COLORS[food.category] || 'bg-muted text-muted-foreground'}`}>
                        {food.category}
                      </span>
                    </div>
                    <ArrowRight size={16} className="text-muted-foreground group-hover:text-secondary transition-colors shrink-0" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{food.benefits}</p>
                  {food.best_time_to_consume && (
                    <p className="text-xs text-secondary flex items-center gap-1">
                      <Zap size={11} />
                      <span>{food.best_time_to_consume}</span>
                    </p>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Apple size={32} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No hay alimentos registrados</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}