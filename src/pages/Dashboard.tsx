/**
 * Archivo: Dashboard.tsx
 * Ruta: src/pages/Dashboard.tsx
 * Última modificación: 2026-03-09
 * Descripción: Pantalla principal del miembro. Muestra saludo, estadísticas
 *              de asistencia, próximas sesiones y actividad reciente del feed.
 */
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Flame, TrendingUp, Users, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const SESSION_COLORS: Record<string, string> = {
  running: 'bg-secondary',
  functional: 'bg-primary',
  amrap: 'bg-primary',
  emom: 'bg-accent',
  hiit: 'bg-destructive',
  technique: 'bg-info',
};

export default function Dashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  const { data: upcomingSessions } = useQuery({
    queryKey: ['upcoming-sessions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('sessions')
        .select('*, groups(name)')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(5);
      return data || [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['member-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.rpc('get_member_stats', { p_user_id: user.id });
      return data as any;
    },
    enabled: !!user?.id,
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

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-muted-foreground text-sm">{greeting()}</p>
        <h1 className="font-display text-3xl font-extrabold text-foreground">
          {profile?.full_name || 'Atleta'} 🏃
        </h1>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Flame, label: 'Racha', value: `${stats?.current_streak || 0} días`, color: 'text-primary' },
          { icon: Calendar, label: 'Sesiones', value: `${stats?.total_sessions || 0}`, color: 'text-secondary' },
          { icon: TrendingUp, label: 'Asistencia', value: `${stats?.attendance_percentage || 0}%`, color: 'text-accent' },
          { icon: Users, label: 'Presentes', value: `${stats?.present_sessions || 0}`, color: 'text-info' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 space-y-2">
            <Icon size={18} className={color} />
            <p className="text-2xl font-display font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* Next Sessions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-foreground">Próximas Sesiones</h2>
          <button onClick={() => navigate('/agenda')} className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
            Ver todas <ChevronRight size={14} />
          </button>
        </div>
        <div className="space-y-3">
          {upcomingSessions && upcomingSessions.length > 0 ? (
            upcomingSessions.map((s: any) => (
              <div key={s.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors cursor-pointer">
                <div className={`w-1.5 h-12 rounded-full ${SESSION_COLORS[s.session_type] || 'bg-primary'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{s.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(s.start_time), "EEEE d MMM · HH:mm", { locale: es })}
                    {s.groups?.name && ` · ${s.groups.name}`}
                  </p>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                  {s.session_type}
                </span>
              </div>
            ))
          ) : (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Calendar size={32} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No hay sesiones próximas</p>
              <p className="text-sm text-muted-foreground mt-1">Tu coach publicará nuevas sesiones pronto</p>
            </div>
          )}
        </div>
      </div>

      {/* Activity Feed Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-foreground">Actividad Reciente</h2>
          <button onClick={() => navigate('/comunidad')} className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
            Ver más <ChevronRight size={14} />
          </button>
        </div>
        <div className="space-y-3">
          {recentPosts && recentPosts.length > 0 ? (
            recentPosts.map((p: any) => (
              <div key={p.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {p.profiles?.full_name?.slice(0, 2).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.profiles?.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(p.created_at), "d MMM · HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-foreground/80">{p.content_text}</p>
              </div>
            ))
          ) : (
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
