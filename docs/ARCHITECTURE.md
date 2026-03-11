# WODITOS — Arquitectura del Proyecto

## Última actualización: 2026-03-11

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Estilos | Tailwind CSS + shadcn/ui |
| Estado | React Query (TanStack) |
| Routing | React Router v6 |
| Backend | Supabase (Lovable Cloud) |
| Auth | Supabase Auth + Google OAuth |
| DB | PostgreSQL (via Supabase) |
| Edge Functions | Deno (Supabase Edge) |
| Distribución | PWA + Capacitor (iOS/Android) |
| Validación | Zod |

---

## Estructura de Directorios

```
src/
├── assets/           # Imágenes y recursos estáticos
├── components/
│   ├── community/    # Componentes de la sección Crew
│   ├── layout/       # AppLayout (sidebar + mobile nav)
│   ├── library/      # Componentes de la biblioteca
│   └── ui/           # shadcn/ui components
├── hooks/            # Custom hooks (useAuth, useTheme, etc.)
├── integrations/     # Supabase client + types (auto-generated)
├── lib/              # Utilidades (supabase client, validation, utils)
├── pages/            # Páginas/rutas de la app
├── test/             # Tests
└── types/            # TypeScript types compartidos

docs/                 # Documentación del proyecto
├── SECURITY.md       # Políticas de seguridad
├── SAAS_TIERS.md     # Modelo freemium y roadmap
├── ARCHITECTURE.md   # Este archivo
└── DATABASE.md       # Schema y exportación de DB

supabase-export/      # SQL exportado para replicar la DB
├── 01_schema.sql
├── 02_functions.sql
├── 03_rls_policies.sql
├── 04_storage.sql
├── 05_seed_data.sql
└── 06_edge_functions.md
```

---

## Roles del Sistema

| Rol (interno) | UI Label | Permisos |
|---------------|----------|----------|
| `super_admin` | Coach | Acceso total, gestión de crews/sesiones/asistencia |
| `coach` | Coach | Gestión de sus crews y sesiones |
| `staff` | Staff | Lectura de datos de miembros |
| `member` | Miembro | Reservar sesiones, feed social, perfil |

---

## Flujo de Datos

```
[Usuario] → [React App] → [Supabase JS SDK] → [PostgREST API] → [PostgreSQL + RLS]
                                              → [Edge Functions] → [Push Notifications]
```

---

## Tablas de la Base de Datos

| Tabla | Descripción |
|-------|------------|
| `users` | Datos base del usuario (email, role, status) |
| `profiles` | Info adicional (nombre, avatar, goals, contacto) |
| `groups` | Crews / grupos de entrenamiento |
| `group_memberships` | Relación usuario ↔ grupo |
| `sessions` | Sesiones de entrenamiento programadas |
| `reservations` | Reservas de miembros a sesiones |
| `attendance` | Registro de asistencia |
| `posts` | Publicaciones del feed social |
| `comments` | Comentarios en posts |
| `reactions` | Likes/reacciones en posts |
| `stories` | Stories tipo Instagram (24h) |
| `notifications` | Notificaciones in-app |
| `achievements` | Logros/badges de usuarios |
| `coach_notes` | Notas privadas del coach sobre miembros |
| `exercise_wiki` | Biblioteca de ejercicios |
| `food_wiki` | Biblioteca de nutrición |
| `push_subscriptions` | Suscripciones push del navegador |
