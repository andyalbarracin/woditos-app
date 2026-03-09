/**
 * Archivo: Library.tsx
 * Ruta: src/pages/Library.tsx
 * Última modificación: 2025-03-09
 * Descripción: Biblioteca de ejercicios y nutrición. Muestra cards clickeables
 *              que navegan a páginas de detalle individuales con diagramas musculares
 *              y descripción completa. Soporta búsqueda por nombre.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Search, Dumbbell, Apple, ArrowRight, Zap, Target, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

/** Colores de dificultad usando tokens semánticos del design system */
const DIFFICULTY_COLORS: Record<string, string> = {
  basic:        'bg-secondary/15 text-secondary border-secondary/30',
  intermediate: 'bg-accent/15 text-accent border-accent/30',
  advanced:     'bg-destructive/15 text-destructive border-destructive/30',
};

/** Etiquetas legibles de dificultad en español */
const DIFFICULTY_LABELS: Record<string, string> = {
  basic:        'Básico',
  intermediate: 'Intermedio',
  advanced:     'Avanzado',
};

/** Íconos de categoría de alimento */
const FOOD_CATEGORY_COLORS: Record<string, string> = {
  proteinas:    'bg-primary/15 text-primary',
  carbohidratos:'bg-accent/15 text-accent',
  grasas:       'bg-secondary/15 text-secondary',
  hidratacion:  'bg-info/15 text-info',
  suplementos:  'bg-muted text-muted-foreground',
};

export default function Library() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  /** Carga ejercicios desde la base de datos, filtrados por búsqueda */
  const { data: exercises, isLoading: loadingEx } = useQuery({
    queryKey: ['exercises', search],
    queryFn: async () => {
      let query = supabase.from('exercise_wiki').select('*').order('name');
      if (search) query = query.ilike('name', `%${search}%`);
      const { data } = await query;
      return data || [];
    },
  });

  /** Carga alimentos desde la base de datos, filtrados por búsqueda */
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
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-foreground">Biblioteca</h1>
        <p className="text-muted-foreground text-sm mt-1">Ejercicios, técnica y nutrición para tu entrenamiento</p>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar ejercicios o alimentos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-card border-border"
        />
      </div>

      <Tabs defaultValue="exercises">
        <TabsList className="bg-card border border-border">
          <TabsTrigger
            value="exercises"
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Dumbbell size={16} /> Ejercicios
          </TabsTrigger>
          <TabsTrigger
            value="foods"
            className="gap-2 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
          >
            <Apple size={16} /> Nutrición
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB EJERCICIOS ───────────────────────────────────────────────── */}
        <TabsContent value="exercises" className="mt-4">
          {loadingEx ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse h-40" />
              ))}
            </div>
          ) : exercises && exercises.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {exercises.map((ex: any) => (
                <button
                  key={ex.id}
                  onClick={() => navigate(`/biblioteca/ejercicio/${ex.id}`)}
                  className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all text-left group cursor-pointer"
                >
                  {/* Header de la card */}
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

                  {/* Descripción corta */}
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{ex.description}</p>

                  {/* Tags + categoría */}
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

                  {/* Indicador de contraindicaciones */}
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
              <p className="text-muted-foreground">No hay ejercicios registrados</p>
            </div>
          )}
        </TabsContent>

        {/* ─── TAB NUTRICIÓN ────────────────────────────────────────────────── */}
        <TabsContent value="foods" className="mt-4">
          {loadingFood ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse h-36" />
              ))}
            </div>
          ) : foods && foods.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {foods.map((food: any) => (
                <button
                  key={food.id}
                  onClick={() => navigate(`/biblioteca/nutricion/${food.id}`)}
                  className="bg-card border border-border rounded-xl p-5 hover:border-secondary/40 hover:shadow-lg hover:shadow-secondary/5 transition-all text-left group cursor-pointer"
                >
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
