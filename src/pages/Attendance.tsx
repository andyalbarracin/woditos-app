/**
 * Archivo: Attendance.tsx
 * Ruta: src/pages/Attendance.tsx
 * Última modificación: 2026-03-12
 * Descripción: Sistema de control de asistencia para coaches.
 */

import { useState, useMemo } from 'react';
import CreateSessionDialog from '@/components/CreateSessionDialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { format, isSameDay, startOfMonth, endOfMonth, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ClipboardCheck, Calendar as CalendarIcon, Check, Clock, X,
  MessageSquare, QrCode, User, Search, Save, Plus, Send, ScanLine, UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import QRScanner from '@/components/QRScanner';
import { sanitizeText } from '@/lib/validation';

type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused';

interface AttendeeState {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  reservationId: string;
  status: AttendanceStatus | null;
  note: string;
  attendanceId: string | null;
}

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; icon: typeof Check; className: string }> = {
  present: { label: 'Presente',  icon: Check,  className: 'bg-secondary/15 text-secondary border-secondary/40' },
  late:    { label: 'Tarde',     icon: Clock,  className: 'bg-accent/15 text-accent border-accent/40' },
  absent:  { label: 'Ausente',   icon: X,      className: 'bg-destructive/15 text-destructive border-destructive/40' },
  excused: { label: 'Excusado',  icon: Check,  className: 'bg-muted text-muted-foreground border-border' },
};

const SESSION_TYPES = [
  { value: 'running', label: 'Running' },
  { value: 'functional', label: 'Funcional' },
  { value: 'amrap', label: 'AMRAP' },
  { value: 'emom', label: 'EMOM' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'technique', label: 'Técnica' },
];

export default function AttendancePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [searchMember, setSearchMember] = useState('');
  const [attendees, setAttendees] = useState<Record<string, AttendeeState>>({});
  const [qrMember, setQrMember] = useState<AttendeeState | null>(null);
  const [editingNoteFor, setEditingNoteFor] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showCommunicate, setShowCommunicate] = useState(false);
  const [communicateMessage, setCommunicateMessage] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);

  // sessionForm moved to CreateSessionDialog component

  const { data: monthSessions } = useQuery({
    queryKey: ['attendance-month-sessions', selectedDate.getMonth(), selectedDate.getFullYear()],
    queryFn: async () => {
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);
      const { data } = await supabase
        .from('sessions')
        .select('id, start_time')
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString());
      return data || [];
    },
  });

  const { data: daySessions } = useQuery({
    queryKey: ['attendance-day-sessions', selectedDate.toDateString()],
    queryFn: async () => {
      const dayStart = startOfDay(selectedDate);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const { data } = await supabase
        .from('sessions')
        .select('*, groups(name)')
        .gte('start_time', dayStart.toISOString())
        .lt('start_time', dayEnd.toISOString())
        .order('start_time');
      return data || [];
    },
  });

  const { data: groups } = useQuery({
    queryKey: ['attendance-groups'],
    queryFn: async () => {
      const { data } = await supabase.from('groups').select('id, name').order('name');
      return data || [];
    },
  });

  const { isLoading: loadingAttendees } = useQuery({
    queryKey: ['attendance-session', selectedSessionId],
    queryFn: async () => {
      if (!selectedSessionId) return [];
      const { data: reservations } = await supabase
        .from('reservations')
        .select('id, user_id, users!user_id(id, profiles(full_name, avatar_url))')
        .eq('session_id', selectedSessionId)
        .eq('reservation_status', 'confirmed');

      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('session_id', selectedSessionId);

      const newAttendees: Record<string, AttendeeState> = {};
      (reservations || []).forEach((r: any) => {
        const existing = existingAttendance?.find(a => a.user_id === r.user_id);
        const userProfile = r.users?.profiles;
        newAttendees[r.user_id] = {
          userId: r.user_id,
          fullName: userProfile?.full_name || 'Sin nombre',
          avatarUrl: userProfile?.avatar_url || null,
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

  const daysWithSessions = useMemo(() => {
    if (!monthSessions) return [];
    return monthSessions.map((s: any) => new Date(s.start_time));
  }, [monthSessions]);

  // Toggle attendance: clicking same status removes it
  const toggleAttendance = async (userId: string, status: AttendanceStatus) => {
    const previousStatus = attendees[userId]?.status || null;

    if (previousStatus === status) {
      setAttendees(prev => ({ ...prev, [userId]: { ...prev[userId], status: null } }));

      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('session_id', selectedSessionId)
        .eq('user_id', userId);

      if (error) {
        setAttendees(prev => ({ ...prev, [userId]: { ...prev[userId], status: previousStatus } }));
        toast.error('No se pudo desmarcar la asistencia');
        return;
      }

      toast.success('Asistencia desmarcada');
      queryClient.invalidateQueries({ queryKey: ['attendance-session', selectedSessionId] });
      return;
    }

    setAttendees(prev => ({ ...prev, [userId]: { ...prev[userId], status } }));

    const { error } = await supabase.from('attendance').upsert({
      session_id: selectedSessionId,
      user_id: userId,
      attendance_status: status,
      checkin_time: status === 'present' ? new Date().toISOString() : null,
    }, { onConflict: 'session_id,user_id' });

    if (error) {
      setAttendees(prev => ({ ...prev, [userId]: { ...prev[userId], status: previousStatus } }));
      toast.error('No se pudo guardar la asistencia');
      return;
    }

    toast.success('Asistencia guardada');
    queryClient.invalidateQueries({ queryKey: ['attendance-session', selectedSessionId] });
  };

  const updateLocalNote = (userId: string, note: string) => {
    setAttendees(prev => ({ ...prev, [userId]: { ...prev[userId], note } }));
  };

  const saveSingleAttendance = async (userId: string) => {
    const a = attendees[userId];
    if (!a.status) { toast.error('Seleccioná un estado primero'); return; }
    const { error } = await supabase.from('attendance').upsert({
      session_id: selectedSessionId,
      user_id: userId,
      attendance_status: a.status,
      notes: a.note ? sanitizeText(a.note) : null,
      checkin_time: a.status === 'present' ? new Date().toISOString() : null,
    }, { onConflict: 'session_id,user_id' });
    if (error) toast.error('No se pudo guardar');
    else {
      toast.success(`✓ ${a.fullName} guardado`);
      queryClient.invalidateQueries({ queryKey: ['attendance-session', selectedSessionId] });
    }
  };

  const saveAllAttendance = async () => {
    const withStatus = Object.values(attendees).filter(a => a.status);
    if (withStatus.length === 0) { toast.error('Marcá al menos un asistente'); return; }
    setSavingAll(true);
    const rows = withStatus.map(a => ({
      session_id: selectedSessionId,
      user_id: a.userId,
      attendance_status: a.status,
      notes: a.note ? sanitizeText(a.note) : null,
      checkin_time: a.status === 'present' ? new Date().toISOString() : null,
    }));
    const { error } = await supabase.from('attendance').upsert(rows, { onConflict: 'session_id,user_id' });
    setSavingAll(false);
    if (error) toast.error('No se pudo guardar la asistencia');
    else {
      toast.success(`✅ ${withStatus.length} asistencias guardadas`);
      queryClient.invalidateQueries({ queryKey: ['attendance-session', selectedSessionId] });
    }
  };

  // handleCreateSession is now handled by CreateSessionDialog component

  // Send message to attendees - creates notifications
  const handleCommunicate = async () => {
    if (!communicateMessage.trim()) { toast.error('Escribí un mensaje'); return; }
    const userIds = Object.keys(attendees);
    if (userIds.length === 0) { toast.error('No hay asistentes en esta sesión'); return; }

    const sanitized = sanitizeText(communicateMessage.trim());
    const sessionTitle = selectedSession?.title || 'Sesión';

    const notifications = userIds.map(uid => ({
      user_id: uid,
      title: `📢 ${sessionTitle}`,
      message: sanitized,
      type: 'announcement',
    }));

    const { error } = await supabase.from('notifications').insert(notifications);
    if (error) {
      console.error('Error sending notifications:', error);
      toast.error('No se pudo enviar el mensaje');
    } else {
      toast.success(`✅ Mensaje enviado a ${userIds.length} asistentes`);
      setShowCommunicate(false);
      setCommunicateMessage('');
    }
  };

  const handleQRScan = async (result: string) => {
    setShowQRScanner(false);
    const match = result.match(/woditos:\/\/member\/([a-f0-9-]+)/i);
    if (!match) {
      toast.error('QR inválido. Probá con el QR de un miembro.');
      return;
    }
    const scannedUserId = match[1];
    const attendee = attendees[scannedUserId];
    if (!attendee) {
      toast.error('Este miembro no está en la lista de esta sesión.');
      return;
    }
    toggleAttendance(scannedUserId, 'present');
  };

  const filteredAttendees = Object.values(attendees).filter(a =>
    a.fullName.toLowerCase().includes(searchMember.toLowerCase())
  );

  const presentCount = Object.values(attendees).filter(a => a.status === 'present').length;
  const lateCount = Object.values(attendees).filter(a => a.status === 'late').length;
  const absentCount = Object.values(attendees).filter(a => a.status === 'absent').length;
  const pendingCount = Object.values(attendees).filter(a => !a.status).length;

  const selectedSession = daySessions?.find((s: any) => s.id === selectedSessionId);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-foreground flex items-center gap-2">
            <ClipboardCheck size={28} className="text-primary" /> Asistencia
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(selectedDate, "EEEE d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowCreateSession(true)}>
            <Plus size={14} /> Crear sesión
          </Button>
          <CreateSessionDialog
            open={showCreateSession}
            onOpenChange={setShowCreateSession}
            initialDate={selectedDate}
            onCreated={() => {
              queryClient.invalidateQueries({ queryKey: ['attendance-day-sessions'] });
              queryClient.invalidateQueries({ queryKey: ['attendance-month-sessions'] });
            }}
          />
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-card border border-border rounded-xl p-4">
        <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-3 block">Elegí una fecha</label>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(d) => { if (d) { setSelectedDate(d); setSelectedSessionId(''); setAttendees({}); } }}
          locale={es}
          className="rounded-md border-0 pointer-events-auto w-full"
          classNames={{
            months: "flex flex-col w-full", month: "space-y-4 w-full",
            table: "w-full border-collapse space-y-1", head_row: "flex w-full",
            head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] text-center",
            row: "flex w-full mt-2",
            cell: "flex-1 h-10 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: "h-10 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-muted rounded-md transition-colors",
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground font-bold",
            day_outside: "text-muted-foreground opacity-50",
            nav: "space-x-1 flex items-center",
            nav_button: "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 border border-border rounded-md inline-flex items-center justify-center",
            nav_button_previous: "absolute left-1", nav_button_next: "absolute right-1",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
          }}
          modifiers={{ hasSessions: daysWithSessions }}
          modifiersClassNames={{ hasSessions: 'bg-primary/20 text-primary font-bold' }}
        />
      </div>

      {/* Selector de sesión */}
      <div className="bg-card border border-border rounded-xl p-4">
        <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2 block">
          Sesiones del {format(selectedDate, 'd MMM', { locale: es })}
        </label>
        {daySessions && daySessions.length > 0 ? (
          <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
            <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Seleccionar sesión..." /></SelectTrigger>
            <SelectContent>
              {daySessions.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>
                  {format(new Date(s.start_time), 'HH:mm')} · {s.title} · {s.groups?.name || 'Sin crew'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm text-muted-foreground">No hay sesiones para este día</p>
        )}

        {selectedSession && (
          <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarIcon size={14} />
                {format(new Date(selectedSession.start_time), 'HH:mm')} - {format(new Date(selectedSession.end_time), 'HH:mm')}
              </span>
              <Badge variant="outline" className="text-xs uppercase">{selectedSession.session_type}</Badge>
              <span>{selectedSession.groups?.name}</span>
            </div>
            {Object.keys(attendees).length > 0 && (
              <Dialog open={showCommunicate} onOpenChange={setShowCommunicate}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1"><Send size={14} /> Comunicar</Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="font-display">Enviar mensaje a asistentes</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Este mensaje se enviará como notificación a los {Object.keys(attendees).length} asistentes de esta sesión.
                    </p>
                    <Textarea
                      placeholder="Ej: La sesión de hoy se cancela por lluvia. Nos vemos mañana!"
                      value={communicateMessage}
                      onChange={e => setCommunicateMessage(e.target.value)}
                      className="bg-background border-border min-h-[100px]"
                    />
                    <Button onClick={handleCommunicate} className="w-full gradient-primary text-primary-foreground gap-2">
                      <Send size={16} /> Enviar mensaje
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </div>

      {/* Lista de asistencia */}
      {selectedSessionId && (
        <>
          {Object.values(attendees).length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Presentes', count: presentCount, color: 'text-secondary' },
                { label: 'Tarde', count: lateCount, color: 'text-accent' },
                { label: 'Ausentes', count: absentCount, color: 'text-destructive' },
                { label: 'Sin marcar', count: pendingCount, color: 'text-muted-foreground' },
              ].map(({ label, count, color }) => (
                <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
                  <p className={`text-2xl font-display font-bold ${color}`}>{count}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar miembro..." value={searchMember} onChange={e => setSearchMember(e.target.value)} className="pl-9 bg-card border-border" />
            </div>
            <Button variant="outline" className="gap-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground shrink-0" onClick={() => setShowQRScanner(true)}>
              <ScanLine size={16} /> QR
            </Button>
          </div>

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
                  <div key={attendee.userId} className={cn('bg-card border rounded-xl p-4 transition-colors', attendee.status ? 'border-border' : 'border-border border-dashed')}>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        {attendee.avatarUrl && <AvatarImage src={attendee.avatarUrl} />}
                        <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                          {attendee.fullName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm">{attendee.fullName}</p>
                        {attendee.status && (
                          <Badge variant="outline" className={cn('text-xs mt-0.5', STATUS_CONFIG[attendee.status].className)}>
                            <StatusIcon size={10} className="mr-1" />
                            {STATUS_CONFIG[attendee.status].label}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {(['present', 'late', 'absent'] as AttendanceStatus[]).map(s => {
                          const cfg = STATUS_CONFIG[s];
                          const Icon = cfg.icon;
                          return (
                            <button
                              key={s}
                              onClick={() => toggleAttendance(attendee.userId, s)}
                              title={`${cfg.label} (click de nuevo para desmarcar)`}
                              className={cn(
                                'w-8 h-8 rounded-full border flex items-center justify-center transition-all',
                                attendee.status === s
                                  ? cfg.className + ' scale-110'
                                  : 'border-border text-muted-foreground hover:border-primary/40'
                              )}
                            >
                              <Icon size={14} />
                            </button>
                          );
                        })}
                        <button onClick={() => setEditingNoteFor(editingNoteFor === attendee.userId ? null : attendee.userId)} title="Agregar nota" className={cn('w-8 h-8 rounded-full border flex items-center justify-center transition-all', attendee.note ? 'border-secondary text-secondary bg-secondary/10' : 'border-border text-muted-foreground hover:border-secondary/40')}>
                          <MessageSquare size={13} />
                        </button>
                        <button onClick={() => setQrMember(attendee)} title="Ver QR" className="w-8 h-8 rounded-full border border-border text-muted-foreground flex items-center justify-center hover:border-accent/40 hover:text-accent transition-all">
                          <QrCode size={13} />
                        </button>
                      </div>
                    </div>

                    {editingNoteFor === attendee.userId && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <Textarea placeholder="Feedback, observaciones, rendimiento..." value={attendee.note} onChange={e => updateLocalNote(attendee.userId, e.target.value)} className="bg-background border-border resize-none text-sm min-h-[70px]" />
                        <div className="flex justify-end mt-2 gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setEditingNoteFor(null)} className="text-muted-foreground text-xs">Cerrar</Button>
                          <Button size="sm" onClick={() => { saveSingleAttendance(attendee.userId); setEditingNoteFor(null); }} className="gradient-primary text-primary-foreground text-xs gap-1">
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
                {Object.keys(attendees).length === 0 ? 'No hay reservas confirmadas para esta sesión' : 'No se encontraron miembros con ese nombre'}
              </p>
            </div>
          )}

          {/* Asignar miembro manualmente */}
          <AssignMemberToSession
            sessionId={selectedSessionId}
            existingUserIds={Object.keys(attendees)}
            onAssigned={() => queryClient.invalidateQueries({ queryKey: ['attendance-session', selectedSessionId] })}
          />
        </>
      )}

      {!selectedSessionId && (
        <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
          <CalendarIcon size={40} className="mx-auto text-muted-foreground mb-4" />
          <p className="font-display font-bold text-foreground mb-1">Seleccioná una sesión</p>
          <p className="text-sm text-muted-foreground">Elegí un día con sesiones en el calendario y luego la sesión específica</p>
        </div>
      )}

      {/* QR dialog */}
      <Dialog open={!!qrMember} onOpenChange={() => setQrMember(null)}>
        <DialogContent className="bg-card border-border max-w-xs text-center">
          <DialogHeader><DialogTitle className="font-display">QR Personal</DialogTitle></DialogHeader>
          {qrMember && (
            <div className="flex flex-col items-center gap-4 py-2">
              <Avatar className="h-16 w-16">
                {qrMember.avatarUrl && <AvatarImage src={qrMember.avatarUrl} />}
                <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">{qrMember.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <p className="font-display font-bold text-foreground">{qrMember.fullName}</p>
              <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG value={`woditos://member/${qrMember.userId}`} size={180} level="M" includeMargin={false} />
              </div>
              <p className="text-xs text-muted-foreground">Escanear para registrar asistencia rápida</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {showQRScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowQRScanner(false)} />}
    </div>
  );
}

/** Subcomponente: buscar y asignar un miembro a la sesión actual.
 * Si no existe, permite crear uno nuevo con solo el nombre.
 */
function AssignMemberToSession({
  sessionId, existingUserIds, onAssigned
}: {
  sessionId: string; existingUserIds: string[]; onAssigned: () => void;
}) {
  const [search, setSearch] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [showCreateMember, setShowCreateMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [creating, setCreating] = useState(false);

  const { data: searchResults } = useQuery({
    queryKey: ['search-members-assign', search],
    queryFn: async () => {
      if (search.length < 2) return [];
      const { data } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .ilike('full_name', `%${search}%`)
        .limit(5);
      return (data || []).filter((p: any) => !existingUserIds.includes(p.user_id));
    },
    enabled: search.length >= 2,
  });

  const assignMember = async (userId: string, name: string) => {
    setAssigning(true);
    const { error } = await supabase.from('reservations').insert({
      session_id: sessionId,
      user_id: userId,
      reservation_status: 'confirmed',
    });
    setAssigning(false);
    if (error) {
      toast.error('No se pudo asignar al miembro');
    } else {
      toast.success(`✅ ${name} asignado a esta sesión`);
      setSearch('');
      onAssigned();
    }
  };

  const handleCreateMember = async () => {
    const name = sanitizeText(newMemberName.trim());
    if (!name || name.length < 2) { toast.error('Ingresá un nombre válido (mín. 2 caracteres)'); return; }
    setCreating(true);

    // Create a placeholder email from the name
    const slug = name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
    const placeholderEmail = `${slug}.${Date.now()}@pendiente.woditos.app`;

    // Use Supabase edge function or direct insert for creating an incomplete user
    // Since we can't create auth users from client, we create the records directly
    // The user will need to be invited or register later
    const userId = crypto.randomUUID();
    
    // Insert into users table
    const { error: userError } = await supabase.from('users').insert({
      id: userId,
      email: placeholderEmail,
      role: 'member',
      status: 'active',
    });
    
    if (userError) {
      // If RLS blocks it, try via profiles only approach
      toast.error('No se pudo crear el miembro. Verificá tus permisos.');
      setCreating(false);
      return;
    }

    // Insert into profiles
    const { error: profileError } = await supabase.from('profiles').insert({
      user_id: userId,
      full_name: name,
    });

    if (profileError) {
      toast.error('Error creando el perfil del miembro');
      setCreating(false);
      return;
    }

    // Assign to session
    const { error: reservationError } = await supabase.from('reservations').insert({
      session_id: sessionId,
      user_id: userId,
      reservation_status: 'confirmed',
    });

    setCreating(false);
    if (reservationError) {
      toast.error('Miembro creado pero no se pudo asignar a la sesión');
    } else {
      toast.success(`✅ ${name} creado y asignado a la sesión`);
    }
    setNewMemberName('');
    setShowCreateMember(false);
    setSearch('');
    onAssigned();
  };

  const noResults = search.length >= 2 && searchResults && searchResults.length === 0;

  return (
    <div className="bg-card border border-dashed border-border rounded-xl p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2">
        Asignar miembro manualmente
      </p>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por nombre..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background border-border" />
      </div>
      {searchResults && searchResults.length > 0 && (
        <div className="mt-2 space-y-1">
          {searchResults.map((p: any) => (
            <button
              key={p.user_id}
              onClick={() => assignMember(p.user_id, p.full_name)}
              disabled={assigning}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
            >
              <Avatar className="h-8 w-8">
                {p.avatar_url && <AvatarImage src={p.avatar_url} />}
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">{p.full_name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-foreground">{p.full_name}</span>
              <Plus size={14} className="ml-auto text-primary" />
            </button>
          ))}
        </div>
      )}
      
      {/* No results: offer to create new member */}
      {noResults && (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-muted-foreground">No se encontraron miembros</p>
          {!showCreateMember ? (
            <Button variant="outline" size="sm" className="gap-1 w-full" onClick={() => { setShowCreateMember(true); setNewMemberName(search); }}>
              <UserPlus size={14} /> Crear miembro nuevo
            </Button>
          ) : (
            <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border">
              <Label className="text-xs">Nombre del nuevo miembro</Label>
              <Input value={newMemberName} onChange={e => setNewMemberName(e.target.value)} placeholder="Nombre completo" className="bg-background border-border" />
              <p className="text-xs text-muted-foreground">Se creará un perfil parcial. Este miembro podrá completar sus datos después.</p>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setShowCreateMember(false)} className="text-xs">Cancelar</Button>
                <Button size="sm" onClick={handleCreateMember} disabled={creating} className="gradient-primary text-primary-foreground text-xs gap-1 flex-1">
                  <UserPlus size={12} /> {creating ? 'Creando...' : 'Crear y asignar'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}