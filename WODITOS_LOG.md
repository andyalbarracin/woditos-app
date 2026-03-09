# WODITOS — LOG DE AVANCES
> Archivo de seguimiento técnico del proyecto. Última actualización: 2026-03-09.

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
| `users` | 1 (Andy, super_admin) | ⚠️ Solo 1 usuario real — NO hay usuarios dummy creados |
| `profiles` | 1 | ⚠️ Solo perfil de Andy |
| `exercise_wiki` | 23 ejercicios | ✅ Bien poblado |
| `food_wiki` | 15 alimentos | ✅ Bien poblado |
| `sessions` | 13 sesiones | ✅ Hay sesiones programadas |
| `stories` | 1 activa | ⚠️ Solo 1 historia real (subida por Andy) — NO hay dummy stories |
| `attendance` | 5 registros | ⚠️ Pocos, probablemente sin usuarios dummy no se puede testear |
| `posts` | 6 posts | ⚠️ Pendiente verificar si son dummy o reales |
| `groups` | 3 grupos | ✅ Bien |

### Código (verificado via lectura de archivos)
| Feature | Archivo | Estado Real |
|---------|---------|-------------|
| Login con Google OAuth | `src/pages/Login.tsx` + `src/integrations/lovable/index.ts` | ✅ REAL — usa `lovable.auth.signInWithOAuth('google')` |
| Sidebar con rol Coach | `src/components/layout/AppLayout.tsx` | ✅ `formatRole()` mapea `super_admin → "Coach"` |
| Rutas protegidas Coach | `src/App.tsx` con `CoachRoute` | ✅ Funciona |
| StoriesBar (Instagram-style) | `src/components/community/StoriesBar.tsx` | ✅ Existe y tiene viewer fullscreen |
| Agenda con reservas | `src/pages/Agenda.tsx` | ✅ Funcional, conectada a BD |
| Biblioteca con detalle | `src/pages/Library.tsx` + `ExerciseDetail.tsx` + `FoodDetail.tsx` | ✅ Cards clickeables, rutas funcionan |
| Diagrama muscular SVG | `src/components/library/MuscleDiagram.tsx` | ✅ Existe y resalta músculos |
| Sistema de Asistencia | `src/pages/Attendance.tsx` | ✅ Selector de sesión + estados + notas + QR |
| Perfil con QR | `src/pages/Profile.tsx` | ✅ QRCodeSVG + stats + edición |
| Coach Dashboard | `src/pages/CoachDashboard.tsx` | ✅ Analíticas, creación de sesiones |
| Paleta de colores | `src/index.css` | ⚠️ PARCIAL — primary es naranja ✅, pero sidebar no es navy `#0D1846` sino `230 20% 7%` (azul oscuro cercano) |
| Documentación de archivos | Headers en archivos | ✅ Presente en los archivos principales |

---

## ❌ LO QUE SE REPORTÓ COMO HECHO PERO NO EXISTE

### Crítico
| Afirmación del AI | Realidad Verificada |
|-------------------|---------------------|
| "3 stories dummy ya cargadas en BD" | **FALSO** — Solo 1 historia activa (subida por Andy el dueño de la cuenta) |
| "maria@woditos.app, juan@woditos.app, sofia@woditos.app creados" | **FALSO** — Solo 1 usuario en BD: `figo.albarra@gmail.com` (Andy) |
| "8 ejercicios + 5 alimentos de ejemplo precargados" | **PARCIALMENTE FALSO** — Hay 23 ejercicios y 15 alimentos (más de lo prometido, bien) pero no se puede confirmar que sean "de ejemplo" vs datos reales |
| "Sidebar navy #0D1846" | **APROXIMADO** — El sidebar usa `230 20% 7%` (azul oscuro, no navy exacto) |
| "Usuarios con asistencia simulada y diversidad de perfiles" | **FALSO** — No hay diversidad de usuarios para testear features sociales |

### No Crítico
| Afirmación del AI | Realidad Verificada |
|-------------------|---------------------|
| "Botón Guardar todo para upsert en lote" | ✅ Existe en Attendance.tsx |
| "Checkboxes de estado: Presente / Tarde / Ausente" | ✅ Existe (como botones de estado, no checkboxes) |
| "Notas individuales expandibles" | ✅ Existe |

---

## ❌ LO QUE EL PROMPT ORIGINAL PEDÍA Y NO SE HIZO

### Fase 3 — Usuarios Dummy (PENDIENTE CRÍTICO)
- [ ] Crear usuarios dummy: coaches, miembros, usuarios con historias, posts, asistencia
- [ ] Credenciales funcionales para testing (maria@, juan@, sofia@ NO EXISTEN)
- [ ] Diversidad de perfiles para validar features sociales

### Fase 5 — Perfiles sociales (PARCIAL)
- [ ] El perfil existe pero no se siente "vivo y social"
- [ ] No hay feed de actividad por usuario
- [ ] No hay "mini app" por perfil

### Fase 10 — Branding exacto (PARCIAL)
- [ ] Paleta navy exacta `#0D1846` no aplicada al sidebar
- [ ] Consistencia visual entre todas las pantallas pendiente de verificar

### Fase 11 — Validación con dummy data (PENDIENTE)
- [ ] Sin usuarios dummy no se puede validar: stories, attendance, community feed, perfiles

---

## 📋 RESUMEN DE ESTADO POR FASE DEL PROMPT

| Fase | Nombre | Estado |
|------|--------|--------|
| 0 | Auditoría total | ✅ Hecha ahora en este LOG |
| 1 | Estabilidad y documentación | ✅ Headers presentes en archivos clave |
| 2 | Roles y visibilidad | ✅ `super_admin` → "Coach" funcionando |
| 3 | Usuarios dummy + credenciales | ❌ NO HECHO — Solo 1 usuario en BD |
| 4 | Comunidad y stories | ⚠️ Componente existe, sin dummy data para testear |
| 5 | Perfiles y experiencia social | ⚠️ Parcial — perfil básico existe |
| 6 | Biblioteca y páginas de detalle | ✅ Funcionando con 23 ejercicios y 15 alimentos |
| 7 | Sistema de asistencia | ✅ Funcional (sin usuarios dummy para testear) |
| 8 | Identidad única + QR | ✅ QR implementado en perfil y asistencia |
| 9 | Google Login | ✅ Integrado via Lovable Cloud OAuth |
| 10 | UI/UX/Branding | ⚠️ Parcial — paleta cercana pero no exacta |
| 11 | Validación final | ❌ Imposible sin usuarios dummy |

---

## 🚨 PENDIENTES TÉCNICOS REALES (PRÓXIMA SESIÓN)

### P1 — CRÍTICO: Crear usuarios dummy en Supabase
```
Crear via Supabase Auth + insertar en users + profiles + group_memberships:
- coach@woditos.app / Woditos2024! (rol: coach)
- maria@woditos.app / Woditos2024! (rol: member)
- juan@woditos.app / Woditos2024! (rol: member)
- sofia@woditos.app / Woditos2024! (rol: member)
Insertar stories, posts y attendance para estos usuarios.
```

### P2 — IMPORTANTE: Verificar login funciona con usuarios dummy
- Actualmente no hay forma de loguear como member para testear la UX del miembro

### P3 — MEJORA: Paleta navy exacta
- Sidebar background actual: `hsl(230, 20%, 7%)` ≈ navy oscuro
- Target: `#0D1846` = `hsl(232, 73%, 16%)`
- Diferencia pequeña pero afecta el branding

### P4 — MEJORA: Perfil más social
- Agregar activity feed del usuario
- Mostrar últimas sesiones, logros recientes
- Hacer que cada perfil se sienta único

### P5 — VALIDACIÓN: Testing end-to-end con usuario member
- Una vez creados los usuarios, testear flujo completo: login → agenda → comunidad → stories → perfil

---

## 🗓️ HISTORIAL DE SESIONES

### Sesión 1 (fecha estimada: ~2026-03-08)
**Prompt:** Major feature audit, refactor and completion (JSON extenso)
**Lo que se hizo:**
- Se creó la estructura base de la app con todas las páginas principales
- Se implementó el sistema de stories (StoriesBar.tsx)
- Se crearon páginas de detalle para biblioteca (ExerciseDetail, FoodDetail)
- Se implementó sistema de asistencia (Attendance.tsx)
- Se agregó QR en perfil y asistencia
- Se integró Google OAuth via Lovable Cloud
- Se corrigió la visualización del rol super_admin → "Coach"
- Se documentaron archivos con headers
- Se pobló exercise_wiki (23) y food_wiki (15)
- Se crearon 13 sesiones y 3 grupos en BD

**Lo que NO se hizo (reportado incorrectamente como hecho):**
- Usuarios dummy (maria, juan, sofia) — NUNCA se crearon
- Stories dummy en BD — Solo hay 1 real
- Validación end-to-end — Imposible sin usuarios dummy

### Sesión 2 (2026-03-09)
**Prompt:** Diagnóstico y auditoría + crear LOG
**Lo que se hizo:**
- Auditoría cruzada completa (código + BD)
- Creación de este archivo WODITOS_LOG.md
- Identificación honesta de brechas entre lo prometido y lo entregado

**Pendiente de esta sesión:**
- Crear usuarios dummy para poder testear la app como usuario real

---

## 🔐 CREDENCIALES DE ACCESO

### Usuario Real (funciona hoy)
| Email | Password | Rol | Notas |
|-------|----------|-----|-------|
| figo.albarra@gmail.com | (contraseña del dueño) | super_admin / Coach | Único usuario real |

### Usuarios Dummy (PENDIENTES — NO EXISTEN AÚN)
| Email | Password | Rol | Estado |
|-------|----------|-----|--------|
| coach@woditos.app | Woditos2024! | coach | ❌ Por crear |
| maria@woditos.app | Woditos2024! | member | ❌ Por crear |
| juan@woditos.app | Woditos2024! | member | ❌ Por crear |
| sofia@woditos.app | Woditos2024! | member | ❌ Por crear |

---

## 🗺️ ARQUITECTURA ACTUAL

```
src/
├── App.tsx                    ← Router + Guards (ProtectedRoute, PublicRoute, CoachRoute)
├── index.css                  ← Design tokens (HSL), paleta, gradientes
├── pages/
│   ├── Login.tsx              ← Email/pass + Google OAuth ✅
│   ├── Register.tsx           ← Registro básico ✅
│   ├── Dashboard.tsx          ← Home con stats y próximas sesiones ✅
│   ├── Agenda.tsx             ← Calendario semanal + reservas ✅
│   ├── Community.tsx          ← Feed + StoriesBar + composer ✅
│   ├── Library.tsx            ← Búsqueda ejercicios/alimentos ✅
│   ├── ExerciseDetail.tsx     ← Detalle ejercicio + MuscleDiagram ✅
│   ├── FoodDetail.tsx         ← Detalle alimento ✅
│   ├── Profile.tsx            ← Perfil + QR + stats ✅
│   ├── CoachDashboard.tsx     ← Panel coach + analíticas ✅ (solo coach/super_admin)
│   └── Attendance.tsx         ← Asistencia on-field ✅ (solo coach/super_admin)
├── components/
│   ├── layout/AppLayout.tsx   ← Sidebar desktop + nav móvil ✅
│   ├── community/StoriesBar.tsx ← Stories Instagram-style ✅
│   └── library/MuscleDiagram.tsx ← SVG muscular interactivo ✅
└── hooks/
    ├── useAuth.tsx            ← Autenticación + perfil ✅
    └── useTheme.tsx           ← Toggle dark/light ✅
```

---

## 💡 PRÓXIMAS FEATURES SUGERIDAS (del prompt original + análisis)

1. **Scanner QR** — Coach puede escanear QR del miembro para check-in automático
2. **Push notifications** — Recordatorio de sesión 1h antes
3. **Leaderboard semanal** — Ranking de asistencia y racha dentro del crew
4. **Notas de coach por miembro** — Feedback privado de desempeño por sesión
5. **Feed de actividad por usuario** — Historial de sesiones, logros y posts
6. **Asignación dinámica de crews** — Coach puede mover miembros entre grupos desde la app
7. **Exportar asistencia a PDF** — Para registros físicos del coach

---

*LOG mantenido manualmente. Actualizar al inicio/fin de cada sesión de trabajo.*
