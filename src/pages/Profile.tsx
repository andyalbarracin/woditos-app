/**
 * Archivo: Profile.tsx
 * Ruta: src/pages/Profile.tsx
 * Última modificación: 2026-03-12
 * Descripción: Perfil de usuario con foto, stats, logros.
 *   Coach ve analytics en vez de objetivos.
 *   Permite cambiar foto de perfil.
 */

import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Flame, Calendar, TrendingUp, Trophy, Edit2, Save, X, QrCode, Camera, Users, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import { profileUpdateSchema } from '@/lib/validation';

function formatRole(role: string | undefined): string {
  if (!role) return 'Miembro';
  if (role === 'super_admin') return 'Coach';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function ProfilePage() {
  const { user, profile, refreshUserData } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    goals: profile?.goals || '',
    emergency_contact: profile?.emergency_contact || '',
  });

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
    queryKey: ['achievements', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('achievements').select('*').eq('user_id', user!.id).order('earned_at', { ascending: false });
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Coach analytics
  const { data: coachStats } = useQuery({
    queryKey: ['coach-profile-stats', user?.id],
    queryFn: async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      // Sessions this month
      const { count: sessionsThisMonth } = await supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('coach_id', user!.id)
        .gte('start_time', monthStart);

      // Unique attendees this month
      const { data: sessionIds } = await supabase
        .from('sessions')
        .select('id')
        .eq('coach_id', user!.id)
        .gte('start_time', monthStart);

      let uniqueStudents = 0;
      if (sessionIds && sessionIds.length > 0) {
        const ids = sessionIds.map(s => s.id);
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('user_id')
          .in('session_id', ids)
          .eq('attendance_status', 'present');
        const uniqueIds = new Set(attendanceData?.map(a => a.user_id) || []);
        uniqueStudents = uniqueIds.size;
      }

      // Total groups
      const { count: totalGroups } = await supabase
        .from('groups')
        .select('id', { count: 'exact', head: true })
        .eq('coach_id', user!.id);

      // Attendance rate this month
      const { data: monthAttendance } = await supabase
        .from('attendance')
        .select('attendance_status, session_id')
        .in('session_id', (sessionIds || []).map(s => s.id));
      
      const totalRecords = monthAttendance?.length || 0;
      const presentRecords = monthAttendance?.filter(a => a.attendance_status === 'present' || a.attendance_status === 'late').length || 0;
      const attendanceRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

      return {
        sessionsThisMonth: sessionsThisMonth || 0,
        uniqueStudents,
        totalGroups: totalGroups || 0,
        attendanceRate,
      };
    },
    enabled: !!user?.id && isCoach,
  });

  const updateProfile = useMutation({
    mutationFn: async () => {
      const validated = profileUpdateSchema.parse(form);
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: validated.full_name,
          goals: isCoach ? null : (validated.goals || null),
          emergency_contact: validated.emergency_contact || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setEditing(false);
      toast.success('Perfil actualizado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no puede superar 2MB');
      return;
    }

    setUploadingAvatar(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error('No se pudo subir la imagen');
      setUploadingAvatar(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    setUploadingAvatar(false);
    if (updateError) {
      toast.error('No se pudo actualizar el perfil');
    } else {
      toast.success('Foto de perfil actualizada');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  };

  const ACHIEVEMENT_ICONS: Record<string, string> = {
    attendance_streak: '🔥',
    sessions_milestone: '📍',
    personal_record: '⚡',
    first_month: '🌟',
    perfect_week: '💯',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-4 mb-4">
          {/* Avatar with upload */}
          <div className="relative group">
            <Avatar className="h-20 w-20">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold font-display">
                {profile?.full_name?.slice(0, 2).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera size={20} className="text-white" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="font-display text-2xl font-extrabold text-foreground">{profile?.full_name}</h1>
            <p className="text-sm text-muted-foreground">{formatRole(user?.role)} · {user?.email}</p>
            {profile?.join_date && (
              <p className="text-xs text-muted-foreground mt-1">
                Miembro desde {format(new Date(profile.join_date), "MMMM yyyy", { locale: es })}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Button variant="ghost" size="icon" onClick={() => { setEditing(!editing); setForm({ full_name: profile?.full_name || '', goals: profile?.goals || '', emergency_contact: profile?.emergency_contact || '' }); }} className="text-muted-foreground">
              {editing ? <X size={18} /> : <Edit2 size={18} />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowQR(true)} className="text-muted-foreground">
              <QrCode size={18} />
            </Button>
          </div>
        </div>

        {editing && (
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} className="bg-background border-border" />
            </div>
            {!isCoach && (
              <div className="space-y-2">
                <Label>Mis objetivos</Label>
                <Textarea value={form.goals} onChange={(e) => setForm(f => ({ ...f, goals: e.target.value }))} className="bg-background border-border" placeholder="Ej: Correr mi primer 10K en menos de 50 min" rows={3} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Contacto de emergencia</Label>
              <Input value={form.emergency_contact} onChange={(e) => setForm(f => ({ ...f, emergency_contact: e.target.value }))} className="bg-background border-border" placeholder="Nombre y teléfono" />
            </div>
            <Button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending} className="gradient-primary text-primary-foreground gap-2">
              <Save size={14} /> Guardar cambios
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      {isCoach ? (
        /* Coach Analytics */
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Users,         label: 'Alumnos',     value: `${coachStats?.uniqueStudents || 0}`, color: 'text-primary' },
            { icon: Calendar,      label: 'Sesiones/mes', value: `${coachStats?.sessionsThisMonth || 0}`, color: 'text-secondary' },
            { icon: ClipboardCheck,label: 'Asistencia',   value: `${coachStats?.attendanceRate || 0}%`, color: 'text-accent' },
            { icon: TrendingUp,    label: 'Crews',        value: `${coachStats?.totalGroups || 0}`, color: 'text-info' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
              <Icon size={20} className={`mx-auto ${color} mb-1`} />
              <p className="text-xl font-display font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      ) : (
        /* Member Stats */
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Flame,     label: 'Racha',       value: `${stats?.current_streak || 0}`, unit: 'días', color: 'text-primary' },
            { icon: Calendar,  label: 'Total',        value: `${stats?.total_sessions || 0}`, unit: 'sesiones', color: 'text-secondary' },
            { icon: TrendingUp,label: 'Asistencia',   value: `${stats?.attendance_percentage || 0}`, unit: '%', color: 'text-accent' },
            { icon: Trophy,    label: 'Logros',       value: `${achievements?.length || 0}`, unit: '', color: 'text-info' },
          ].map(({ icon: Icon, label, value, unit, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
              <Icon size={20} className={`mx-auto ${color} mb-1`} />
              <p className="text-xl font-display font-bold text-foreground">{value}<span className="text-sm font-normal">{unit}</span></p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Objectives (members only) */}
      {!isCoach && profile?.goals && !editing && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-display font-bold text-foreground mb-2">🎯 Mis Objetivos</h3>
          <p className="text-sm text-foreground/80 leading-relaxed">{profile.goals}</p>
        </div>
      )}

      {/* Achievements */}
      <div>
        <h3 className="font-display text-lg font-bold text-foreground mb-3">🏆 Logros</h3>
        {achievements && achievements.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((a: any) => (
              <div key={a.id} className="bg-card border border-border rounded-xl p-4">
                <span className="text-2xl">{ACHIEVEMENT_ICONS[a.achievement_type] || '🏅'}</span>
                <p className="font-medium text-foreground text-sm mt-2">{a.title}</p>
                {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
                <p className="text-xs text-muted-foreground mt-2">
                  {a.earned_at && format(new Date(a.earned_at), "d MMM yyyy", { locale: es })}
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

      {/* QR Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="bg-card border-border max-w-xs text-center">
          <DialogHeader><DialogTitle className="font-display">Mi QR Personal</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <p className="text-sm text-muted-foreground">Mostrá este QR a tu coach para registro rápido de asistencia</p>
            <div className="bg-white p-4 rounded-xl">
              <QRCodeSVG value={`woditos://member/${user?.id}`} size={200} level="M" includeMargin={false} />
            </div>
            <p className="font-display font-bold text-foreground">{profile?.full_name}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}