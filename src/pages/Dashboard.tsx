/**
 * Archivo: Dashboard.tsx
 * Ruta: src/pages/Dashboard.tsx
 * Última modificación: 2026-04-10
 * Descripción: Dashboard principal. Orquesta entre CoachDashboardView y MemberDashboardView.
 *   Carga stats compartidos y el feed de actividad reciente.
 *   v1.1 (seguridad): recentPosts filtrado por miembros del mismo club en dos pasos.
 *         Antes mostraba posts de TODOS los clubs.
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

const db = supabase as any;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function Dashboard() {
  const { profile, user, clubMembership } = useAuth();
  const navigate = useNavigate();
  const isCoach = user?.role === 'coach' || user?.role === 'super_admin';
  const clubId = clubMembership?.club_id;

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
    queryKey: ['recent-posts', clubId],
    queryFn: async () => {
      if (!clubId) return [];

      // Paso 1: obtener user_ids de todos los miembros activos del club.
      // Los posts tienen author_user_id. Filtramos por autores del mismo club
      // para evitar mostrar posts de otros clubs.
      const { data: members } = await db
        .from('club_memberships')
        .select('user_id')
        .eq('club_id', clubId)
        .eq('status', 'active');

      const memberIds = (members || []).map((m: any) => m.user_id);
      if (memberIds.length === 0) return [];

      // Paso 2: posts recientes solo de miembros del mismo club.
      const { data } = await supabase
        .from('posts')
        .select('*, users!author_user_id(id, profiles(full_name, avatar_url))')
        .in('author_user_id', memberIds)
        .order('created_at', { ascending: false })
        .limit(3);

      return data || [];
    },
    enabled: !!clubId,
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