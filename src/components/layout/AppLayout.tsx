/**
 * Archivo: AppLayout.tsx
 * Ruta: src/components/layout/AppLayout.tsx
 * Última modificación: 2026-03-09
 * Descripción: Layout principal de la app. Incluye sidebar desktop, barra de navegación
 *              móvil inferior, header con toggle de tema, notificaciones y rutas protegidas por rol.
 *              El rol "super_admin" se muestra como "Coach" en la UI.
 */

import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Home, Calendar, Users, BookOpen, User, LogOut, Dumbbell, Sun, Moon, ClipboardCheck } from 'lucide-react';
import woditosLogo from '@/assets/woditos-logo.png';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import NotificationsBell from '@/components/NotificationsBell';
import NextSessionBanner from '@/components/NextSessionBanner';

/** Ítems de navegación comunes a todos los usuarios */
const navItems = [
  { to: '/', icon: Home, label: 'Inicio' },
  { to: '/agenda', icon: Calendar, label: 'Agenda' },
  { to: '/comunidad', icon: Users, label: 'Crew' },
  { to: '/biblioteca', icon: BookOpen, label: 'Wiki' },
  { to: '/perfil', icon: User, label: 'Perfil' },
];

/**
 * Convierte el rol interno en una etiqueta legible para el usuario.
 * "super_admin" → "Coach" para simplificar la UX.
 */
function formatRole(role: string | undefined): string {
  if (!role) return 'Miembro';
  if (role === 'super_admin') return 'Coach';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function AppLayout() {
  const { profile, user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  /** Verifica si el usuario tiene permisos de coach (coach o super_admin) */
  const isCoach = user?.role === 'coach' || user?.role === 'super_admin';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* ─── SIDEBAR DESKTOP ───────────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-sidebar">

        {/* Logo + nombre */}
        <div className="p-5 flex items-center gap-3">
          <img src={woditosLogo} alt="Woditos" className="h-9" />
          <span className="font-display font-bold text-lg text-foreground">Woditos</span>
        </div>

        {/* Ítems de navegación */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sidebar-primary/20 text-sidebar-primary'
                    : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}

          {/* Divider + rutas exclusivas para Coach / Super Admin */}
          {isCoach && (
            <>
              {/* Línea divisoria sutil antes de las opciones de Coach */}
              <div className="my-3 border-t border-sidebar-border" />
              
              <NavLink
                to="/coach"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive ? 'bg-sidebar-primary/20 text-sidebar-primary' : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                  }`
                }
              >
                <Dumbbell size={18} />
                Coach Panel
              </NavLink>
              <NavLink
                to="/asistencia"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive ? 'bg-sidebar-primary/20 text-sidebar-primary' : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                  }`
                }
              >
                <ClipboardCheck size={18} />
                Asistencias
              </NavLink>
            </>
          )}
        </nav>

        {/* Toggle de tema (oscuro / claro) */}
        <div className="px-4 py-3 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
              <span>{theme === 'dark' ? 'Modo oscuro' : 'Modo claro'}</span>
            </div>
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
          </div>
        </div>

        {/* Perfil del usuario + botón de cierre de sesión */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                {profile?.full_name?.slice(0, 2).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{profile?.full_name || 'Usuario'}</p>
              {/* Muestra "Coach" en lugar de "super_admin" */}
              <p className="text-xs text-muted-foreground truncate">{formatRole(user?.role)}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-muted-foreground hover:text-destructive">
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </aside>

      {/* ─── CONTENIDO PRINCIPAL ───────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header desktop */}
        <header className="hidden md:flex items-center justify-between px-6 py-3 border-b border-border bg-card/50">
          <NextSessionBanner />
          <div className="flex items-center gap-2">
            <NotificationsBell />
          </div>
        </header>

        {/* Header móvil */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-sidebar">
          <div className="flex items-center gap-2">
            <img src={woditosLogo} alt="Woditos" className="h-8" />
            <span className="font-display font-bold text-foreground">Woditos</span>
          </div>
          <div className="flex items-center gap-2">
            <NextSessionBanner />
            <NotificationsBell />
          </div>
        </header>

        {/* Área de contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>

        {/* Barra de navegación inferior (móvil) */}
        <nav className="md:hidden flex items-center justify-around border-t border-border bg-sidebar py-2 pb-safe">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-2 text-xs font-medium transition-all ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
          {/* Ítem Coach en móvil (si aplica) */}
          {isCoach && (
            <NavLink
              to="/coach"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-2 text-xs font-medium transition-all ${
                  isActive ? 'text-secondary' : 'text-muted-foreground'
                }`
              }
            >
              <Dumbbell size={20} />
              Coach
            </NavLink>
          )}
        </nav>
      </main>
    </div>
  );
}
