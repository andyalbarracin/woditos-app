/**
 * Archivo: MemberProfileView.tsx
 * Ruta: src/pages/MemberProfileView.tsx
 * Última modificación: 2026-04-14
 * Descripción: Vista del perfil de un miembro desde la perspectiva del coach.
 *   Muestra datos personales, stats, feedback de sesiones y documentos.
 *   Ruta: /miembro/:id — accesible solo para coaches del mismo club.
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft, Loader2, User, Phone, Target,
  Calendar, Flame, TrendingUp, Trophy, Star,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import DocumentsTab from '@/components/documents/DocumentsTab';

const db = supabase as any;

const RATING_EMOJI: Record<number, string> = { 1: '😞', 2: '😕', 3: '😐', 4: '😊', 5: '🤩' };
const LEVEL_LABELS: Record<string, string> = {
  basic:        'Principiante',
  intermediate: 'Intermedio',
  advanced:     'Avanzado',
};

export default function MemberProfileView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Perfil del miembro ─────────────────────────────────────────
  const { data: memberData, isLoading } = useQuery({
    queryKey: ['member-profile-view', id],
    queryFn: async () => {
      const [{ data: profile }, { data: userData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', id!).single(),
        db.from('users').select('email, role, status, created_at').eq('id', id!).single(),
      ]);
      return { profile, user: userData };
    },
    enabled: !!id,
  });

  // ── Stats del miembro ──────────────────────────────────────────
  const { data: stats } = useQuery({
    queryKey: ['member-stats-coach-view', id],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_member_stats', { p_user_id: id! });
      return data as any;
    },
    enabled: !!id,
  });

  // ── Feedback de sesiones del miembro ───────────────────────────
  const { data: feedbacks } = useQuery({
    queryKey: ['member-feedback-coach-view', id],
    queryFn: async () => {
      // Solo feedback de sesiones del coach logueado
      const ago = new Date(); ago.setDate(ago.getDate() - 90);
      const { data: sessions } = await supabase.from('sessions')
        .select('id, title, start_time')
        .eq('coach_id', user!.id)
        .gte('start_time', ago.toISOString());

      if (!sessions?.length) return [];
      const ids = sessions.map(s => s.id);
      const sessionMap: Record<string, any> = {};
      sessions.forEach(s => { sessionMap[s.id] = s; });

      const { data } = await supabase.from('session_feedback')
        .select('*')
        .eq('user_id', id!)
        .in('session_id', ids)
        .order('created_at', { ascending: false });

      return (data ?? []).map(f => ({ ...f, session: sessionMap[f.session_id] }));
    },
    enabled: !!id && !!user?.id,
  });

  // ── Logros ─────────────────────────────────────────────────────
  const { data: achievements } = useQuery({
    queryKey: ['member-achievements-view', id],
    queryFn: async () => {
      const { data } = await supabase.from('achievements').select('*')
        .eq('user_id', id!).order('earned_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const profile = memberData?.profile;
  const userData = memberData?.user;

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in pb-10">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </Button>
        <h1 className="font-display text-xl font-bold text-foreground">Perfil del miembro</h1>
      </div>

      {/* Card de perfil */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
            <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold font-display">
              {profile?.full_name?.slice(0, 2).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl font-extrabold text-foreground">{profile?.full_name || 'Sin nombre'}</h2>
            <p className="text-sm text-muted-foreground">{userData?.email}</p>
            {profile?.join_date && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Miembro desde {format(new Date(profile.join_date), "MMMM yyyy", { locale: es })}
              </p>
            )}
            {profile?.experience_level && (
              <Badge variant="outline" className="text-xs mt-1">
                {LEVEL_LABELS[profile.experience_level] || profile.experience_level}
              </Badge>
            )}
          </div>
        </div>

        {/* Datos personales */}
        <div className="mt-4 pt-4 border-t border-border space-y-2">
          {profile?.emergency_contact && (
            <div className="flex items-center gap-2 text-sm">
              <Phone size={14} className="text-destructive shrink-0" />
              <span className="text-muted-foreground">Emergencia:</span>
              <span className="text-foreground font-medium">{profile.emergency_contact}</span>
            </div>
          )}
          {profile?.goals && (
            <div className="flex items-start gap-2 text-sm">
              <Target size={14} className="text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-muted-foreground">Objetivos: </span>
                <span className="text-foreground">{profile.goals}</span>
              </div>
            </div>
          )}
          {/* Campos opcionales: peso y altura (listos para mostrar cuando se quiera) */}
          {/* {profile?.weight_kg && <p className="text-sm text-muted-foreground">Peso: {profile.weight_kg} kg</p>} */}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Flame,      label: 'Racha',      value: `${stats?.current_streak || 0}`,        unit: 'd',  color: 'text-primary' },
          { icon: Calendar,   label: 'Sesiones',   value: `${stats?.total_sessions || 0}`,        unit: '',   color: 'text-secondary' },
          { icon: TrendingUp, label: 'Asistencia', value: `${stats?.attendance_percentage || 0}`, unit: '%',  color: 'text-accent' },
          { icon: Trophy,     label: 'Logros',     value: `${achievements?.length || 0}`,         unit: '',   color: 'text-info' },
        ].map(({ icon: Icon, label, value, unit, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
            <Icon size={18} className={`mx-auto ${color} mb-1`} />
            <p className="text-xl font-display font-bold text-foreground">
              {value}<span className="text-sm font-normal">{unit}</span>
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="feedback">
        <TabsList className="bg-card border border-border grid grid-cols-3 h-auto gap-1 p-1">
          <TabsTrigger value="feedback" className="text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Star size={12} /> Feedback
          </TabsTrigger>
          <TabsTrigger value="docs" className="text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            📄 Documentos
          </TabsTrigger>
          <TabsTrigger value="achievements" className="text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            🏆 Logros
          </TabsTrigger>
        </TabsList>

        {/* ── Feedback ─────────────────────────────────────────── */}
        <TabsContent value="feedback" className="mt-4">
          {!feedbacks?.length ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Star size={24} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Sin feedback en los últimos 90 días</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedbacks.map((f: any) => (
                <div key={f.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{RATING_EMOJI[f.rating] || '😐'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {f.session?.title || 'Sesión'}
                      </p>
                      {f.session?.start_time && (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(f.session.start_time), "d MMM yyyy · HH:mm", { locale: es })}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={12} className={i < f.rating ? 'text-accent fill-accent' : 'text-muted-foreground/30'} />
                      ))}
                    </div>
                  </div>
                  {f.discomforts?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {f.discomforts.map((d: string) => (
                        <span key={d} className="text-xs bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 rounded-full">{d}</span>
                      ))}
                    </div>
                  )}
                  {f.note && (
                    <p className="text-xs text-foreground/70 italic">"{f.note}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Documentos ───────────────────────────────────────── */}
        <TabsContent value="docs" className="mt-4">
          <DocumentsTab userId={id!} canUpload={false} canDelete={false} />
        </TabsContent>

        {/* ── Logros ───────────────────────────────────────────── */}
        <TabsContent value="achievements" className="mt-4">
          {!achievements?.length ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Trophy size={24} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Sin logros aún</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {achievements.map((a: any) => (
                <div key={a.id} className="bg-card border border-border rounded-xl p-4">
                  <p className="text-xl mb-1">🏅</p>
                  <p className="font-medium text-foreground text-sm">{a.title}</p>
                  {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
                  {a.earned_at && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {format(new Date(a.earned_at), "d MMM yyyy", { locale: es })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}