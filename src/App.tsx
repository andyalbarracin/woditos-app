/**
 * Archivo: App.tsx
 * Ruta: src/App.tsx
 * Última modificación: 2026-04-10
 * Descripción: Punto de entrada de la app. Rutas, providers,
 *   OnboardingGuard y AppWithFeedback.
 *   v2.0: agrega rutas del módulo de rutinas (/rutinas/*).
 *   v2.1: agrega /sesion/:id para detalle de sesión de coaches.
 *   v2.2: agrega /mi-sesion/:id para detalle de sesión de miembros.
 *   v2.3: agrega rutas públicas /privacidad y /terminos.
 *   v2.4: fix OnboardingGuard — usaba !user como spinner eterno cuando
 *         fetchUserData fallaba silenciosamente. Ahora usa isLoading.
 */
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ThemeProvider } from '@/hooks/useTheme';
import AppLayout from '@/components/layout/AppLayout';

// Pages v1
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
import Support from '@/pages/Support';

// Pages v2 — Módulo de Rutinas
import Routines from '@/pages/Routines';
import RoutineDetail from '@/pages/RoutineDetail';
import RoutineBuilder from '@/components/routines/RoutineBuilder';

// Pages v2.1 — Detalle de sesión (coach)
import SessionDetail from '@/pages/SessionDetail';

// Pages v2.2 — Detalle de ejercicio librería + detalle sesión miembro
import LibraryExerciseDetail from '@/pages/LibraryExerciseDetail';
import MemberSessionDetail from '@/pages/MemberSessionDetail';

// Pages v2.3 — Legales (públicas)
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfUse from '@/pages/TermsOfUse';
import Plans from '@/pages/Plans';


// Feedback modal
import SessionFeedbackModal from '@/components/SessionFeedbackModal';
import { useSessionFeedback } from '@/hooks/useSessionFeedback';

// ── Spinner compartido ────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

// ── Guards ────────────────────────────────────────────────────

function ProtectedRoute() {
  const { session, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function OnboardingGuard() {
  const { user, clubMembership, isLoading } = useAuth();

  // Mostrar spinner SOLO mientras la sesión está cargando.
  // Antes usaba !user como condición del spinner, lo que causaba
  // un loop eterno si fetchUserData tardaba o fallaba silenciosamente.
  if (isLoading) return <Spinner />;

  // Si no hay user después de cargar → redirigir a login
  if (!user) return <Navigate to="/login" replace />;

  // Si hay user pero no tiene club → onboarding
  if (!clubMembership) return <Navigate to="/onboarding" replace />;

  return <Outlet />;
}

function CoachRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  const role = user?.role as string | undefined;
  const isCoach = role === 'coach' || role === 'super_admin' || role === 'club_admin';
  if (!isCoach) return <Navigate to="/inicio" replace />;
  return <>{children}</>;
}

// ── Wrappers ──────────────────────────────────────────────────

function RoutineBuilderEdit() {
  const { id } = useParams<{ id: string }>();
  return <RoutineBuilder routineId={id} />;
}

function AppWithFeedback() {
  const { user } = useAuth();
  const { pending, dismiss } = useSessionFeedback();
  const role = user?.role as string | undefined;
  if (role !== 'member' || !pending) return null;
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

// ── App ───────────────────────────────────────────────────────

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
                {/* ── Rutas públicas ── */}
                <Route path="/login"          element={<Login />} />
                <Route path="/register"       element={<Register />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/privacidad"     element={<PrivacyPolicy />} />
                <Route path="/terminos"       element={<TermsOfUse />} />

                {/* ── Rutas protegidas ── */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/onboarding" element={<Onboarding />} />

                  <Route element={<OnboardingGuard />}>
                    <Route element={<AppLayout />}>

                      {/* v1.0 */}
                      <Route path="/"          element={<Navigate to="/inicio" replace />} />
                      <Route path="/inicio"     element={<Dashboard />} />
                      <Route path="/agenda"     element={<Agenda />} />
                      <Route path="/comunidad"  element={<Community />} />
                      <Route path="/biblioteca" element={<Library />} />
                      <Route path="/biblioteca/ejercicio/:id" element={<ExerciseDetail />} />
                      <Route path="/biblioteca/libreria/:id"  element={<LibraryExerciseDetail />} />
                      <Route path="/biblioteca/nutricion/:id" element={<FoodDetail />} />
                      <Route path="/perfil"     element={<Profile />} />
                      <Route path="/asistencia" element={<Attendance />} />
                      <Route path="/coach"      element={<CoachRoute><CoachDashboard /></CoachRoute>} />
                      <Route path="/soporte"    element={<Support />} />
                      <Route path="/planes" element={<Plans />} />

                      {/* v2.0 — Rutinas */}
                      <Route path="/rutinas"            element={<Routines />} />
                      <Route path="/rutinas/nueva"      element={<CoachRoute><RoutineBuilder /></CoachRoute>} />
                      <Route path="/rutinas/:id"         element={<RoutineDetail />} />
                      <Route path="/rutinas/:id/editar" element={<CoachRoute><RoutineBuilderEdit /></CoachRoute>} />

                      {/* v2.1 — Detalle sesión coach */}
                      <Route path="/sesion/:id" element={<CoachRoute><SessionDetail /></CoachRoute>} />

                      {/* v2.2 — Detalle sesión miembro */}
                      <Route path="/mi-sesion/:id" element={<MemberSessionDetail />} />

                    </Route>
                  </Route>
                </Route>

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