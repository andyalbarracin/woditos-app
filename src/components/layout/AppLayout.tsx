/**
 * Archivo: AppLayout.tsx
 * Ruta: src/components/layout/AppLayout.tsx
 * Última modificación: 2026-04-12
 * Descripción: Layout principal. Sidebar desktop colapsable, nav móvil inferior.
 *   v2.4: sidebar corregido por rol:
 *         - Miembro: navItems → separador → Rutinas (bottomItems)
 *         - Coach: navItems → separador → Rutinas + Sesiones + Coach Panel (coachItems)
 *         Fix logout: se removió navigate('/login') manual — ProtectedRoute redirige
 *         automáticamente cuando la sesión se anula, evitando race condition.
 */
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import {
  Home, Calendar, Users, BookOpen, User, LogOut,
  Dumbbell, Sun, Moon, ClipboardCheck, Menu, LifeBuoy, ListChecks,
} from 'lucide-react';
import woditosLogo from '@/assets/woditos-logo.png';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import NotificationsBell from '@/components/NotificationsBell';
import NextSessionBanner from '@/components/NextSessionBanner';

// Items comunes a todos los roles
const navItems = [
  { to: '/',           icon: Home,     label: 'Inicio', end: true  },
  { to: '/agenda',     icon: Calendar, label: 'Agenda', end: false },
  { to: '/comunidad',  icon: Users,    label: 'Crew',   end: false },
  { to: '/biblioteca', icon: BookOpen, label: 'Wiki',   end: false },
  { to: '/perfil',     icon: User,     label: 'Perfil', end: false },
];

// Solo visible para miembros (con separador propio)
const memberBottomItems = [
  { to: '/rutinas', icon: ListChecks, label: 'Rutinas', end: false },
];

// Visible para coaches — Rutinas incluida aquí, no en navItems
const coachItems = [
  { to: '/rutinas',    icon: ListChecks,     label: 'Rutinas',     end: false },
  { to: '/coach',      icon: Dumbbell,       label: 'Coach Panel', end: false },
  { to: '/asistencia', icon: ClipboardCheck, label: 'Sesiones',    end: false },
];

function formatRole(role: string | undefined): string {
  if (!role) return 'Miembro';
  if (role === 'super_admin' || role === 'club_admin') return 'Coach';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function AppLayout() {
  const { profile, user, signOut, clubMembership } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileBannerDismissed, setMobileBannerDismissed] = useState(false);

  const role    = user?.role as string | undefined;
  const isCoach = role === 'coach' || role === 'super_admin' || role === 'club_admin';

  // FIX: navigate('/login') se ejecuta en try/finally para garantizar que
  // siempre se redirige, incluso si signOut tarda o falla silenciosamente.
  // Sin este navigate, React puede batchear el update de session→null y
  // ProtectedRoute no re-renderiza a tiempo → el botón "no hace nada".
  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const collapsedItem = (isActive: boolean) =>
    `flex items-center justify-center rounded-xl transition-colors ${
      isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    }`;

  const expandedItem = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all ${
      isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    }`;

  const COLLAPSED_PAD = 26;

  const renderNavItem = ({ to, icon: Icon, label, end }: typeof navItems[0]) =>
    collapsed ? (
      <Tooltip key={to} delayDuration={0}>
        <TooltipTrigger asChild>
          <NavLink to={to} end={end} className={({ isActive }) => collapsedItem(isActive)}
            style={{ display: 'flex', height: 44 }}>
            <Icon size={22} />
          </NavLink>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={6}>{label}</TooltipContent>
      </Tooltip>
    ) : (
      <NavLink key={to} to={to} end={end} className={({ isActive }) => expandedItem(isActive)}>
        <Icon size={18} /><span>{label}</span>
      </NavLink>
    );

  return (
    <div className="flex h-dvh bg-background overflow-hidden">

      {/* ─── SIDEBAR DESKTOP ─────────────────────────────────────── */}
      <aside
        style={{ width: collapsed ? 72 : 256 }}
        className="hidden md:flex flex-col border-r border-border bg-card transition-all duration-200 ease-in-out overflow-hidden shrink-0"
      >
        {/* Logo + toggle */}
        <div className="flex items-center border-b border-border h-14 shrink-0"
          style={collapsed
            ? { justifyContent: 'center' }
            : { justifyContent: 'space-between', paddingLeft: 12, paddingRight: 12 }}>
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <img src={woditosLogo} alt="Woditos" className="h-7 shrink-0" />
              <span className="font-display font-bold text-foreground truncate">Woditos</span>
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)}
            className="flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all shrink-0">
            <Menu size={20} />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden"
          style={collapsed
            ? { paddingTop: 12, paddingBottom: 8, paddingLeft: COLLAPSED_PAD, paddingRight: COLLAPSED_PAD }
            : { padding: '8px 10px' }}>
          <div className="flex flex-col gap-1">

            {/* Items principales — iguales para todos */}
            {navItems.map(renderNavItem)}

            {/* Separador + items según rol */}
            <div className="border-t border-border" style={{ margin: collapsed ? '6px 0' : '4px 0' }} />

            {isCoach
              // Coach: Rutinas, Coach Panel, Sesiones juntos
              ? coachItems.map(renderNavItem)
              // Miembro: solo Rutinas con su separador
              : memberBottomItems.map(renderNavItem)
            }
          </div>
        </nav>

        {/* Soporte */}
        {collapsed ? (
          <div className="shrink-0" style={{ display: 'flex', justifyContent: 'center', paddingTop: 4, paddingBottom: 4 }}>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <NavLink to="/soporte" className={({ isActive }) => collapsedItem(isActive)} style={{ display: 'flex', height: 44 }}>
                  <LifeBuoy size={22} />
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={6}>Ayuda</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="shrink-0 px-[10px] pb-1">
            <NavLink to="/soporte" className={({ isActive }) => expandedItem(isActive)}>
              <LifeBuoy size={18} /><span>Ayuda</span>
            </NavLink>
          </div>
        )}

        {/* Theme toggle */}
        {collapsed ? (
          <div className="border-t border-border shrink-0"
            style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 8 }}>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button onClick={toggleTheme}
                  className="flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                  style={{ height: 44, width: 44 }}>
                  {theme === 'dark' ? <Moon size={22} /> : <Sun size={22} />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={6}>
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
          <div className="border-t border-border shrink-0"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 12, paddingBottom: 12 }}>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Avatar className="h-9 w-9 cursor-pointer" onClick={() => navigate('/perfil')}>
                  {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                    {profile?.full_name?.slice(0, 2).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={6}>{profile?.full_name}</TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button onClick={handleSignOut}
                  className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-all">
                  <LogOut size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={6}>Cerrar sesión</TooltipContent>
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

      {/* ─── CONTENIDO PRINCIPAL ─────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header desktop */}
        <header className="hidden md:flex items-center px-6 py-3 border-b border-border bg-card/50 h-14 shrink-0">
          <div className="flex-1 flex items-center"><NextSessionBanner /></div>
          <div className="flex items-center justify-center">
            {clubMembership ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-sm">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="font-medium text-foreground max-w-[160px] truncate">{clubMembership.club.name}</span>
                {clubMembership.club.plan !== 'free' && (
                  <span className="text-xs text-muted-foreground">
                    · {clubMembership.club.plan === 'pro_plus' ? 'Pro+' : 'Pro'}
                  </span>
                )}
              </div>
            ) : <div className="w-32" />}
          </div>
          <div className="flex-1 flex items-center justify-end"><NotificationsBell /></div>
        </header>

        {/* Header móvil */}
        <header className="md:hidden flex items-center px-3 py-2.5 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <img src={woditosLogo} alt="Woditos" className="h-7 shrink-0" />
            <span className="font-display font-bold text-foreground text-sm truncate">Woditos</span>
          </div>
          {clubMembership && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-border bg-card/80 text-xs mx-2 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="font-medium text-foreground max-w-[80px] truncate">{clubMembership.club.name}</span>
            </div>
          )}
          <div className="flex items-center gap-1 shrink-0">
            <NotificationsBell />
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center justify-center h-9 w-9 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <Avatar className="h-8 w-8">
                    {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                    <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-bold">
                      {profile?.full_name?.slice(0, 2).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0 bg-card border-border" align="end" sideOffset={8}>
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground truncate">{profile?.full_name || 'Usuario'}</p>
                  <p className="text-xs text-muted-foreground truncate">{formatRole(user?.role)}</p>
                </div>
                <div className="p-1.5">
                  <button onClick={() => navigate('/perfil')}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
                    <User size={16} className="text-muted-foreground" /> Mi perfil
                  </button>
                  <button onClick={toggleTheme}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
                    {theme === 'dark' ? <Sun size={16} className="text-muted-foreground" /> : <Moon size={16} className="text-muted-foreground" />}
                    {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                  </button>
                  <div className="border-t border-border my-1" />
                  {/* FIX logout mobile: onClick directo, no onPointerDown */}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors">
                    <LogOut size={16} /> Cerrar sesión
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="min-h-full flex flex-col">
            <div className="flex-1"><Outlet /></div>
            <footer className="mt-8 py-4 text-center text-xs text-muted-foreground border-t border-border">
              © 2026 Woditos V2.0 - Todos los derechos reservados.
            </footer>
          </div>
        </div>

        {/* Banner flotante mobile */}
        {!mobileBannerDismissed && (
          <div className="md:hidden fixed bottom-[68px] right-3 z-40">
            <NextSessionBanner variant="mobile-float" onDismiss={() => setMobileBannerDismissed(true)} />
          </div>
        )}

        {/* Nav móvil inferior */}
        <nav className="md:hidden flex items-center justify-around border-t border-border bg-card py-2 shrink-0">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-1 px-1.5 text-[10px] font-medium transition-all ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}>
              <Icon size={19} />{label}
            </NavLink>
          ))}
          {/* Divisor visual */}
          <div className="w-px h-8 bg-border shrink-0" />
          {/* Rutinas — siempre visible */}
          <NavLink to="/rutinas"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-1 px-1.5 text-[10px] font-medium transition-all ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}>
            <ListChecks size={19} />Rutinas
          </NavLink>
          {/* Coach Panel — solo coaches */}
          {isCoach && (
            <NavLink to="/coach"
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-1 px-1.5 text-[10px] font-medium transition-all ${
                  isActive ? 'text-secondary' : 'text-muted-foreground'
                }`}>
              <Dumbbell size={19} />Coach
            </NavLink>
          )}
        </nav>
      </main>
    </div>
  );
}