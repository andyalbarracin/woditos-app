/**
 * Archivo: ExerciseManager.tsx
 * Ruta: src/pages/ExerciseManager.tsx
 * Última modificación: 2026-04-23
 * Descripción: Página de gestión de ejercicios del coach.
 *   Lista ejercicios globales (CDN) y los del club del coach.
 *   Permite crear, editar y eliminar ejercicios propios del club.
 *   Los ejercicios creados aquí se guardan en exercise_library con club_id
 *   y quedan disponibles automáticamente en el RoutineBuilder.
 */

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Plus, Search, Loader2, Dumbbell, Edit2, Trash2,
  Upload, X, ArrowLeft, Save, Globe, Building2,
  Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const db = supabase as any;

// ── Constantes ────────────────────────────────────────────────
const BODY_PARTS = [
  'back', 'cardio', 'chest', 'lower arms', 'lower legs',
  'neck', 'shoulders', 'upper arms', 'upper legs', 'waist',
];
const BODY_PARTS_ES: Record<string, string> = {
  'back': 'Espalda', 'cardio': 'Cardio', 'chest': 'Pecho',
  'lower arms': 'Antebrazos', 'lower legs': 'Pantorrillas',
  'neck': 'Cuello', 'shoulders': 'Hombros', 'upper arms': 'Brazos',
  'upper legs': 'Piernas', 'waist': 'Cintura / Core',
};
const EQUIPMENT_OPTIONS = [
  'body only', 'barbell', 'dumbbell', 'cable', 'machine',
  'kettlebells', 'bands', 'medicine ball', 'exercise ball',
  'foam roll', 'other',
];
const EQUIPMENT_ES: Record<string, string> = {
  'body only': 'Peso corporal', 'barbell': 'Barra', 'dumbbell': 'Mancuernas',
  'cable': 'Polea', 'machine': 'Máquina', 'kettlebells': 'Kettlebells',
  'bands': 'Bandas', 'medicine ball': 'Pelota medicinal',
  'exercise ball': 'Pelota fitball', 'foam roll': 'Foam roller', 'other': 'Otro',
};

interface ExerciseForm {
  name: string;
  body_part: string;
  equipment: string;
  target: string;
  description: string;
  instructions: string; // texto libre, se convierte a array al guardar
}

const EMPTY_FORM: ExerciseForm = {
  name: '', body_part: 'upper legs', equipment: 'body only',
  target: '', description: '', instructions: '',
};

// ── Componente ────────────────────────────────────────────────
export default function ExerciseManager() {
  const { user, clubMembership } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch]           = useState('');
  const [filter, setFilter]           = useState<'all' | 'mine'>('all');
  const [dialog, setDialog]           = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [form, setForm]               = useState<ExerciseForm>(EMPTY_FORM);
  const [deleting, setDeleting]       = useState<string | null>(null);

  // Upload de imágenes
  const startImgRef  = useRef<HTMLInputElement>(null);
  const endImgRef    = useRef<HTMLInputElement>(null);
  const [startFile, setStartFile] = useState<File | null>(null);
  const [endFile, setEndFile]     = useState<File | null>(null);
  const [startPreview, setStartPreview] = useState<string | null>(null);
  const [endPreview, setEndPreview]     = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const clubId = clubMembership?.club_id;

  // ── Query: ejercicios ─────────────────────────────────────
  const { data: exercises, isLoading } = useQuery({
    queryKey: ['exercise-library-managed', clubId, search, filter],
    queryFn: async () => {
      let q = db.from('exercise_library')
        .select('id, name, body_part, equipment, target, gif_url, image_start_url, image_end_url, is_global, club_id, created_by, instructions')
        .order('name');

      if (filter === 'mine') {
        q = q.eq('club_id', clubId).eq('created_by', user!.id);
      }
      // Para 'all': RLS ya filtra → globales + del club

      const { data, error } = await q;
      if (error) throw error;

      if (search.trim()) {
        const s = search.toLowerCase();
        return (data ?? []).filter((e: any) =>
          e.name?.toLowerCase().includes(s) ||
          e.body_part?.toLowerCase().includes(s) ||
          e.target?.toLowerCase().includes(s)
        );
      }
      return data ?? [];
    },
    enabled: !!clubId,
  });

  // ── Upload imagen ─────────────────────────────────────────
  const handleImageSelect = (
    file: File,
    setter: (f: File) => void,
    previewSetter: (url: string) => void
  ) => {
    if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imágenes'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('La imagen no puede superar 10MB'); return; }
    setter(file);
    const reader = new FileReader();
    reader.onload = e => previewSetter(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file: File, path: string): Promise<string> => {
    const { error } = await supabase.storage.from('exercise-images').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('exercise-images').getPublicUrl(path);
    return data.publicUrl;
  };

  // ── Abrir diálogo crear ───────────────────────────────────
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setStartFile(null); setEndFile(null);
    setStartPreview(null); setEndPreview(null);
    setEditingId(null);
    setDialog('create');
  };

  // ── Abrir diálogo editar ──────────────────────────────────
  const openEdit = (ex: any) => {
    setForm({
      name:         ex.name ?? '',
      body_part:    ex.body_part ?? 'upper legs',
      equipment:    ex.equipment ?? 'body only',
      target:       ex.target ?? '',
      description:  '',
      instructions: (ex.instructions ?? []).join('\n'),
    });
    setStartPreview(ex.image_start_url || ex.gif_url || null);
    setEndPreview(ex.image_end_url || null);
    setStartFile(null); setEndFile(null);
    setEditingId(ex.id);
    setDialog('edit');
  };

  // ── Guardar ───────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    if (!clubId || !user?.id) return;
    setSaving(true);
    try {
      let image_start_url: string | null = null;
      let image_end_url: string | null = null;
      const timestamp = Date.now();

      if (startFile) {
        const path = `${clubId}/${user.id}/${timestamp}_start.${startFile.name.split('.').pop()}`;
        image_start_url = await uploadImage(startFile, path);
      }
      if (endFile) {
        const path = `${clubId}/${user.id}/${timestamp}_end.${endFile.name.split('.').pop()}`;
        image_end_url = await uploadImage(endFile, path);
      }

      const instructionsArray = form.instructions
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);

      const payload: Record<string, any> = {
        name:         form.name.trim(),
        name_en:      form.name.trim(),
        body_part:    form.body_part,
        equipment:    form.equipment,
        target:       form.target.trim() || form.body_part,
        instructions: instructionsArray,
        is_global:    false,
        club_id:      clubId,
        created_by:   user.id,
      };

      if (image_start_url) payload.image_start_url = image_start_url;
      if (image_end_url)   payload.image_end_url = image_end_url;
      // gif_url apunta a image_start_url para compatibilidad con RoutineBuilder
      if (image_start_url) payload.gif_url = image_start_url;

      if (dialog === 'edit' && editingId) {
        const { error } = await db.from('exercise_library').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Ejercicio actualizado');
      } else {
        const { error } = await db.from('exercise_library').insert(payload);
        if (error) throw error;
        toast.success('Ejercicio creado');
      }

      qc.invalidateQueries({ queryKey: ['exercise-library-managed'] });
      qc.invalidateQueries({ queryKey: ['exercise-library'] });
      setDialog(null);
    } catch (err: any) {
      toast.error('Error al guardar: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  // ── Eliminar ──────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('exercise_library').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exercise-library-managed'] });
      qc.invalidateQueries({ queryKey: ['exercise-library'] });
      toast.success('Ejercicio eliminado');
      setDeleting(null);
    },
    onError: () => toast.error('No se pudo eliminar'),
  });

  const myExercisesCount = exercises?.filter((e: any) => e.club_id === clubId).length ?? 0;

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in pb-10">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-extrabold text-foreground">Ejercicios</h1>
          <p className="text-sm text-muted-foreground">
            Biblioteca global + {myExercisesCount} ejercicio{myExercisesCount !== 1 ? 's' : ''} de tu club
          </p>
        </div>
        <Button onClick={openCreate} className="gradient-primary text-primary-foreground gap-2">
          <Plus size={16} /> Nuevo ejercicio
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o músculo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {(['all', 'mine'] as const).map(f => (
            <button key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                filter === f ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'
              }`}>
              {f === 'all' ? 'Todos' : 'Mis ejercicios'}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !exercises?.length ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center">
          <Dumbbell size={32} className="mx-auto text-muted-foreground mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">
            {filter === 'mine' ? 'Todavía no creaste ejercicios propios.' : 'Sin resultados.'}
          </p>
          {filter === 'mine' && (
            <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={openCreate}>
              <Plus size={13} /> Crear primero
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {exercises.map((ex: any) => {
            const isOwn = ex.club_id === clubId && ex.created_by === user?.id;
            const imgSrc = ex.image_start_url || ex.gif_url;
            return (
              <div key={ex.id}
            className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 hover:border-border/80 transition-colors cursor-pointer"
            onClick={() => navigate(`/biblioteca/libreria/${ex.id}`)}>
                  {/* Imagen */}
                <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                  {imgSrc ? (
                    <img src={imgSrc} alt={ex.name}
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <Dumbbell size={20} className="text-muted-foreground" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground truncate">{ex.name}</p>
                    {ex.is_global ? (
                      <Badge variant="secondary" className="text-[10px] gap-1 px-1.5 py-0">
                        <Globe size={9} /> Global
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0 border-primary/30 text-primary">
                        <Building2 size={9} /> Tu club
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {BODY_PARTS_ES[ex.body_part] || ex.body_part}
                    {ex.equipment && ` · ${EQUIPMENT_ES[ex.equipment] || ex.equipment}`}
                    {ex.target && ` · ${ex.target}`}
                  </p>
                </div>

                {/* Acciones (solo los ejercicios propios) */}
                {isOwn && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => openEdit(ex)}>
                      <Edit2 size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleting(ex.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Dialog crear / editar ─────────────────────────── */}
      <Dialog open={!!dialog} onOpenChange={v => { if (!v) setDialog(null); }}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {dialog === 'edit' ? 'Editar ejercicio' : 'Nuevo ejercicio'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Nombre */}
            <div className="space-y-1.5">
              <Label className="text-xs">Nombre del ejercicio *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Burpee, Sentadilla libre, Plank..." className="bg-background border-border" />
            </div>

            {/* Grupo muscular + Equipo */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Grupo muscular</Label>
                <Select value={form.body_part} onValueChange={v => setForm(f => ({ ...f, body_part: v }))}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BODY_PARTS.map(bp => (
                      <SelectItem key={bp} value={bp}>{BODY_PARTS_ES[bp] || bp}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Equipamiento</Label>
                <Select value={form.equipment} onValueChange={v => setForm(f => ({ ...f, equipment: v }))}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_OPTIONS.map(eq => (
                      <SelectItem key={eq} value={eq}>{EQUIPMENT_ES[eq] || eq}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Músculo objetivo */}
            <div className="space-y-1.5">
              <Label className="text-xs">Músculo objetivo <span className="text-muted-foreground">(opcional)</span></Label>
              <Input value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                placeholder="Ej: glúteos, cuádriceps, core..."
                className="bg-background border-border" />
            </div>

            {/* Instrucciones */}
            <div className="space-y-1.5">
              <Label className="text-xs">Instrucciones paso a paso <span className="text-muted-foreground">(una por línea)</span></Label>
              <Textarea
                value={form.instructions}
                onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                placeholder={"1. Párate con los pies al ancho de los hombros.\n2. Baja hasta que los muslos estén paralelos al suelo.\n3. Empuja desde los talones para volver."}
                className="bg-background border-border resize-none min-h-[100px] text-sm"
                rows={5}
              />
              <p className="text-xs text-muted-foreground">Cada línea se guarda como un paso separado.</p>
            </div>

            {/* Imágenes */}
            <div className="space-y-2">
              <Label className="text-xs">Imágenes del ejercicio <span className="text-muted-foreground">(máx 10MB c/u)</span></Label>
              <div className="grid grid-cols-2 gap-3">
                {/* Imagen inicio */}
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Posición inicial</p>
                  <div
                    onClick={() => startImgRef.current?.click()}
                    className="relative w-full aspect-square rounded-lg bg-muted border border-dashed border-border overflow-hidden cursor-pointer hover:border-primary/50 transition-colors flex items-center justify-center">
                    {startPreview ? (
                      <>
                        <img src={startPreview} alt="inicio" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Camera size={20} className="text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-2">
                        <Upload size={20} className="mx-auto text-muted-foreground mb-1" />
                        <p className="text-xs text-muted-foreground">Subir foto</p>
                      </div>
                    )}
                  </div>
                  <input ref={startImgRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleImageSelect(f, setStartFile, setStartPreview); }} />
                </div>

                {/* Imagen fin */}
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Posición final</p>
                  <div
                    onClick={() => endImgRef.current?.click()}
                    className="relative w-full aspect-square rounded-lg bg-muted border border-dashed border-border overflow-hidden cursor-pointer hover:border-primary/50 transition-colors flex items-center justify-center">
                    {endPreview ? (
                      <>
                        <img src={endPreview} alt="fin" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Camera size={20} className="text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-2">
                        <Upload size={20} className="mx-auto text-muted-foreground mb-1" />
                        <p className="text-xs text-muted-foreground">Subir foto</p>
                      </div>
                    )}
                  </div>
                  <input ref={endImgRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleImageSelect(f, setEndFile, setEndPreview); }} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                💡 La imagen de inicio también se usa como miniatura en las rutinas.
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialog(null)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 gradient-primary text-primary-foreground gap-2"
                onClick={handleSave}
                disabled={saving || !form.name.trim()}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {dialog === 'edit' ? 'Guardar cambios' : 'Crear ejercicio'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog confirmar eliminación ─────────────────── */}
      <Dialog open={!!deleting} onOpenChange={v => { if (!v) setDeleting(null); }}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-destructive">Eliminar ejercicio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro? Este ejercicio se eliminará de tu librería. Si ya fue usado en rutinas existentes, los ejercicios de esas rutinas no se verán afectados.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDeleting(null)}>Cancelar</Button>
              <Button variant="destructive" className="flex-1"
                disabled={deleteMutation.isPending}
                onClick={() => deleting && deleteMutation.mutate(deleting)}>
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}