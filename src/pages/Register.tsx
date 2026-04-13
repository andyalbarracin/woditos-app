/**
 * Archivo: Register.tsx
 * Ruta: src/pages/Register.tsx
 * Última modificación: 2026-04-12
 * Descripción: Registro en 4 pasos.
 *   1. Rol (miembro / coach)
 *   2. Cuenta (email, password, nombre, código de club o token)
 *   3. Perfil (fecha de nacimiento, peso, frecuencia de actividad, objetivos)
 *      + declaración jurada de veracidad de datos (legal)
 *   4. Crear club (solo coaches sin token)
 *   v1.2: sanitización con schemas de validation.ts.
 *   v1.3: paso 3 con datos de perfil para historial médico/deportivo.
 */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import woditosLogo from '@/assets/woditos-logo.png';
import { toast } from 'sonner';
import { registerSchema, clubCreationSchema, joinCodeSchema, inviteTokenSchema } from '@/lib/validation';
import { ShieldCheck, Users, Dumbbell, ArrowRight, ArrowLeft, FileCheck } from 'lucide-react';

type Step = 'role' | 'account' | 'profile' | 'club';

const FREQUENCY_OPTIONS = [
  { value: 'inicio',  label: 'Estoy empezando ahora' },
  { value: '1-2',     label: '1-2 veces por semana' },
  { value: '3-4',     label: '3-4 veces por semana' },
  { value: '5+',      label: '5 o más veces por semana' },
];

export default function Register() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');

  const [step, setStep]               = useState<Step>('role');
  const [role, setRole]               = useState<'member' | 'coach'>('member');

  // Paso 2 — cuenta
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [fullName, setFullName]       = useState('');
  const [joinCode, setJoinCode]       = useState('');
  const [inviteCode, setInviteCode]   = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Paso 3 — perfil
  const [birthDate, setBirthDate]     = useState('');
  const [weightKg, setWeightKg]       = useState('');
  const [frequency, setFrequency]     = useState('');
  const [goals, setGoals]             = useState('');
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  // Paso 4 — club
  const [clubName, setClubName]       = useState('');

  const [loading, setLoading]         = useState(false);
  const [tokenValid, setTokenValid]   = useState<boolean | null>(null);
  const [errors, setErrors]           = useState<Record<string, string>>({});

  const { signUp } = useAuth();
  const navigate   = useNavigate();

  useEffect(() => {
    if (!inviteToken) return;
    setRole('coach');
    setInviteCode(inviteToken);
    setStep('account');
    validateInviteToken(inviteToken);
  }, [inviteToken]);

  const validateInviteToken = async (token: string) => {
    const tokenResult = inviteTokenSchema.safeParse(token);
    if (!tokenResult.success) {
      setTokenValid(false);
      toast.error('Este link de invitación es inválido.');
      return;
    }
    const { data, error } = await supabase
      .from('coach_invites')
      .select('status, expires_at, email_hint')
      .eq('token', tokenResult.data)
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

  const handleRoleSelect = (selected: 'member' | 'coach') => {
    setRole(selected);
    setStep('account');
  };

  // ── Paso 2: Validar cuenta y avanzar al perfil ────────────────
  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!acceptedTerms) {
      toast.error('Debés aceptar los Términos de Uso y la Política de Privacidad para continuar.');
      return;
    }
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

    if (role === 'coach' && inviteCode.trim() && !inviteToken) {
      await validateInviteToken(inviteCode.trim());
      if (tokenValid === false) return;
    }

    // Avanzar al paso de perfil
    setStep('profile');
  };

  // ── Paso 3: Validar perfil y avanzar / registrar ─────────────
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!declarationAccepted) {
      toast.error('Debés declarar que los datos son verdaderos para continuar.');
      return;
    }

    // Validar fecha de nacimiento (campo requerido)
    if (!birthDate) {
      toast.error('La fecha de nacimiento es obligatoria.');
      return;
    }
    const birthYear = new Date(birthDate).getFullYear();
    const currentYear = new Date().getFullYear();
    if (birthYear < 1920 || birthYear > currentYear - 5) {
      toast.error('Ingresá una fecha de nacimiento válida.');
      return;
    }

    // Para coaches sin token → crear club
    if (role === 'coach' && !inviteCode.trim() && !inviteToken) {
      setStep('club');
      return;
    }

    await doRegister();
  };

  // ── Paso 4: Crear club y registrar ───────────────────────────
  const handleClubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clubResult = clubCreationSchema.safeParse({ name: clubName });
    if (!clubResult.success) {
      toast.error(clubResult.error.errors[0]?.message || 'Nombre de club inválido');
      return;
    }
    await doRegister();
  };

  // ── Registro final ────────────────────────────────────────────
  const doRegister = async () => {
    setLoading(true);
    try {
      // 1. Crear cuenta en Supabase Auth
      try {
        await signUp(email, password, fullName);
      } catch (authErr: any) {
        const msg = authErr?.message || '';
        if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already been registered')) {
          toast.error('Este email ya tiene una cuenta. ¿Querés iniciar sesión?');
        } else if (msg.toLowerCase().includes('invalid') && msg.toLowerCase().includes('email')) {
          toast.error('El email ingresado no es válido. Revisalo e intentá de nuevo.');
          setStep('account');
        } else {
          toast.error(msg || 'Error al crear la cuenta');
        }
        setLoading(false);
        return;
      }

      await new Promise(res => setTimeout(res, 1500));

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        toast.error('Hubo un problema al obtener tu cuenta. Intentá iniciar sesión.');
        setLoading(false);
        navigate('/login');
        return;
      }

      // 2. Guardar datos de perfil extendido
      const profileUpdate: Record<string, any> = {
        full_name:          fullName,
        updated_at:         new Date().toISOString(),
      };
      if (birthDate)           profileUpdate.birth_date          = birthDate;
      if (weightKg)            profileUpdate.weight_kg           = parseFloat(weightKg);
      if (frequency)           profileUpdate.training_frequency  = frequency;
      if (goals.trim())        profileUpdate.goals               = goals.trim();

      await supabase.from('profiles').update(profileUpdate).eq('user_id', authUser.id);

      // 3. Lógica de club / invitación
      const tokenToUse = inviteCode.trim() || inviteToken;

      if (tokenToUse && tokenValid) {
        const tokenResult = inviteTokenSchema.safeParse(tokenToUse);
        if (!tokenResult.success) {
          toast.error('Token de invitación inválido.');
          setLoading(false);
          return;
        }
        const { data: rpcResult } = await supabase.rpc('use_coach_invite', {
          p_token:   tokenResult.data,
          p_user_id: authUser.id,
        });
        const result = rpcResult as { success: boolean; error?: string } | null;
        if (!result?.success) {
          toast.error(result?.error || 'No se pudo activar la invitación.');
        } else {
          toast.success('¡Cuenta Coach creada! Bienvenido al club.');
        }

      } else if (role === 'coach' && clubName.trim()) {
        const clubResult = clubCreationSchema.safeParse({ name: clubName });
        if (!clubResult.success) {
          toast.error('Nombre de club inválido.');
          setLoading(false);
          return;
        }
        const sanitizedClubName = clubResult.data.name;
        const slug       = sanitizedClubName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 50);
        const uniqueSlug = `${slug}-${Date.now().toString(36)}`;

        const { data: newClub, error: clubError } = await supabase
          .from('clubs')
          .insert({ name: sanitizedClubName, slug: uniqueSlug, owner_id: authUser.id, plan: 'pro' })
          .select().single();

        if (clubError) throw clubError;

        await supabase.from('club_memberships').insert({
          club_id: newClub.id, user_id: authUser.id, role: 'club_admin', status: 'active',
        });
        await new Promise(res => setTimeout(res, 500));
        await supabase.from('users').update({ role: 'coach' }).eq('id', authUser.id);
        toast.success(`¡Club "${sanitizedClubName}" creado! Bienvenido a Woditos.`);

      } else if (role === 'member' && joinCode.trim()) {
        const joinResult = joinCodeSchema.safeParse(joinCode);
        if (!joinResult.success) {
          toast.error('Código de club inválido. Verificá con tu coach.');
          setLoading(false);
          return;
        }
        const { data: club } = await supabase
          .from('clubs').select('id, name')
          .eq('join_code', joinResult.data).eq('status', 'active').single();

        if (club) {
          await supabase.from('club_memberships').insert({
            club_id: club.id, user_id: authUser.id, role: 'member', status: 'active',
          });
          toast.success(`¡Te uniste a "${club.name}"!`);
        } else {
          toast.error('Código de club inválido. Podés unirte más tarde desde tu perfil.');
        }

      } else {
        toast.success('¡Cuenta creada! Ya podés iniciar sesión.');
      }

      window.location.href = '/inicio';

    } catch (err: any) {
      toast.error(err.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center p-6 gradient-surface">
      <div className="w-full max-w-sm space-y-8">

        <div className="text-center">
          <img src={woditosLogo} alt="Woditos" className="h-16 mx-auto mb-6" />
          <h1 className="font-display text-2xl font-bold text-foreground">Crear Cuenta</h1>
          <p className="text-muted-foreground mt-2">Únete a la comunidad Woditos</p>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          {(['role', 'account', 'profile', ...(role === 'coach' && !inviteCode && !inviteToken ? ['club'] : [])] as Step[]).map((s, i, arr) => (
            <span key={s} className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] transition-colors ${
                step === s ? 'bg-primary text-primary-foreground' :
                arr.indexOf(step) > i ? 'bg-secondary/30 text-secondary' : 'bg-muted text-muted-foreground'
              }`}>{i + 1}</span>
              {i < arr.length - 1 && <span className="w-6 h-px bg-border" />}
            </span>
          ))}
        </div>

        {/* Banner invitación */}
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

        {/* ── PASO 1: Rol ───────────────────────────────────── */}
        {step === 'role' && (
          <div className="space-y-4">
            <p className="text-sm text-center text-muted-foreground">¿Cómo vas a usar Woditos?</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleRoleSelect('member')}
                className="p-5 rounded-xl border-2 border-border bg-card text-left transition-all hover:border-primary/50 hover:bg-primary/5">
                <Users size={24} className="text-primary mb-3" />
                <p className="font-semibold text-sm text-foreground">Miembro</p>
                <p className="text-xs text-muted-foreground mt-1">Me sumo a un club existente</p>
              </button>
              <button onClick={() => handleRoleSelect('coach')}
                className="p-5 rounded-xl border-2 border-border bg-card text-left transition-all hover:border-primary/50 hover:bg-primary/5">
                <Dumbbell size={24} className="text-primary mb-3" />
                <p className="font-semibold text-sm text-foreground">Coach</p>
                <p className="text-xs text-muted-foreground mt-1">Creo mi club o me uno a uno</p>
              </button>
            </div>
          </div>
        )}

        {/* ── PASO 2: Cuenta ────────────────────────────────── */}
        {step === 'account' && (
          <form onSubmit={handleAccountSubmit} className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
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
              <Label>Nombre completo</Label>
              <Input placeholder="Juan Pérez" value={fullName}
                onChange={e => setFullName(e.target.value)} required maxLength={100}
                className="bg-card border-border" />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="tu@email.com" value={email}
                onChange={e => setEmail(e.target.value)} required maxLength={255}
                className="bg-card border-border" />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Input type="password" placeholder="Mínimo 6 caracteres" value={password}
                onChange={e => setPassword(e.target.value)} required maxLength={128} minLength={6}
                className="bg-card border-border" />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            {role === 'member' && (
              <div className="space-y-2">
                <Label>Código de club <span className="text-muted-foreground">(opcional)</span></Label>
                <Input placeholder="Ej: ABC123" value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={10}
                  className="bg-card border-border font-mono tracking-widest" />
                <p className="text-xs text-muted-foreground">Tu coach te comparte este código.</p>
              </div>
            )}

            {role === 'coach' && !inviteToken && (
              <div className="space-y-2">
                <Label>Token de invitación <span className="text-muted-foreground">(opcional)</span></Label>
                <Input placeholder="Si tenés un código de coach" value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.trim())}
                  className="bg-card border-border font-mono" />
                <p className="text-xs text-muted-foreground">
                  Sin token, creás tu propio club en el siguiente paso.
                </p>
              </div>
            )}

            {/* Aceptación de términos */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5 shrink-0">
                <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} className="sr-only" />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  acceptedTerms ? 'bg-primary border-primary' : 'border-border bg-card group-hover:border-primary/50'
                }`}>
                  {acceptedTerms && (
                    <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                      <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-xs text-muted-foreground leading-relaxed">
                Leí y acepto los{' '}
                <Link to="/terminos" target="_blank" rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium" onClick={e => e.stopPropagation()}>
                  Términos de Uso
                </Link>{' '}y la{' '}
                <Link to="/privacidad" target="_blank" rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium" onClick={e => e.stopPropagation()}>
                  Política de Privacidad
                </Link>{' '}de Woditos.
              </span>
            </label>

            <Button type="submit"
              className="w-full gradient-primary text-primary-foreground font-semibold gap-2"
              disabled={loading || !acceptedTerms || (inviteToken !== null && tokenValid === false)}>
              Siguiente <ArrowRight size={14} />
            </Button>
          </form>
        )}

        {/* ── PASO 3: Perfil ────────────────────────────────── */}
        {step === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-foreground mb-0.5">Tu perfil deportivo</p>
              <p className="text-xs text-muted-foreground">
                Esta información ayuda a tu coach a personalizar el entrenamiento.
              </p>
            </div>

            {/* Fecha de nacimiento */}
            <div className="space-y-2">
              <Label>Fecha de nacimiento <span className="text-destructive">*</span></Label>
              <Input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
                required max={new Date().toISOString().split('T')[0]}
                className="bg-card border-border" />
              <p className="text-xs text-muted-foreground">
                Requerida. Menores de 18 años necesitan autorización de un adulto.
              </p>
            </div>

            {/* Peso */}
            <div className="space-y-2">
              <Label>Peso (kg) <span className="text-muted-foreground">(opcional)</span></Label>
              <Input type="number" placeholder="Ej: 72" value={weightKg}
                onChange={e => setWeightKg(e.target.value)}
                min={20} max={300} step={0.1}
                className="bg-card border-border" />
              <p className="text-xs text-muted-foreground">
                Solo tu coach puede ver este dato. No se muestra a otros miembros.
              </p>
            </div>

            {/* Frecuencia de actividad */}
            <div className="space-y-2">
              <Label>¿Cuántas veces hacés actividad física? <span className="text-muted-foreground">(opcional)</span></Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger className="bg-card border-border">
                  <SelectValue placeholder="Elegí una opción" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Objetivos */}
            <div className="space-y-2">
              <Label>¿Cuáles son tus objetivos? <span className="text-muted-foreground">(opcional)</span></Label>
              <Textarea
                placeholder="Ej: Correr mi primer 10K, mejorar mi resistencia, bajar de peso..."
                value={goals} onChange={e => setGoals(e.target.value)}
                maxLength={500} rows={3} className="bg-card border-border resize-none" />
            </div>

            {/* Declaración jurada */}
            <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <FileCheck size={16} className="text-primary shrink-0" />
                <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Declaración de veracidad
                </p>
              </div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5 shrink-0">
                  <input type="checkbox" checked={declarationAccepted}
                    onChange={e => setDeclarationAccepted(e.target.checked)} className="sr-only" />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    declarationAccepted ? 'bg-primary border-primary' : 'border-border bg-card group-hover:border-primary/50'
                  }`}>
                    {declarationAccepted && (
                      <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                        <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Declaro que todos los datos ingresados en este formulario son verdaderos, completos y puestos voluntariamente por mí. Entiendo que la veracidad de esta información es responsabilidad mía y que Woditos no se hace responsable por consecuencias derivadas de datos incorrectos o incompletos.
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep('account')}
                className="gap-1" disabled={loading}>
                <ArrowLeft size={14} /> Volver
              </Button>
              <Button type="submit"
                className="flex-1 gradient-primary text-primary-foreground font-semibold gap-2"
                disabled={loading || !declarationAccepted}>
                {role === 'coach' && !inviteCode.trim() && !inviteToken
                  ? <><span>Siguiente: Crear club</span><ArrowRight size={14} /></>
                  : loading ? 'Creando cuenta...' : <><span>Crear cuenta</span><ArrowRight size={14} /></>
                }
              </Button>
            </div>
          </form>
        )}

        {/* ── PASO 4: Crear Club ────────────────────────────── */}
        {step === 'club' && (
          <form onSubmit={handleClubSubmit} className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">Creá tu Club</p>
              <p className="text-xs text-muted-foreground">
                Tu club es el espacio donde gestionás tus grupos, sesiones y alumnos.
                Se generará automáticamente un código para que tus alumnos se unan.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Nombre del club</Label>
              <Input placeholder="Ej: Crew Palermo Runners" value={clubName}
                onChange={e => setClubName(e.target.value)} required maxLength={80}
                className="bg-card border-border" />
              <p className="text-xs text-muted-foreground">
                Puede ser el nombre de tu plaza, tu barrio, o simplemente tu nombre.
              </p>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep('profile')}
                className="flex-1 gap-1" disabled={loading}>
                <ArrowLeft size={14} /> Volver
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

        <p className="text-center text-xs text-muted-foreground">
          © 2026 Woditos V2.0 - Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}