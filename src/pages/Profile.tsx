import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Flame, Calendar, TrendingUp, Trophy, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    goals: profile?.goals || '',
    emergency_contact: profile?.emergency_contact || '',
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

  const { data: achievements } = useQuery({
    queryKey: ['achievements', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('achievements').select('*').eq('user_id', user!.id).order('earned_at', { ascending: false });
      return data || [];
    },
    enabled: !!user?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('profiles').update({
        full_name: form.full_name,
        goals: form.goals,
        emergency_contact: form.emergency_contact,
      }).eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setEditing(false);
      toast.success('Perfil actualizado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Profile Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold font-display">
              {profile?.full_name?.slice(0, 2).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-extrabold text-foreground">{profile?.full_name}</h1>
            <p className="text-sm text-muted-foreground capitalize">{user?.role} · {user?.email}</p>
            {profile?.join_date && (
              <p className="text-xs text-muted-foreground mt-1">
                Miembro desde {format(new Date(profile.join_date), "MMMM yyyy", { locale: es })}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setEditing(!editing); setForm({ full_name: profile?.full_name || '', goals: profile?.goals || '', emergency_contact: profile?.emergency_contact || '' }); }}
            className="text-muted-foreground"
          >
            {editing ? <X size={18} /> : <Edit2 size={18} />}
          </Button>
        </div>

        {editing && (
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label>Objetivos</Label>
              <Textarea value={form.goals} onChange={(e) => setForm(f => ({ ...f, goals: e.target.value }))} className="bg-background border-border" placeholder="Ej: Correr mi primer 10K en menos de 50 min" />
            </div>
            <div className="space-y-2">
              <Label>Contacto de emergencia</Label>
              <Input value={form.emergency_contact} onChange={(e) => setForm(f => ({ ...f, emergency_contact: e.target.value }))} className="bg-background border-border" />
            </div>
            <Button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending} className="gradient-primary text-primary-foreground gap-2">
              <Save size={14} /> Guardar
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Flame, label: 'Racha', value: `${stats?.current_streak || 0}`, color: 'text-primary' },
          { icon: Calendar, label: 'Total', value: `${stats?.total_sessions || 0}`, color: 'text-secondary' },
          { icon: TrendingUp, label: 'Asistencia', value: `${stats?.attendance_percentage || 0}%`, color: 'text-accent' },
          { icon: Trophy, label: 'Logros', value: `${achievements?.length || 0}`, color: 'text-info' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
            <Icon size={20} className={`mx-auto ${color} mb-1`} />
            <p className="text-xl font-display font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* Goals */}
      {profile?.goals && !editing && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-display font-bold text-foreground mb-2">🎯 Mis Objetivos</h3>
          <p className="text-sm text-foreground/80">{profile.goals}</p>
        </div>
      )}

      {/* Achievements */}
      <div>
        <h3 className="font-display text-lg font-bold text-foreground mb-3">🏆 Logros</h3>
        {achievements && achievements.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((a: any) => (
              <div key={a.id} className="bg-card border border-border rounded-xl p-4">
                <p className="font-medium text-foreground text-sm">{a.title}</p>
                {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
                <p className="text-xs text-muted-foreground mt-2">
                  {format(new Date(a.earned_at), "d MMM yyyy", { locale: es })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <Trophy size={24} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Tus logros aparecerán aquí</p>
          </div>
        )}
      </div>
    </div>
  );
}
