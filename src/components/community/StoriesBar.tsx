/**
 * Archivo: StoriesBar.tsx
 * Ruta: src/components/community/StoriesBar.tsx
 * Última modificación: 2026-03-09
 * Descripción: Barra de Stories estilo Instagram. Muestra círculos con avatar de cada
 *              usuario que subió una story activa (últimas 24h). Al hacer click abre
 *              un viewer de pantalla completa con avance automático de 5 segundos.
 *              Soporta swipe táctil (izquierda/derecha) para navegar entre stories.
 *              El botón "Tu story" abre el selector nativo de archivo/cámara del dispositivo.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { X, ChevronLeft, ChevronRight, Plus, Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

const STORY_DURATION = 5000;

interface Story {
  id: string;
  media_url: string;
  author_user_id: string;
  expires_at: string;
  created_at: string;
}

interface AuthorStories {
  authorId: string;
  fullName: string;
  avatarUrl: string | null;
  stories: Story[];
  hasUnread: boolean;
}

export default function StoriesBar() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [viewingAuthorIndex, setViewingAuthorIndex] = useState(-1);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [mediaError, setMediaError] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef(false);

  // Touch/swipe state
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  /** Fetch active stories with author profile data */
  const { data: storiesData } = useQuery({
    queryKey: ['stories-bar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stories')
        .select('*, users!author_user_id(id, profiles(full_name, avatar_url))')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      if (error) console.error('[StoriesBar] query error:', error);
      return data || [];
    },
    refetchInterval: 60000,
  });

  const uploadStory = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('No autenticado');

      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'video/mp4',
        'video/webm',
        'video/quicktime',
      ];

      if (!allowedTypes.includes(file.type.toLowerCase())) {
        throw new Error('Formato no soportado. Usá JPG, PNG, WEBP, GIF, MP4 o WEBM.');
      }
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('stories').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('stories').getPublicUrl(path);
      const { error: insertError } = await supabase.from('stories').insert({
        author_user_id: user.id,
        media_url: urlData.publicUrl,
      });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories-bar'] });
      toast.success('¡Story publicada! Estará activa por 24 horas');
    },
    onError: (err: any) => toast.error(err.message || 'Error al subir la story'),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadStory.mutate(file);
    e.target.value = '';
  };

  /** Group stories by author */
  const authorGroups: AuthorStories[] = [];
  (storiesData || []).forEach((s: any) => {
    const prof = s.users?.profiles || null;
    const existing = authorGroups.find(g => g.authorId === s.author_user_id);
    if (existing) {
      existing.stories.push(s);
    } else {
      authorGroups.push({
        authorId: s.author_user_id,
        fullName: prof?.full_name || 'Usuario',
        avatarUrl: prof?.avatar_url || null,
        stories: [s],
        hasUnread: true,
      });
    }
  });

  const openViewer = (authorIndex: number) => {
    setViewingAuthorIndex(authorIndex);
    setCurrentStoryIndex(0);
    setProgress(0);
  };

  const closeViewer = useCallback(() => {
    setViewingAuthorIndex(-1);
    setMediaError(false);
    setIsHolding(false);
    isHoldingRef.current = false;
    if (progressRef.current) clearInterval(progressRef.current);
  }, []);

  const nextAuthor = useCallback(() => {
    if (viewingAuthorIndex < authorGroups.length - 1) {
      setViewingAuthorIndex(i => i + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
      setMediaError(false);
      return;
    }

    closeViewer();
  }, [viewingAuthorIndex, authorGroups.length, closeViewer]);

  const prevAuthor = useCallback(() => {
    if (viewingAuthorIndex > 0) {
      setViewingAuthorIndex(i => i - 1);
      setCurrentStoryIndex(0);
      setProgress(0);
      setMediaError(false);
    }
  }, [viewingAuthorIndex]);

  const nextStory = useCallback(() => {
    const group = authorGroups[viewingAuthorIndex];
    if (!group) return;

    if (currentStoryIndex < group.stories.length - 1) {
      setCurrentStoryIndex(i => i + 1);
      setProgress(0);
      setMediaError(false);
      return;
    }

    nextAuthor();
  }, [viewingAuthorIndex, currentStoryIndex, authorGroups, nextAuthor]);

  const prevStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(i => i - 1);
      setProgress(0);
      setMediaError(false);
      return;
    }

    prevAuthor();
  }, [currentStoryIndex, prevAuthor]);

  /** Auto-advance timer */
  useEffect(() => {
    if (viewingAuthorIndex < 0) return;
    if (progressRef.current) clearInterval(progressRef.current);
    const interval = 50;
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

  /** Touch handlers for swipe */
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only horizontal swipes (ignore vertical scrolling)
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) nextStory();
      else prevStory();
    }
  };

  /** Tap left/right halves to navigate */
  const handleViewerTap = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) prevStory();
    else nextStory();
  };

  const currentAuthor = authorGroups[viewingAuthorIndex];
  const currentStory = currentAuthor?.stories[currentStoryIndex];

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ─── STORIES BAR ──────────────────────────────────────────────── */}
      <div className="flex gap-4 overflow-x-auto py-2 px-1 no-scrollbar">
        {/* Add story button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadStory.isPending}
          className="flex flex-col items-center gap-1.5 shrink-0 opacity-100 hover:opacity-80 transition-opacity"
        >
          <div className="relative w-16 h-16">
            <div className="w-16 h-16 rounded-full bg-muted border-2 border-dashed border-primary/40 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-muted-foreground">
                  {user?.email?.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center border-2 border-background">
              {uploadStory.isPending
                ? <span className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse" />
                : <Plus size={10} className="text-primary-foreground" />
              }
            </div>
          </div>
          <span className="text-xs text-muted-foreground font-medium truncate w-16 text-center">
            {uploadStory.isPending ? 'Subiendo...' : 'Tu story'}
          </span>
        </button>

        {/* Author circles */}
        {authorGroups.map((group, idx) => (
          <button
            key={group.authorId}
            onClick={() => openViewer(idx)}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <div className={`p-0.5 rounded-full ${group.hasUnread
              ? 'bg-gradient-to-tr from-primary via-orange-400 to-secondary'
              : 'bg-muted'
            }`}>
              <Avatar className="border-2 border-background w-[58px] h-[58px]">
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

        {authorGroups.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-4 px-2">
            <Camera size={14} />
            <span>¡Sé el primero en publicar una story!</span>
          </div>
        )}
      </div>

      {/* ─── FULLSCREEN STORY VIEWER ────────────────────────────────── */}
      {viewingAuthorIndex >= 0 && currentStory && (
        <div
          className="fixed inset-0 z-50 bg-black flex flex-col select-none"
          onClick={handleViewerTap}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 flex gap-1 p-3 z-10">
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

          {/* Header */}
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
            <button onClick={(e) => { e.stopPropagation(); closeViewer(); }} className="ml-auto text-white/80 hover:text-white p-1">
              <X size={22} />
            </button>
          </div>

          {/* Image */}
          <div className="flex-1 flex items-center justify-center">
            <img
              src={currentStory.media_url}
              alt="Story"
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${currentStory.id}/400/700`;
              }}
            />
          </div>

          {/* Nav buttons (desktop) */}
          <div
            className="absolute inset-y-0 left-0 right-0 hidden md:flex items-center justify-between px-2 pointer-events-none"
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
