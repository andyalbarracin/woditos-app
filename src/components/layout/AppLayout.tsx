import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Home, Calendar, Users, BookOpen, User, LogOut, Bell, Dumbbell, Sun, Moon } from 'lucide-react';
import woditosLogo from '@/assets/woditos-logo.png';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';

const navItems = [
  { to: '/', icon: Home, label: 'Inicio' },
  { to: '/agenda', icon: Calendar, label: 'Agenda' },
  { to: '/comunidad', icon: Users, label: 'Comunidad' },
  { to: '/biblioteca', icon: BookOpen, label: 'Biblioteca' },
  { to: '/perfil', icon: User, label: 'Perfil' },
];

export default function AppLayout() {
  const { profile, user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isCoach = user?.role === 'coach' || user?.role === 'super_admin';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-sidebar">
        <div className="p-5 flex items-center gap-3">
          <img src={woditosLogo} alt="Woditos" className="h-9" />
          <span className="font-display font-bold text-lg text-foreground">Woditos</span>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          {isCoach && (
            <NavLink
              to="/coach"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'bg-secondary/10 text-secondary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`
              }
            >
              <Dumbbell size={18} />
              Coach Panel
            </NavLink>
          )}
        </nav>

        {/* Theme Toggle */}
        <div className="px-4 py-3 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
              <span>{theme === 'dark' ? 'Modo oscuro' : 'Modo claro'}</span>
            </div>
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
          </div>
        </div>

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
              <p className="text-xs text-muted-foreground truncate capitalize">{user?.role || 'member'}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-muted-foreground hover:text-destructive">
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar mobile */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-sidebar">
          <div className="flex items-center gap-2">
            <img src={woditosLogo} alt="Woditos" className="h-8" />
            <span className="font-display font-bold text-foreground">Woditos</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Bell size={20} />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>

        {/* Bottom nav mobile */}
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
        </nav>
      </main>
    </div>
  );
}
