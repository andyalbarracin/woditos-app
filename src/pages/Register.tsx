/**
 * Archivo: Register.tsx
 * Ruta: src/pages/Register.tsx
 * Última modificación: 2026-03-09
 * Descripción: Página de registro de nuevos usuarios. Crea cuenta con email/contraseña
 *              y nombre completo. Redirige al login tras registro exitoso.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import woditosLogo from '@/assets/woditos-logo.png';
import { toast } from 'sonner';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(email, password, fullName);
      toast.success('¡Cuenta creada! Revisa tu email para confirmar.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 gradient-surface">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <img src={woditosLogo} alt="Woditos" className="h-16 mx-auto mb-6" />
          <h1 className="font-display text-2xl font-bold text-foreground">Crear Cuenta</h1>
          <p className="text-muted-foreground mt-2">Únete a la comunidad Woditos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo</Label>
            <Input id="name" placeholder="Juan Pérez" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="bg-card border-border" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-card border-border" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-card border-border" />
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
    </div>
  );
}
