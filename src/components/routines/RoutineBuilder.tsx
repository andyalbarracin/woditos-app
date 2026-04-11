/**
 * Archivo: RoutineBuilder.tsx
 * Ruta: src/components/routines/RoutineBuilder.tsx
 * Última modificación: 2026-04-08
 * Descripción: Constructor de rutinas. Form de metadatos + RoutineDnDBoard.
 *   FIX CRÍTICO v2.2: condición de loading corregida.
 *   La condición anterior `!dataLoaded && !routineData` era incorrecta:
 *   cuando routineData llegaba antes de que el useEffect corriera,
 *   la condición fallaba y mostraba el form vacío.
 *   Fix: usar `loadingRoutine || !dataLoaded` para esperar ambas condiciones.
 */

import { useState, useId, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, Clock, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ROUTINE_TYPES, ROUTINE_LEVELS } from '@/lib/exerciseTranslations';
import type { ExerciseDBItem } from '@/lib/exerciseTranslations';
import RoutineDnDBoard, { type RoutineExerciseEntry } from './RoutineDnDBoard';
import ExercisePickerModal from './ExercisePickerModal';
import { useIsMobile } from '@/hooks/use-mobile';

const db = supabase as any;

interface RoutineForm {
  name: string; description: string; type: string;
  level: string; estimatedMinutes: number;
}

const DEFAULT_FORM: RoutineForm = {
  name: '', description: '', type: 'custom', level: 'intermediate', estimatedMinutes: 30,
};

interface Props { routineId?: string; }

export default function RoutineBuilder({ routineId }: Props) {
  const navigate  = useNavigate();
  const { toast } = useToast();
  const qc        = useQueryClient();
  const { user, clubMembership } = useAuth();
  const isMobile  = useIsMobile();
  const uid       = useId();

  const [form, setForm]             = useState<RoutineForm>(DEFAULT_FORM);
  const [exercises, setExercises]   = useState<RoutineExerciseEntry[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const clubId = clubMembership?.club_id;
  const isEdit = !!routineId;

  // ── Cargar rutina en modo edición ─────────────────────────────
  const { data: routineData, isLoading: loadingRoutine } = useQuery({
    queryKey: ['routine', routineId],
    queryFn: async () => {
      const { data, error } = await db
        .from('routines').select('*, routine_exercises(*)')
        .eq('id', routineId).single();
      if (error) throw error;
      return data;
    },
    enabled: isEdit,
  });

  // FIX: useEffect carga datos cuando routineData llega.
  // La clave del fix está en el loading check de abajo, no aquí.
  useEffect(() => {
    if (!routineData || dataLoaded) return;
    setForm({
      name:             routineData.name ?? '',
      description:      routineData.description ?? '',
      type:             routineData.type ?? 'custom',
      level:            routineData.level ?? 'intermediate',
      estimatedMinutes: routineData.estimated_minutes ?? 30,
    });
    const exs: RoutineExerciseEntry[] = (routineData.routine_exercises ?? [])
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .map((ex: any) => ({
        uid:             `${uid}-${ex.id}`,
        dbId:            ex.exercise_db_id ?? '',
        nameES:          ex.exercise_name ?? '',
        gifUrl:          ex.exercise_gif_url ?? '',
        bodyPartES:      ex.exercise_body_part ?? '',
        equipmentES:     '',
        sets:            ex.sets !== null ? Number(ex.sets) : '',
        reps:            ex.reps !== null ? Number(ex.reps) : '',
        durationSeconds: ex.duration_seconds !== null ? Number(ex.duration_seconds) : '',
        restSeconds:     ex.rest_seconds !== null ? Number(ex.rest_seconds) : '',
        weightKg:        ex.weight_kg !== null ? Number(ex.weight_kg) : '',
        notes:           ex.notes ?? '',
        inPool:          false, expanded: false,
      }));
    setExercises(exs);
    setDataLoaded(true);
  }, [routineData]); // dataLoaded y uid NO son deps — no necesitan re-ejecutar el efecto

  const handleSelectExercise = (ex: ExerciseDBItem) => {
    setExercises(prev => [
      ...prev,
      {
        uid:             `${uid}-${Date.now()}-${ex.id}`,
        dbId:            ex.id,
        nameES:          ex.nameES,
        gifUrl:          ex.gifUrl,
        bodyPartES:      ex.bodyPartES,
        equipmentES:     ex.equipmentES,
        sets:            3, reps: 10, durationSeconds: '',
        restSeconds:     60, weightKg: '', notes: '',
        inPool:          false, expanded: false,
      },
    ]);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!clubId || !user?.id) throw new Error('Sin club o usuario');
      if (!form.name.trim()) throw new Error('El nombre es obligatorio');

      const payload = {
        club_id: clubId, coach_id: user.id,
        name:        form.name.trim(),
        description: form.description.trim() || null,
        type:  form.type, level: form.level,
        estimated_minutes: form.estimatedMinutes,
      };

      let rId = routineId;
      if (isEdit) {
        const { error } = await db.from('routines').update(payload).eq('id', routineId);
        if (error) throw error;
      } else {
        const { data, error } = await db.from('routines').insert(payload).select('id').single();
        if (error) throw error;
        rId = data.id;
      }

      await db.from('routine_exercises').delete().eq('routine_id', rId);

      const active = exercises.filter(e => !e.inPool);
      if (active.length > 0) {
        const rows = active.map((ex, idx) => ({
          routine_id:         rId,
          exercise_db_id:     ex.dbId || null,
          exercise_name:      ex.nameES,
          exercise_gif_url:   ex.gifUrl || null,
          exercise_body_part: ex.bodyPartES || null,
          sets:               ex.sets !== '' ? ex.sets : null,
          reps:               ex.reps !== '' ? ex.reps : null,
          duration_seconds:   ex.durationSeconds !== '' ? ex.durationSeconds : null,
          rest_seconds:       ex.restSeconds !== '' ? ex.restSeconds : null,
          weight_kg:          ex.weightKg !== '' ? ex.weightKg : null,
          notes:              ex.notes || null,
          order_index:        idx,
        }));
        const { error } = await db.from('routine_exercises').insert(rows);
        if (error) throw error;
      }
      return rId!;
    },
    onSuccess: (id: string) => {
      toast({ title: isEdit ? 'Rutina actualizada' : 'Rutina creada', description: form.name });
      qc.invalidateQueries({ queryKey: ['routines'] });
      qc.invalidateQueries({ queryKey: ['routine', routineId] });
      navigate(`/rutinas/${id}`);
    },
    onError: (err: Error) =>
      toast({ title: 'Error al guardar', description: err.message, variant: 'destructive' }),
  });

  const setField = <K extends keyof RoutineForm>(k: K, v: RoutineForm[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  const activeCount = exercises.filter(e => !e.inPool).length;

  // ─── FIX CRÍTICO ────────────────────────────────────────────
  // ANTES: `!dataLoaded && !routineData`
  //   → Fallaba cuando routineData llegaba antes del useEffect:
  //     !dataLoaded=true, !routineData=false → false → mostraba form VACÍO
  //
  // AHORA: `loadingRoutine || !dataLoaded`
  //   → Muestra spinner mientras carga el query (loadingRoutine=true)
  //   → Muestra spinner mientras el useEffect aún no corrió (!dataLoaded=true)
  //   → Solo muestra el form cuando routineData llegó Y el form fue seteado
  if (isEdit && (loadingRoutine || !dataLoaded)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/rutinas')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">{isEdit ? 'Editar rutina' : 'Nueva rutina'}</h1>
          <p className="text-sm text-muted-foreground">
            {activeCount} ejercicio{activeCount !== 1 ? 's' : ''} activo{activeCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border bg-card p-4">
        <div>
          <Label htmlFor="rname">Nombre *</Label>
          <Input id="rname" placeholder="Ej: AMRAP 20 min · Funcional"
            value={form.name} onChange={e => setField('name', e.target.value)} className="mt-1" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Tipo</Label>
            <Select value={form.type} onValueChange={v => setField('type', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROUTINE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nivel</Label>
            <Select value={form.level} onValueChange={v => setField('level', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROUTINE_LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1">
            <Label>Duración estimada (minutos)</Label>
            <Input type="number" min={5} max={180} value={form.estimatedMinutes}
              onChange={e => setField('estimatedMinutes', Number(e.target.value))} className="mt-1" />
          </div>
        </div>
        <div>
          <Label>Descripción (opcional)</Label>
          <Textarea placeholder="Instrucciones generales…" value={form.description}
            onChange={e => setField('description', e.target.value)} rows={2} className="mt-1 resize-none" />
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-medium text-sm">Ejercicios</h2>
        </div>
        <RoutineDnDBoard items={exercises} onChange={setExercises}
          onAddClick={() => setPickerOpen(true)} isMobile={isMobile} />
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate('/rutinas')}>Cancelar</Button>
        <Button className="flex-1" onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !form.name.trim()}>
          {saveMutation.isPending
            ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
            : <Save className="h-4 w-4 mr-2" />}
          {isEdit ? 'Guardar cambios' : 'Crear rutina'}
        </Button>
      </div>

      <ExercisePickerModal open={pickerOpen} onClose={() => setPickerOpen(false)}
        onSelect={handleSelectExercise}
        selectedIds={exercises.filter(e => !e.inPool).map(e => e.dbId)} />
    </div>
  );
}