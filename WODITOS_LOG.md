# WODITOS — LOG DE AVANCES
> Archivo de seguimiento técnico del proyecto. Última actualización: 2026-03-17.

---

## 🔍 AUDITORÍA HONESTA — Sesión 2026-03-09

### Contexto
Se solicitó una auditoría cruzada entre:
1. Lo que el AI reportó como "completado"
2. Lo que el prompt original requería
3. El estado **real y verificado** del código y la base de datos

---

## ✅ LO QUE SÍ EXISTE Y FUNCIONA

### Base de Datos (verificado via queries directas)
| Tabla | Registros | Estado |
|-------|-----------|--------|
| `users` | 5+ (Andy + dummies) | ✅ |
| `profiles` | 5+ | ✅ |
| `exercise_wiki` | 23 ejercicios | ✅ Bien poblado |
| `food_wiki` | 15 alimentos | ✅ Bien poblado |
| `sessions` | 13+ sesiones | ✅ Hay sesiones programadas |
| `stories` | 1+ activa | ⚠️ Pocas historias |
| `attendance` | 5+ registros | ✅ Toggle funcional (marcar/desmarcar) |
| `posts` | 6+ posts | ✅ |
| `groups` | 3+ grupos | ✅ |
| `notifications` | Activo | ✅ RLS corregido para coaches |

### Código (verificado via lectura de archivos)
| Feature | Archivo | Estado Real |
|---------|---------|-------------|
| Login con Google OAuth | `src/pages/Login.tsx` | ✅ |
| Sidebar con rol Coach | `src/components/layout/AppLayout.tsx` | ✅ `formatRole()` mapea `super_admin → "Coach"` |
| Rutas protegidas Coach | `src/App.tsx` con `CoachRoute` | ✅ |
| StoriesBar (Instagram-style) | `src/components/community/StoriesBar.tsx` | ✅ |
| Agenda con reservas + crear sesión | `src/pages/Agenda.tsx` | ✅ Botón crear sesión para coaches |
| Biblioteca con detalle | `src/pages/Library.tsx` + detalle | ✅ |
| Sistema de Asistencia | `src/pages/Attendance.tsx` | ✅ Toggle marcar/desmarcar, QR, notas |
| Perfil con QR + avatar upload | `src/pages/Profile.tsx` | ✅ Subida a bucket avatars + refresh global |
| Coach Dashboard | `src/pages/CoachDashboard.tsx` | ✅ Analíticas, usa CreateSessionDialog |
| Dashboard diferenciado | `src/pages/Dashboard.tsx` | ✅ Roles coach/member, crear sesión |
| Crear sesión (componente compartido) | `src/components/CreateSessionDialog.tsx` | ✅ Calendar picker, duración +/-15min, 24h |
| Notificaciones coach→asistentes | `src/pages/Attendance.tsx` | ✅ RLS corregido |
| Notificaciones reserva→coach | `Agenda.tsx` + `Dashboard.tsx` | ✅ |
| Validación/Sanitización | `src/lib/validation.ts` | ✅ Zod + sanitizeText |
| Footer copyright | `AppLayout.tsx`, `Login.tsx`, `Register.tsx` | ✅ "© 2026 Woditos" |

---

## 📋 RESUMEN DE ESTADO POR FASE DEL PROMPT

| Fase | Nombre | Estado |
|------|--------|--------|
| 0 | Auditoría total | ✅ |
| 1 | Estabilidad y documentación | ✅ |
| 2 | Roles y visibilidad | ✅ |
| 3 | Usuarios dummy + credenciales | ✅ Creados 4 usuarios |
| 4 | Comunidad y stories | ✅ Feed + StoriesBar |
| 5 | Perfiles y experiencia social | ✅ Avatar upload, analytics coach |
| 6 | Biblioteca y páginas de detalle | ✅ |
| 7 | Sistema de asistencia | ✅ Toggle marcar/desmarcar, crear miembros inline |
| 8 | Identidad única + QR | ✅ |
| 9 | Google Login | ✅ |
| 10 | UI/UX/Branding | ✅ Paleta, footer, 24h format |
| 11 | Validación final | ⚠️ Pendiente testing exhaustivo |

---

## 🗓️ HISTORIAL DE SESIONES

### Sesión 1 (~2026-03-08)
**Lo que se hizo:** Estructura base, stories, biblioteca, asistencia, QR, OAuth, documentación.

### Sesión 2 (2026-03-09)
**Lo que se hizo:** Auditoría cruzada, creación de WODITOS_LOG.md.

### Sesión 3 (2026-03-09)
**Lo que se hizo:** Usuarios dummy (4 auth users + profiles + memberships + posts + stories + attendance).

### Sesión 4 (2026-03-12)
**Lo que se hizo:**
- Seguridad: `src/lib/validation.ts` con Zod (sanitizeText, schemas)
- Documentación SaaS: `docs/SAAS_TIERS.md`, `docs/SECURITY.md`, `docs/ARCHITECTURE.md`
- Footer copyright en toda la app
- Dashboard diferenciado por rol (coach ve analytics, member ve sesiones)
- Notificaciones al coach cuando un miembro reserva
- Asistencia: toggle marcar/desmarcar (delete on re-click)
- Avatar upload con refresh global (bucket `avatars`)
- Perfil coach con analytics (alumnos, sesiones, asistencia)
- Crear miembros inline desde asistencia

### Sesión 5 (2026-03-13)
**Lo que se hizo:**
- Fix nombres en Coach Panel (join profiles en reservations query)
- Fix avatar sync (refreshUserData en useAuth)
- Fix attendance toggle: RLS policy `attendance_delete` para coaches
- Fix attendance en CoachDashboard: toggle con delete

### Sesión 6 (2026-03-16)
**Lo que se hizo:**
- **Fix envío de mensajes a asistentes:** RLS de `notifications` tenía política `ALL` con `user_id = auth.uid()`, bloqueando inserts de coaches para otros usuarios. Se separó en políticas granulares (SELECT/UPDATE/DELETE own + INSERT para coaches a cualquier user).
- **Componente CreateSessionDialog:** Nuevo componente reutilizable (`src/components/CreateSessionDialog.tsx`) usado en Agenda, Dashboard y Attendance. Features:
  - Calendar picker (react-day-picker) para selección de fecha
  - Hora de inicio con input time 24h (sin AM/PM)
  - Duración con botones +/- 15 minutos y label "hasta las XXhs"
  - Crear crew inline
  - Sanitización de inputs
- **Botón "Crear sesión" en Agenda:** Visible para coaches, tanto en el header como cuando no hay sesiones el día seleccionado.
- **Botón "Crear sesión" en Dashboard:** Cuando el coach no tiene sesiones próximas.
- **Refactor:** CoachDashboard y Attendance ahora usan el componente compartido CreateSessionDialog, eliminando duplicación de código (~300 líneas menos).

### Sesión 7 (2026-03-17)
**Lo que se hizo:**
- **Fix formato 24h real en modal de sesión:** se reemplazó el input nativo de hora por selectores de hora/minutos (00-23 / 00-15-30-45) para eliminar AM/PM en todos los dispositivos.
- **Fix re-reserva en Agenda:** al volver a reservar una sesión cancelada, ahora se reactiva la reserva existente (`reservation_status = confirmed`, `cancelled_at = null`) en lugar de fallar por conflicto de registro previo.
- **Fix Stories en negro + UX estilo Instagram:**
  - viewer con contenedor **9:16**
  - render de imagen/video según extensión
  - eliminación de fallback externo
  - pausa del avance automático al mantener presionado
  - swipe horizontal para cambiar de usuario de story

---

## 🔐 CREDENCIALES DE ACCESO

### Usuario Real
| Email | Password | Rol | Notas |
|-------|----------|-----|-------|
| figo.albarra@gmail.com | (contraseña del dueño) | super_admin / Coach | Dueño del proyecto |

### Usuarios Dummy (✅ CREADOS 2026-03-09)
| Email | Password | Rol | Estado |
|-------|----------|-----|--------|
| coach@woditos.app | Woditos2024! | coach | ✅ Activo |
| maria@woditos.app | Woditos2024! | member | ✅ Activo |
| juan@woditos.app | Woditos2024! | member | ✅ Activo |
| sofia@woditos.app | Woditos2024! | member | ✅ Activo |

---

## 🗺️ ARQUITECTURA ACTUAL

```
src/
├── App.tsx                    ← Router + Guards (ProtectedRoute, PublicRoute, CoachRoute)
├── index.css                  ← Design tokens (HSL), paleta, gradientes
├── pages/
│   ├── Login.tsx              ← Email/pass + Google OAuth ✅
│   ├── Register.tsx           ← Registro básico ✅
│   ├── Dashboard.tsx          ← Home diferenciado coach/member + crear sesión ✅
│   ├── Agenda.tsx             ← Calendario semanal + reservas + crear sesión ✅
│   ├── Community.tsx          ← Feed + StoriesBar + composer ✅
│   ├── Library.tsx            ← Búsqueda ejercicios/alimentos ✅
│   ├── ExerciseDetail.tsx     ← Detalle ejercicio + MuscleDiagram ✅
│   ├── FoodDetail.tsx         ← Detalle alimento ✅
│   ├── Profile.tsx            ← Perfil + QR + stats + avatar upload ✅
│   ├── CoachDashboard.tsx     ← Panel coach + analíticas + crear sesión ✅
│   └── Attendance.tsx         ← Asistencia + toggle + crear miembros ✅
├── components/
│   ├── CreateSessionDialog.tsx ← Modal crear sesión (calendar, +/-15min) ✅ NUEVO
│   ├── layout/AppLayout.tsx   ← Sidebar desktop + nav móvil + footer ✅
│   ├── community/StoriesBar.tsx ← Stories Instagram-style ✅
│   └── library/MuscleDiagram.tsx ← SVG muscular interactivo ✅
├── lib/
│   ├── validation.ts          ← Zod schemas + sanitizeText ✅
│   └── utils.ts               ← cn() helper ✅
└── hooks/
    ├── useAuth.tsx            ← Auth + perfil + refreshUserData ✅
    └── useTheme.tsx           ← Toggle dark/light ✅
```

---

## 📊 MODELO SAAS (documentado en docs/SAAS_TIERS.md)

| Tier | Usuarios | Estado |
|------|----------|--------|
| Free | 1-5 | Funcional (actual) |
| Pro | 6-22 | Documentado, pendiente integración |
| Team | 23-50 | Documentado |
| Enterprise | 50-999 | Documentado |

Integración de pagos: RevenueCat (pendiente).

---

## 🚀 PRÓXIMOS PASOS

1. **Testing E2E:** Probar flujos completos con usuarios dummy (coach + member)
2. **Push notifications reales:** Web Push API + Edge Functions
3. **Emails transaccionales:** Confirmación de reserva, recordatorio de sesión
4. **Multi-tenancy:** Tabla `organizations` + `subscriptions` para SaaS
5. **Leaderboard:** Ranking de asistencia/racha por crew
6. **Exportar asistencia a PDF**
7. **Integración RevenueCat** para pagos

---

*LOG mantenido manualmente. Actualizar al inicio/fin de cada sesión de trabajo.*

# WODITOS — LOG DE AVANCES
> Última actualización: 2026-03-28

---

## ✅ ESTADO ACTUAL — TODO LO IMPLEMENTADO

### Base de Datos

| Tabla | Estado |
|-------|--------|
| `users` | ✅ Con 6 usuarios (Andy + 5 dummies) |
| `profiles` | ✅ Con avatares, goals, join_date |
| `clubs` | ✅ Club "Crew Woditos" + sistema multi-club |
| `club_memberships` | ✅ Todos los usuarios asignados al club inicial |
| `groups` | ✅ 3+ grupos (Palermo Runners, Funcional Belgrano, Costanera Sur) |
| `group_memberships` | ✅ |
| `sessions` | ✅ 10+ sesiones con club_id asignado |
| `reservations` | ✅ |
| `attendance` | ✅ UNIQUE(session_id, user_id) |
| `posts` | ✅ 6+ posts dummy |
| `comments` | ✅ |
| `reactions` | ✅ |
| `stories` | ✅ |
| `notifications` | ✅ RLS con policy separada para coaches |
| `achievements` | ✅ |
| `coach_notes` | ✅ |
| `exercise_wiki` | ✅ 23 ejercicios |
| `food_wiki` | ✅ 15 alimentos |
| `push_subscriptions` | ✅ |
| `coach_invites` | ✅ Con columna `club_id`, RLS permite coaches |
| `session_feedback` | ✅ UNIQUE(session_id, user_id), RLS completo |

### SQL aplicado (acumulado)
```sql
-- Políticas RLS notifications
CREATE POLICY "notifications_insert_for_others" ON public.notifications
  FOR INSERT WITH CHECK (get_my_role() = ANY(ARRAY['super_admin','coach','club_admin']));

-- session_feedback tabla
CREATE TABLE public.session_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  discomforts text[] DEFAULT '{}',
  note text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, user_id)
);
ALTER TABLE public.session_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feedback_insert_own" ON public.session_feedback FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "feedback_select_own" ON public.session_feedback FOR SELECT USING (user_id = auth.uid() OR get_my_role() = ANY(ARRAY['super_admin','coach','club_admin']));
CREATE POLICY "feedback_update_own" ON public.session_feedback FOR UPDATE USING (user_id = auth.uid());

-- coach_invites: permitir a coaches
DROP POLICY IF EXISTS "coach_invites_insert" ON public.coach_invites;
CREATE POLICY "coach_invites_insert" ON public.coach_invites FOR INSERT WITH CHECK (get_my_role() = ANY(ARRAY['super_admin','coach','club_admin']));
DROP POLICY IF EXISTS "coach_invites_select" ON public.coach_invites;
CREATE POLICY "coach_invites_select" ON public.coach_invites FOR SELECT USING (created_by = auth.uid() OR get_my_role() = 'super_admin');

-- club_id en coach_invites (si no existe)
ALTER TABLE public.coach_invites ADD COLUMN IF NOT EXISTS club_id uuid REFERENCES public.clubs(id);

-- sessions RLS (actualización sin coach del mismo club)
-- (aplicado en sesiones anteriores)

-- attendance RLS delete para coaches
-- (aplicado en sesiones anteriores)
```

---

## 🗓️ HISTORIAL DE SESIONES

### Sesiones 1-7 (hasta 2026-03-17)
Ver log anterior. Resumen: estructura base, stories, biblioteca, asistencia, QR, OAuth, usuarios dummy, validación Zod, CreateSessionDialog, formato 24h, re-reserva fix.

### Sesión 8 (2026-03-27)
**Implementado:**
- Club badge en header (izq: próxima sesión | centro: club | der: campana)
- Tab "Hoy" del Coach Panel con calendario + detalle del día en 2 columnas
- RLS sessions_update (tomar sesiones sin coach del mismo club)
- RLS attendance_delete
- CreateSessionDialog: club_id + validación fecha pasada + días pasados deshabilitados
- Foto de perfil 20MB + bucket avatars SQL
- Flujo de registro con Club (3 pasos)
- SQL clubs, club_memberships, migración de datos
- SessionFeedbackModal + useSessionFeedback + integración en App.tsx
- SQL session_feedback
- Profile.tsx con insights del miembro (6 cards)
- Dashboard modularizado: CoachDashboardView + MemberDashboardView + orquestador
- NextSessionBanner fix (filtra sesiones futuras para miembros)
- Sesiones disponibles con nombre del coach, horario hasta, barra de progreso de lugares
- Queries separadas para coach sin límite global de 10
- vercel.json con rewrites SPA + cache headers
- Branch cleanup y backup-v1.0

### Sesión 9 (2026-03-28)
**Implementado:**
- **Fix Vercel:** Variables de entorno faltaban en el nuevo proyecto → app conectaba a Supabase viejo
- **Sidebar colapsable** en AppLayout.tsx:
  - Toggle con ícono Menu
  - Colapsado: `w-[72px]`, íconos 24px, height 52px, centrados, tooltips
  - Expandido: `w-64` con íconos + labels
  - Usa CSS inline para garantizar tamaños (no sobreescrito por Tailwind)
  - Sigue tema global (`bg-card`, no navy fijo)
- **Login fix:** `h-screen overflow-hidden` + columna formulario `overflow-y-auto` → elimina scroll no deseado. Copyright dentro del flujo del formulario
- **Register fix:**
  - Toast de email inválido aparece en paso de cuenta (no en paso club)
  - Mensaje específico si email ya registrado
  - Campo de token de invitación manual para coaches
  - Footer dentro del flujo, no absoluto
- **Agenda:** sesiones pasadas muestran "Cerrada" / "Completada" / badge "Finalizada". `isPast = new Date(s.end_time) < new Date()`
- **SessionFeedbackModal:**
  - Al **enviar**: elimina la notificación (no vuelve a aparecer)
  - Al **omitir**: marca como leída (puede reabrirse desde campana)
  - Usa `upsert` en lugar de `insert` para manejar feedback duplicado
- **NotificationsBell:**
  - Click en notificación `session_feedback` reabre `SessionFeedbackModal`
  - Estado `feedbackTarget` gestiona el modal dentro de la campana
- **CoachDashboardView:**
  - Fix: `setClaimingSessionId(null)` en `onSuccess` del claimMutation
  - Invalida `next-session` query al tomar sesión → banner se actualiza sin recargar
- **InviteCoach:**
  - Disponible para todos los coaches (no solo super_admin)
  - Genera invitaciones con el `club_id` del coach que las crea
  - Muestra nombre del club en el banner informativo
  - Lista solo las invitaciones creadas por el usuario actual
- **CoachDashboard:** tab "Invitar Coach" visible para todos los coaches
- **RLS notifications:** policy `notifications_insert_for_others` para coaches
- **App.tsx:** ProtectedRoute y CoachRoute definidos en el mismo archivo, Outlet importado

---

## 🚀 PRÓXIMOS PASOS

### Alta prioridad
- [ ] **Panel de gestión del Club** — ver/editar join_code, cambiar plan, listar miembros del club
- [ ] **Unclaim/delete sesiones desde CoachDashboard** — alert de confirmación, notificación a inscriptos, solo el creador puede eliminar

### Media prioridad
- [ ] CoachDashboard modularización (si supera 600 líneas al agregar unclaim/delete)
- [ ] Leaderboard de asistencia
- [ ] Exportar asistencia CSV

### Infraestructura futura
- [ ] RevenueCat billing
- [ ] Multi-tenancy (tabla `organizations`)
- [ ] Push notifications server-side
- [ ] Emails transaccionales

---

## 📊 CRÉDENCIALES ACTUALIZADAS

| Email | Password | Rol |
|-------|----------|-----|
| figo.albarra@gmail.com | (personal) | super_admin |
| coach@woditos.app | Coach2026! | coach |
| maria@woditos.app | Woditos2026! | member |
| juan@woditos.app | Woditos2026! | member |
| sofia@woditos.app | Woditos2026! | member |
| test@woditos.app | 123456 | member |