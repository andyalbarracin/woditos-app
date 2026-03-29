/**
 * Archivo: AppLayout.tsx
 * Ruta: src/components/layout/AppLayout.tsx
 * Última modificación: 2026-03-28
 * Descripción: Layout principal. Sidebar desktop colapsable (iconos + tooltips).
 *   Sidebar sigue el tema global (no fijo en dark).
 */
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import {
  Home, Calendar, Users, BookOpen, User, LogOut,
  Dumbbell, Sun, Moon, ClipboardCheck, Menu, X,
} from 'lucide-react';
import woditosLogo from '@/assets/woditos-logo.png';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import NotificationsBell from '@/components/NotificationsBell';
import NextSessionBanner from '@/components/NextSessionBanner';

const navItems = [
  { to: '/',          icon: Home,         label: 'Inicio' },
  { to: '/agenda',    icon: Calendar,     label: 'Agenda' },
  { to: '/comunidad', icon: Users,        label: 'Crew' },
  { to: '/biblioteca',icon: BookOpen,     label: 'Wiki' },
  { to: '/perfil',    icon: User,         label: 'Perfil' },
];

function formatRole(role: string | undefined): string {
  if (!role) return 'Miembro';
  if (role === 'super_admin') return 'Coach';
  return role.charAt(0).toUpperCase() + role.slice(1);
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
        transition-all duration-200 ease-in-out
        ${collapsed ? 'w-16' : 'w-64'}
      `}>

        {/* Logo + toggle */}
        <div className={`flex items-center border-b border-border h-14 px-3 ${collapsed ? 'justify-center' : 'justify-between px-4'}`}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <img src={woditosLogo} alt="Woditos" className="h-7" />
              <span className="font-display font-bold text-foreground">Woditos</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(c => !c)}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            {collapsed ? <Menu size={18} /> : <X size={18} />}
          </Button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 py-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            collapsed ? (
              <Tooltip key={to} delayDuration={0}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) =>
                      `flex items-center justify-center h-10 w-10 mx-auto rounded-lg transition-all ${
                        isActive
                          ? 'bg-primary/15 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`
                    }
                  >
                    <Icon size={18} />
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            ) : (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            )
          ))}

          {isCoach && (
            <>
              <div className={`my-2 border-t border-border ${collapsed ? 'mx-2' : 'mx-1'}`} />
              {coachItems.map(({ to, icon: Icon, label }) => (
                collapsed ? (
                  <Tooltip key={to} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <NavLink
                        to={to}
                        className={({ isActive }) =>
                          `flex items-center justify-center h-10 w-10 mx-auto rounded-lg transition-all ${
                            isActive
                              ? 'bg-primary/15 text-primary'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`
                        }
                      >
                        <Icon size={18} />
                      </NavLink>
                    </TooltipTrigger>
                    <TooltipContent side="right">{label}</TooltipContent>
                  </Tooltip>
                ) : (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-primary/15 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`
                    }
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </NavLink>
                )
              ))}
            </>
          )}
        </nav>

        {/* Theme toggle */}
        {!collapsed && (
          <div className="px-4 py-3 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                <span>{theme === 'dark' ? 'Modo oscuro' : 'Modo claro'}</span>
              </div>
              <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
            </div>
          </div>
        )}

        {collapsed && (
          <div className="py-3 border-t border-border flex justify-center">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-center h-10 w-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {theme === 'dark' ? 'Modo oscuro' : 'Modo claro'}
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Perfil + logout */}
        <div className={`border-t border-border ${collapsed ? 'p-2' : 'p-4'}`}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer" onClick={() => navigate('/perfil')}>
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
                    className="h-8 w-8 text-muted-foreground hover:text-destructive">
                    <LogOut size={15} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Cerrar sesión</TooltipContent>
              </Tooltip>
            </div>
          ) : (
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
                className="text-muted-foreground hover:text-destructive">
                <LogOut size={16} />
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* ─── CONTENIDO PRINCIPAL ─────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header desktop */}
        <header className="hidden md:flex items-center px-6 py-3 border-b border-border bg-card/50 h-14">
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
        <header className="md:hidden flex items-center px-4 py-3 border-b border-border bg-card">
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

        {/* Contenido */}
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
        <nav className="md:hidden flex items-center justify-around border-t border-border bg-card py-2">
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