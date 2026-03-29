/**
 * Archivo: AppLayout.tsx
 * Ruta: src/components/layout/AppLayout.tsx
 * Última modificación: 2026-03-28
 * Descripción: Layout principal. Sidebar colapsable con iconos grandes y centrados.
 */
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import {
  Home, Calendar, Users, BookOpen, User, LogOut,
  Dumbbell, Sun, Moon, ClipboardCheck, Menu,
} from 'lucide-react';
import woditosLogo from '@/assets/woditos-logo.png';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import NotificationsBell from '@/components/NotificationsBell';
import NextSessionBanner from '@/components/NextSessionBanner';

const navItems = [
  { to: '/',           icon: Home,          label: 'Inicio' },
  { to: '/agenda',     icon: Calendar,      label: 'Agenda' },
  { to: '/comunidad',  icon: Users,         label: 'Crew' },
  { to: '/biblioteca', icon: BookOpen,      label: 'Wiki' },
  { to: '/perfil',     icon: User,          label: 'Perfil' },
];

function formatRole(role: string | undefined): string {
  if (!role) return 'Miembro';
  if (role === 'super_admin') return 'Coach';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

// Componente reutilizable para cada ítem de nav
function NavItem({
  to, icon: Icon, label, collapsed, end,
}: {
  to: string; icon: React.ElementType; label: string; collapsed: boolean; end?: boolean;
}) {
  const baseCollapsed = `flex items-center justify-center w-full h-12 rounded-xl transition-all`;
  const baseExpanded = `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full`;

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
              `${baseCollapsed} ${isActive
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`
            }
          >
            <Icon size={22} />
          </NavLink>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `${baseExpanded} ${isActive
          ? 'bg-primary/15 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`
      }
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );
}

export default function AppLayout() {
  const { profile, user, signOut, clubMembership } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const isCoach = user?.role === 'coach' || user?.role === 'super_admin';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const coachItems = [
    { to: '/coach',      icon: Dumbbell,      label: 'Coach Panel' },
    { to: '/asistencia', icon: ClipboardCheck, label: 'Asistencias' },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* ─── SIDEBAR DESKTOP ─────────────────────────────────── */}
      <aside className={`
        hidden md:flex flex-col border-r border-border bg-card
        transition-all duration-200 ease-in-out overflow-hidden
        ${collapsed ? 'w-[72px]' : 'w-64'}
      `}>

        {/* Header del sidebar: logo + botón toggle */}
        <div className={`
          flex items-center border-b border-border h-14 shrink-0
          ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}
        `}>
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <img src={woditosLogo} alt="Woditos" className="h-7 shrink-0" />
              <span className="font-display font-bold text-foreground truncate">Woditos</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(c => !c)}
            className="text-muted-foreground hover:text-foreground shrink-0 h-9 w-9"
          >
            <Menu size={18} />
          </Button>
        </div>

        {/* Navegación */}
        <nav className={`flex-1 py-3 space-y-1 overflow-hidden ${collapsed ? 'px-2' : 'px-3'}`}>
          {navItems.map(({ to, icon, label }) => (
            <NavItem key={to} to={to} icon={icon} label={label} collapsed={collapsed} end={to === '/'} />
          ))}

          {isCoach && (
            <>
              <div className="my-2 border-t border-border" />
              {coachItems.map(({ to, icon, label }) => (
                <NavItem key={to} to={to} icon={icon} label={label} collapsed={collapsed} />
              ))}
            </>
          )}
        </nav>

        {/* Toggle de tema */}
        {collapsed ? (
          <div className="px-2 py-3 border-t border-border flex justify-center shrink-0">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-center w-full h-12 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  {theme === 'dark' ? <Moon size={22} /> : <Sun size={22} />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {theme === 'dark' ? 'Modo oscuro' : 'Modo claro'}
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="px-4 py-3 border-t border-border shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                <span>{theme === 'dark' ? 'Modo oscuro' : 'Modo claro'}</span>
              </div>
              <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
            </div>
          </div>
        )}

        {/* Perfil + logout */}
        {collapsed ? (
          <div className="px-2 py-3 border-t border-border flex flex-col items-center gap-2 shrink-0">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Avatar className="h-9 w-9 cursor-pointer" onClick={() => navigate('/perfil')}>
                  {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                    {profile?.full_name?.slice(0, 2).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="right">{profile?.full_name}</TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleSignOut}
                  className="h-9 w-9 text-muted-foreground hover:text-destructive">
                  <LogOut size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Cerrar sesión</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="p-4 border-t border-border shrink-0">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 shrink-0">
                {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                  {profile?.full_name?.slice(0, 2).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{profile?.full_name || 'Usuario'}</p>
                <p className="text-xs text-muted-foreground truncate">{formatRole(user?.role)}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSignOut}
                className="text-muted-foreground hover:text-destructive shrink-0">
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        )}
      </aside>

      {/* ─── CONTENIDO PRINCIPAL ─────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header desktop */}
        <header className="hidden md:flex items-center px-6 py-3 border-b border-border bg-card/50 h-14 shrink-0">
          <div className="flex-1 flex items-center">
            <NextSessionBanner />
          </div>
          <div className="flex items-center justify-center">
            {clubMembership ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-sm">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="font-medium text-foreground max-w-[160px] truncate">
                  {clubMembership.club.name}
                </span>
                {clubMembership.club.plan !== 'free' && (
                  <span className="text-xs text-muted-foreground">
                    · {clubMembership.club.plan === 'pro_plus' ? 'Pro+' : 'Pro'}
                  </span>
                )}
              </div>
            ) : (
              <div className="w-32" />
            )}
          </div>
          <div className="flex-1 flex items-center justify-end">
            <NotificationsBell />
          </div>
        </header>

        {/* Header móvil */}
        <header className="md:hidden flex items-center px-4 py-3 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-2 flex-1">
            <img src={woditosLogo} alt="Woditos" className="h-8" />
            <span className="font-display font-bold text-foreground">Woditos</span>
          </div>
          {clubMembership && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-border bg-card/80 text-xs mx-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="font-medium text-foreground max-w-[90px] truncate">
                {clubMembership.club.name}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <NextSessionBanner />
            <NotificationsBell />
          </div>
        </header>

        {/* Área de contenido */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="min-h-full flex flex-col">
            <div className="flex-1">
              <Outlet />
            </div>
            <footer className="mt-8 py-4 text-center text-xs text-muted-foreground border-t border-border">
              © 2026 Woditos. Todos los derechos reservados.
            </footer>
          </div>
        </div>

        {/* Nav móvil inferior */}
        <nav className="md:hidden flex items-center justify-around border-t border-border bg-card py-2 shrink-0">
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