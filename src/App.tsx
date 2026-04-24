/**
 * Archivo: App.tsx
 * Ruta: src/App.tsx
 * Última modificación: 2026-04-14
 * Descripción: Punto de entrada de la app. Rutas, providers,
 *   OnboardingGuard y AppWithFeedback.
 *   v2.5: agrega ruta /miembro/:id para MemberProfileView (solo coaches).
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

// Pages v2.5 — Perfil de miembro para coach
import MemberProfileView from '@/pages/MemberProfileView';

// Pages v2.6 — Gestión de ejercicios
import ExerciseManager from '@/pages/ExerciseManager';

// Feedback modal
import SessionFeedbackModal from '@/components/SessionFeedbackModal';
import { useSessionFeedback } from '@/hooks/useSessionFeedback';

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function ProtectedRoute() {
  const { session, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function OnboardingGuard() {
  const { user, clubMembership, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
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
                      <Route path="/"           element={<Navigate to="/inicio" replace />} />
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
                      <Route path="/planes"     element={<Plans />} />

                      {/* v2.0 — Rutinas */}
                      <Route path="/rutinas"             element={<Routines />} />
                      <Route path="/rutinas/nueva"       element={<CoachRoute><RoutineBuilder /></CoachRoute>} />
                      <Route path="/rutinas/:id"          element={<RoutineDetail />} />
                      <Route path="/rutinas/:id/editar"  element={<CoachRoute><RoutineBuilderEdit /></CoachRoute>} />

                      {/* v2.1 — Detalle sesión coach */}
                      <Route path="/sesion/:id"    element={<CoachRoute><SessionDetail /></CoachRoute>} />

                      {/* v2.2 — Detalle sesión miembro */}
                      <Route path="/mi-sesion/:id" element={<MemberSessionDetail />} />

                      {/* v2.5 — Perfil de miembro (vista coach) */}
                      <Route path="/miembro/:id"   element={<CoachRoute><MemberProfileView /></CoachRoute>} />

                      {/* v2.6 — Gestión de ejercicios */}
                      <Route path="/ejercicios"    element={<CoachRoute><ExerciseManager /></CoachRoute>} />

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