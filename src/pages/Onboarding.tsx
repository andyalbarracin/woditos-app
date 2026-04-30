/**
 * Archivo: Onboarding.tsx
 * Ruta: src/pages/Onboarding.tsx
 * Última modificación: 2026-04-29
 * Descripción: Flujo de onboarding post-registro para usuarios sin club.
 *   Se muestra automáticamente cuando un usuario autenticado no tiene
 *   club_membership (ej: registro con Google, o registro sin código).
 *   Permite elegir rol, confirmar nombre, y unirse/crear club.
 *   v1.2: fuerza light mode. Quita gradient-surface (era dark).
 *         Sanitización de inputs con schemas de validation.ts.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import woditosLogo from '@/assets/woditos-logo.png';
import { toast } from 'sonner';
import {
  profileUpdateSchema,
  joinCodeSchema,
  inviteTokenSchema,
  clubCreationSchema,
} from '@/lib/validation';
import { Users, Dumbbell, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

type Step = 'role' | 'details';

export default function Onboarding() {
  const { user, profile, session, refreshUserData } = useAuth();
  const navigate = useNavigate();

  /* ── Forzar light mode en onboarding ─────────────────────────── */
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');
    root.classList.remove('dark');
    root.classList.add('light');
    return () => {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark' || wasDark) {
        root.classList.remove('light');
        root.classList.add('dark');
      }
    };
  }, []);

  /* ── Pre-fill nombre desde profile o Google metadata ────────── */
  const googleName =
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    '';
  const initialName = profile?.full_name || googleName || '';

  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<'member' | 'coach'>('member');
  const [fullName, setFullName] = useState(initialName);
  const [joinCode, setJoinCode] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [clubName, setClubName] = useState('');
  const [coachMode, setCoachMode] = useState<'join' | 'create'>('create');
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (selected: 'member' | 'coach') => {
    setRole(selected);
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    // Validar y sanitizar el nombre con profileUpdateSchema
    const nameResult = profileUpdateSchema.safeParse({
      full_name: fullName,
      goals: '',
      emergency_contact: '',
    });
    if (!nameResult.success) {
      toast.error(nameResult.error.errors[0]?.message || 'Nombre inválido');
      return;
    }
    const sanitizedName = nameResult.data.full_name;

    setLoading(true);

    try {
      /* ── Actualizar nombre en profile ────────────────────────── */
      if (sanitizedName !== profile?.full_name) {
        await supabase
          .from('profiles')
          .update({ full_name: sanitizedName, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
      }

      /* ── Miembro: unirse con código ──────────────────────────── */
      if (role === 'member' && joinCode.trim()) {
        const joinResult = joinCodeSchema.safeParse(joinCode);
        if (!joinResult.success) {
          toast.error('Código de club inválido. Verificá con tu coach.');
          setLoading(false);
          return;
        }

        const { data: club } = await supabase
          .from('clubs')
          .select('id, name')
          .eq('join_code', joinResult.data)
          .eq('status', 'active')
          .single();

        if (!club) {
          toast.error('Código de club inválido. Verificá con tu coach.');
          setLoading(false);
          return;
        }

        await supabase.from('club_memberships').insert({
          club_id: club.id, user_id: user.id, role: 'member', status: 'active',
        });
        toast.success(`¡Te uniste a "${club.name}"!`);

      /* ── Coach con token de invitación ───────────────────────── */
      } else if (role === 'coach' && coachMode === 'join' && inviteCode.trim()) {
        const tokenResult = inviteTokenSchema.safeParse(inviteCode);
        if (!tokenResult.success) {
          toast.error('Token de invitación inválido.');
          setLoading(false);
          return;
        }

        const { data: invite } = await supabase
          .from('coach_invites')
          .select('status, expires_at')
          .eq('token', tokenResult.data)
          .single();

        if (!invite || invite.status !== 'pending' || new Date(invite.expires_at) < new Date()) {
          toast.error('Token inválido o expirado.');
          setLoading(false);
          return;
        }

        const { data: rpcResult } = await (supabase.rpc as any)('use_coach_invite', {
          p_token: tokenResult.data,
          p_user_id: user.id,
        });
        const result = rpcResult as { success: boolean; error?: string } | null;
        if (!result?.success) {
          toast.error(result?.error || 'No se pudo activar la invitación.');
          setLoading(false);
          return;
        }
        toast.success('¡Bienvenido como Coach!');

      /* ── Coach crea club nuevo ───────────────────────────────── */
      } else if (role === 'coach' && coachMode === 'create') {
        const clubResult = clubCreationSchema.safeParse({ name: clubName });
        if (!clubResult.success) {
          toast.error(clubResult.error.errors[0]?.message || 'Nombre de club inválido');
          setLoading(false);
          return;
        }
        const sanitizedClubName = clubResult.data.name;

        const slug = sanitizedClubName
          .toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 50);
        const uniqueSlug = `${slug}-${Date.now().toString(36)}`;

        const { data: newClub, error: clubError } = await supabase
          .from('clubs')
          .insert({ name: sanitizedClubName, slug: uniqueSlug, owner_id: user.id, plan: 'pro' })
          .select()
          .single();

        if (clubError) { toast.error('No se pudo crear el club'); setLoading(false); return; }

        await supabase.from('users').update({ role: 'club_admin' }).eq('id', user.id);
        await supabase.from('club_memberships').insert({
          club_id: newClub.id, user_id: user.id, role: 'club_admin', status: 'active',
        });
        toast.success(`¡Club "${sanitizedClubName}" creado!`);

      /* ── Miembro sin código (error) ──────────────────────────── */
      } else if (role === 'member' && !joinCode.trim()) {
        toast.error('Necesitás un código de club para continuar. Pedíselo a tu coach.');
        setLoading(false);
        return;
      }

      /* ── Refresh y navegar ───────────────────────────────────── */
      await refreshUserData();
      navigate('/inicio', { replace: true });

    } catch (err: any) {
      toast.error(err.message || 'Error al completar el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm space-y-6">

        <div className="text-center">
          <img src={woditosLogo} alt="Woditos" className="h-14 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground">
            {step === 'role' ? '¡Bienvenido a Woditos!' : 'Completá tu perfil'}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {step === 'role'
              ? '¿Cómo vas a usar la plataforma?'
              : role === 'coach'
                ? 'Configurá tu cuenta de Coach'
                : 'Unite a tu club para empezar'
            }
          </p>
        </div>

        {/* ── PASO 1: Elegir rol ─────────────────────────────────── */}
        {step === 'role' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleRoleSelect('member')}
                className="p-5 rounded-xl border-2 border-border bg-card text-left transition-all hover:border-primary/50 hover:bg-primary/5"
              >
                <Users size={24} className="text-primary mb-3" />
                <p className="font-semibold text-sm text-foreground">Miembro</p>
                <p className="text-xs text-muted-foreground mt-1">Me sumo a un club</p>
              </button>
              <button
                onClick={() => handleRoleSelect('coach')}
                className="p-5 rounded-xl border-2 border-border bg-card text-left transition-all hover:border-primary/50 hover:bg-primary/5"
              >
                <Dumbbell size={24} className="text-primary mb-3" />
                <p className="font-semibold text-sm text-foreground">Coach</p>
                <p className="text-xs text-muted-foreground mt-1">Creo o me uno a un club</p>
              </button>
            </div>
          </div>
        )}

        {/* ── PASO 2: Detalles ───────────────────────────────────── */}
        {step === 'details' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Indicador de rol */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={role === 'coach' ? 'text-primary font-medium' : ''}>
                {role === 'coach' ? '🏋️ Coach' : '🏃 Miembro'}
              </span>
              <button type="button" onClick={() => setStep('role')}
                className="ml-auto text-primary hover:underline flex items-center gap-1">
                <ArrowLeft size={12} /> cambiar
              </button>
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="onb-name">Tu nombre</Label>
              <Input
                id="onb-name"
                placeholder="Juan Pérez"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                maxLength={100}
                className="bg-card border-border"
              />
            </div>

            {/* ── Campos según rol ─────────────────────────────────── */}
            {role === 'member' ? (
              <div className="space-y-2">
                <Label htmlFor="onb-join">Código de club</Label>
                <Input
                  id="onb-join"
                  placeholder="Ej: ABC123"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="bg-card border-border font-mono tracking-widest"
                />
                <p className="text-xs text-muted-foreground">
                  Tu coach te comparte este código para unirte a su club.
                </p>
              </div>
            ) : (
              <>
                {/* Toggle coach: crear / unirse */}
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button type="button"
                    onClick={() => setCoachMode('create')}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      coachMode === 'create' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'
                    }`}>
                    Crear club
                  </button>
                  <button type="button"
                    onClick={() => setCoachMode('join')}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      coachMode === 'join' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'
                    }`}>
                    Tengo invitación
                  </button>
                </div>

                {coachMode === 'create' ? (
                  <div className="space-y-2">
                    <Label htmlFor="onb-club">Nombre del club</Label>
                    <Input
                      id="onb-club"
                      placeholder="Ej: Crew Palermo Runners"
                      value={clubName}
                      onChange={e => setClubName(e.target.value)}
                      maxLength={80}
                      className="bg-card border-border"
                    />
                    <p className="text-xs text-muted-foreground">
                      Se generará un código automático para que tus miembros se unan.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="onb-invite">Token de invitación</Label>
                    <Input
                      id="onb-invite"
                      placeholder="Pegá el token acá"
                      value={inviteCode}
                      onChange={e => setInviteCode(e.target.value.trim())}
                      className="bg-card border-border font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      Otro coach te envió este token para unirte a su club.
                    </p>
                  </div>
                )}
              </>
            )}

            <Button
              type="submit"
              className="w-full gradient-primary text-primary-foreground font-semibold gap-2"
              disabled={loading}
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Procesando...</>
                : <><span>Comenzar</span><ArrowRight size={14} /></>
              }
            </Button>
          </form>
        )}

        <button
          onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }}
          className="flex items-center justify-center gap-2 w-full text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft size={14} /> Volver al inicio
        </button>

        <p className="text-center text-xs text-muted-foreground">
          © 2026 Woditos. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}