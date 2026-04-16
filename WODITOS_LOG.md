# WODITOS — LOG DE AVANCES
> Última actualización: 2026-04-14

---

## ✅ ESTADO ACTUAL — TODO LO IMPLEMENTADO

### Base de Datos

| Tabla | Estado |
|-------|--------|
| `users` | ✅ 10+ usuarios (Andy + dummies + reales) |
| `profiles` | ✅ Con avatares, goals, join_date |
| `clubs` | ✅ Crew Woditos + Club Test + otros reales |
| `club_memberships` | ✅ RLS completo, 7 policies |
| `groups` | ✅ |
| `sessions` | ✅ Con start_time (no date), coach_id, created_by |
| `reservations` | ✅ |
| `attendance` | ✅ UNIQUE(session_id, user_id) |
| `posts` | ✅ |
| `comments` / `reactions` / `stories` | ✅ |
| `notifications` | ✅ RLS con INSERT para coaches a otros users |
| `achievements` | ✅ |
| `coach_notes` | ✅ |
| `exercise_wiki` | ✅ |
| `food_wiki` | ✅ |
| `coach_invites` | ✅ Con club_id, RLS coaches |
| `session_feedback` | ✅ UNIQUE(session_id, user_id), upsert |
| `routines` | ✅ RLS 4 policies |
| `routine_exercises` | ✅ RLS 2 policies |
| `routine_assignments` | ✅ RLS 3 policies |
| `routine_results` | ✅ RLS 2 policies |
| `exercise_library` | ✅ ~870 ejercicios, instrucciones ES, RLS 7 policies |
| `personal_records` | ✅ RLS 2 policies |
| `clubs.plan` | ✅ free / pro / pro_plus |

### Ramas Git activas

| Rama | Propósito |
|------|-----------|
| `main` | Desarrollo activo — Vercel auto-deploy |
| `prod` | Producción estable |
| `beta_v2` | Beta pública |
| `backup-v2.0` | Snapshot v2.0 |
| `backup-v1.0` | Snapshot histórico v1.0 (no tocar) |
| `beta_v1` | Histórico v1 (no tocar) |

---

## 🗓️ HISTORIAL DE SESIONES

### Sesiones 1–7 (hasta 2026-03-17)
Estructura base, stories, biblioteca, asistencia, QR, OAuth, usuarios dummy, validación Zod, CreateSessionDialog, formato 24h, re-reserva fix.

### Sesión 8 (2026-03-27)
Club badge en header, tab "Hoy" Coach Panel, RLS sessions_update, foto perfil 20MB, registro con Club 3 pasos, SessionFeedbackModal, Profile insights, Dashboard modularizado, NextSessionBanner fix, vercel.json rewrites.

### Sesión 9 (2026-03-28)
Fix Vercel env vars, sidebar colapsable desktop, Login fix scroll, Register fixes (toast email inválido, token invitación), Agenda sesiones pasadas "Cerrada", SessionFeedbackModal (elimina notif al enviar, upsert), NotificationsBell reabre modal feedback, InviteCoach para todos los coaches con club_id.

### Sesión 10 (2026-04-08) — Seguridad + Legal
**Implementado:**
- `src/lib/validation.ts`: schemas Zod reforzados, sanitizeText en todos los inputs
- Auditoría RLS: policies granulares en todas las tablas v1
- `vercel.json`: security headers (CSP, X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy)
- `PrivacyPolicy.tsx` + `TermsOfUse.tsx`: páginas legales completas (Ley 25.326 Argentina)
- `Login.tsx` + `Register.tsx` + `Support.tsx`: links a páginas legales
- `App.tsx`: rutas públicas `/privacidad` y `/terminos`
- `Plans.tsx`: página de planes en `/planes` con tiers beta y nota "Plan Pro gratis"
- Club badge en header desktop clickeable → `/planes`
- `Register.tsx` v2: 4 pasos (rol, perfil, objetivos, club) con `GoalSelector` visual (tarjetas con íconos)

### Sesión 11 (2026-04-09) — Rutinas v2.0
**Implementado:**
- Módulo completo de rutinas:
  - `RoutineBuilder.tsx`: creador/editor de rutinas. Fix edit mode (TanStack Query v5: `onSuccess` deprecado → `useEffect`)
  - `RoutineDetail.tsx`: vista detalle de rutina con ejercicios
  - `RoutineLogModal.tsx`: modal para registrar resultado (feeling, RPE, tiempo, log por ejercicio)
  - `RoutinesTab.tsx`: tab en CoachDashboard con chips de sesión asignada
  - `Routines.tsx`: página principal, vista coach + vista alumno con tabs Pendientes/Historial
- Exercise picker migrado a `free-exercise-db` (~870 ejercicios, sin API key)
  - CDN: `https://yuhonas.github.io/free-exercise-db/`
  - IDs URL-safe: reemplaza caracteres no alfanuméricos por guiones (fix `3/4 sit-up` → 404)
- `exerciseTranslations.ts`: ~870 ejercicios con traducción nombre por nombre + fallback word-by-word
- SQL: tablas `routines`, `routine_exercises`, `routine_assignments`, `routine_results` con RLS
- SQL: tabla `exercise_library` con `instructions text[]`, `is_global boolean`, ~870 ejercicios importados

### Sesión 12 (2026-04-10) — SessionDetail + Library + Sidebar
**Implementado:**
- `SessionDetail.tsx`: página `/sesion/:id` con 3 tabs: Asistencia, Rutinas asignadas, Notas del coach
- `Agenda.tsx`: tarjetas de sesión clickeables para coaches (navegan a `/sesion/:id`)
- `Library.tsx`: tab "Librería" integrado a la Wiki
- `LibraryExerciseDetail.tsx`: `/biblioteca/libreria/:id` — detalla ejercicio con imágenes y instrucciones ES
  - Detecta si ID es UUID (exercise_library DB) o CDN (fex-...)
  - Badge "✓ Instrucciones en español" cuando viene de DB
- `AppLayout.tsx` v2.0–v2.3: sidebar actualizado (Rutinas visible para todos, separadores por rol)
- `CoachDashboard.tsx`: tab Rutinas + botón "Nueva Rutina"
- `useExerciseDB.ts`: hooks `useExerciseLibraryItem`, `useExerciseLibrary`, `useExerciseLibraryPopulated`

### Sesión 13 (2026-04-12) — Seguridad datos + Fixes
**Implementado:**
- `MemberDashboardView.tsx`: upcomingSessions filtrada por coaches del mismo club (2 pasos)
- `CoachDashboard.tsx`: allSessions y allAttendance filtradas por coach_id (antes exponía todos los clubs)
- `Attendance.tsx` v2.3: monthSessions, daySessions y groups filtrados por clubCoachIds compartida. Rate limiting en comunicados (useRateLimit, 3 cada 5 minutos)
- `useRateLimit.ts`: hook de rate limiting cliente-side con countdown
- `sanitizeText` aplicado en todos los inputs de texto libre
- `Plans.tsx` con badge "Tu plan actual" y CTA para coaches fundadores beta

### Sesión 14 (2026-04-12) — AppLayout v2.4 + Login fix
**Implementado:**
- `AppLayout.tsx` v2.4:
  - Sidebar corregido por rol: Miembro → navItems + Rutinas / Coach → navItems + Rutinas + Coach Panel + Sesiones
  - Fix logout mobile: `onPointerDown` en botón del Popover
  - Fix logout race condition: `navigate('/login', { replace: true })` en try/finally
  - Club badge mobile: `max-w` reducido, flecha ↑ con `shrink-0` siempre visible
  - Logo (desktop y mobile) navega a home con `<NavLink to="/">`
- `Routines.tsx` v2.3: usa `RoutineLogModal` en lugar de `RoutineFeedbackModal` para "Completar"
- `RoutineLogModal.tsx`: pasa `assignmentId` y `assignedBy` para notificar al coach al completar
- `Profile.tsx`: sección "Completaciones de Rutinas" en actividad del miembro

### Sesión 15 (2026-04-13) — Mobile fixes
**Implementado:**
- `LibraryExerciseDetail.tsx`: fix imágenes mobile — `flex flex-col sm:flex-row` + `style={{ height: '260px' }}` inline para evitar conflictos CSS en Safari/Brave iOS
- `AppLayout.tsx` v2.5: club badge mobile con `max-w-[56px]` y flecha ↑ `shrink-0`; logo navega a home
- Supabase Security Advisor: SQL `SET search_path TO 'public'` en 6 funciones SECURITY DEFINER
- Leaked Password Protection: habilitado en Supabase Dashboard
- SQL passwords test accounts: `coach@woditos.app` y `test-coach@woditos.app` → `Woditos2026!`
- SQL membership: `coach@woditos.app` movido de Crew Woditos → Club Test

### Sesión 16 (2026-04-14) — Login bug fix (useAuth)
**Implementado:**
- `useAuth.tsx` v1.4: fix login colgado en "Entrando..."
  - Root cause: `onAuthStateChange` era `async` y hacía `await fetchUserData()`. Supabase JS v2 procesa eventos en cola secuencial → `signInWithPassword` quedaba bloqueado esperando que `INITIAL_SESSION` terminara
  - Fix: callback `onAuthStateChange` ahora es NO-async. `fetchUserData` se llama fire-and-forget con `.finally(() => setIsLoading(false))`
  - Fix form reset en primer intento: `signIn()` ahora llama `await fetchUserData(data.user.id)` directamente antes de resolver → cuando `navigate('/')` dispara, `user/profile/clubMembership` ya están cargados → `ProtectedRoute` no redirige de vuelta a `/login`

---

## 🔐 CREDENCIALES DE ACCESO

### Usuario Real (dueño del proyecto)
| Email | Rol |
|-------|-----|
| figo.albarra@gmail.com | super_admin |

### Usuarios de Prueba
| Email | Password | Rol | Club |
|-------|----------|-----|------|
| coach@woditos.app | Woditos2026! | coach | Club Test |
| test-coach@woditos.app | Woditos2026! | coach | Club Test |
| maria@woditos.app | Woditos2026! | member | Crew Woditos |
| juan@woditos.app | Woditos2026! | member | Crew Woditos |
| sofia@woditos.app | Woditos2026! | member | Crew Woditos |

### Códigos de Club
| Club | Código |
|------|--------|
| Crew Woditos | C10168 |
| Club Test | 6BBE3B |

---

## 🗺️ ARQUITECTURA ACTUAL

```
src/
├── App.tsx                        ← Router + Guards + rutas públicas legales
├── pages/
│   ├── Login.tsx                  ✅ Email/pass + Google OAuth + usuarios prueba
│   ├── Register.tsx               ✅ 4 pasos con GoalSelector visual
│   ├── Onboarding.tsx             ✅ Pantalla post-registro para vincular club
│   ├── Dashboard.tsx              ✅ Home diferenciado coach/member
│   ├── Agenda.tsx                 ✅ Semana + reservas + cards clickeables coaches
│   ├── SessionDetail.tsx          ✅ /sesion/:id — Asistencia/Rutinas/Notas tabs
│   ├── Attendance.tsx             ✅ Control asistencia + QR + rate limiting
│   ├── CoachDashboard.tsx         ✅ 5 tabs: Agenda/Miembros/Analytics/Rutinas/Invitar
│   ├── Routines.tsx               ✅ Coach: lista+asigna / Alumno: pendientes+historial
│   ├── Plans.tsx                  ✅ /planes — tiers + beta badge
│   ├── Community.tsx              ✅ Feed + StoriesBar
│   ├── Library.tsx                ✅ Wiki + tab Librería ejercicios
│   ├── LibraryExerciseDetail.tsx  ✅ Detalle ejercicio con imágenes + instrucciones ES
│   ├── Profile.tsx                ✅ QR + avatar + stats + actividad + rutinas
│   ├── ResetPassword.tsx          ✅ Flujo 3 fases reset contraseña
│   ├── Support.tsx                ✅ Centro de ayuda completo v2
│   ├── PrivacyPolicy.tsx          ✅ Ley 25.326 Argentina
│   └── TermsOfUse.tsx             ✅
├── components/
│   ├── layout/AppLayout.tsx       ✅ v2.5 sidebar + mobile nav + logo home
│   ├── routines/
│   │   ├── RoutineBuilder.tsx     ✅ Creador/editor con exercise picker
│   │   ├── RoutineDetail.tsx      ✅ Vista detalle + RoutineLogModal
│   │   ├── RoutineLogModal.tsx    ✅ Registra resultado + notifica coach
│   │   └── RoutinesTab.tsx        ✅ Tab en CoachDashboard con chips sesión
│   ├── dashboard/
│   │   ├── CoachDashboardView.tsx ✅
│   │   ├── MemberDashboardView.tsx ✅ Sesiones filtradas por club
│   │   ├── FeedbackAnalytics.tsx  ✅
│   │   └── FeedbackHistory.tsx    ✅
│   ├── CreateSessionDialog.tsx    ✅ Modal crear sesión compartido
│   ├── NotificationsBell.tsx      ✅ Reabre SessionFeedbackModal
│   ├── NextSessionBanner.tsx      ✅ Float mobile + desktop banner
│   ├── SessionFeedbackModal.tsx   ✅ Upsert, elimina notif al enviar
│   ├── InviteCoach.tsx            ✅ Para todos los coaches
│   └── community/StoriesBar.tsx   ✅
├── hooks/
│   ├── useAuth.tsx                ✅ v1.4 — callback no-async, signIn awaita fetchUserData
│   ├── useExerciseDB.ts           ✅ CDN + exercise_library hooks
│   ├── useRateLimit.ts            ✅ Rate limiting cliente-side
│   └── useTheme.tsx               ✅
├── lib/
│   ├── validation.ts              ✅ Zod schemas + sanitizeText
│   ├── exerciseTranslations.ts    ✅ ~870 ejercicios ES + word-by-word fallback
│   └── queryClient.ts             ✅
└── integrations/supabase/client.ts ✅ Navigator Locks bypass para Vite HMR
```

---

## 🔧 PATRONES Y GOTCHAS DOCUMENTADOS

| Problema | Solución |
|----------|----------|
| TanStack Query v5: `onSuccess` en `useQuery` deprecado | Usar `useEffect` watching query data |
| Supabase FK join `sessions.coach_id → users` | Sintaxis: `users!coach_id(profiles(full_name))` |
| `club_admin` no existe en TypeScript union | Usar `const role = user?.role as string` |
| RLS clubs SELECT: nuevo club sin membership | Agregar `owner_id = auth.uid()` a SELECT policy |
| Recharts Tooltip vs shadcn Tooltip | Alias: `import { Tooltip as RechartsTooltip }` |
| Nuevas RPC functions sin tipos | `(supabase.rpc as any)('name', params)` |
| Tailwind specificity en sidebar icons | Usar `style={{}}` inline |
| PostgREST `.order()` en tabla referenciada | Ordenar client-side con `useMemo` |
| `useMemo` import incorrecto | Siempre de `'react'`, no de TanStack |
| `session_feedback` upsert | `onConflict: 'session_id,user_id'` |
| Notifications INSERT para coaches | Policy separada: `role IN ('coach', 'super_admin', 'club_admin')` |
| Exercise IDs con `/` → 404 | Reemplazar non-alphanumeric con guiones |
| Vercel env vars perdidas | Re-agregar manualmente al recrear proyecto |
| Login colgado "Entrando..." | `onAuthStateChange` callback NO-async + `signIn` awaita `fetchUserData` |
| Form reset en primer intento de login | `signIn` awaita `fetchUserData` antes de resolver → datos listos para `navigate('/')` |
| Navigator Locks + Vite HMR | `lock: ((_name, _timeout, fn) => fn()) as any` en createClient |
| Imágenes mobile Safari/Brave | `style={{ height }}` inline en lugar de clases Tailwind para evitar purge/cache |
| `const db = supabase as any` | Para tablas v2 hasta regenerar tipos |

---

## 🚀 PENDIENTES

### Alta prioridad
- [ ] Panel de gestión del Club (`/club`) — ver/editar join_code, listar miembros, cambiar plan
- [ ] Regenerar tipos Supabase (eliminar `const db = supabase as any`)

### Media prioridad
- [ ] Instrucciones en español para ejercicios sin traducción aún (script de población `exercise_library`)
- [ ] Records Personales UI (`personal_records` ya en DB)
- [ ] Export CSV asistencia (papaparse ya instalado)
- [ ] IA para generar rutinas (Edge Function + OpenAI)

### Infraestructura futura
- [ ] RevenueCat billing
- [ ] Push notifications server-side
- [ ] Emails transaccionales (confirmación reserva, recordatorio sesión)