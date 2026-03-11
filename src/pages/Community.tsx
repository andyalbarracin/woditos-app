/**
 * Archivo: Community.tsx
 * Ruta: src/pages/Community.tsx
 * Última modificación: 2026-03-09
 * Descripción: Página de comunidad con Stories, compositor de posts, feed con
 *              reacciones (like toggle) y comentarios funcionales.
 */

import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Heart, MessageCircle, Send, Image, Award, Megaphone, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import StoriesBar from '@/components/community/StoriesBar';

const PAGE_SIZE = 15;

export default function Community() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState('');
  const [postType, setPostType] = useState<'text' | 'milestone' | 'announcement'>('text');
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});

  /** Feed query */
  const { data, fetchNextPage, hasNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam = 0 }) => {
      const { data } = await supabase
        .from('posts')
        .select('*, users!author_user_id(id, profiles(full_name, avatar_url)), reactions(id, user_id, reaction_type), comments(id)')
        .order('created_at', { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);
      return data || [];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _, lastPageParam) =>
      lastPage.length === PAGE_SIZE ? lastPageParam + 1 : undefined,
  });

  /** Create post */
  const createPostMutation = useMutation({
    mutationFn: async (text: string) => {
      const sanitized = sanitizeText(text);
      if (!sanitized || sanitized.length > 2000) throw new Error('Contenido inválido');
      const { error } = await supabase.from('posts').insert({
        author_user_id: user!.id,
        content_text: sanitized,
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

  /** Toggle like */
  const toggleLike = useMutation({
    mutationFn: async ({ postId, existingReactionId }: { postId: string; existingReactionId: string | null }) => {
      if (existingReactionId) {
        const { error } = await supabase.from('reactions').delete().eq('id', existingReactionId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('reactions').insert({
          post_id: postId,
          user_id: user!.id,
          reaction_type: 'like',
        });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
    onError: () => toast.error('No se pudo procesar tu reacción'),
  });

  /** Add comment */
  const addComment = useMutation({
    mutationFn: async ({ postId, text }: { postId: string; text: string }) => {
      const sanitized = sanitizeText(text);
      if (!sanitized || sanitized.length > 1000) throw new Error('Comentario inválido');
      const { error } = await supabase.from('comments').insert({
        post_id: postId,
        author_user_id: user!.id,
        content_text: sanitized,
      });
      if (error) throw error;
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      setCommentTexts(prev => ({ ...prev, [postId]: '' }));
      toast.success('Comentario agregado');
    },
    onError: () => toast.error('No se pudo agregar el comentario'),
  });

  const posts = data?.pages.flat() || [];

  const POST_TYPE_STYLES: Record<string, { label: string; className: string }> = {
    announcement: { label: '📢 Anuncio', className: 'bg-primary/10 text-primary' },
    milestone:    { label: '🏆 Logro',   className: 'bg-accent/10 text-accent' },
    text:         { label: 'Post',        className: '' },
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      <h1 className="font-display text-3xl font-extrabold text-foreground">Crew</h1>

      {/* Stories */}
      <div className="bg-card border border-border rounded-xl px-3 py-2">
        <StoriesBar />
      </div>

      {/* Post composer */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-start gap-3">
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
            <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
              <div className="flex gap-1">
                <Button variant={postType === 'text' ? 'default' : 'ghost'} size="sm"
                  className={`text-xs gap-1 ${postType === 'text' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
                  onClick={() => setPostType('text')}>
                  <Image size={13} /> Post
                </Button>
                <Button variant={postType === 'milestone' ? 'default' : 'ghost'} size="sm"
                  className={`text-xs gap-1 ${postType === 'milestone' ? 'bg-accent/20 text-accent' : 'text-muted-foreground'}`}
                  onClick={() => setPostType('milestone')}>
                  <Award size={13} /> Logro
                </Button>
                <Button variant={postType === 'announcement' ? 'default' : 'ghost'} size="sm"
                  className={`text-xs gap-1 ${postType === 'announcement' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
                  onClick={() => setPostType('announcement')}>
                  <Megaphone size={13} /> Anuncio
                </Button>
              </div>
              <Button size="sm" onClick={() => createPostMutation.mutate(newPost)}
                disabled={!newPost.trim() || createPostMutation.isPending}
                className="gradient-primary text-primary-foreground gap-2 ml-auto">
                <Send size={14} /> Publicar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse h-32" />
          ))
        ) : posts.length > 0 ? (
          posts.map((post: any) => {
            const typeStyle = POST_TYPE_STYLES[post.post_type] || POST_TYPE_STYLES.text;
            const authorProfile = post.users?.profiles;
            const reactions = post.reactions || [];
            const myReaction = reactions.find((r: any) => r.user_id === user?.id);
            const likeCount = reactions.length;
            const commentCount = post.comments?.length || 0;
            const isExpanded = expandedComments[post.id];

            return (
              <div key={post.id} className="bg-card border border-border rounded-xl p-5">
                {/* Post header */}
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
                  {post.post_type !== 'text' && typeStyle.className && (
                    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${typeStyle.className}`}>
                      {typeStyle.label}
                    </span>
                  )}
                </div>

                <p className="text-foreground/90 leading-relaxed">{post.content_text}</p>

                {post.media_url && (
                  <img src={post.media_url} alt="" className="mt-3 rounded-lg w-full object-cover max-h-80" />
                )}

                {/* Actions: like + comment */}
                <div className="flex items-center gap-6 mt-4 pt-3 border-t border-border">
                  <button
                    onClick={() => toggleLike.mutate({ postId: post.id, existingReactionId: myReaction?.id || null })}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${
                      myReaction ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
                    }`}
                  >
                    <Heart size={16} className={myReaction ? 'fill-current' : ''} />
                    <span>{likeCount}</span>
                  </button>
                  <button
                    onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <MessageCircle size={16} />
                    <span>{commentCount}</span>
                    {commentCount > 0 && (isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </button>
                </div>

                {/* Comments section */}
                {isExpanded && (
                  <CommentsSection
                    postId={post.id}
                    userId={user?.id || ''}
                    commentText={commentTexts[post.id] || ''}
                    onCommentTextChange={(t) => setCommentTexts(prev => ({ ...prev, [post.id]: t }))}
                    onSubmit={() => {
                      const text = commentTexts[post.id]?.trim();
                      if (text) addComment.mutate({ postId: post.id, text });
                    }}
                    isSubmitting={addComment.isPending}
                  />
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <MessageCircle size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Sé el primero en publicar algo</p>
          </div>
        )}

        {hasNextPage && (
          <Button variant="outline" className="w-full" onClick={() => fetchNextPage()}>
            Cargar más
          </Button>
        )}
      </div>
    </div>
  );
}

/** Subcomponent: comments list + input */
function CommentsSection({
  postId, userId, commentText, onCommentTextChange, onSubmit, isSubmitting
}: {
  postId: string; userId: string; commentText: string;
  onCommentTextChange: (t: string) => void; onSubmit: () => void; isSubmitting: boolean;
}) {
  const { data: comments } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data } = await supabase
        .from('comments')
        .select('*, users!author_user_id(id, profiles(full_name, avatar_url))')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      return data || [];
    },
  });

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-3">
      {(comments || []).map((c: any) => {
        const cp = c.users?.profiles;
        return (
          <div key={c.id} className="flex gap-2">
            <Avatar className="h-7 w-7 shrink-0">
              {cp?.avatar_url && <AvatarImage src={cp.avatar_url} />}
              <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-bold">
                {cp?.full_name?.slice(0, 2).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs">
                <span className="font-semibold text-foreground">{cp?.full_name || 'Usuario'}</span>{' '}
                <span className="text-muted-foreground">
                  {format(new Date(c.created_at), 'd MMM HH:mm', { locale: es })}
                </span>
              </p>
              <p className="text-sm text-foreground/90">{c.content_text}</p>
            </div>
          </div>
        );
      })}

      {/* Comment input */}
      <div className="flex gap-2">
        <Input
          placeholder="Escribí un comentario..."
          value={commentText}
          onChange={(e) => onCommentTextChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(); } }}
          className="bg-background border-border text-sm h-9"
        />
        <Button size="sm" onClick={onSubmit} disabled={!commentText.trim() || isSubmitting}
          className="h-9 px-3 gradient-primary text-primary-foreground">
          <Send size={14} />
        </Button>
      </div>
    </div>
  );
}
