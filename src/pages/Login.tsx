/**
 * Archivo: Login.tsx
 * Ruta: src/pages/Login.tsx
 * Última modificación: 2026-03-29
 * Descripción: Página de login con email/password, Google OAuth,
 *   y link a recuperación de contraseña.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import woditosLogo from '@/assets/woditos-logo.png';
import heroBg from '@/assets/hero-bg.jpg';
import { toast } from 'sonner';
import { loginSchema } from '@/lib/validation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setLoading(true);
    try {
      await signIn(result.data.email, result.data.password);
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) toast.error('Error al iniciar con Google');
    } catch (err: any) {
      toast.error(err.message || 'Error con Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Columna izquierda: imagen hero */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img src={heroBg} alt="Woditos running" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/30" />
        <div className="relative z-10 flex flex-col justify-end p-12">
          <h2 className="font-display text-4xl font-extrabold text-foreground mb-3">
            Tu comunidad de <span className="text-gradient-primary">running</span> te espera
          </h2>
          <p className="text-muted-foreground text-lg max-w-md">
            Entrena, conecta y crece con Woditos. La plataforma que une a runners y atletas funcionales.
          </p>
        </div>
      </div>

      {/* Columna derecha: formulario con scroll propio */}
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-sm space-y-6">

            <div className="text-center">
            <img src={woditosLogo} alt="Woditos" className="h-20 mx-auto mb-6" />              
            <h1 className="font-display text-2xl font-bold text-foreground">Iniciar Sesión</h1>
              <p className="text-muted-foreground mt-2">Bienvenido de vuelta a tu crew</p>
            </div>

            <Button type="button" variant="outline"
              className="w-full gap-3 border-border text-foreground"
              onClick={handleGoogleSignIn} disabled={googleLoading}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleLoading ? 'Conectando...' : 'Continuar con Google'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">o con email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="tu@email.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} required maxLength={255}
                  className="bg-card border-border" />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <button
                    type="button"
                    onClick={() => navigate('/reset-password')}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <Input id="password" type="password" placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)} required maxLength={128}
                  className="bg-card border-border" />
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground font-semibold"
                disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">👤 Usuarios de prueba:</p>
              <p>Perfiles de Miembros: </p>
              <p>📧 maria@woditos.app · 🔑 Woditos2026!</p>
              <p>📧 juan@woditos.app · 🔑 Woditos2026!</p>
              <p>📧 sofia@woditos.app · 🔑 Woditos2026!</p>
              <p>Perfil de Coach: </p>
              <p>📧 coach@woditos.app · 🔑 Woditos2026!</p>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <button onClick={() => navigate('/register')} className="text-primary hover:underline font-medium">
                Regístrate
              </button>
            </p>

            <p className="text-center text-xs text-muted-foreground">
              © 2026 Woditos. Todos los derechos reservados.
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}