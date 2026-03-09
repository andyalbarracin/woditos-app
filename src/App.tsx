/**
 * Archivo: App.tsx
 * Ruta: src/App.tsx
 * Última modificación: 2025-03-09
 * Descripción: Componente raíz de la aplicación. Configura los providers globales
 *              (React Query, Router, Auth, Theme, Tooltip, Toast) y define el árbol
 *              de rutas protegidas y públicas.
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import AppLayout from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Agenda from "@/pages/Agenda";
import Community from "@/pages/Community";
import Library from "@/pages/Library";
import ProfilePage from "@/pages/Profile";
import CoachDashboard from "@/pages/CoachDashboard";
import AttendancePage from "@/pages/Attendance";
import ExerciseDetail from "@/pages/ExerciseDetail";
import FoodDetail from "@/pages/FoodDetail";
import NotFound from "@/pages/NotFound";

/**
 * Cliente de React Query con configuración global:
 * - staleTime: 2 minutos antes de revalidar datos en segundo plano
 * - retry: 1 reintento en caso de error
 */
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 2, retry: 1 } },
});

/**
 * Guard para rutas protegidas.
 * Redirige a /login si no hay sesión activa.
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/**
 * Guard para rutas públicas (login, register).
 * Redirige al dashboard si ya hay sesión activa.
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (session) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/**
 * Guard específico para rutas de Coach (coach + super_admin).
 * Redirige al inicio si el usuario no tiene el rol adecuado.
 */
function CoachRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  const isCoach = user?.role === 'coach' || user?.role === 'super_admin';
  if (!isCoach) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Rutas públicas */}
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

              {/* Rutas protegidas (requieren sesión) */}
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/agenda" element={<Agenda />} />
                <Route path="/comunidad" element={<Community />} />
                <Route path="/biblioteca" element={<Library />} />
                <Route path="/biblioteca/ejercicio/:id" element={<ExerciseDetail />} />
                <Route path="/biblioteca/nutricion/:id" element={<FoodDetail />} />
                <Route path="/perfil" element={<ProfilePage />} />

                {/* Rutas exclusivas de Coach */}
                <Route path="/coach" element={<CoachRoute><CoachDashboard /></CoachRoute>} />
                <Route path="/asistencia" element={<CoachRoute><AttendancePage /></CoachRoute>} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
