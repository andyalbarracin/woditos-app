/**
 * Archivo: Register.tsx
 * Ruta: src/pages/Register.tsx
 * Última modificación: 2026-03-11
 * Descripción: Página de registro con validación Zod.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import woditosLogo from '@/assets/woditos-logo.png';
import { toast } from 'sonner';
import { registerSchema } from '@/lib/validation';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = registerSchema.safeParse({ email, password, fullName });
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
      await signUp(result.data.email, result.data.password, result.data.fullName);
      toast.success('¡Cuenta creada! Revisa tu email para confirmar.');
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo</Label>
            <Input id="name" placeholder="Juan Pérez" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={100} className="bg-card border-border" />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} className="bg-card border-border" />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required maxLength={128} minLength={6} className="bg-card border-border" />
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>
          <Button type="submit" className="w-full gradient-primary text-primary-foreground font-semibold" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <button onClick={() => navigate('/login')} className="text-primary hover:underline font-medium">
            Inicia sesión
          </button>
        </p>
      </div>
      <footer className="absolute bottom-4 left-0 right-0 text-center text-xs text-muted-foreground">
        © 2026 Woditos. Todos los derechos reservados.
      </footer>
    </div>
  );
}
