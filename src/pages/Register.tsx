/**
 * Archivo: Register.tsx
 * Ruta: src/pages/Register.tsx
 * Última modificación: 2026-03-27
 * Descripción: Registro en 2 pasos para coaches (crear club) y 1 paso para miembros.
 *   - Coach: datos personales → crear club → cuenta lista
 *   - Miembro: datos personales → (opcional) código de club para unirse
 *   - Con ?invite=TOKEN: flujo de coach con token de invitación
 */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import woditosLogo from '@/assets/woditos-logo.png';
import { toast } from 'sonner';
import { registerSchema } from '@/lib/validation';
import { ShieldCheck, Users, Dumbbell, ArrowRight } from 'lucide-react';

type Step = 'role' | 'account' | 'club';

export default function Register() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');

  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<'member' | 'coach'>('member');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [clubName, setClubName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signUp } = useAuth();
  const navigate = useNavigate();

  // Si hay token, pre-seleccionamos coach y validamos
  useEffect(() => {
    if (!inviteToken) return;
    setRole('coach');
    setStep('account');

    const validateToken = async () => {
      const { data, error } = await supabase
        .from('coach_invites')
        .select('status, expires_at, email_hint')
        .eq('token', inviteToken)
        .single();

      if (error || !data || data.status !== 'pending') {
        setTokenValid(false);
        toast.error('Este link de invitación es inválido o ya fue utilizado.');
        return;
      }
      if (new Date(data.expires_at) < new Date()) {
        setTokenValid(false);
        toast.error('Este link de invitación expiró.');
        return;
      }
      setTokenValid(true);
      if (data.email_hint) setEmail(data.email_hint);
      toast.success('Invitación válida. Completá tu registro como Coach.');
    };

    validateToken();
  }, [inviteToken]);

  const handleRoleSelect = (selected: 'member' | 'coach') => {
    setRole(selected);
    setStep('account');
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (inviteToken && tokenValid === false) {
      toast.error('No podés continuar con un link inválido.');
      return;
    }

    const result = registerSchema.safeParse({ email, password, fullName });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // Coaches sin invite token van al paso de crear club
    if (role === 'coach' && !inviteToken) {
      setStep('club');
      return;
    }

    // Miembros y coaches con token van directo a registrarse
    await doRegister();
  };

  const handleClubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName.trim()) {
      toast.error('El nombre del club es obligatorio');
      return;
    }
    await doRegister();
  };

  const doRegister = async () => {
    setLoading(true);
    try {
      await signUp(email, password, fullName);
      await new Promise(res => setTimeout(res, 1500));

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('No se pudo obtener el usuario creado.');

      if (inviteToken && tokenValid) {
        // Usar token de invitación → asigna rol coach en club existente
        const { data: rpcResult } = await supabase.rpc('use_coach_invite', {
          p_token: inviteToken,
          p_user_id: authUser.id,
        });
        const result = rpcResult as { success: boolean; error?: string } | null;
        if (!result?.success) {
  toast.error(result?.error || 'No se pudo activar la invitación.');
        } else {
          toast.success('¡Cuenta Coach creada! Bienvenido al club.');
        }
      } else if (role === 'coach' && clubName.trim()) {
        // Crear club nuevo
        const slug = clubName.trim()
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .slice(0, 50);

        const uniqueSlug = `${slug}-${Date.now().toString(36)}`;

        const { data: newClub, error: clubError } = await supabase
          .from('clubs')
          .insert({
            name: clubName.trim(),
            slug: uniqueSlug,
            owner_id: authUser.id,
            plan: 'pro', // todos arrancan con pro en el MVP
          })
          .select()
          .single();

        if (clubError) throw clubError;

        // Actualizar rol del usuario a club_admin
        await supabase
          .from('users')
          .update({ role: 'club_admin' })
          .eq('id', authUser.id);

        // Crear club_membership como club_admin
        await supabase
          .from('club_memberships')
          .insert({
            club_id: newClub.id,
            user_id: authUser.id,
            role: 'club_admin',
          });

        toast.success(`¡Club "${clubName}" creado! Bienvenido a Woditos.`);
      } else if (role === 'member' && joinCode.trim()) {
        // Unirse a un club con código
        const { data: club } = await supabase
          .from('clubs')
          .select('id, name')
          .eq('join_code', joinCode.trim().toUpperCase())
          .eq('status', 'active')
          .single();

        if (club) {
          await supabase
            .from('club_memberships')
            .insert({
              club_id: club.id,
              user_id: authUser.id,
              role: 'member',
            });
          toast.success(`¡Te uniste a "${club.name}"!`);
        } else {
          toast.error('Código de club inválido. Podés unirte más tarde desde tu perfil.');
        }
      } else {
        toast.success('¡Cuenta creada! Revisá tu email para confirmar.');
      }

      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 gradient-surface relative">
      <div className="w-full max-w-sm space-y-8">

        <div className="text-center">
          <img src={woditosLogo} alt="Woditos" className="h-16 mx-auto mb-6" />
          <h1 className="font-display text-2xl font-bold text-foreground">Crear Cuenta</h1>
          <p className="text-muted-foreground mt-2">Únete a la comunidad Woditos</p>
        </div>

        {/* Banner de invitación */}
        {inviteToken && tokenValid === true && (
          <div className="flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-xl p-4">
            <ShieldCheck size={20} className="text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Invitación de Coach activa</p>
              <p className="text-xs text-muted-foreground">Fuiste invitado para unirte como Coach.</p>
            </div>
          </div>
        )}

        {inviteToken && tokenValid === false && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-center">
            <p className="text-sm font-semibold text-destructive">Link inválido o expirado</p>
            <p className="text-xs text-muted-foreground mt-1">Pedí un nuevo link o registrate como Miembro.</p>
          </div>
        )}

        {/* PASO 1: Elegir rol */}
        {step === 'role' && (
          <div className="space-y-4">
            <p className="text-sm text-center text-muted-foreground">¿Cómo vas a usar Woditos?</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleRoleSelect('member')}
                className="p-5 rounded-xl border-2 border-border bg-card text-left transition-all hover:border-primary/50 hover:bg-primary/5"
              >
                <Users size={24} className="text-primary mb-3" />
                <p className="font-semibold text-sm text-foreground">Miembro</p>
                <p className="text-xs text-muted-foreground mt-1">Me sumo a un club existente</p>
              </button>

              <button
                onClick={() => handleRoleSelect('coach')}
                className="p-5 rounded-xl border-2 border-border bg-card text-left transition-all hover:border-primary/50 hover:bg-primary/5"
              >
                <Dumbbell size={24} className="text-primary mb-3" />
                <p className="font-semibold text-sm text-foreground">Coach</p>
                <p className="text-xs text-muted-foreground mt-1">Creo y gestiono mi propio club</p>
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: Datos de cuenta */}
        {step === 'account' && (
          <form onSubmit={handleAccountSubmit} className="space-y-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <span className={role === 'coach' ? 'text-primary font-medium' : ''}>
                {role === 'coach' ? '🏋️ Registrándote como Coach' : '🏃 Registrándote como Miembro'}
              </span>
              {!inviteToken && (
                <button type="button" onClick={() => setStep('role')} className="ml-auto text-primary hover:underline">
                  cambiar
                </button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input id="name" placeholder="Juan Pérez" value={fullName}
                onChange={e => setFullName(e.target.value)} required maxLength={100}
                className="bg-card border-border" />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="tu@email.com" value={email}
                onChange={e => setEmail(e.target.value)} required maxLength={255}
                className="bg-card border-border" />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="Mínimo 6 caracteres" value={password}
                onChange={e => setPassword(e.target.value)} required maxLength={128} minLength={6}
                className="bg-card border-border" />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            {/* Campo opcional de código de club para miembros */}
            {role === 'member' && (
              <div className="space-y-2">
                <Label htmlFor="joinCode">Código de club <span className="text-muted-foreground">(opcional)</span></Label>
                <Input id="joinCode" placeholder="Ej: ABC123" value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={6}
                  className="bg-card border-border font-mono tracking-widest" />
                <p className="text-xs text-muted-foreground">Tu coach te comparte este código para unirte a su club.</p>
              </div>
            )}

            <Button type="submit"
              className="w-full gradient-primary text-primary-foreground font-semibold gap-2"
              disabled={loading || (inviteToken !== null && tokenValid === false)}>
              {role === 'coach' && !inviteToken
                ? <><span>Siguiente</span><ArrowRight size={14} /></>
                : loading ? 'Creando cuenta...' : 'Crear cuenta'
              }
            </Button>
          </form>
        )}

        {/* PASO 3: Crear Club (solo coaches sin invite token) */}
        {step === 'club' && (
          <form onSubmit={handleClubSubmit} className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">Creá tu Club</p>
              <p className="text-xs text-muted-foreground">
                Tu club es el espacio donde vas a gestionar tus grupos, sesiones y miembros.
                Se generará automáticamente un código para que tus miembros se unan.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clubName">Nombre del club</Label>
              <Input id="clubName" placeholder="Ej: Crew Palermo Runners" value={clubName}
                onChange={e => setClubName(e.target.value)} required maxLength={80}
                className="bg-card border-border" />
              <p className="text-xs text-muted-foreground">
                Puede ser el nombre de tu plaza, tu barrio, o simplemente tu nombre.
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep('account')}
                className="flex-1" disabled={loading}>
                Volver
              </Button>
              <Button type="submit"
                className="flex-1 gradient-primary text-primary-foreground font-semibold"
                disabled={loading || !clubName.trim()}>
                {loading ? 'Creando...' : 'Crear Club'}
              </Button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tenés cuenta?{' '}
          <button onClick={() => navigate('/login')} className="text-primary hover:underline font-medium">
            Iniciá sesión
          </button>
        </p>
      </div>

      <footer className="absolute bottom-4 left-0 right-0 text-center text-xs text-muted-foreground">
        © 2026 Woditos. Todos los derechos reservados.
      </footer>
    </div>
  );
}