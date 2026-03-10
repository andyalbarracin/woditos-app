# WODITOS — Exportación de Base de Datos

## Orden de ejecución

Ejecutá estos archivos **en orden** en el SQL Editor de tu proyecto Supabase:

| Paso | Archivo | Descripción |
|------|---------|-------------|
| 1 | `01_schema.sql` | Tablas con foreign keys y RLS habilitado |
| 2 | `02_functions.sql` | Funciones y trigger de auth |
| 3 | `03_rls_policies.sql` | Todas las políticas RLS |
| 4 | `04_storage.sql` | Bucket de stories + policies |
| 5 | **Crear usuarios en Auth** | Ver instrucciones abajo |
| 6 | `05_seed_data.sql` | Datos de ejemplo |
| 7 | `06_edge_functions.md` | Deploy manual de Edge Functions |

## Paso 5: Crear usuarios en Auth

Antes de correr el seed, creá estos usuarios en **Authentication → Users → Add User**:

| Email | Password | Notas |
|-------|----------|-------|
| `figo.albarra@gmail.com` | (tu contraseña) | Luego se le asigna rol `super_admin` |
| `coach@woditos.app` | `Woditos2024!` | Se le asigna rol `coach` |
| `maria@woditos.app` | `Woditos2024!` | Member |
| `juan@woditos.app` | `Woditos2024!` | Member |
| `sofia@woditos.app` | `Woditos2024!` | Member |

Marcá **"Auto Confirm"** al crear cada usuario para que no requiera verificación por email.

El trigger `handle_new_user` creará automáticamente filas en `users` y `profiles`.

## Configuración adicional

### Auth Settings
- En **Authentication → Settings → Email**, habilitar el login por email/password.
- Si querés Google OAuth, configuralo en **Authentication → Providers → Google**.

### Environment variables para Edge Functions
Las Edge Functions necesitan `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (ya vienen por defecto en Supabase).

### Código del frontend
Actualizá el archivo `.env` de tu proyecto React con:
```
VITE_SUPABASE_URL=https://xwjxpgqnscahvrseunus.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=tu_anon_key_aqui
```
