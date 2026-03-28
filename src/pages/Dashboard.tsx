/**
 * Archivo: Dashboard.tsx
 * Ruta: src/pages/Dashboard.tsx
 * Última modificación: 2026-03-28
 * Descripción: Dashboard principal. Orquesta entre CoachDashboardView y MemberDashboardView.
 *   Carga stats compartidos y el feed de actividad reciente.
 */
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Users, ChevronRight } from 'lucide-react';
import CoachDashboardView from '@/components/dashboard/CoachDashboardView';
import MemberDashboardView from '@/components/dashboard/MemberDashboardView';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function Dashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const isCoach = user?.role === 'coach' || user?.role === 'super_admin';

  const { data: stats } = useQuery({
    queryKey: ['member-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.rpc('get_member_stats', { p_user_id: user.id });
      return data as any;
    },
    enabled: !!user?.id,
  });

  const { data: achievements } = useQuery({
    queryKey: ['achievements-count', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('achievements').select('id').eq('user_id', user!.id);
      return data || [];
    },
    enabled: !!user?.id && !isCoach,
  });

  const { data: recentPosts } = useQuery({
    queryKey: ['recent-posts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('posts')
        .select('*, users!author_user_id(id, profiles(full_name, avatar_url))')
        .order('created_at', { ascending: false })
        .limit(3);
      return data || [];
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">

      {/* Header */}
      <div>
        <p className="text-muted-foreground text-sm">{greeting()}</p>
        <h1 className="font-display text-3xl font-extrabold text-foreground">
          {profile?.full_name || 'Atleta'} {isCoach ? '💪' : '🏃'}
        </h1>
      </div>

      {/* Vista diferenciada por rol */}
      {isCoach
        ? <CoachDashboardView stats={stats} />
        : <MemberDashboardView stats={stats} achievements={achievements || []} />
      }

      {/* Feed de actividad reciente */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-foreground">Actividad Reciente</h2>
          <button onClick={() => navigate('/comunidad')}
            className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
            Ver más <ChevronRight size={14} />
          </button>
        </div>
        <div className="space-y-3">
          {recentPosts && recentPosts.length > 0 ? recentPosts.map((p: any) => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {p.users?.profiles?.full_name?.slice(0, 2).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{p.users?.profiles?.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(p.created_at), "d MMM · HH:mm", { locale: es })}
                  </p>
                </div>
              </div>
              <p className="text-sm text-foreground/80">{p.content_text}</p>
            </div>
          )) : (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Users size={32} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Sin actividad reciente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}