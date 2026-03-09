/**
 * Archivo: StoriesBar.tsx
 * Ruta: src/components/community/StoriesBar.tsx
 * Última modificación: 2025-03-09
 * Descripción: Barra de Stories estilo Instagram. Muestra círculos con avatar de cada
 *              usuario que subió una story activa (últimas 24h). Al hacer click abre
 *              un viewer de pantalla completa con avance automático de 5 segundos.
 *              Usa datos reales de la tabla `stories` + `profiles`.
 */

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { X, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

/** Tiempo de visualización automática por story (ms) */
const STORY_DURATION = 5000;

/** Una story individual del servidor */
interface Story {
  id: string;
  media_url: string;
  author_user_id: string;
  expires_at: string;
  created_at: string;
}

/** Story agrupada por autor para mostrar en la barra */
interface AuthorStories {
  authorId: string;
  fullName: string;
  avatarUrl: string | null;
  stories: Story[];
  hasUnread: boolean; // (futuro: tracking de vistas)
}

/** Props del componente */
interface StoriesBarProps {
  onAddStory?: () => void;
}

export default function StoriesBar({ onAddStory }: StoriesBarProps) {
  const { user } = useAuth();

  // Índice del grupo de autor abierto en el viewer (-1 = cerrado)
  const [viewingAuthorIndex, setViewingAuthorIndex] = useState(-1);
  // Índice de la story actual dentro del grupo del autor
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  // Progreso de la barra de tiempo (0–100)
  const [progress, setProgress] = useState(0);

  const progressRef = useRef<NodeJS.Timeout | null>(null);

  /** Carga stories activas (no vencidas) de las últimas 24h con perfil del autor */
  const { data: storiesData } = useQuery({
    queryKey: ['stories-bar'],
    queryFn: async () => {
      const { data } = await supabase
        .from('stories')
        .select('*, profiles!author_user_id(full_name, avatar_url)')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      return data || [];
    },
    refetchInterval: 60000, // refrescar cada minuto
  });

  /**
   * Agrupa las stories por autor para mostrar un solo círculo por persona.
   * El autor con más stories recientes aparece primero.
   */
  const authorGroups: AuthorStories[] = [];
  (storiesData || []).forEach((s: any) => {
    const existing = authorGroups.find(g => g.authorId === s.author_user_id);
    if (existing) {
      existing.stories.push(s);
    } else {
      authorGroups.push({
        authorId: s.author_user_id,
        fullName: s.profiles?.full_name || 'Usuario',
        avatarUrl: s.profiles?.avatar_url || null,
        stories: [s],
        hasUnread: true,
      });
    }
  });

  /** Abre el viewer en el grupo del autor indicado */
  const openViewer = (authorIndex: number) => {
    setViewingAuthorIndex(authorIndex);
    setCurrentStoryIndex(0);
    setProgress(0);
  };

  /** Cierra el viewer */
  const closeViewer = () => {
    setViewingAuthorIndex(-1);
    if (progressRef.current) clearInterval(progressRef.current);
  };

  /** Avanza a la siguiente story o siguiente autor */
  const nextStory = () => {
    const group = authorGroups[viewingAuthorIndex];
    if (!group) return;
    if (currentStoryIndex < group.stories.length - 1) {
      setCurrentStoryIndex(i => i + 1);
      setProgress(0);
    } else if (viewingAuthorIndex < authorGroups.length - 1) {
      setViewingAuthorIndex(i => i + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      closeViewer();
    }
  };

  /** Retrocede a la story anterior o autor anterior */
  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(i => i - 1);
      setProgress(0);
    } else if (viewingAuthorIndex > 0) {
      setViewingAuthorIndex(i => i - 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    }
  };

  /**
   * Efecto: maneja el avance automático con barra de progreso.
   * Se resetea cada vez que cambia la story activa.
   */
  useEffect(() => {
    if (viewingAuthorIndex < 0) return;
    if (progressRef.current) clearInterval(progressRef.current);
    const interval = 50; // ms entre updates de progreso
    const steps = STORY_DURATION / interval;
    let step = 0;
    progressRef.current = setInterval(() => {
      step++;
      setProgress((step / steps) * 100);
      if (step >= steps) {
        clearInterval(progressRef.current!);
        nextStory();
      }
    }, interval);
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [viewingAuthorIndex, currentStoryIndex]);

  const currentAuthor = authorGroups[viewingAuthorIndex];
  const currentStory = currentAuthor?.stories[currentStoryIndex];

  return (
    <>
      {/* ─── BARRA DE STORIES ──────────────────────────────────────────────── */}
      <div className="flex gap-4 overflow-x-auto py-2 px-1 no-scrollbar">

        {/* Botón "Tu story" (agregar) */}
        <button
          onClick={onAddStory}
          className="flex flex-col items-center gap-1.5 shrink-0"
        >
          <div className="relative w-16 h-16">
            {/* Avatar del usuario actual */}
            <div className="w-16 h-16 rounded-full bg-muted border-2 border-border flex items-center justify-center overflow-hidden">
              <span className="text-xl font-bold text-muted-foreground">
                {user?.email?.slice(0, 2).toUpperCase()}
              </span>
            </div>
            {/* Botón + superpuesto */}
            <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center border-2 border-background">
              <Plus size={10} className="text-primary-foreground" />
            </div>
          </div>
          <span className="text-xs text-muted-foreground font-medium truncate w-16 text-center">Tu story</span>
        </button>

        {/* Círculos de stories por autor */}
        {authorGroups.map((group, idx) => (
          <button
            key={group.authorId}
            onClick={() => openViewer(idx)}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            {/* Anillo gradiente indicando story activa */}
            <div className={`p-0.5 rounded-full ${group.hasUnread
              ? 'bg-gradient-to-tr from-primary via-accent to-secondary'
              : 'bg-muted'
            }`}>
              <Avatar className="w-15 h-15 border-2 border-background w-[58px] h-[58px]">
                {group.avatarUrl && <AvatarImage src={group.avatarUrl} />}
                <AvatarFallback className="bg-card text-foreground font-bold text-sm">
                  {group.fullName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <span className="text-xs text-foreground font-medium truncate w-16 text-center">
              {group.fullName.split(' ')[0]}
            </span>
          </button>
        ))}

        {/* Estado vacío si no hay stories */}
        {authorGroups.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-4 px-2">
            <span>No hay stories activas — ¡sé el primero!</span>
          </div>
        )}
      </div>

      {/* ─── VIEWER DE STORIES (OVERLAY FULLSCREEN) ────────────────────────── */}
      {viewingAuthorIndex >= 0 && currentStory && (
        <div
          className="fixed inset-0 z-50 bg-black flex flex-col"
          onClick={nextStory}
        >
          {/* Barras de progreso (una por story del autor) */}
          <div className="absolute top-0 left-0 right-0 flex gap-1 p-3 pt-safe z-10">
            {currentAuthor.stories.map((_, i) => (
              <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-none"
                  style={{
                    width: i < currentStoryIndex ? '100%' : i === currentStoryIndex ? `${progress}%` : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header: avatar + nombre + cerrar */}
          <div
            className="absolute top-0 left-0 right-0 flex items-center gap-3 p-4 pt-8 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <Avatar className="w-9 h-9 border border-white/40">
              {currentAuthor.avatarUrl && <AvatarImage src={currentAuthor.avatarUrl} />}
              <AvatarFallback className="bg-black/40 text-white text-xs font-bold">
                {currentAuthor.fullName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-semibold text-sm leading-none">{currentAuthor.fullName}</p>
              <p className="text-white/60 text-xs mt-0.5">
                {new Date(currentStory.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <button onClick={closeViewer} className="ml-auto text-white/80 hover:text-white">
              <X size={22} />
            </button>
          </div>

          {/* Imagen o video de la story */}
          <div className="flex-1 flex items-center justify-center">
            <img
              src={currentStory.media_url}
              alt="Story"
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                // Fallback si la imagen no carga
                (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${currentStory.id}/400/700`;
              }}
            />
          </div>

          {/* Botones prev/next (evitan propagación al overlay) */}
          <div
            className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 pointer-events-none"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center text-white pointer-events-auto"
              onClick={(e) => { e.stopPropagation(); prevStory(); }}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center text-white pointer-events-auto"
              onClick={(e) => { e.stopPropagation(); nextStory(); }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
