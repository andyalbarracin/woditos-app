/**
 * Archivo: CreateSessionDialog.tsx
 * Ruta: src/components/CreateSessionDialog.tsx
 * Última modificación: 2026-03-16
 * Descripción: Modal reutilizable para crear sesiones.
 *   - Calendar date picker (react-day-picker)
 *   - Hora inicio con input time 24h
 *   - Duración con botones +/- 15 minutos
 *   - Muestra "hasta las XXhs"
 */
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { format, addMinutes, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Minus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { sanitizeText } from '@/lib/validation';
import { cn } from '@/lib/utils';

const SESSION_TYPES = [
  { value: 'running', label: 'Running' },
  { value: 'functional', label: 'Funcional' },
  { value: 'amrap', label: 'AMRAP' },
  { value: 'emom', label: 'EMOM' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'technique', label: 'Técnica' },
];

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
  onCreated?: () => void;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTE_OPTIONS = ['00', '15', '30', '45'];

export default function CreateSessionDialog({ open, onOpenChange, initialDate, onCreated }: CreateSessionDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate || new Date());
  const [title, setTitle] = useState('');
  const [sessionType, setSessionType] = useState('');
  const [startHour, setStartHour] = useState('08');
  const [startMinute, setStartMinute] = useState('00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('20');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [crewMode, setCrewMode] = useState<'existing' | 'new'>('existing');
  const [newCrewName, setNewCrewName] = useState('');
  const [newCrewType, setNewCrewType] = useState('functional');
  const [newCrewLocation, setNewCrewLocation] = useState('');
  const [creating, setCreating] = useState(false);

  const { data: groups } = useQuery({
    queryKey: ['session-dialog-groups'],
    queryFn: async () => {
      const { data } = await supabase.from('groups').select('id, name').order('name');
      return data || [];
    },
  });

  const startTime = `${startHour}:${startMinute}`;

  // Calculate end time from start + duration
  const getEndTime = () => {
    try {
      const baseDate = parse(startTime, 'HH:mm', new Date());
      const endDate = addMinutes(baseDate, durationMinutes);
      return format(endDate, 'HH:mm');
    } catch {
      return '--:--';
    }
  };

  const endTime = getEndTime();

  const handleCreate = async () => {
    if (!selectedDate) { toast.error('Elegí una fecha'); return; }
    if (!startTime) { toast.error('Elegí una hora de inicio'); return; }
    if (!sessionType) { toast.error('Elegí un tipo de sesión'); return; }

    setCreating(true);

    let groupId = selectedGroupId;

    // Create new crew if needed
    if (crewMode === 'new') {
      if (!newCrewName.trim()) { toast.error('Ingresá el nombre del crew'); setCreating(false); return; }
      const { data: newGroup, error: groupError } = await supabase.from('groups').insert({
        name: sanitizeText(newCrewName.trim()),
        group_type: newCrewType || 'functional',
        location: newCrewLocation || null,
        capacity: parseInt(capacity) || 20,
        coach_id: user!.id,
      }).select('id').single();
      if (groupError) { toast.error('No se pudo crear el crew'); setCreating(false); return; }
      groupId = newGroup.id;
    }

    if (!groupId) { toast.error('Elegí o creá un crew'); setCreating(false); return; }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const startISO = `${dateStr}T${startTime}:00`;
    const endISO = `${dateStr}T${endTime}:00`;

    const { error } = await supabase.from('sessions').insert({
      group_id: groupId,
      coach_id: user!.id,
      title: sanitizeText(title) || 'Sesión',
      session_type: sessionType,
      start_time: startISO,
      end_time: endISO,
      location: location ? sanitizeText(location) : null,
      capacity: parseInt(capacity) || 20,
    });

    setCreating(false);

    if (error) {
      toast.error('No se pudo crear la sesión');
    } else {
      toast.success('¡Sesión creada!');
      // Reset
      setTitle('');
      setSessionType('');
      setStartHour('08');
      setStartMinute('00');
      setDurationMinutes(60);
      setLocation('');
      setCapacity('20');
      setSelectedGroupId('');
      setCrewMode('existing');
      setNewCrewName('');
      onOpenChange(false);
      // Invalidate all session-related queries
      queryClient.invalidateQueries({ queryKey: ['sessions-week'] });
      queryClient.invalidateQueries({ queryKey: ['coach-today-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-sessions-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-day-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-month-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['coach-groups'] });
      onCreated?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Crear Sesión</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">

          {/* Crew */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Crew</Label>
              <button
                type="button"
                onClick={() => setCrewMode(m => m === 'existing' ? 'new' : 'existing')}
                className="text-xs text-primary font-medium hover:underline"
              >
                {crewMode === 'existing' ? '+ Crear nuevo crew' : 'Elegir crew existente'}
              </button>
            </div>
            {crewMode === 'existing' ? (
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Seleccionar crew" />
                </SelectTrigger>
                <SelectContent>
                  {groups?.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <div className="space-y-2 p-3 border border-dashed border-primary/30 rounded-lg bg-primary/5">
                <Input placeholder="Nombre del nuevo crew" value={newCrewName} onChange={e => setNewCrewName(e.target.value)} className="bg-background border-border" />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Tipo (ej: functional)" value={newCrewType} onChange={e => setNewCrewType(e.target.value)} className="bg-background border-border text-sm" />
                  <Input placeholder="Ubicación" value={newCrewLocation} onChange={e => setNewCrewLocation(e.target.value)} className="bg-background border-border text-sm" />
                </div>
              </div>
            )}
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label>Título</Label>
            <Input placeholder="Ej: AMRAP 20min" value={title} onChange={e => setTitle(e.target.value)} className="bg-background border-border" />
          </div>

          {/* Tipo de sesión */}
          <div className="space-y-2">
            <Label>Tipo de sesión</Label>
            <Select value={sessionType} onValueChange={setSessionType}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Elegir tipo..." />
              </SelectTrigger>
              <SelectContent>
                {SESSION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Fecha - Calendar picker */}
          <div className="space-y-2">
            <Label>Fecha</Label>
            <div className="bg-background border border-border rounded-lg p-1">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => { if (d) setSelectedDate(d); }}
                locale={es}
                className={cn("rounded-md border-0 pointer-events-auto w-full")}
                classNames={{
                  months: "flex flex-col w-full",
                  month: "space-y-2 w-full",
                  table: "w-full border-collapse",
                  head_row: "flex w-full",
                  head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] text-center",
                  row: "flex w-full mt-1",
                  cell: "flex-1 h-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                  day: "h-9 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-muted rounded-md transition-colors",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground font-bold",
                  day_outside: "text-muted-foreground opacity-50",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-border rounded-md inline-flex items-center justify-center",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                }}
              />
            </div>
            {selectedDate && (
              <p className="text-xs text-muted-foreground">
                Seleccionado: {format(selectedDate, "EEEE d 'de' MMMM yyyy", { locale: es })}
              </p>
            )}
          </div>

          {/* Hora de inicio */}
          <div className="space-y-2">
            <Label>Hora de inicio (24hs)</Label>
            <div className="grid grid-cols-2 gap-3">
              <Select value={startHour} onValueChange={setStartHour}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Hora" />
                </SelectTrigger>
                <SelectContent>
                  {HOUR_OPTIONS.map((h) => (
                    <SelectItem key={h} value={h}>{h} hs</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={startMinute} onValueChange={setStartMinute}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Min" />
                </SelectTrigger>
                <SelectContent>
                  {MINUTE_OPTIONS.map((m) => (
                    <SelectItem key={m} value={m}>{m} min</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">Inicio: {startTime} hs</p>
          </div>

          {/* Duración con botones +/- 15min */}
          <div className="space-y-2">
            <Label>Duración</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setDurationMinutes(d => Math.max(15, d - 15))}
                disabled={durationMinutes <= 15}
                className="h-10 w-10 shrink-0"
              >
                <Minus size={16} />
              </Button>
              <div className="flex-1 text-center">
                <p className="text-lg font-display font-bold text-foreground">{durationMinutes} min</p>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Clock size={12} /> hasta las {endTime}hs
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setDurationMinutes(d => Math.min(240, d + 15))}
                disabled={durationMinutes >= 240}
                className="h-10 w-10 shrink-0"
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>

          {/* Ubicación + Capacidad */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Ubicación</Label>
              <Input placeholder="Ej: Palermo Rosedal" value={location} onChange={e => setLocation(e.target.value)} className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label>Capacidad</Label>
              <Input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} className="bg-background border-border" />
            </div>
          </div>

          <Button
            onClick={handleCreate}
            disabled={creating}
            className="w-full gradient-primary text-primary-foreground"
          >
            {creating ? 'Creando...' : 'Crear Sesión'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
