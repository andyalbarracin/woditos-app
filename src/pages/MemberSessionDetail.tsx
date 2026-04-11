/**
 * Archivo: MemberSessionDetail.tsx
 * Ruta: src/pages/MemberSessionDetail.tsx
 * Última modificación: 2026-04-10
 * Descripción: Detalle de sesión para miembros/alumnos.
 *   Muestra info de la sesión, lista de alumnos inscriptos,
 *   rutinas asignadas a la sesión y feedback propio si ya fue completada.
 *   Ruta: /mi-sesion/:id
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft, MapPin, Users, Clock, Calendar,
  ListChecks, Star, CheckCircle, Loader2, Dumbbell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

const db = supabase as any;

const TYPE_LABELS: Record<string, string> = {
  running: 'Running', functional: 'Funcional', amrap: 'AMRAP',
  emom: 'EMOM', hiit: 'HIIT', technique: 'Técnica',
};

const TYPE_COLORS: Record<string, string> = {
  running:    'bg-secondary/20 text-secondary border-secondary/30',
  functional: 'bg-primary/20 text-primary border-primary/30',
  amrap:      'bg-primary/20 text-primary border-primary/30',
  emom:       'bg-accent/20 text-accent border-accent/30',
  hiit:       'bg-destructive/20 text-destructive border-destructive/30',
  technique:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200',
};

const LEVEL_LABELS: Record<string, string> = {
  beginner:     'Principiante',
  intermediate: 'Intermedio',
  advanced:     'Avanzado',
};

export default function MemberSessionDetail() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Sesión ────────────────────────────────────────────────────
  const { data: session, isLoading } = useQuery({
    queryKey: ['member-session-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*, groups(name), users!coach_id(profiles(full_name, avatar_url))')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!id,
  });

  // ── Alumnos inscriptos ────────────────────────────────────────
  const { data: attendees } = useQuery({
    queryKey: ['member-session-attendees', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('reservations')
        .select('user_id, users!user_id(profiles(full_name, avatar_url))')
        .eq('session_id', id!)
        .eq('reservation_status', 'confirmed');
      return (data ?? []).map((r: any) => ({
        userId:    r.user_id,
        fullName:  r.users?.profiles?.full_name ?? 'Alumno',
        avatarUrl: r.users?.profiles?.avatar_url ?? null,
      }));
    },
    enabled: !!id,
  });

  // ── Rutinas asignadas a la sesión ─────────────────────────────
  const { data: routines } = useQuery({
    queryKey: ['member-session-routines', id],
    queryFn: async () => {
      const { data } = await db
        .from('routine_assignments')
        .select('routine_id, routines(id, name, type, level, estimated_minutes, description)')
        .eq('session_id', id!)
        .not('routine_id', 'is', null);
      return (data ?? [])
        .map((a: any) => a.routines)
        .filter(Boolean);
    },
    enabled: !!id,
  });

  // ── Feedback propio (si la sesión ya pasó) ────────────────────
  const { data: myFeedback } = useQuery({
    queryKey: ['member-session-feedback', id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('session_feedback')
        .select('rating, note, discomforts, created_at')
        .eq('session_id', id!)
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!id && !!user?.id,
  });

  // ── Asistencia propia ─────────────────────────────────────────
  const { data: myAttendance } = useQuery({
    queryKey: ['member-session-attendance', id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('attendance')
        .select('attendance_status')
        .eq('session_id', id!)
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!id && !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) return null;

  const isPast      = new Date(session.end_time) < new Date();
  const typeColor   = TYPE_COLORS[session.session_type] ?? 'bg-muted text-muted-foreground border-border';
  const typeLabel   = TYPE_LABELS[session.session_type] ?? session.session_type;
  const coachName   = session.users?.profiles?.full_name;
  const coachAvatar = session.users?.profiles?.avatar_url;
  const groupName   = session.groups?.name;
  const totalSpots  = attendees?.length ?? 0;

  const attendanceLabel =
    myAttendance?.attendance_status === 'present' ? '✓ Presente'
    : myAttendance?.attendance_status === 'late'  ? '⏱ Tarde'
    : myAttendance?.attendance_status === 'absent' ? '✕ Ausente'
    : null;

  const attendanceColor =
    myAttendance?.attendance_status === 'present' ? 'text-secondary'
    : myAttendance?.attendance_status === 'late'   ? 'text-accent'
    : 'text-destructive';

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in pb-10">

      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" className="shrink-0 mt-0.5" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-2xl font-extrabold text-foreground">
              {session.title}
            </h1>
            {isPast && (
              <Badge variant="outline" className="text-xs text-muted-foreground">Finalizada</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap text-sm text-muted-foreground">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${typeColor}`}>
              {typeLabel}
            </span>
            {groupName && <span>· {groupName}</span>}
            {isPast && attendanceLabel && (
              <span className={`text-xs font-medium ${attendanceColor}`}>{attendanceLabel}</span>
            )}
          </div>
        </div>
      </div>

      {/* Info principal */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm text-foreground/80">
            <Calendar size={15} className="text-primary shrink-0" />
            <span>{format(new Date(session.start_time), "EEEE d 'de' MMMM", { locale: es })}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground/80">
            <Clock size={15} className="text-primary shrink-0" />
            <span>
              {format(new Date(session.start_time), 'HH:mm')} — {format(new Date(session.end_time), 'HH:mm')}
            </span>
          </div>
          {session.location && (
            <div className="flex items-center gap-2 text-sm text-foreground/80">
              <MapPin size={15} className="text-primary shrink-0" />
              <span>{session.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-foreground/80">
            <Users size={15} className="text-primary shrink-0" />
            <span>{totalSpots} / {session.capacity} inscriptos</span>
          </div>
        </div>

        {/* Coach */}
        {coachName && (
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <Avatar className="h-9 w-9">
              {coachAvatar && <img src={coachAvatar} alt={coachName} />}
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                {coachName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-muted-foreground">Coach</p>
              <p className="text-sm font-medium text-foreground">{coachName}</p>
            </div>
          </div>
        )}
      </div>

      {/* Alumnos inscriptos */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="font-display font-bold text-muted-foreground mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
          <Users size={14} /> Alumnos inscriptos ({totalSpots})
        </h2>
        {attendees && attendees.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {attendees.map((a: any) => (
              <div key={a.userId} className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1.5">
                <Avatar className="h-6 w-6">
                  {a.avatarUrl && <AvatarImage src={a.avatarUrl} />}
                  <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-bold">
                    {a.fullName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-foreground">
                  {a.userId === user?.id ? <strong>{a.fullName} (vos)</strong> : a.fullName}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin inscriptos aún</p>
        )}
      </div>

      {/* Rutinas de la sesión */}
      {routines && routines.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="font-display font-bold text-muted-foreground mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
            <ListChecks size={14} /> Rutinas de la sesión
          </h2>
          <div className="space-y-2">
            {routines.map((r: any) => (
              <button
                key={r.id}
                onClick={() => navigate(`/rutinas/${r.id}`)}
                className="w-full flex items-center gap-3 bg-muted/40 hover:bg-muted/70 border border-border rounded-xl p-3 text-left transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Dumbbell size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                    {r.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {TYPE_LABELS[r.type] ?? r.type}
                    {r.level && ` · ${LEVEL_LABELS[r.level] ?? r.level}`}
                    {r.estimated_minutes && ` · ${r.estimated_minutes} min`}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                  Ver →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feedback propio (solo si ya pasó) */}
      {isPast && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="font-display font-bold text-muted-foreground mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
            <Star size={14} /> Tu feedback
          </h2>
          {myFeedback ? (
            <div className="space-y-3">
              {/* Estrellas */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className={i < myFeedback.rating ? 'text-accent fill-accent' : 'text-muted-foreground/30'}
                  />
                ))}
                <span className="text-sm text-muted-foreground ml-2">{myFeedback.rating}/5</span>
              </div>
              {/* Molestias */}
              {myFeedback.discomforts && myFeedback.discomforts.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {myFeedback.discomforts.map((d: string) => (
                    <span key={d} className="text-xs bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 rounded-full">
                      {d}
                    </span>
                  ))}
                </div>
              )}
              {/* Nota */}
              {myFeedback.note && (
                <p className="text-sm text-foreground/80 italic">"{myFeedback.note}"</p>
              )}
              <p className="text-xs text-muted-foreground">
                Enviado el {format(new Date(myFeedback.created_at), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <CheckCircle size={24} className="mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">
                No enviaste feedback para esta sesión
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}