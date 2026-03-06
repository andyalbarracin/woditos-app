import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Search, Dumbbell, Apple, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const DIFFICULTY_COLORS: Record<string, string> = {
  basic: 'bg-secondary/10 text-secondary',
  intermediate: 'bg-accent/10 text-accent',
  advanced: 'bg-destructive/10 text-destructive',
};

export default function Library() {
  const [search, setSearch] = useState('');

  const { data: exercises } = useQuery({
    queryKey: ['exercises', search],
    queryFn: async () => {
      let query = supabase.from('exercise_wiki').select('*').order('name');
      if (search) query = query.ilike('name', `%${search}%`);
      const { data } = await query;
      return data || [];
    },
  });

  const { data: foods } = useQuery({
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
      <h1 className="font-display text-3xl font-extrabold text-foreground">Biblioteca</h1>

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
          <TabsTrigger value="exercises" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Dumbbell size={16} /> Ejercicios
          </TabsTrigger>
          <TabsTrigger value="foods" className="gap-2 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
            <Apple size={16} /> Nutrición
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exercises" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {exercises && exercises.length > 0 ? (
              exercises.map((ex: any) => (
                <div key={ex.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-display font-bold text-foreground">{ex.name}</h3>
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[ex.difficulty_level]}`}>
                      {ex.difficulty_level}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{ex.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ex.category && <Badge variant="outline" className="text-xs">{ex.category}</Badge>}
                    {ex.muscle_group && <Badge variant="outline" className="text-xs">{ex.muscle_group}</Badge>}
                    {ex.tags?.slice(0, 3).map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                  {ex.technique && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Técnica</p>
                      <p className="text-sm text-foreground/80 line-clamp-3">{ex.technique}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-2 bg-card border border-border rounded-xl p-8 text-center">
                <Dumbbell size={32} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No hay ejercicios registrados</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="foods" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {foods && foods.length > 0 ? (
              foods.map((food: any) => (
                <div key={food.id} className="bg-card border border-border rounded-xl p-5 hover:border-secondary/30 transition-colors cursor-pointer">
                  <h3 className="font-display font-bold text-foreground mb-1">{food.name}</h3>
                  <Badge variant="outline" className="text-xs mb-3">{food.category}</Badge>
                  <p className="text-sm text-muted-foreground mb-3">{food.benefits}</p>
                  {food.best_time_to_consume && (
                    <p className="text-xs text-secondary">
                      <span className="font-medium">Mejor momento:</span> {food.best_time_to_consume}
                    </p>
                  )}
                  {food.performance_relation && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="font-medium">Rendimiento:</span> {food.performance_relation}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-2 bg-card border border-border rounded-xl p-8 text-center">
                <Apple size={32} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No hay alimentos registrados</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
