/**
 * Archivo: InviteCoach.tsx
 * Ruta: src/components/InviteCoach.tsx
 * Última modificación: 2026-03-28
 * Descripción: Cualquier coach puede generar links de invitación para su club.
 *   El link invita al nuevo coach al club del coach que lo genera.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Copy, Link, Trash2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_CONFIG = {
  pending: { label: 'Activa',   icon: Clock,       color: 'text-yellow-500' },
  used:    { label: 'Usada',    icon: CheckCircle, color: 'text-green-500' },
  expired: { label: 'Expirada', icon: XCircle,     color: 'text-muted-foreground' },
  revoked: { label: 'Revocada', icon: XCircle,     color: 'text-destructive' },
};

export default function InviteCoach() {
  const { user, clubMembership } = useAuth();
  const queryClient = useQueryClient();
  const [emailHint, setEmailHint] = useState('');
  const [days, setDays] = useState(7);

  // Disponible para coaches y super_admin
  const isCoach = user?.role === 'coach' || user?.role === 'super_admin';
  if (!isCoach) return null;

  const clubId = clubMembership?.club_id;
  const clubName = clubMembership?.club?.name;

  const { data: invites } = useQuery({
    queryKey: ['coach-invites', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach_invites')
        .select('*')
        .eq('created_by', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const createInvite = useMutation({
    mutationFn: async () => {
      if (!clubId) {
        throw new Error('No estás asociado a ningún club.');
      }
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);

      const { data, error } = await supabase
        .from('coach_invites')
        .insert({
          created_by: user!.id,
          club_id: clubId,
          email_hint: emailHint.trim() || null,
          expires_at: expiresAt.toISOString(),
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['coach-invites'] });
      setEmailHint('');
      const link = `${window.location.origin}/register?invite=${data.token}`;
      navigator.clipboard.writeText(link);
      toast.success('Link generado y copiado al portapapeles.');
    },
    onError: (err: any) => toast.error(err.message || 'No se pudo generar el link.'),
  });

  const revokeInvite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('coach_invites')
        .update({ status: 'revoked' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-invites'] });
      toast.success('Invitación revocada.');
    },
  });

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/register?invite=${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado al portapapeles.');
  };

  return (
    <div className="space-y-6">

      {/* Info del club */}
      {clubName && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 space-y-3">
          <p className="text-sm text-foreground">
            Las invitaciones generadas acá son para unirse a <span className="font-semibold">{clubName}</span> como coach.
          </p>
          {clubMembership?.club?.join_code && (
            <div className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Código para miembros</p>
                <p className="text-2xl font-mono font-bold text-primary tracking-widest mt-0.5">
                  {clubMembership.club.join_code}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  navigator.clipboard.writeText(clubMembership.club.join_code);
                  toast.success('Código copiado');
                }}
              >
                <Copy size={14} /> Copiar
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Compartí este código con tus alumnos para que se unan al club al registrarse.
          </p>
        </div>
      )}

      {/* Formulario */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Link size={18} className="text-primary" />
          <h3 className="font-display font-bold text-foreground">Generar invitación de Coach</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email-hint">Email del invitado (opcional)</Label>
            <Input
              id="email-hint"
              type="email"
              placeholder="joaquin@ejemplo.com"
              value={emailHint}
              onChange={e => setEmailHint(e.target.value)}
              className="bg-background border-border"
            />
            <p className="text-xs text-muted-foreground">Se pre-completa en el formulario de registro.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="days">Expiración</Label>
            <select
              id="days"
              value={days}
              onChange={e => setDays(Number(e.target.value))}
              className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value={1}>1 día</option>
              <option value={3}>3 días</option>
              <option value={7}>7 días</option>
              <option value={14}>14 días</option>
              <option value={30}>30 días</option>
            </select>
          </div>
        </div>

        <Button
          onClick={() => createInvite.mutate()}
          disabled={createInvite.isPending || !clubId}
          className="gradient-primary text-primary-foreground gap-2"
        >
          <Link size={14} />
          {createInvite.isPending ? 'Generando...' : 'Generar link de invitación'}
        </Button>

        {!clubId && (
          <p className="text-xs text-destructive">No estás asociado a ningún club todavía.</p>
        )}
      </div>

      {/* Lista */}
      {invites && invites.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="font-display font-bold text-foreground text-sm">Invitaciones enviadas</h3>
          </div>
          <div className="divide-y divide-border">
            {invites.map((inv: any) => {
              const config = STATUS_CONFIG[inv.status as keyof typeof STATUS_CONFIG];
              const StatusIcon = config.icon;
              const isActive = inv.status === 'pending' && new Date(inv.expires_at) > new Date();
              return (
                <div key={inv.id} className="flex items-center gap-3 px-5 py-3">
                  <StatusIcon size={16} className={config.color} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {inv.email_hint || 'Sin email sugerido'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expira: {format(new Date(inv.expires_at), "d MMM yyyy", { locale: es })}
                      {' · '}{config.label}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isActive && (
                      <Button variant="ghost" size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => copyLink(inv.token)} title="Copiar link">
                        <Copy size={14} />
                      </Button>
                    )}
                    {inv.status === 'pending' && (
                      <Button variant="ghost" size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => revokeInvite.mutate(inv.id)}
                        disabled={revokeInvite.isPending} title="Revocar">
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}