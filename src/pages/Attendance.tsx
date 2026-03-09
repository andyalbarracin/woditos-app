/**
 * Archivo: Attendance.tsx
 * Ruta: src/pages/Attendance.tsx
 * Última modificación: 2026-03-09
 * Descripción: Sistema de control de asistencia para coaches.
 *   - Calendario interactivo para elegir fecha con sesiones
 *   - Selector de sesión del día elegido
 *   - Marcar presencia/ausencia/tarde con botones rápidos
 *   - Notas individuales por asistente
 *   - QR personal de cada miembro
 *   - Botón para crear nueva sesión
 *   - Botón para comunicar mensaje a todos los asistentes
 */

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { format, isSameDay, startOfMonth, endOfMonth, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ClipboardCheck, Calendar as CalendarIcon, Check, Clock, X,
  MessageSquare, QrCode, User, Search, Save, Plus, Send, ScanLine
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

/** Tipos válidos de sesión (según constraint de BD) */
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

  // Fecha seleccionada en el calendario
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  // ID de la sesión seleccionada
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  // Búsqueda de miembros
  const [searchMember, setSearchMember] = useState('');
  // Estado local de asistencia
  const [attendees, setAttendees] = useState<Record<string, AttendeeState>>({});
  // QR dialog
  const [qrMember, setQrMember] = useState<AttendeeState | null>(null);
  // Nota expandida
  const [editingNoteFor, setEditingNoteFor] = useState<string | null>(null);
  // Guardando
  const [savingAll, setSavingAll] = useState(false);
  // Crear sesión dialog
  const [showCreateSession, setShowCreateSession] = useState(false);
  // Comunicar a asistentes dialog
  const [showCommunicate, setShowCommunicate] = useState(false);
  const [communicateMessage, setCommunicateMessage] = useState('');
  // QR Scanner
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Form para nueva sesión
  const [sessionForm, setSessionForm] = useState({
    title: '',
    session_type: 'functional',
    start_time: '08:00',
    end_time: '09:00',
    location: '',
    capacity: '20',
    notes: '',
  });
  const [selectedGroupId, setSelectedGroupId] = useState('');

  /** Todas las sesiones del mes para marcar días en el calendario */
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

  /** Sesiones del día seleccionado */
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

  /** Groups disponibles para crear sesión */
  const { data: groups } = useQuery({
    queryKey: ['attendance-groups'],
    queryFn: async () => {
      const { data } = await supabase.from('groups').select('id, name').order('name');
      return data || [];
    },
  });

  /** Asistentes de la sesión seleccionada */
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

  // Días con sesiones
  const daysWithSessions = useMemo(() => {
    if (!monthSessions) return [];
    return monthSessions.map((s: any) => new Date(s.start_time));
  }, [monthSessions]);

  // Actualizar estado local
  const updateLocalStatus = (userId: string, status: AttendanceStatus) => {
    setAttendees(prev => ({ ...prev, [userId]: { ...prev[userId], status } }));
  };

  const updateLocalNote = (userId: string, note: string) => {
    setAttendees(prev => ({ ...prev, [userId]: { ...prev[userId], note } }));
  };

  // Guardar uno
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
    if (error) toast.error('No se pudo guardar');
    else {
      toast.success(`✓ ${a.fullName} guardado`);
      queryClient.invalidateQueries({ queryKey: ['attendance-session', selectedSessionId] });
    }
  };

  // Guardar todos
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
    if (error) toast.error('No se pudo guardar la asistencia');
    else {
      toast.success(`✅ ${withStatus.length} asistencias guardadas`);
      queryClient.invalidateQueries({ queryKey: ['attendance-session', selectedSessionId] });
    }
  };

  // Crear sesión
  const handleCreateSession = async () => {
    if (!selectedGroupId) { toast.error('Elegí un crew'); return; }
    if (!sessionForm.session_type) { toast.error('Elegí un tipo de sesión'); return; }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const startISO = `${dateStr}T${sessionForm.start_time}:00`;
    const endISO = `${dateStr}T${sessionForm.end_time}:00`;

    const { error } = await supabase.from('sessions').insert({
      group_id: selectedGroupId,
      coach_id: user?.id,
      title: sessionForm.title || 'Sesión',
      session_type: sessionForm.session_type,
      start_time: startISO,
      end_time: endISO,
      location: sessionForm.location || null,
      capacity: parseInt(sessionForm.capacity) || 20,
      notes: sessionForm.notes || null,
    });

    if (error) {
      toast.error('No se pudo crear la sesión');
    } else {
      toast.success('¡Sesión creada!');
      setShowCreateSession(false);
      setSessionForm({ title: '', session_type: 'functional', start_time: '08:00', end_time: '09:00', location: '', capacity: '20', notes: '' });
      setSelectedGroupId('');
      queryClient.invalidateQueries({ queryKey: ['attendance-day-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-month-sessions'] });
    }
  };

  // Comunicar a asistentes (simulated - crea notificaciones)
  const handleCommunicate = async () => {
    if (!communicateMessage.trim()) { toast.error('Escribí un mensaje'); return; }
    const userIds = Object.keys(attendees);
    if (userIds.length === 0) { toast.error('No hay asistentes en esta sesión'); return; }

    const notifications = userIds.map(uid => ({
      user_id: uid,
      title: 'Mensaje del coach',
      message: communicateMessage.trim(),
      type: 'announcement',
    }));

    const { error } = await supabase.from('notifications').insert(notifications);
    if (error) toast.error('No se pudo enviar el mensaje');
    else {
      toast.success(`Mensaje enviado a ${userIds.length} asistentes`);
      setShowCommunicate(false);
      setCommunicateMessage('');
    }
  };

  // Manejar escaneo QR
  const handleQRScan = async (result: string) => {
    setShowQRScanner(false);
    
    // Extraer user ID del QR (formato: woditos://member/{userId})
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

    // Marcar como presente
    updateLocalStatus(scannedUserId, 'present');
    
    // Guardar automáticamente
    const { error } = await supabase.from('attendance').upsert({
      session_id: selectedSessionId,
      user_id: scannedUserId,
      attendance_status: 'present',
      checkin_time: new Date().toISOString(),
    }, { onConflict: 'session_id,user_id' });

    if (error) {
      toast.error('No se pudo registrar la asistencia');
    } else {
      toast.success(`✅ ${attendee.fullName} registrado como presente`);
      queryClient.invalidateQueries({ queryKey: ['attendance-session', selectedSessionId] });
    }
  };

  // Filtrar miembros
  const filteredAttendees = Object.values(attendees).filter(a =>
    a.fullName.toLowerCase().includes(searchMember.toLowerCase())
  );

  // Contadores
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
          {/* Botón escanear QR - siempre visible si hay sesión seleccionada */}
          {selectedSessionId && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={() => setShowQRScanner(true)}
            >
              <ScanLine size={14} /> Escanear QR
            </Button>
          )}
          
          {/* Botón crear sesión */}
          <Dialog open={showCreateSession} onOpenChange={setShowCreateSession}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Plus size={14} /> Crear sesión
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-display">Nueva Sesión para {format(selectedDate, 'd MMM', { locale: es })}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Crew</Label>
                  <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Elegir crew..." />
                    </SelectTrigger>
                    <SelectContent>
                      {groups?.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    placeholder="Ej: AMRAP 20'"
                    value={sessionForm.title}
                    onChange={e => setSessionForm(f => ({ ...f, title: e.target.value }))}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={sessionForm.session_type} onValueChange={v => setSessionForm(f => ({ ...f, session_type: v }))}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SESSION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Hora inicio</Label>
                    <Input type="time" value={sessionForm.start_time} onChange={e => setSessionForm(f => ({ ...f, start_time: e.target.value }))} className="bg-background border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora fin</Label>
                    <Input type="time" value={sessionForm.end_time} onChange={e => setSessionForm(f => ({ ...f, end_time: e.target.value }))} className="bg-background border-border" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Ubicación</Label>
                  <Input placeholder="Opcional" value={sessionForm.location} onChange={e => setSessionForm(f => ({ ...f, location: e.target.value }))} className="bg-background border-border" />
                </div>
                <Button onClick={handleCreateSession} className="w-full gradient-primary text-primary-foreground">
                  Crear sesión
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Guardar todo */}
          {selectedSessionId && Object.values(attendees).some(a => a.status) && (
            <Button onClick={saveAllAttendance} disabled={savingAll} className="gradient-primary text-primary-foreground gap-1" size="sm">
              <Save size={14} />
              {savingAll ? 'Guardando...' : 'Guardar todo'}
            </Button>
          )}
        </div>
      </div>

      {/* Calendario interactivo */}
      <div className="bg-card border border-border rounded-xl p-4">
        <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-3 block">
          Elegí una fecha
        </label>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(d) => { if (d) { setSelectedDate(d); setSelectedSessionId(''); setAttendees({}); } }}
          locale={es}
          className="rounded-md border-0 pointer-events-auto w-full"
          classNames={{
            months: "flex flex-col w-full",
            month: "space-y-4 w-full",
            table: "w-full border-collapse space-y-1",
            head_row: "flex w-full",
            head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] text-center",
            row: "flex w-full mt-2",
            cell: "flex-1 h-10 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: "h-10 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-muted rounded-md transition-colors",
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground font-bold",
            day_outside: "text-muted-foreground opacity-50",
            nav: "space-x-1 flex items-center",
            nav_button: "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 border border-border rounded-md inline-flex items-center justify-center",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
          }}
          modifiers={{ hasSessions: daysWithSessions }}
          modifiersClassNames={{ hasSessions: 'bg-primary/20 text-primary font-bold' }}
        />
      </div>

      {/* Selector de sesión del día */}
      <div className="bg-card border border-border rounded-xl p-4">
        <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2 block">
          Sesiones del {format(selectedDate, 'd MMM', { locale: es })}
        </label>
        {daySessions && daySessions.length > 0 ? (
          <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
            <SelectTrigger className="bg-background border-border">
              <SelectValue placeholder="Seleccionar sesión..." />
            </SelectTrigger>
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

        {/* Info sesión seleccionada + botón comunicar */}
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
                  <Button variant="outline" size="sm" className="gap-1">
                    <Send size={14} /> Comunicar
                  </Button>
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
          {/* Resumen rápido */}
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

          {/* Buscador */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar miembro..."
              value={searchMember}
              onChange={e => setSearchMember(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>

          {/* Lista */}
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
                    className={cn(
                      'bg-card border rounded-xl p-4 transition-colors',
                      attendee.status ? 'border-border' : 'border-border border-dashed'
                    )}
                  >
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
                              onClick={() => updateLocalStatus(attendee.userId, s)}
                              title={cfg.label}
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

                        <button
                          onClick={() => setEditingNoteFor(editingNoteFor === attendee.userId ? null : attendee.userId)}
                          title="Agregar nota"
                          className={cn(
                            'w-8 h-8 rounded-full border flex items-center justify-center transition-all',
                            attendee.note
                              ? 'border-secondary text-secondary bg-secondary/10'
                              : 'border-border text-muted-foreground hover:border-secondary/40'
                          )}
                        >
                          <MessageSquare size={13} />
                        </button>

                        <button
                          onClick={() => setQrMember(attendee)}
                          title="Ver QR"
                          className="w-8 h-8 rounded-full border border-border text-muted-foreground flex items-center justify-center hover:border-accent/40 hover:text-accent transition-all"
                        >
                          <QrCode size={13} />
                        </button>
                      </div>
                    </div>

                    {editingNoteFor === attendee.userId && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <Textarea
                          placeholder="Feedback, observaciones, rendimiento..."
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
                  : 'No se encontraron miembros con ese nombre'}
              </p>
            </div>
          )}
        </>
      )}

      {/* Estado vacío */}
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
          <DialogHeader>
            <DialogTitle className="font-display">QR Personal</DialogTitle>
          </DialogHeader>
          {qrMember && (
            <div className="flex flex-col items-center gap-4 py-2">
              <Avatar className="h-16 w-16">
                {qrMember.avatarUrl && <AvatarImage src={qrMember.avatarUrl} />}
                <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
                  {qrMember.fullName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="font-display font-bold text-foreground">{qrMember.fullName}</p>
              <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG
                  value={`woditos://member/${qrMember.userId}`}
                  size={180}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p className="text-xs text-muted-foreground">Escanear para registrar asistencia rápida</p>
              <p className="text-xs font-mono text-muted-foreground/60 break-all">ID: {qrMember.userId.slice(0, 16)}...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Scanner fullscreen */}
      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
}
