/**
 * Archivo: RoutineDnDBoard.tsx
 * Ruta: src/components/routines/RoutineDnDBoard.tsx
 * Última modificación: 2026-04-03
 * Descripción: Tablero con drag & drop para el constructor de rutinas.
 *   Desktop: zona activa (arriba) + línea divisoria + pool (abajo).
 *   Arrastrar un ejercicio sobre la línea lo incluye/excluye de la rutina.
 *   Mobile: tabs "Rutina" / "Agregar" con botones up/down para reordenar.
 */

import { useState, useRef } from 'react';
import {
  GripVertical, X, ChevronUp, ChevronDown,
  Plus, ChevronRight, Dumbbell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface RoutineExerciseEntry {
  uid: string;          // id local único para React keys
  dbId: string;         // ID en ExerciseDB
  nameES: string;
  gifUrl: string;
  bodyPartES: string;
  equipmentES: string;
  sets: number | '';
  reps: number | '';
  durationSeconds: number | '';
  restSeconds: number | '';
  weightKg: number | '';
  notes: string;
  inPool: boolean;      // false = activo (sobre la línea), true = pool (bajo la línea)
  expanded: boolean;
}

interface Props {
  items: RoutineExerciseEntry[];
  onChange: (items: RoutineExerciseEntry[]) => void;
  onAddClick: () => void;
  isMobile: boolean;
}

export default function RoutineDnDBoard({ items, onChange, onAddClick, isMobile }: Props) {
  const [dragIdx, setDragIdx]       = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | 'line' | null>(null);
  const [mobileTab, setMobileTab]   = useState<'routine' | 'add'>('routine');
  const [imgErrors, setImgErrors]   = useState<Set<string>>(new Set());
  const dragItem                    = useRef<number | null>(null);

  const activeItems = items.filter(i => !i.inPool);
  const poolItems   = items.filter(i => i.inPool);

  // ─── Helpers ────────────────────────────────────────────────────

  const updateItem = (uid: string, patch: Partial<RoutineExerciseEntry>) => {
    onChange(items.map(i => i.uid === uid ? { ...i, ...patch } : i));
  };

  const removeItem = (uid: string) => {
    onChange(items.filter(i => i.uid !== uid));
  };

  const moveToPool = (uid: string) => updateItem(uid, { inPool: true, expanded: false });
  const moveToActive = (uid: string) => updateItem(uid, { inPool: false });

  const moveUp = (uid: string) => {
    const arr = [...activeItems];
    const idx = arr.findIndex(i => i.uid === uid);
    if (idx <= 0) return;
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    onChange([...arr, ...poolItems]);
  };

  const moveDown = (uid: string) => {
    const arr = [...activeItems];
    const idx = arr.findIndex(i => i.uid === uid);
    if (idx >= arr.length - 1) return;
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    onChange([...arr, ...poolItems]);
  };

  // ─── Drag & Drop (Desktop HTML5) ────────────────────────────────

  const handleDragStart = (e: React.DragEvent, globalIdx: number) => {
    dragItem.current = globalIdx;
    setDragIdx(globalIdx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, target: number | 'line') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(target);
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number | 'line') => {
    e.preventDefault();
    const srcIdx = dragItem.current;
    if (srcIdx === null) return;

    const newItems = [...items];
    if (targetIdx === 'line') {
      // Soltar sobre la línea → mover a pool
      newItems[srcIdx] = { ...newItems[srcIdx], inPool: true };
    } else if (typeof targetIdx === 'number') {
      const target = newItems[targetIdx];
      // Si el target está en pool y el src estaba activo, lo activa
      if (target.inPool && !newItems[srcIdx].inPool) {
        newItems[srcIdx] = { ...newItems[srcIdx], inPool: false };
      } else if (!target.inPool && newItems[srcIdx].inPool) {
        // Si el src estaba en pool y el target activo, lo activa
        newItems[srcIdx] = { ...newItems[srcIdx], inPool: false };
      }
      // Reordenar
      const [moved] = newItems.splice(srcIdx, 1);
      const insertAt = srcIdx < targetIdx ? targetIdx - 1 : targetIdx;
      newItems.splice(insertAt, 0, moved);
    }

    onChange(newItems);
    setDragIdx(null);
    setDropTarget(null);
    dragItem.current = null;
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setDropTarget(null);
  };

  // ─── Card de ejercicio ───────────────────────────────────────────

  const ExerciseCard = ({
    item,
    globalIdx,
    showMoveUp,
    showMoveDown,
    inActiveZone,
  }: {
    item: RoutineExerciseEntry;
    globalIdx: number;
    showMoveUp: boolean;
    showMoveDown: boolean;
    inActiveZone: boolean;
  }) => (
    <div
      draggable={!isMobile}
      onDragStart={e => handleDragStart(e, globalIdx)}
      onDragOver={e => handleDragOver(e, globalIdx)}
      onDrop={e => handleDrop(e, globalIdx)}
      onDragEnd={handleDragEnd}
      className={`rounded-lg border bg-card transition-all ${
        dragIdx === globalIdx ? 'opacity-40 scale-95' : ''
      } ${dropTarget === globalIdx ? 'border-primary shadow-md' : 'border-border'}`}
    >
      {/* Header de la card */}
      <div className="flex items-center gap-2 p-2">
        {!isMobile && (
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing" />
        )}

        {/* GIF */}
        <div className="h-10 w-10 shrink-0 rounded bg-muted overflow-hidden">
          {!imgErrors.has(item.uid) ? (
            <img
              src={item.gifUrl}
              alt={item.nameES}
              className="h-full w-full object-cover"
              onError={() => setImgErrors(p => new Set(p).add(item.uid))}
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.nameES}</p>
          <p className="text-xs text-muted-foreground">{item.bodyPartES}</p>
        </div>

        {/* Controles mobile */}
        {isMobile && inActiveZone && (
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveUp(item.uid)} disabled={!showMoveUp}>
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveDown(item.uid)} disabled={!showMoveDown}>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Toggle expand */}
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => updateItem(item.uid, { expanded: !item.expanded })}
        >
          <ChevronRight className={`h-4 w-4 transition-transform ${item.expanded ? 'rotate-90' : ''}`} />
        </Button>

        {/* Quitar del pool o eliminar */}
        {inActiveZone ? (
          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => moveToPool(item.uid)}>
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.uid)}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Detalle expandible */}
      {item.expanded && (
        <div className="px-3 pb-3 pt-1 border-t grid grid-cols-2 sm:grid-cols-4 gap-2">
          {([
            { label: 'Series', key: 'sets', placeholder: '3' },
            { label: 'Reps', key: 'reps', placeholder: '12' },
            { label: 'Seg.', key: 'durationSeconds', placeholder: '30' },
            { label: 'Descanso', key: 'restSeconds', placeholder: '60' },
            { label: 'Kg', key: 'weightKg', placeholder: '0' },
          ] as const).map(f => (
            <div key={f.key}>
              <Label className="text-xs text-muted-foreground">{f.label}</Label>
              <Input
                type="number"
                min={0}
                placeholder={f.placeholder}
                value={item[f.key] === '' ? '' : String(item[f.key])}
                onChange={e => updateItem(item.uid, { [f.key]: e.target.value === '' ? '' : Number(e.target.value) })}
                className="h-7 text-sm"
              />
            </div>
          ))}
          <div className="col-span-2 sm:col-span-4">
            <Label className="text-xs text-muted-foreground">Nota del coach</Label>
            <Input
              placeholder="Indicación para el miembro…"
              value={item.notes}
              onChange={e => updateItem(item.uid, { notes: e.target.value })}
              className="h-7 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );

  // ─── Render Desktop ──────────────────────────────────────────────

  if (!isMobile) {
    return (
      <div className="space-y-2">
        {/* Zona activa */}
        <div
          className="min-h-[60px] space-y-2"
          onDragOver={e => { e.preventDefault(); }}
          onDrop={e => { if (dragIdx !== null && items[dragIdx].inPool) handleDrop(e, dragIdx); }}
        >
          {activeItems.length === 0 ? (
            <div className="flex items-center justify-center h-16 rounded-lg border-2 border-dashed border-muted-foreground/30 text-sm text-muted-foreground">
              La rutina está vacía — agregá ejercicios abajo
            </div>
          ) : (
            activeItems.map((item, localIdx) => {
              const globalIdx = items.findIndex(i => i.uid === item.uid);
              return (
                <ExerciseCard
                  key={item.uid}
                  item={item}
                  globalIdx={globalIdx}
                  showMoveUp={localIdx > 0}
                  showMoveDown={localIdx < activeItems.length - 1}
                  inActiveZone
                />
              );
            })
          )}
        </div>

        {/* Línea divisoria */}
        <div
          onDragOver={e => handleDragOver(e, 'line')}
          onDrop={e => handleDrop(e, 'line')}
          className={`flex items-center gap-2 py-2 rounded transition-colors ${
            dropTarget === 'line' ? 'bg-destructive/10' : ''
          }`}
        >
          <div className="flex-1 border-t-2 border-dashed border-muted-foreground/40" />
          <span className="text-xs text-muted-foreground px-2 shrink-0">
            ↑ Rutina activa · Sin incluir ↓
          </span>
          <div className="flex-1 border-t-2 border-dashed border-muted-foreground/40" />
        </div>

        {/* Pool / ejercicios no incluidos */}
        <div className="space-y-2">
          {poolItems.map(item => {
            const globalIdx = items.findIndex(i => i.uid === item.uid);
            return (
              <div key={item.uid} className="relative">
                <div className="opacity-60">
                  <ExerciseCard item={item} globalIdx={globalIdx} showMoveUp={false} showMoveDown={false} inActiveZone={false} />
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-8 text-xs h-6 px-2"
                  onClick={() => moveToActive(item.uid)}
                >
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Incluir
                </Button>
              </div>
            );
          })}
        </div>

        <Button variant="outline" size="sm" className="w-full mt-2" onClick={onAddClick}>
          <Plus className="h-4 w-4 mr-2" /> Agregar ejercicio
        </Button>
      </div>
    );
  }

  // ─── Render Mobile ───────────────────────────────────────────────

  return (
    <div>
      <div className="flex rounded-lg border overflow-hidden mb-3">
        {(['routine', 'add'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mobileTab === tab ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            {tab === 'routine' ? `Mi rutina (${activeItems.length})` : '+ Agregar ejercicio'}
          </button>
        ))}
      </div>

      {mobileTab === 'routine' ? (
        <div className="space-y-2">
          {activeItems.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <p>Rutina vacía.</p>
              <button className="text-primary mt-1 text-xs" onClick={() => setMobileTab('add')}>
                Tocá "Agregar ejercicio" para empezar
              </button>
            </div>
          ) : (
            activeItems.map((item, localIdx) => {
              const globalIdx = items.findIndex(i => i.uid === item.uid);
              return (
                <ExerciseCard
                  key={item.uid}
                  item={item}
                  globalIdx={globalIdx}
                  showMoveUp={localIdx > 0}
                  showMoveDown={localIdx < activeItems.length - 1}
                  inActiveZone
                />
              );
            })
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center py-8">
          <Button onClick={onAddClick} size="lg" className="w-full">
            <Plus className="h-5 w-5 mr-2" /> Buscar ejercicios
          </Button>
        </div>
      )}
    </div>
  );
}