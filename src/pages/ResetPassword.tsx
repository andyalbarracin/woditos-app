/**
 * Archivo: ResetPassword.tsx
 * Ruta: src/pages/ResetPassword.tsx
 * Última modificación: 2026-03-29
 * Descripción: Flujo de recuperación de contraseña en dos fases:
 *   1. "request" — el usuario ingresa su email y recibe un link de reset
 *   2. "update"  — tras clickear el link, ingresa su nueva contraseña
 *   Supabase Auth detecta el token en la URL automáticamente y dispara
 *   el evento PASSWORD_RECOVERY que activa la fase 2.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import woditosLogo from '@/assets/woditos-logo.png';
import { toast } from 'sonner';
import { Mail, Lock, ArrowLeft, CheckCircle } from 'lucide-react';

type Phase = 'request' | 'email-sent' | 'update';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('request');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  /* ── Detectar token de recovery en la URL ──────────────────────
     Cuando el usuario clickea el link del email, Supabase redirige
     a /reset-password con tokens en el hash. El cliente JS los
     procesa y dispara onAuthStateChange con PASSWORD_RECOVERY.
  ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setPhase('update');
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  /* ── Fase 1: enviar email de reset ─────────────────────────── */
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Ingresá tu email');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message || 'No se pudo enviar el email');
    } else {
      setPhase('email-sent');
    }
  };

  /* ── Fase 2: actualizar contraseña ─────────────────────────── */
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      toast.error(error.message || 'No se pudo actualizar la contraseña');
    } else {
      toast.success('¡Contraseña actualizada! Ya podés iniciar sesión.');
      await supabase.auth.signOut();
      navigate('/login');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 gradient-surface">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center">
          <img src={woditosLogo} alt="Woditos" className="h-16 mx-auto mb-6" />
        </div>

        {/* ── FASE: Pedir email ──────────────────────────────────── */}
        {phase === 'request' && (
          <>
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground">Recuperar contraseña</h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Ingresá tu email y te enviaremos un link para crear una contraseña nueva.
              </p>
            </div>

            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    maxLength={255}
                    className="bg-card border-border pl-10"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full gradient-primary text-primary-foreground font-semibold"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar link de recuperación'}
              </Button>
            </form>
          </>
        )}

        {/* ── FASE: Email enviado ────────────────────────────────── */}
        {phase === 'email-sent' && (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
              <CheckCircle size={32} className="text-secondary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">¡Email enviado!</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Si <strong>{email}</strong> tiene una cuenta en Woditos, vas a recibir un email con un link para restablecer tu contraseña.
            </p>
            <p className="text-xs text-muted-foreground">
              Revisá tu carpeta de spam si no lo ves en unos minutos.
            </p>
          </div>
        )}

        {/* ── FASE: Nueva contraseña ─────────────────────────────── */}
        {phase === 'update' && (
          <>
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground">Nueva contraseña</h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Elegí tu nueva contraseña para Woditos.
              </p>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    maxLength={128}
                    className="bg-card border-border pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Repetí la contraseña"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    maxLength={128}
                    className="bg-card border-border pl-10"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full gradient-primary text-primary-foreground font-semibold"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
              </Button>
            </form>
          </>
        )}

        {/* Volver al login */}
        <button
          onClick={() => navigate('/login')}
          className="flex items-center justify-center gap-2 w-full text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft size={14} /> Volver al inicio de sesión
        </button>

        <p className="text-center text-xs text-muted-foreground">
          © 2026 Woditos. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}