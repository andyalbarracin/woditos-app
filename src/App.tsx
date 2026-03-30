/**
 * Archivo: App.tsx
 * Ruta: src/App.tsx
 * Última modificación: 2026-03-30
 * Descripción: Punto de entrada de la app. Define rutas, providers,
 *   OnboardingGuard (redirige a /onboarding si no tiene club) y
 *   AppWithFeedback (modal post-sesión).
 */
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ThemeProvider } from '@/hooks/useTheme';
import AppLayout from '@/components/layout/AppLayout';

// Pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ResetPassword from '@/pages/ResetPassword';
import Onboarding from '@/pages/Onboarding';
import Dashboard from '@/pages/Dashboard';
import Agenda from '@/pages/Agenda';
import Community from '@/pages/Community';
import Library from '@/pages/Library';
import ExerciseDetail from '@/pages/ExerciseDetail';
import FoodDetail from '@/pages/FoodDetail';
import Profile from '@/pages/Profile';
import CoachDashboard from '@/pages/CoachDashboard';
import Attendance from '@/pages/Attendance';
import NotFound from '@/pages/NotFound';

// Feedback modal
import SessionFeedbackModal from '@/components/SessionFeedbackModal';
import { useSessionFeedback } from '@/hooks/useSessionFeedback';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function ProtectedRoute() {
  const { session, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/**
 * OnboardingGuard — se ubica entre ProtectedRoute y AppLayout.
 * Si el usuario está autenticado pero no tiene clubMembership,
 * lo redirige a /onboarding para completar su perfil.
 */
function OnboardingGuard() {
  const { user, clubMembership } = useAuth();

  /* user es null mientras fetchUserData todavía corre */
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!clubMembership) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

function CoachRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  const isCoach = user?.role === 'coach' || user?.role === 'super_admin';  if (!isCoach) return <Navigate to="/inicio" replace />;
  return <>{children}</>;
}

function AppWithFeedback() {
  const { user } = useAuth();
  const { pending, dismiss } = useSessionFeedback();

  if (user?.role !== 'member' || !pending) return null;

  return (
    <SessionFeedbackModal
      open={!!pending}
      onClose={dismiss}
      sessionId={pending.sessionId}
      sessionTitle={pending.sessionTitle}
      sessionLocation={pending.sessionLocation}
      notificationId={pending.notificationId}
    />
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <AppWithFeedback />

              <Routes>
                {/* Rutas públicas */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Rutas protegidas */}
                <Route element={<ProtectedRoute />}>
                  {/* Onboarding — accesible SIN club (fuera de OnboardingGuard) */}
                  <Route path="/onboarding" element={<Onboarding />} />

                  {/* App principal — requiere club */}
                  <Route element={<OnboardingGuard />}>
                    <Route element={<AppLayout />}>
                      <Route path="/" element={<Navigate to="/inicio" replace />} />
                      <Route path="/inicio" element={<Dashboard />} />
                      <Route path="/agenda" element={<Agenda />} />
                      <Route path="/comunidad" element={<Community />} />
                      <Route path="/biblioteca" element={<Library />} />
                      <Route path="/biblioteca/ejercicio/:id" element={<ExerciseDetail />} />
                      <Route path="/biblioteca/nutricion/:id" element={<FoodDetail />} />
                      <Route path="/perfil" element={<Profile />} />
                      <Route path="/asistencia" element={<Attendance />} />
                      <Route path="/coach" element={<CoachRoute><CoachDashboard /></CoachRoute>} />
                    </Route>
                  </Route>
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;