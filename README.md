# Woditos

**Plataforma de gestión fitness para comunidades de running y entrenamiento funcional.**

Woditos conecta a coaches con sus alumnos, centralizando la gestión de sesiones, asistencia, rutinas y comunicación en un solo lugar.

---

## ¿Qué es Woditos?

Woditos está diseñado para clubs deportivos en Argentina — especialmente comunidades de running y entrenamiento funcional. Permite a los coaches organizar su trabajo diario y a los miembros mantenerse conectados con su club.

### Para Coaches
- Crear y gestionar sesiones grupales con tipo, crew, ubicación y capacidad
- Tomar y soltar sesiones disponibles
- Control de asistencia (presente / tarde / ausente) con check-in por QR
- Asignar rutinas a sesiones
- Ver analytics: sesiones por tipo, distribución de asistencia, actividad semanal
- Invitar coaches al club mediante links con expiración
- Enviar notificaciones y comunicados a los alumnos de una sesión
- Escribir notas privadas sobre cada miembro

### Para Miembros
- Reservar y cancelar sesiones
- Ver el detalle de cada sesión: rutina asignada, compañeros inscriptos, coach
- Dejar feedback post-sesión (valoración 1-5, incomodidades, nota al coach)
- Ver estadísticas personales: racha de asistencia, presencia, porcentaje mensual
- Participar en el feed del club: posts, stories, likes y comentarios
- Perfil con QR personal para check-in rápido

### General
- Autenticación por email/password y Google OAuth
- Sistema de clubs con código de unión
- Notificaciones en tiempo real
- Modo oscuro / claro
- App mobile-ready (navegación inferior, diseño responsivo)

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui |
| Estado | TanStack Query v5 |
| Routing | React Router v6 |
| Backend | Supabase (PostgreSQL + Auth + RLS + Storage) |
| Deploy | Vercel |

---

## Instalación y desarrollo local

```bash
# 1. Clonar el repositorio
git clone https://github.com/andyalbarracin/woditos-app.git
cd woditos-app

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Completar VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY

# 4. Iniciar servidor de desarrollo
npm run dev
```

### Variables de entorno requeridas

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

---

## Estructura del proyecto
src/
├── components/       # Componentes reutilizables
│   ├── dashboard/    # Vistas del dashboard por rol
│   ├── layout/       # AppLayout, sidebar, header
│   └── routines/     # Constructor de rutinas
├── hooks/            # Custom hooks (useAuth, useRateLimit, etc.)
├── lib/              # Supabase client, validación, utils
├── pages/            # Páginas de la app
└── types/            # Tipos TypeScript

---

## Roles de usuario

| Rol | Descripción |
|---|---|
| `super_admin` | Acceso total a la plataforma |
| `coach` / `club_admin` | Gestión de club, sesiones y miembros |
| `member` | Reservas, feedback y comunidad |

---

## Deploy

La app se despliega automáticamente en **Vercel** desde la rama `main`.

```bash
npm run build   # Build de producción
npm run preview # Preview local del build
```

---

## Licencia

© 2026 Woditos — Todos los derechos reservados.