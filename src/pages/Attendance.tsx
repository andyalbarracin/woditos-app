/**
 * Archivo: Attendance.tsx
 * Ruta: src/pages/Attendance.tsx
 * Última modificación: 2025-03-09
 * Descripción: Sistema de control de asistencia para coaches. Permite seleccionar
 *              una sesión del día, marcar presencia/ausencia/tarde con checkbox,
 *              agregar notas individuales y ver el QR personal de cada miembro.
 *              Solo accesible para usuarios con rol coach o super_admin.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ClipboardCheck, Calendar, ChevronDown, Check, Clock, X,
  MessageSquare, QrCode, User, Search, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

/** Estados posibles de asistencia */
type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused';

/** Estado local de un miembro en la lista de asistencia */
interface AttendeeState {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  reservationId: string;
  status: AttendanceStatus | null;
  note: string;
  attendanceId: string | null;
}

/** Configuración visual por estado de asistencia */
const STATUS_CONFIG: Record<AttendanceStatus, { label: string; icon: typeof Check; className: string }> = {
  present: { label: 'Presente',  icon: Check,  className: 'bg-secondary/15 text-secondary border-secondary/40' },
  late:    { label: 'Tarde',     icon: Clock,  className: 'bg-accent/15 text-accent border-accent/40' },
  absent:  { label: 'Ausente',   icon: X,      className: 'bg-destructive/15 text-destructive border-destructive/40' },
  excused: { label: 'Excusado',  icon: Check,  className: 'bg-muted text-muted-foreground border-border' },
};

export default function AttendancePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ID de la sesión seleccionada para pasar lista
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  // Búsqueda de miembros en la lista
  const [searchMember, setSearchMember] = useState('');
  // Estado local de asistencia por miembro (map userId → state)
  const [attendees, setAttendees] = useState<Record<string, AttendeeState>>({});
  // Miembro cuyo QR se está mostrando en el diálogo
  const [qrMember, setQrMember] = useState<AttendeeState | null>(null);
  // Miembro cuya nota se está editando inline
  const [editingNoteFor, setEditingNoteFor] = useState<string | null>(null);
  // Indica si se están guardando todos los cambios
  const [savingAll, setSavingAll] = useState(false);

  /** Sesiones de hoy (para el selector de sesión) */
  const { data: todaySessions } = useQuery({
    queryKey: ['attendance-today-sessions'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const { data } = await supabase
        .from('sessions')
        .select('*, groups(name)')
        .gte('start_time', today.toISOString())
        .lt('start_time', tomorrow.toISOString())
        .order('start_time');
      return data || [];
    },
  });

  /**
   * Cuando se selecciona una sesión, carga las reservas confirmadas
   * y las asistencias ya registradas para inicializar el estado local.
   */
  const { isLoading: loadingAttendees } = useQuery({
    queryKey: ['attendance-session', selectedSessionId],
    queryFn: async () => {
      if (!selectedSessionId) return [];

      // Reservas confirmadas (lista de participantes esperados)
      const { data: reservations } = await supabase
        .from('reservations')
        .select('id, user_id, profiles!user_id(full_name, avatar_url)')
        .eq('session_id', selectedSessionId)
        .eq('reservation_status', 'confirmed');

      // Asistencias ya guardadas para esta sesión
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('session_id', selectedSessionId);

      // Construir mapa de estado local
      const newAttendees: Record<string, AttendeeState> = {};
      (reservations || []).forEach((r: any) => {
        const existing = existingAttendance?.find(a => a.user_id === r.user_id);
        newAttendees[r.user_id] = {
          userId: r.user_id,
          fullName: r.profiles?.full_name || 'Sin nombre',
          avatarUrl: r.profiles?.avatar_url || null,
          reservationId: r.id,
          status: existing?.attendance_status as AttendanceStatus || null,
          note: existing?.notes || '',
          attendanceId: existing?.id || null,
        };
      });
      setAttendees(newAttendees);
      return reservations || [];
    },
    enabled: !!selectedSessionId,
  });

  /** Actualiza el estado local de un miembro sin guardar aún en BD */
  const updateLocalStatus = (userId: string, status: AttendanceStatus) => {
    setAttendees(prev => ({
      ...prev,
      [userId]: { ...prev[userId], status },
    }));
  };

  /** Actualiza la nota local de un miembro */
  const updateLocalNote = (userId: string, note: string) => {
    setAttendees(prev => ({
      ...prev,
      [userId]: { ...prev[userId], note },
    }));
  };

  /**
   * Guarda la asistencia de UN miembro (upsert en BD).
   * Usa el campo de conflicto session_id,user_id para evitar duplicados.
   */
  const saveSingleAttendance = async (userId: string) => {
    const a = attendees[userId];
    if (!a.status) { toast.error('Seleccioná un estado primero'); return; }
    const { error } = await supabase.from('attendance').upsert({
      session_id: selectedSessionId,
      user_id: userId,
      attendance_status: a.status,
      notes: a.note || null,
      checkin_time: a.status === 'present' ? new Date().toISOString() : null,
    }, { onConflict: 'session_id,user_id' });
    if (error) toast.error(error.message);
    else {
      toast.success(`✓ ${a.fullName} guardado`);
      queryClient.invalidateQueries({ queryKey: ['attendance-session', selectedSessionId] });
    }
  };

  /**
   * Guarda todos los cambios pendientes de una vez.
   * Itera por todos los miembros con estado asignado y hace upsert en lote.
   */
  const saveAllAttendance = async () => {
    const withStatus = Object.values(attendees).filter(a => a.status);
    if (withStatus.length === 0) { toast.error('Marcá al menos un asistente'); return; }
    setSavingAll(true);
    const rows = withStatus.map(a => ({
      session_id: selectedSessionId,
      user_id: a.userId,
      attendance_status: a.status,
      notes: a.note || null,
      checkin_time: a.status === 'present' ? new Date().toISOString() : null,
    }));
    const { error } = await supabase.from('attendance').upsert(rows, { onConflict: 'session_id,user_id' });
    setSavingAll(false);
    if (error) toast.error(error.message);
    else {
      toast.success(`✅ ${withStatus.length} asistencias guardadas`);
      queryClient.invalidateQueries({ queryKey: ['attendance-session', selectedSessionId] });
      queryClient.invalidateQueries({ queryKey: ['coach-today-sessions'] });
    }
  };

  // Filtrar miembros por búsqueda
  const filteredAttendees = Object.values(attendees).filter(a =>
    a.fullName.toLowerCase().includes(searchMember.toLowerCase())
  );

  // Contadores para el resumen rápido
  const presentCount = Object.values(attendees).filter(a => a.status === 'present').length;
  const lateCount    = Object.values(attendees).filter(a => a.status === 'late').length;
  const absentCount  = Object.values(attendees).filter(a => a.status === 'absent').length;
  const pendingCount = Object.values(attendees).filter(a => !a.status).length;

  const selectedSession = todaySessions?.find((s: any) => s.id === selectedSessionId);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-foreground flex items-center gap-2">
            <ClipboardCheck size={28} className="text-primary" /> Asistencia
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        {selectedSessionId && Object.values(attendees).some(a => a.status) && (
          <Button
            onClick={saveAllAttendance}
            disabled={savingAll}
            className="gradient-primary text-primary-foreground gap-2"
          >
            <Save size={16} />
            {savingAll ? 'Guardando...' : 'Guardar todo'}
          </Button>
        )}
      </div>

      {/* Selector de sesión */}
      <div className="bg-card border border-border rounded-xl p-4">
        <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2 block">
          Sesión del día
        </label>
        <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
          <SelectTrigger className="bg-background border-border">
            <SelectValue placeholder="Seleccionar sesión..." />
          </SelectTrigger>
          <SelectContent>
            {todaySessions && todaySessions.length > 0 ? (
              todaySessions.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>
                  {format(new Date(s.start_time), 'HH:mm')} · {s.title} · {s.groups?.name || 'Sin crew'}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="none" disabled>No hay sesiones hoy</SelectItem>
            )}
          </SelectContent>
        </Select>

        {/* Info de la sesión seleccionada */}
        {selectedSession && (
          <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {format(new Date(selectedSession.start_time), 'HH:mm')} -
              {format(new Date(selectedSession.end_time), 'HH:mm')}
            </span>
            <span className="uppercase text-xs font-bold text-primary">{selectedSession.session_type}</span>
            <span>{selectedSession.groups?.name}</span>
          </div>
        )}
      </div>

      {/* Lista de asistencia */}
      {selectedSessionId && (
        <>
          {/* Resumen rápido */}
          {Object.values(attendees).length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Presentes', count: presentCount, color: 'text-secondary' },
                { label: 'Tarde',     count: lateCount,    color: 'text-accent' },
                { label: 'Ausentes',  count: absentCount,  color: 'text-destructive' },
                { label: 'Sin marcar',count: pendingCount, color: 'text-muted-foreground' },
              ].map(({ label, count, color }) => (
                <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
                  <p className={`text-2xl font-display font-bold ${color}`}>{count}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Buscador de miembros */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar miembro..."
              value={searchMember}
              onChange={e => setSearchMember(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>

          {/* Lista de miembros */}
          {loadingAttendees ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse h-20" />
              ))}
            </div>
          ) : filteredAttendees.length > 0 ? (
            <div className="space-y-2">
              {filteredAttendees.map(attendee => {
                const StatusIcon = attendee.status ? STATUS_CONFIG[attendee.status].icon : User;
                return (
                  <div
                    key={attendee.userId}
                    className={`bg-card border rounded-xl p-4 transition-colors ${
                      attendee.status ? 'border-border' : 'border-border border-dashed'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar + nombre */}
                      <Avatar className="h-10 w-10 shrink-0">
                        {attendee.avatarUrl && <AvatarImage src={attendee.avatarUrl} />}
                        <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                          {attendee.fullName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm">{attendee.fullName}</p>
                        {/* Badge de estado actual */}
                        {attendee.status && (
                          <Badge variant="outline" className={`text-xs mt-0.5 ${STATUS_CONFIG[attendee.status].className}`}>
                            <StatusIcon size={10} className="mr-1" />
                            {STATUS_CONFIG[attendee.status].label}
                          </Badge>
                        )}
                      </div>

                      {/* Botones de estado */}
                      <div className="flex items-center gap-1">
                        {(['present', 'late', 'absent'] as AttendanceStatus[]).map(s => {
                          const cfg = STATUS_CONFIG[s];
                          const Icon = cfg.icon;
                          return (
                            <button
                              key={s}
                              onClick={() => updateLocalStatus(attendee.userId, s)}
                              title={cfg.label}
                              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                                attendee.status === s
                                  ? cfg.className + ' scale-110'
                                  : 'border-border text-muted-foreground hover:border-primary/40'
                              }`}
                            >
                              <Icon size={14} />
                            </button>
                          );
                        })}

                        {/* Botón nota */}
                        <button
                          onClick={() => setEditingNoteFor(editingNoteFor === attendee.userId ? null : attendee.userId)}
                          title="Agregar nota"
                          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                            attendee.note
                              ? 'border-secondary text-secondary bg-secondary/10'
                              : 'border-border text-muted-foreground hover:border-secondary/40'
                          }`}
                        >
                          <MessageSquare size={13} />
                        </button>

                        {/* Botón QR */}
                        <button
                          onClick={() => setQrMember(attendee)}
                          title="Ver QR"
                          className="w-8 h-8 rounded-full border border-border text-muted-foreground flex items-center justify-center hover:border-accent/40 hover:text-accent transition-all"
                        >
                          <QrCode size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Área de nota expandible */}
                    {editingNoteFor === attendee.userId && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <Textarea
                          placeholder="Feedback de la sesión, observaciones, rendimiento..."
                          value={attendee.note}
                          onChange={e => updateLocalNote(attendee.userId, e.target.value)}
                          className="bg-background border-border resize-none text-sm min-h-[70px]"
                        />
                        <div className="flex justify-end mt-2 gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setEditingNoteFor(null)} className="text-muted-foreground text-xs">
                            Cerrar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => { saveSingleAttendance(attendee.userId); setEditingNoteFor(null); }}
                            className="gradient-primary text-primary-foreground text-xs gap-1"
                          >
                            <Save size={12} /> Guardar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <User size={32} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {Object.keys(attendees).length === 0
                  ? 'No hay reservas confirmadas para esta sesión'
                  : 'No se encontraron miembros con ese nombre'
                }
              </p>
            </div>
          )}
        </>
      )}

      {/* Estado vacío: no se seleccionó sesión */}
      {!selectedSessionId && (
        <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
          <Calendar size={40} className="mx-auto text-muted-foreground mb-4" />
          <p className="font-display font-bold text-foreground mb-1">Seleccioná una sesión</p>
          <p className="text-sm text-muted-foreground">Elegí la sesión del día para ver la lista de asistencia</p>
        </div>
      )}

      {/* Diálogo QR del miembro */}
      <Dialog open={!!qrMember} onOpenChange={() => setQrMember(null)}>
        <DialogContent className="bg-card border-border max-w-xs text-center">
          <DialogHeader>
            <DialogTitle className="font-display">QR Personal</DialogTitle>
          </DialogHeader>
          {qrMember && (
            <div className="flex flex-col items-center gap-4 py-2">
              {/* Avatar */}
              <Avatar className="h-16 w-16">
                {qrMember.avatarUrl && <AvatarImage src={qrMember.avatarUrl} />}
                <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
                  {qrMember.fullName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="font-display font-bold text-foreground">{qrMember.fullName}</p>

              {/* QR con el userId único e irrepetible del miembro */}
              <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG
                  value={`woditos://member/${qrMember.userId}`}
                  size={180}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Escanear para registrar asistencia rápida
              </p>
              <p className="text-xs font-mono text-muted-foreground/60 break-all">
                ID: {qrMember.userId.slice(0, 16)}...
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
