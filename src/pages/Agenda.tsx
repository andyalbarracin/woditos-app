/**
 * Archivo: Agenda.tsx
 * Ruta: src/pages/Agenda.tsx
 * Última modificación: 2026-03-16
 * Descripción: Agenda semanal. Coaches crean/toman sesiones.
 *   Members reservan/cancelan. Notifica al coach al reservar.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, MapPin, Users, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import CreateSessionDialog from '@/components/CreateSessionDialog';

const SESSION_COLORS: Record<string, string> = {
  running: 'border-l-secondary',
  functional: 'border-l-primary',
  amrap: 'border-l-primary',
  emom: 'border-l-accent',
  hiit: 'border-l-destructive',
  technique: 'border-l-info',
};

export default function Agenda() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const [showCreateSession, setShowCreateSession] = useState(false);

  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const [selectedDay, setSelectedDay] = useState(new Date());

  const isCoach = user?.role === 'coach' || user?.role === 'super_admin';

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions-week', weekOffset],
    queryFn: async () => {
      const start = weekDays[0].toISOString();
      const end = addDays(weekDays[6], 1).toISOString();
      const { data } = await supabase
        .from('sessions')
        .select('*, groups(name), reservations(id, user_id, reservation_status)')
        .gte('start_time', start)
        .lt('start_time', end)
        .order('start_time', { ascending: true });
      return data || [];
    },
  });

  const bookMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { data: existingReservation, error: existingError } = await supabase
        .from('reservations')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existingReservation?.id) {
        const { error: updateError } = await supabase
          .from('reservations')
          .update({ reservation_status: 'confirmed', cancelled_at: null })
          .eq('id', existingReservation.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('reservations').insert({
          session_id: sessionId,
          user_id: user!.id,
          reservation_status: 'confirmed',
        });

        if (insertError) throw insertError;
      }

      // Notify coach
      const session = sessions?.find((s: any) => s.id === sessionId);
      if (session?.coach_id && session.coach_id !== user!.id) {
        await supabase.from('notifications').insert({
          user_id: session.coach_id,
          title: '🏋️ Nueva reserva',
          message: `${profile?.full_name || 'Un miembro'} se inscribió en "${session.title}"`,
          type: 'reservation',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions-week'] });
      toast.success('¡Reserva confirmada!');
    },
    onError: () => toast.error('No se pudo hacer la reserva. Intentá de nuevo.'),
  });

  const cancelMutation = useMutation({
    mutationFn: async (reservationId: string) => {
      const { error } = await supabase.from('reservations')
        .update({ reservation_status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', reservationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions-week'] });
      toast.success('Reserva cancelada');
    },
    onError: () => toast.error('No se pudo cancelar la reserva.'),
  });

  const claimMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.from('sessions')
        .update({ coach_id: user!.id })
        .eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions-week'] });
      toast.success('Sesión asignada a vos');
    },
    onError: () => toast.error('No se pudo asignar la sesión'),
  });

  const daySessions = sessions?.filter((s: any) => isSameDay(new Date(s.start_time), selectedDay)) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold text-foreground">Agenda</h1>
        {isCoach && (
          <Button onClick={() => setShowCreateSession(true)} className="gradient-primary text-primary-foreground gap-2">
            <Plus size={16} /> Nueva Sesión
          </Button>
        )}
      </div>

      {/* Week Selector */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset(w => w - 1)}><ChevronLeft size={18} /></Button>
        <div className="flex-1 grid grid-cols-7 gap-1">
          {weekDays.map((day) => {
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDay);
            const hasSessions = sessions?.some((s: any) => isSameDay(new Date(s.start_time), day));
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={`flex flex-col items-center py-2 rounded-xl transition-all text-sm ${
                  isSelected ? 'bg-primary text-primary-foreground' :
                  isToday ? 'bg-primary/10 text-primary' :
                  'hover:bg-muted text-muted-foreground'
                }`}
              >
                <span className="text-xs uppercase">{format(day, 'EEE', { locale: es })}</span>
                <span className="font-bold text-lg">{format(day, 'd')}</span>
                {hasSessions && !isSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />}
              </button>
            );
          })}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset(w => w + 1)}><ChevronRight size={18} /></Button>
      </div>

      <h2 className="font-display text-lg font-bold text-foreground capitalize">
        {format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}
      </h2>

      {/* Sessions */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse h-24" />
          ))
        ) : daySessions.length > 0 ? (
          daySessions.map((s: any) => {
            const confirmedReservations = s.reservations?.filter((r: any) => r.reservation_status === 'confirmed') || [];
            const userReservation = confirmedReservations.find((r: any) => r.user_id === user?.id);
            const isFull = confirmedReservations.length >= s.capacity;
            const spots = s.capacity - confirmedReservations.length;
            const isMySession = s.coach_id === user?.id;
            const isUnassigned = !s.coach_id;

            return (
              <div key={s.id} className={`bg-card border border-border rounded-xl p-4 border-l-4 ${SESSION_COLORS[s.session_type] || 'border-l-primary'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-bold text-foreground">
                        {format(new Date(s.start_time), 'HH:mm')} - {format(new Date(s.end_time), 'HH:mm')}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {s.session_type}
                      </span>
                      {userReservation && (
                        <Badge variant="outline" className="text-xs bg-secondary/10 text-secondary border-secondary/30">
                          <Check size={10} className="mr-1" /> Reservado
                        </Badge>
                      )}
                      {isCoach && isMySession && (
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">Tu sesión</Badge>
                      )}
                    </div>
                    <p className="font-semibold text-foreground">{s.title}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {s.location && <span className="flex items-center gap-1"><MapPin size={12} /> {s.location}</span>}
                      <span className={`flex items-center gap-1 ${isFull ? 'text-destructive' : ''}`}>
                        <Users size={12} /> {confirmedReservations.length}/{s.capacity}
                        {!isFull && ` · ${spots} disponibles`}
                      </span>
                      {s.groups?.name && <span>{s.groups.name}</span>}
                    </div>
                  </div>
                  <div>
                    {isCoach ? (
                      isUnassigned ? (
                        <Button size="sm" onClick={() => claimMutation.mutate(s.id)} disabled={claimMutation.isPending} className="gradient-primary text-primary-foreground">
                          Tomar
                        </Button>
                      ) : isMySession ? (
                        <span className="text-xs font-medium text-muted-foreground px-2 py-1 bg-muted rounded-md">Coach</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Otro coach</span>
                      )
                    ) : userReservation ? (
                      <Button variant="outline" size="sm" onClick={() => cancelMutation.mutate(userReservation.id)} disabled={cancelMutation.isPending} className="border-secondary text-secondary hover:bg-secondary/10">
                        Cancelar
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => bookMutation.mutate(s.id)} disabled={isFull || bookMutation.isPending} className="gradient-primary text-primary-foreground">
                        {isFull ? 'Lleno' : 'Reservar'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-card border border-border rounded-xl p-8 text-center space-y-3">
            <p className="text-muted-foreground">No hay sesiones este día</p>
            {isCoach && (
              <Button onClick={() => setShowCreateSession(true)} variant="outline" className="gap-2">
                <Plus size={14} /> Crear sesión para este día
              </Button>
            )}
          </div>
        )}
      </div>

      <CreateSessionDialog
        open={showCreateSession}
        onOpenChange={setShowCreateSession}
        initialDate={selectedDay}
      />
    </div>
  );
}
