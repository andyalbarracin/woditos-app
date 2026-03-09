/**
 * Archivo: Community.tsx
 * Ruta: src/pages/Community.tsx
 * Última modificación: 2025-03-09
 * Descripción: Página de comunidad. Muestra la barra de Stories estilo Instagram
 *              (24h de duración), un compositor de posts, y el feed paginado de
 *              publicaciones con reacciones y comentarios.
 */

import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Heart, MessageCircle, Send, Image, Award, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import StoriesBar from '@/components/community/StoriesBar';

/** Cantidad de posts por página en el feed */
const PAGE_SIZE = 15;

export default function Community() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState('');
  // Tipo de post seleccionado para el compositor
  const [postType, setPostType] = useState<'text' | 'milestone' | 'announcement'>('text');

  /**
   * Consulta paginada del feed de posts con perfil del autor, reacciones y comentarios.
   * FK: posts.author_user_id → users.id, y users.id ← profiles.user_id
   * Por lo tanto usamos users!author_user_id(id, profiles(...)) para hacer el join correctamente.
   */
  const { data, fetchNextPage, hasNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam = 0 }) => {
      const { data } = await supabase
        .from('posts')
        .select('*, users!author_user_id(id, profiles(full_name, avatar_url)), reactions(count), comments(count)')
        .order('created_at', { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);
      return data || [];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _, lastPageParam) =>
      lastPage.length === PAGE_SIZE ? lastPageParam + 1 : undefined,
  });

  /** Mutación para crear un nuevo post */
  const createPostMutation = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await supabase.from('posts').insert({
        author_user_id: user!.id,
        content_text: text,
        post_type: postType,
        visibility: 'all_members',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      setNewPost('');
      setPostType('text');
      toast.success('Publicación creada');
    },
    onError: () => toast.error('No se pudo crear la publicación. Intentá de nuevo.'),
  });

  /** Todos los posts aplanados de todas las páginas */
  const posts = data?.pages.flat() || [];

  /** Mapeo de tipo de post a estilos visuales */
  const POST_TYPE_STYLES: Record<string, { label: string; className: string }> = {
    announcement: { label: '📢 Anuncio', className: 'bg-primary/10 text-primary' },
    milestone:    { label: '🏆 Logro',   className: 'bg-accent/10 text-accent' },
    text:         { label: 'Post',        className: '' },
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      <h1 className="font-display text-3xl font-extrabold text-foreground">Crew</h1>

      {/* ─── STORIES BAR ─────────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl px-3 py-2">
        <StoriesBar />
      </div>

      {/* ─── COMPOSITOR DE POSTS ──────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-start gap-3">
          {/* Avatar del usuario actual */}
          <Avatar className="h-10 w-10 shrink-0">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
            <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
              {profile?.full_name?.slice(0, 2).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <Textarea
              placeholder="¿Qué tal tu entrenamiento hoy?"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="bg-background border-0 resize-none min-h-[60px] p-0 focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
            />

            {/* Selector de tipo de post + botón publicar */}
            <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
              <div className="flex gap-1">
                {/* Tipo normal */}
                <Button
                  variant={postType === 'text' ? 'default' : 'ghost'}
                  size="sm"
                  className={`text-xs gap-1 ${postType === 'text' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
                  onClick={() => setPostType('text')}
                >
                  <Image size={13} /> Post
                </Button>
                {/* Logro personal */}
                <Button
                  variant={postType === 'milestone' ? 'default' : 'ghost'}
                  size="sm"
                  className={`text-xs gap-1 ${postType === 'milestone' ? 'bg-accent/20 text-accent' : 'text-muted-foreground'}`}
                  onClick={() => setPostType('milestone')}
                >
                  <Award size={13} /> Logro
                </Button>
                {/* Anuncio (visible para coaches) */}
                <Button
                  variant={postType === 'announcement' ? 'default' : 'ghost'}
                  size="sm"
                  className={`text-xs gap-1 ${postType === 'announcement' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
                  onClick={() => setPostType('announcement')}
                >
                  <Megaphone size={13} /> Anuncio
                </Button>
              </div>

              <Button
                size="sm"
                onClick={() => createPostMutation.mutate(newPost)}
                disabled={!newPost.trim() || createPostMutation.isPending}
                className="gradient-primary text-primary-foreground gap-2 ml-auto"
              >
                <Send size={14} /> Publicar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── FEED DE POSTS ────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {isLoading ? (
          // Skeletons de carga
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse h-32" />
          ))
        ) : posts.length > 0 ? (
          posts.map((post: any) => {
            const typeStyle = POST_TYPE_STYLES[post.post_type] || POST_TYPE_STYLES.text;
            // El perfil viene anidado en users.profiles debido al join correcto
            const authorProfile = post.users?.profiles;
            return (
              <div key={post.id} className="bg-card border border-border rounded-xl p-5">
                {/* Header del post: avatar, nombre, fecha, badge de tipo */}
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    {authorProfile?.avatar_url && <AvatarImage src={authorProfile.avatar_url} />}
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                      {authorProfile?.full_name?.slice(0, 2).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">{authorProfile?.full_name || 'Usuario'}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(post.created_at), "d MMM · HH:mm", { locale: es })}
                    </p>
                  </div>
                  {/* Badge de tipo solo si no es texto común */}
                  {post.post_type !== 'text' && typeStyle.className && (
                    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${typeStyle.className}`}>
                      {typeStyle.label}
                    </span>
                  )}
                </div>

                {/* Contenido del post */}
                <p className="text-foreground/90 leading-relaxed">{post.content_text}</p>

                {/* Imagen adjunta (si existe) */}
                {post.media_url && (
                  <img src={post.media_url} alt="" className="mt-3 rounded-lg w-full object-cover max-h-80" />
                )}

                {/* Acciones: like + comentario */}
                <div className="flex items-center gap-6 mt-4 pt-3 border-t border-border">
                  <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Heart size={16} />
                    <span>{post.reactions?.[0]?.count || 0}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <MessageCircle size={16} />
                    <span>{post.comments?.[0]?.count || 0}</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <MessageCircle size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Sé el primero en publicar algo</p>
          </div>
        )}

        {/* Botón cargar más */}
        {hasNextPage && (
          <Button variant="outline" className="w-full" onClick={() => fetchNextPage()}>
            Cargar más
          </Button>
        )}
      </div>
    </div>
  );
}
