/**
 * Archivo: FoodDetail.tsx
 * Ruta: src/pages/FoodDetail.tsx
 * Última modificación: 2025-03-09
 * Descripción: Página de detalle de un alimento / nutriente. Muestra beneficios,
 *              momento óptimo de consumo, relación con el rendimiento deportivo,
 *              ejemplos prácticos y notas adicionales.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Clock, Zap, Star, FileText, Apple } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Colores por categoría de alimento usando tokens del design system */
const CATEGORY_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  proteinas:     { bg: 'bg-primary/10',   text: 'text-primary',   icon: '🥩' },
  carbohidratos: { bg: 'bg-accent/10',    text: 'text-accent',    icon: '🍞' },
  grasas:        { bg: 'bg-secondary/10', text: 'text-secondary', icon: '🥑' },
  hidratacion:   { bg: 'bg-info/10',      text: 'text-info',      icon: '💧' },
  suplementos:   { bg: 'bg-muted',        text: 'text-muted-foreground', icon: '💊' },
};

export default function FoodDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  /** Carga el alimento por ID desde la base de datos */
  const { data: food, isLoading } = useQuery({
    queryKey: ['food', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('food_wiki')
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
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  if (!food) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-muted-foreground">Alimento no encontrado</p>
        <Button variant="ghost" onClick={() => navigate('/biblioteca')} className="mt-4">
          <ArrowLeft size={16} className="mr-2" /> Volver
        </Button>
      </div>
    );
  }

  const catStyle = CATEGORY_STYLES[food.category] || CATEGORY_STYLES.suplementos;

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/biblioteca')}>
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{catStyle.icon}</span>
            <h1 className="font-display text-2xl font-extrabold text-foreground">{food.name}</h1>
          </div>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium mt-1 inline-block ${catStyle.bg} ${catStyle.text}`}>
            {food.category}
          </span>
        </div>
      </div>

      {/* Tarjeta visual de macro (decorativa) */}
      <div className={`rounded-xl p-6 flex items-center justify-center ${catStyle.bg}`}>
        <span className="text-7xl">{catStyle.icon}</span>
      </div>

      {/* Beneficios */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
          <Star size={16} className="text-secondary" /> Beneficios
        </h2>
        <p className="text-foreground/80 leading-relaxed">{food.benefits}</p>
      </div>

      {/* Mejor momento de consumo */}
      {food.best_time_to_consume && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-display font-bold text-foreground mb-2 flex items-center gap-2">
            <Clock size={16} className="text-primary" /> Mejor momento para consumir
          </h2>
          <p className="text-foreground/80 leading-relaxed">{food.best_time_to_consume}</p>
        </div>
      )}

      {/* Relación con el rendimiento */}
      {food.performance_relation && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-display font-bold text-foreground mb-2 flex items-center gap-2">
            <Zap size={16} className="text-accent" /> Impacto en el rendimiento
          </h2>
          <p className="text-foreground/80 leading-relaxed">{food.performance_relation}</p>
        </div>
      )}

      {/* Ejemplos */}
      {food.examples && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
            <Apple size={16} className="text-secondary" /> Ejemplos
          </h2>
          <div className="flex flex-wrap gap-2">
            {food.examples.split(',').map((ex: string) => (
              <span key={ex} className="text-sm bg-muted text-foreground px-3 py-1 rounded-full">
                {ex.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notas adicionales */}
      {food.notes && (
        <div className="bg-muted/50 border border-border rounded-xl p-5">
          <h2 className="font-display font-bold text-foreground mb-2 flex items-center gap-2">
            <FileText size={16} className="text-muted-foreground" /> Notas
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{food.notes}</p>
        </div>
      )}
    </div>
  );
}
