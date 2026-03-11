# WODITOS — Seguridad

## Última actualización: 2026-03-11

---

## 1. Protección contra SQL Injection

Woditos usa **Supabase JS SDK** que utiliza consultas parametrizadas internamente (PostgREST). 
Esto significa que **no hay concatenación directa de strings SQL** en el frontend.

Adicionalmente:
- Todos los inputs de texto pasan por `sanitizeText()` que elimina patrones peligrosos (DROP TABLE, UNION SELECT, etc.)
- Los esquemas Zod validan tipo, longitud y formato antes de enviar al backend

## 2. Protección contra XSS

- **No se usa `dangerouslySetInnerHTML`** en ningún componente
- Todos los textos se renderizan como strings nativos de React (auto-escaped)
- `sanitizeText()` remueve tags HTML (`<script>`, `<iframe>`, etc.)
- URLs de media se validan como URLs seguras (http/https)

## 3. Row Level Security (RLS)

Todas las tablas tienen RLS habilitado con políticas granulares:
- **Usuarios** solo acceden a sus propios datos
- **Coaches** acceden a datos de sus crews y miembros
- **super_admin** accede a todo
- Funciones `get_my_role()` e `is_member_of_group()` son `SECURITY DEFINER` para evitar recursión RLS

## 4. Validación de Inputs (Zod)

| Formulario | Esquema | Límite |
|---|---|---|
| Login | `loginSchema` | email 255ch, password 6-128ch |
| Registro | `registerSchema` | nombre 100ch, email, password |
| Perfil | `profileUpdateSchema` | nombre 100ch, goals 500ch, contacto 200ch |
| Post | `postSchema` | contenido 2000ch, tipo enum |
| Comentario | `commentSchema` | texto 1000ch |
| Sesión | `sessionSchema` | título 200ch, tipo enum, fecha/hora regex |
| Crew | `crewSchema` | nombre 100ch, capacidad 1-999 |
| Comunicación | `communicationSchema` | mensaje 500ch |

## 5. Autenticación

- Supabase Auth con email/password + Google OAuth
- Sesiones persisten en localStorage con auto-refresh
- Rutas protegidas con `ProtectedRoute` guard
- Roles verificados server-side con `get_my_role()` (SECURITY DEFINER)
- **No se almacenan roles en localStorage** (se consultan desde la DB)

## 6. Almacenamiento

- Bucket `stories` es público (read) pero solo el autor puede insertar (RLS)
- No se permiten uploads arbitrarios sin autenticación

## 7. Secrets y API Keys

- Las API keys privadas se almacenan como Supabase Secrets (edge functions)
- Solo la publishable/anon key está en el frontend
- La service_role_key **nunca** se expone al cliente

## 8. Headers de Seguridad (recomendados para producción)

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
```
