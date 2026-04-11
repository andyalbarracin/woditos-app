/**
 * Archivo: RoutinesTab.tsx
 * Ruta: src/components/dashboard/RoutinesTab.tsx
 * Última modificación: 2026-04-07
 * Descripción: Tab de Rutinas en Coach Panel. Muestra chips de sesiones
 *   asignadas por rutina (con opción de eliminar asignación).
 *   Asignación directa a miembros con notificación automática.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Plus, ListChecks, Clock, Target, ChevronRight,
  Zap, Loader2, Edit, Users, X, Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ROUTINE_TYPES, ROUTINE_LEVELS } from '@/lib/exerciseTranslations';

const db = supabase as any;

const TYPE_LABEL: Record<string, string> = Object.fromEntries(ROUTINE_TYPES.map(t => [t.value, t.label]));
const LEVEL_COLOR: Record<string, string> = {
  beginner:     'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  advanced:     'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};
const LEVEL_LABEL: Record<string, string> = Object.fromEntries(ROUTINE_LEVELS.map(l => [l.value, l.label]));

interface Member { user_id: string; full_name: string; selected: boolean; }

export default function RoutinesTab() {
  const navigate    = useNavigate();
  const { user, clubMembership } = useAuth();
  const { toast }   = useToast();
  const qc          = useQueryClient();
  const clubId      = clubMembership?.club_id;

  const [assignDialog, setAssignDialog] = useState<{ routineId: string; name: string } | null>(null);
  const [members, setMembers]           = useState<Member[]>([]);

  const routinesQuery = useQuery({
    queryKey: ['routines-tab', clubId],
    queryFn: async () => {
      const { data, error } = await db
        .from('routines').select('*, routine_exercises(id)')
        .eq('club_id', clubId).eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!clubId,
  });

  const routineIds = useMemo(
    () => (routinesQuery.data ?? []).map((r: any) => r.id),
    [routinesQuery.data]
  );

  const assignmentsQuery = useQuery({
    queryKey: ['routines-session-assignments', routineIds.join(',')],
    queryFn: async () => {
      if (!routineIds.length) return [];
      const { data } = await db
        .from('routine_assignments')
        .select('id, routine_id, session_id, sessions(id, title, start_time)')
        .in('routine_id', routineIds)
        .not('session_id', 'is', null);
      return data ?? [];
    },
    enabled: routineIds.length > 0,
  });

  const assignmentsByRoutine = useMemo(() => {
    const map: Record<string, any[]> = {};
    (assignmentsQuery.data ?? []).forEach((a: any) => {
      if (!map[a.routine_id]) map[a.routine_id] = [];
      map[a.routine_id].push(a);
    });
    return map;
  }, [assignmentsQuery.data]);

  const removeSessionAssignment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('routine_assignments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routines-session-assignments'] });
      qc.invalidateQueries({ queryKey: ['session-routines'] });
      toast({ title: 'Asignación eliminada' });
    },
  });

  const loadMembers = async () => {
    const { data } = await supabase
      .from('club_memberships')
      .select('user_id, users!user_id(profiles(full_name))')
      .eq('club_id', clubId!).eq('role', 'member').eq('status', 'active');
    setMembers((data ?? []).map((m: any) => ({
      user_id:   m.user_id,
      full_name: (m as any).users?.profiles?.full_name ?? 'Sin nombre',
      selected:  false,
    })));
  };

  const openAssign = async (routineId: string, name: string) => {
    setAssignDialog({ routineId, name });
    await loadMembers();
  };

  const toggleMember = (userId: string) =>
    setMembers(p => p.map(m => m.user_id === userId ? { ...m, selected: !m.selected } : m));

  const assignMutation = useMutation({
    mutationFn: async () => {
      const selected = members.filter(m => m.selected);
      if (!selected.length || !assignDialog || !user?.id) throw new Error('Seleccioná al menos un miembro');
      const { error } = await db.from('routine_assignments').insert(
        selected.map(m => ({
          routine_id: assignDialog.routineId, assigned_to: m.user_id,
          assigned_by: user.id, status: 'pending',
        }))
      );
      if (error) throw error;
      await supabase.from('notifications').insert(
        selected.map(m => ({
          user_id: m.user_id,
          title:   '📋 Nueva rutina asignada',
          message: `Tu coach te asignó la rutina "${assignDialog.name}". ¡Mirala en Rutinas!`,
          type:    'routine',
        }))
      );
    },
    onSuccess: () => {
      const count = members.filter(m => m.selected).length;
      toast({ title: 'Rutina asignada', description: `Se notificó a ${count} miembro${count !== 1 ? 's' : ''}` });
      qc.invalidateQueries({ queryKey: ['routines-tab'] });
      setAssignDialog(null);
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const selectedCount = members.filter(m => m.selected).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {routinesQuery.data?.length ?? 0} rutina{routinesQuery.data?.length !== 1 ? 's' : ''}
        </p>
        <Button size="sm" onClick={() => navigate('/rutinas/nueva')}>
          <Plus className="h-4 w-4 mr-1.5" /> Nueva rutina
        </Button>
      </div>

      {routinesQuery.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !routinesQuery.data?.length ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border text-muted-foreground space-y-3">
          <ListChecks className="h-9 w-9 mx-auto opacity-30" />
          <p className="text-sm">Todavía no creaste rutinas.</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/rutinas/nueva')}>
            <Plus className="h-4 w-4 mr-1.5" /> Crear primera rutina
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {routinesQuery.data?.map((r: any) => {
            const sessionAssignments = assignmentsByRoutine[r.id] ?? [];
            return (
              <div key={r.id} className="rounded-xl border bg-card">
                <div className="p-3 flex items-start gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => navigate(`/rutinas/${r.id}`)}>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{r.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="secondary" className="text-xs">{TYPE_LABEL[r.type] ?? r.type}</Badge>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${LEVEL_COLOR[r.level]}`}>
                        {LEVEL_LABEL[r.level] ?? r.level}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Target className="h-3 w-3" /> {r.routine_exercises?.length ?? 0} ej.
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {r.estimated_minutes} min
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                </div>

                {/* Chips de sesiones asignadas */}
                {sessionAssignments.length > 0 && (
                  <div className="px-3 pb-2.5 flex flex-wrap gap-1.5">
                    <span className="text-xs text-muted-foreground w-full mb-0.5">Asignada a:</span>
                    {sessionAssignments.map((a: any) => (
                      <div key={a.id}
                        className="flex items-center gap-1.5 bg-primary/5 border border-primary/15 text-xs px-2.5 py-1 rounded-full">
                        <Calendar className="h-3 w-3 text-primary/60 shrink-0" />
                        <span className="text-foreground/80 max-w-[110px] truncate">
                          {a.sessions?.title ?? '—'}
                        </span>
                        {a.sessions?.start_time && (
                          <span className="text-muted-foreground shrink-0">
                            {format(new Date(a.sessions.start_time), 'd/M HH:mm', { locale: es })}
                          </span>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); removeSessionAssignment.mutate(a.id); }}
                          className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t px-3 py-2 flex gap-2">
                  <Button size="sm" variant="ghost" className="text-xs h-7 gap-1"
                    onClick={() => navigate(`/rutinas/${r.id}/editar`)}>
                    <Edit className="h-3 w-3" /> Editar
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs h-7 gap-1 text-primary"
                    onClick={() => openAssign(r.id, r.name)}>
                    <Zap className="h-3 w-3" /> Asignar a miembros
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!assignDialog} onOpenChange={v => !v && setAssignDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Asignar a miembros</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground truncate -mt-2">{assignDialog?.name}</p>
          {!members.length ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <Users className="h-8 w-8 mx-auto opacity-30 mb-2" />
              No hay miembros activos.
            </div>
          ) : (
            <div className="space-y-1 max-h-60 overflow-y-auto py-1">
              {members.map(m => (
                <label key={m.user_id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted cursor-pointer">
                  <input type="checkbox" checked={m.selected} onChange={() => toggleMember(m.user_id)}
                    className="h-4 w-4 rounded accent-primary" />
                  <span className="text-sm">{m.full_name}</span>
                </label>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setAssignDialog(null)}>Cancelar</Button>
            <Button className="flex-1" disabled={!selectedCount || assignMutation.isPending}
              onClick={() => assignMutation.mutate()}>
              {assignMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
              Asignar{selectedCount > 0 ? ` (${selectedCount})` : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}