import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Heart, MessageCircle, Send, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function Community() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState('');

  const { data, fetchNextPage, hasNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam = 0 }) => {
      const PAGE_SIZE = 15;
      const { data } = await supabase
        .from('posts')
        .select('*, profiles!author_user_id(full_name, avatar_url), reactions(count), comments(count)')
        .order('created_at', { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);
      return data || [];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _, lastPageParam) =>
      lastPage.length === 15 ? lastPageParam + 1 : undefined,
  });

  const createPostMutation = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await supabase.from('posts').insert({
        author_user_id: user!.id,
        content_text: text,
        post_type: 'text',
        visibility: 'all_members',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      setNewPost('');
      toast.success('Publicación creada');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const posts = data?.pages.flat() || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="font-display text-3xl font-extrabold text-foreground">Comunidad</h1>

      {/* Post Composer */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
            {profile?.full_name?.slice(0, 2).toUpperCase() || '?'}
          </div>
          <div className="flex-1">
            <Textarea
              placeholder="¿Qué tal tu entrenamiento hoy?"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="bg-background border-0 resize-none min-h-[60px] p-0 focus-visible:ring-0 text-foreground"
            />
            <div className="flex items-center justify-between mt-3">
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
                <Image size={16} /> Foto
              </Button>
              <Button
                size="sm"
                onClick={() => createPostMutation.mutate(newPost)}
                disabled={!newPost.trim() || createPostMutation.isPending}
                className="gradient-primary text-primary-foreground gap-2"
              >
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
          posts.map((post: any) => (
            <div key={post.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {post.profiles?.full_name?.slice(0, 2).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{post.profiles?.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(post.created_at), "d MMM · HH:mm", { locale: es })}
                  </p>
                </div>
                {post.post_type === 'announcement' && (
                  <span className="ml-auto text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    Anuncio
                  </span>
                )}
                {post.post_type === 'milestone' && (
                  <span className="ml-auto text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                    🏆 Logro
                  </span>
                )}
              </div>

              <p className="text-foreground/90 leading-relaxed">{post.content_text}</p>

              {post.media_url && (
                <img src={post.media_url} alt="" className="mt-3 rounded-lg w-full object-cover max-h-80" />
              )}

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
          ))
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
