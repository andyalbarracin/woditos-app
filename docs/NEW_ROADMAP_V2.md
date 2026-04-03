# WODITOS — REPORTE ESTRATÉGICO & ROADMAP DE VICTORIA
> Versión 2.0 · Abril 2026 · Confidencial

---

## PARTE 1 — INTELIGENCIA COMPETITIVA: CROSSFY

### Quiénes son

Crossfy es una app argentina de gestión para gimnasios y boxes fundada por Matías Zamorano. Tienen **340.000+ usuarios** y operan en toda LATAM. Son el referente actual del mercado hispanohablante para gestión de boxes de CrossFit, funcional, pilates, yoga y musculación.

### Modelo de negocio

**Un solo plan. Sin tiers. Sin freemium.**

| Periodicidad | Precio LATAM | Precio ARG |
|---|---|---|
| Mensual | USD 68/mes | ARS 50.000/mes |
| Semestral | USD 60/mes (total $360) | ARS 44.000/mes |
| Anual | USD 53/mes (total $636) | ARS 32.500/mes |

Sin límite de socios. Sin costo de lanzamiento. Incluye diseño con marca del gimnasio.
Soporte por WhatsApp. Sin plan gratuito. **No existe versión free.**

### Features de Crossfy (completo)

1. **Agenda y reservas** — tiempos de cancelación configurables, capacidad, turnos fijos, lista de espera, consentimientos legales, QR check-in
2. **Comunicación** — noticias/posts con notificaciones push, mensajes privados, chat directo, alertas automáticas
3. **WODs y Rutinas** — programaciones de entrenamiento grupales e individuales, registro de resultados, rankings, programas online a distancia
4. **Registro de rendimiento** — RMs (récords personales), Benchmarks, Habilidades, videos de ejercicios, ranking comparativo
5. **Gestión de caja y stock** — movimientos de dinero, control de stock, reportes mensuales
6. **Branding personalizado** — skin con colores y logo del gimnasio incluido en el precio
7. **Extras** — calculadora de RM, timer, registro de peso corporal, sección de beneficios, reportes

### Debilidades críticas de Crossfy

- **No tiene plan gratuito** → barrera de entrada alta para coaches pequeños
- **No es mobile-first** → la app del alumno es funcional pero el admin es web clásico
- **No tiene feed social estilo redes** → solo "noticias" unidireccionales
- **No tiene stories** → sin engagement visual moderno
- **No tiene insights del miembro** → el alumno no ve su propia evolución con inteligencia
- **No tiene feedback post-sesión** → el coach no sabe cómo se sintió el alumno
- **No tiene coach independiente sin sede física** → pensado para gimnasios establecidos, no para coaches de plaza
- **No es mobile-first en diseño** → UX anticuada visualmente
- **Precio en USD** → para coaches independientes en Argentina es una barrera real
- **Sin IA** → el generador de WODs con IA que mencionan es externo y básico
- **Sin integración WhatsApp nativa** → solo lo usan para soporte, no como canal del producto

---

## PARTE 2 — ANÁLISIS ESTRATÉGICO

### El mercado real que Crossfy no cubre

Crossfy fue construido para **gimnasios con estructura**: recepción, múltiples coaches, socios con cuota mensual, gestión de caja. Eso los excluye de un segmento enorme y creciente:

- Coach que entrena en la plaza del barrio con 15 personas
- Trainer que empezó con grupos de running en Instagram
- Profe de funcional que no tiene sede pero tiene comunidad
- Coach que cobra por Mercado Pago y coordina todo por WhatsApp

**Ese es el target real de Woditos.** Y ese segmento no tiene una herramienta pensada para ellos. Woditos puede ser la primera.

### Ventaja de ser jugador nuevo en 2026

- Stack más moderno (React + Supabase + Vercel)
- UX diseñada desde cero para mobile
- Sin deuda técnica
- Freemium como estrategia de adquisición masiva
- IA disponible y accesible (OpenAI API)
- WhatsApp Cloud API disponible para LATAM
- Comunidad como diferenciador (feed social, stories, feedback)

### Posicionamiento definitivo

> **"Crossfy organiza gimnasios. Woditos impulsa coaches."**
> Crossfy es un ERP. Woditos es el copiloto diario del coach independiente.

---

## PARTE 3 — ANÁLISIS DE GAPS (lo que le falta a Woditos hoy)

### Gap 1: Rutinas y seguimiento de progreso ← CRÍTICO
Crossfy lo tiene. Es la razón #1 por la que un coach elegiría Crossfy sobre Woditos hoy.
Sin rutinas, Woditos es solo "agenda + comunidad". Con rutinas, es una herramienta de coaching real.

### Gap 2: App nativa (iOS/Android)
Crossfy tiene app nativa. Woditos es PWA. Para el miembro casual esto importa mucho en términos de percepción.

### Gap 3: Registro de métricas del atleta
RMs, benchmarks, peso corporal, habilidades. El atleta quiere ver su progreso.

### Gap 4: Comunicación directa coach → miembro
Mensajes privados y notificaciones segmentadas. Hoy Woditos tiene campana de notificaciones, pero no mensajes 1:1.

### Gap 5: Gestión de pagos
Crossfy no lo hace bien, pero lo menciona como control de caja. Woditos no tiene nada.

### Gap 6: WhatsApp como canal
El coach vive en WhatsApp. Quien lo integre bien, gana la retención.

### Gap 7: IA útil y visible
El coach no sabe crear rutinas ni WODs optimizados. IA que genere eso en 10 segundos es un diferenciador brutal.

---

## PARTE 4 — ROADMAP DE VICTORIA (detallado)

---

### FASE 1 — CONSOLIDACIÓN MVP ← Estado actual, casi completo

**Objetivo:** Base sólida, sin bugs, lista para crecer.

**Features ya implementadas:** ✅ login, registro 3 pasos, sistema de clubs, agenda, reservas, asistencia QR, perfil, insights del miembro, feedback post-sesión, analytics del coach, comunidad con feed y stories, biblioteca wiki, notificaciones, multi-coach, sidebar colapsable.

**Pendientes de esta fase:**

**1.1 Panel de gestión del Club**
- Ver y editar `join_code` del club
- Cambiar nombre del club
- Listar miembros activos
- Ver plan actual
- Archivos a crear/modificar: `src/pages/ClubSettings.tsx` (nuevo) + ruta `/club` en `App.tsx`
- Costo: $0 (solo Supabase queries existentes)

**1.2 Área de Soporte mejorada**
- La página `/soporte` actual necesita contenido real: FAQ, contacto directo, link a WhatsApp del soporte
- Costo: $0

**1.3 Export de asistencia CSV**
- Librería: `papaparse` (ya disponible en el proyecto, ver artifacts)
- Un botón en `Attendance.tsx` que descargue el registro de la sesión seleccionada como CSV
- Costo: $0

**1.4 Fix técnico: trigger `on_auth_user_created`**
- Ya implementado el delay de 500ms como workaround
- Solución definitiva: modificar la función `handle_new_user()` en Supabase para que nunca asigne `club_admin` como rol global en `users`, solo en `club_memberships`
- SQL: `CREATE OR REPLACE FUNCTION handle_new_user()` → siempre insertar `role = 'member'` y actualizar después desde el frontend

---

### FASE 2 — RUTINAS Y PROGRESO ← El diferenciador más urgente

**Objetivo:** Darle al coach una herramienta de coaching real. Que no necesite ninguna otra app.

**Costo total estimado fase 2: $0 - $10 USD/mes (solo si se usa IA)**

#### 2.1 Módulo de Rutinas

**Tablas nuevas en Supabase:**
```sql
CREATE TABLE routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  coach_id uuid REFERENCES users(id),
  name text NOT NULL,
  description text,
  type text DEFAULT 'custom', -- custom, wod, amrap, emom, for_time
  is_template boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE routine_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid REFERENCES routines(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES exercise_wiki(id),
  custom_exercise_name text, -- si no está en la wiki
  sets int,
  reps int,
  duration_seconds int,
  weight_kg numeric,
  notes text,
  order_index int NOT NULL
);

CREATE TABLE routine_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid REFERENCES routines(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES users(id), -- null = toda la sesión
  session_id uuid REFERENCES sessions(id), -- null = asignación directa
  assigned_by uuid REFERENCES users(id),
  assigned_at timestamptz DEFAULT now()
);

CREATE TABLE routine_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid REFERENCES routines(id),
  user_id uuid REFERENCES users(id),
  session_id uuid REFERENCES sessions(id),
  completed_at timestamptz DEFAULT now(),
  notes text,
  total_time_seconds int,
  rpe int CHECK (rpe BETWEEN 1 AND 10) -- esfuerzo percibido
);

CREATE TABLE exercise_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_result_id uuid REFERENCES routine_results(id) ON DELETE CASCADE,
  routine_exercise_id uuid REFERENCES routine_exercises(id),
  sets_completed int,
  reps_completed int,
  weight_used_kg numeric,
  notes text
);
```

**Frontend:**
- `src/pages/Routines.tsx` — lista de rutinas del coach, crear nueva
- `src/components/RoutineBuilder.tsx` — constructor drag-and-drop de ejercicios
- `src/pages/RoutineDetail.tsx` — ver rutina con botón "Registrar resultado"
- Ruta nueva: `/rutinas` y `/rutinas/:id`
- Icono en nav: `Zap` o `ListChecks` (lucide-react)
- Integración: botón "Asignar rutina" en sesión desde `CoachDashboard`

**Costo: $0**

#### 2.2 Registro de Métricas del Atleta (RMs y Benchmarks)

**Tabla nueva:**
```sql
CREATE TABLE personal_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES exercise_wiki(id),
  custom_exercise_name text,
  record_type text NOT NULL, -- '1rm', 'max_reps', 'best_time', 'max_distance'
  value numeric NOT NULL,
  unit text NOT NULL, -- 'kg', 'reps', 'seconds', 'meters'
  recorded_at date DEFAULT current_date,
  notes text
);
```

**Frontend:**
- Sección "Mis Marcas" dentro de `Profile.tsx` para miembros
- Gráfico de progreso usando `recharts` (ya instalado) — línea de tiempo de RM
- El coach puede ver las marcas de cualquier miembro desde el panel

**Costo: $0**

#### 2.3 IA para generar rutinas y WODs

**Tecnología:** OpenAI API — modelo `gpt-4o-mini` (más barato, suficiente para esto)

**Costo:** ~$0.15 USD por cada 1M tokens de input. Una generación de rutina consume ~500 tokens → **$0.000075 por rutina**. Con 1000 generaciones al mes: **$0.075 USD**. Prácticamente gratis.

**Implementación:** Supabase Edge Function (Deno) para no exponer la API key en el frontend.

```typescript
// supabase/functions/generate-routine/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { level, goal, duration, type } = await req.json()
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Genera una rutina de entrenamiento funcional para un atleta de nivel ${level}, 
        objetivo: ${goal}, duración: ${duration} minutos, tipo: ${type}. 
        Responde SOLO en JSON con: {name, description, exercises: [{name, sets, reps, notes}]}`
      }],
      max_tokens: 500
    })
  })
  
  const data = await response.json()
  return new Response(data.choices[0].message.content, {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

**Variables de entorno en Supabase:** `OPENAI_API_KEY` → Supabase Dashboard > Edge Functions > Secrets

**Deploy:** `supabase functions deploy generate-routine`

**Frontend:** Botón "✨ Generar con IA" en el constructor de rutinas → abre modal con inputs de nivel/objetivo/tipo → llama a la edge function → pre-rellena el builder.

**Costo real:** $5-10 USD/mes con uso moderado. Gratis en tier Supabase actual para edge functions.

---

### FASE 3 — WHATSAPP COMO CANAL NATIVO ← El mayor diferenciador de LATAM

**Objetivo:** El coach coordina todo desde WhatsApp hoy. Woditos debe entrar en ese canal, no competir con él.

**Tecnología recomendada: WhatsApp Cloud API (Meta) + n8n**

#### Opción A — WhatsApp Cloud API directo (RECOMENDADA)

**Qué es:** La API oficial de Meta para WhatsApp Business. Gratuita para las primeras 1000 conversaciones/mes iniciadas por el usuario. Después cobra por conversación (~$0.05 USD).

**Cómo funciona:**
1. Crear cuenta en [Meta for Developers](https://developers.facebook.com)
2. Crear WhatsApp Business App
3. Obtener `WHATSAPP_TOKEN` y `PHONE_NUMBER_ID`
4. Crear Supabase Edge Function que recibe webhooks de Supabase y envía mensajes

**Edge Function para enviar notificaciones por WhatsApp:**
```typescript
// supabase/functions/send-whatsapp/index.ts
const sendWhatsApp = async (to: string, message: string) => {
  await fetch(
    `https://graph.facebook.com/v18.0/${Deno.env.get('WA_PHONE_NUMBER_ID')}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('WA_TOKEN')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to, // número con código de país, ej: "5491123456789"
        type: 'text',
        text: { body: message }
      })
    }
  )
}
```

**Cuándo enviar mensajes:**
- Reserva confirmada → "✅ Reservaste *Running Palermo* para mañana a las 18hs. ¡Te esperamos!"
- Recordatorio 2hs antes de sesión (Supabase cron job)
- Sesión cancelada por coach → "❌ La sesión de hoy fue cancelada. Nos vemos el jueves."
- Coach asignado a sesión → "🏋️ Nuevo coach para tu clase de mañana: Willy San"

**Implementación en Woditos:**
- Campo `phone` en `profiles` (ya existe en `users` pero está vacío)
- Checkbox en perfil: "Quiero recibir notificaciones por WhatsApp"
- La edge function se llama después de cada mutation relevante en el frontend

**Costo:** Gratis hasta 1000 conversaciones/mes. Con crecimiento: ~$50 USD/mes para 1000 usuarios activos.

#### Opción B — n8n (para automatizaciones más complejas, futuro)

**Qué es:** Herramienta de automatización open-source, alternativa a Zapier/Make.

**Costo:** Self-hosted en VPS (Hostinger/DigitalOcean) ~$5-10 USD/mes O n8n Cloud $20 USD/mes.

**Cuándo usarlo:** Cuando se necesiten flujos complejos como "si el miembro no se conectó en 7 días → mandar WhatsApp de reenganche → si no responde en 3 días → notificar al coach".

**Recomendación:** Empezar con Opción A (directo). Agregar n8n en Fase 5.

---

### FASE 4 — PAGOS Y MONETIZACIÓN

**Objetivo:** Que el coach pueda cobrar la cuota de sus miembros desde Woditos.

#### 4.1 MercadoPago (para Argentina y LATAM)

**Tecnología:** MercadoPago Checkout Pro o Suscripciones

**SDK:** `npm install mercadopago` (versión oficial)

**Flujo básico:**
1. Coach configura precio mensual de su club en el panel
2. Woditos genera link de pago de MercadoPago para ese club
3. Miembro paga → webhook de MercadoPago notifica a Supabase Edge Function
4. Edge function actualiza `membership_status = 'active'` y fecha de vencimiento

**Tablas nuevas:**
```sql
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id),
  user_id uuid REFERENCES users(id),
  amount numeric NOT NULL,
  currency text DEFAULT 'ARS',
  status text DEFAULT 'pending', -- pending, approved, rejected
  provider text DEFAULT 'mercadopago',
  provider_payment_id text,
  period_start date,
  period_end date,
  created_at timestamptz DEFAULT now()
);
```

**Costo:** MercadoPago cobra ~5.99% + IVA por transacción. Sin costo fijo. Woditos puede tomar un % como comisión de plataforma (2-3%) en el futuro.

**Costo para implementar:** $0 (API gratuita, solo comisiones sobre ventas)

#### 4.2 Stripe (para coaches internacionales)

Solo en Fase 5. Por ahora, MercadoPago cubre el 100% del mercado argentino.

---

### FASE 5 — APP NATIVA (PWA → App Store)

**Objetivo:** Estar en el celular del miembro con ícono propio.

**Tecnología:** Capacitor (ya mencionado en arquitectura)

**Qué es Capacitor:** Wrapper que convierte la PWA existente en una app nativa iOS/Android **sin reescribir código**. Desarrollado por el equipo de Ionic.

**Instalación:**
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init Woditos app.woditos.com
npx cap add ios
npx cap add android
```

**Costo:** $0 para Android (Google Play Developer: $25 USD único). $99 USD/año para iOS (Apple Developer Program).

**Cuándo hacer esto:** Con 30+ usuarios pagos. Antes no vale el esfuerzo de mantener builds nativos.

**Alternativa más simple hoy:** Mejorar el PWA install prompt para que los usuarios "instalen" Woditos en su pantalla de inicio. Costo: $0.

---

### FASE 6 — MENSAJES PRIVADOS 1:1

**Objetivo:** Eliminar WhatsApp para la comunicación coach-miembro dentro de la app.

**Tecnología:** Supabase Realtime (ya en el stack) para mensajes en tiempo real.

**Tablas:**
```sql
CREATE TABLE direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES users(id),
  receiver_id uuid REFERENCES users(id),
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
-- Supabase Realtime subscription en el frontend para nuevos mensajes
```

**Frontend:** Sección "Mensajes" en el nav (ícono `MessageCircle`), UI similar a Instagram DMs.

**Costo:** $0 (Supabase Realtime está incluido en el plan gratuito hasta cierto volumen)

---

### FASE 7 — LEADERBOARD Y GAMIFICACIÓN

**Objetivo:** Retención. El miembro que está en el top 3 de asistencia de su crew no se va.

**Features:**
- Ranking semanal/mensual de asistencia por club
- Badges automáticos (ya existe tabla `achievements`): "10 sesiones seguidas", "Primero del mes", "Racha de oro"
- Sistema de puntos configurable por el coach

**Implementación:**
- Vista `Leaderboard` en `/comunidad` con tabs: Esta semana / Este mes / Histórico
- Función SQL `get_club_leaderboard(club_id, period)` para performance
- Push notification automática cuando alguien sube al podio

**Costo: $0**

---

### FASE 8 — MULTI-TENANCY Y BILLING DE WODITOS

**Objetivo:** Monetizar Woditos como plataforma.

Este es el modelo SaaS real. Cada club es un tenant. Woditos cobra al coach por usar la plataforma.

**Modelo freemium definitivo:**

| Tier | Miembros activos | Precio | Diferencial |
|---|---|---|---|
| **Free** | hasta 15 | $0 | Todo lo básico |
| **Pro** | hasta 50 | $15 USD/mes | IA, WhatsApp, pagos, analytics avanzados |
| **Team** | hasta 150 | $35 USD/mes | Multi-coach ilimitado, branding, export |
| **Enterprise** | ilimitado | $80 USD/mes | API, soporte dedicado, white-label |

**Por qué 15 miembros gratis (no 5 como antes):**
Crossfy no tiene plan gratuito. Si Woditos regala el tier básico hasta 15 miembros, cualquier coach que empieza elige Woditos. Cuando crece a 20, ya está fidelizado y paga $15 USD en lugar de $68 USD de Crossfy.

**Integración de billing:**
- **RevenueCat** para mobile (cuando exista la app nativa)
- **Stripe** para web (internacionales)
- **MercadoPago** para Argentina

---

## PARTE 5 — ROADMAP CONSOLIDADO POR PRIORIDAD

### Q2 2026 (Abril - Junio) — Consolidar y diferenciar

| Prioridad | Feature | Esfuerzo | Impacto |
|---|---|---|---|
| 🔴 CRÍTICO | Módulo de Rutinas (builder + asignación) | Alto | Muy alto |
| 🔴 CRÍTICO | Panel de gestión del Club | Bajo | Alto |
| 🟠 ALTO | Registro de RMs y Benchmarks en Perfil | Medio | Alto |
| 🟠 ALTO | IA para generar rutinas (Edge Function) | Medio | Muy alto |
| 🟠 ALTO | Export CSV de asistencia | Bajo | Medio |
| 🟡 MEDIO | WhatsApp notificaciones (reserva + recordatorio) | Medio | Muy alto |
| 🟡 MEDIO | Leaderboard de asistencia por club | Bajo | Alto |
| 🟡 MEDIO | PWA install prompt mejorado | Bajo | Medio |

### Q3 2026 (Julio - Septiembre) — Monetización

| Prioridad | Feature | Esfuerzo | Impacto |
|---|---|---|---|
| 🔴 CRÍTICO | MercadoPago: cobro de cuota al miembro | Alto | Muy alto |
| 🔴 CRÍTICO | Implementar tiers Free/Pro/Team | Medio | Muy alto |
| 🟠 ALTO | Mensajes privados 1:1 (Supabase Realtime) | Medio | Alto |
| 🟠 ALTO | Resultados de rutinas + historial del atleta | Medio | Alto |
| 🟡 MEDIO | n8n para automatizaciones WhatsApp complejas | Medio | Alto |
| 🟡 MEDIO | Notificaciones push server-side (Edge Functions) | Medio | Medio |

### Q4 2026 (Octubre - Diciembre) — Escalar

| Prioridad | Feature | Esfuerzo | Impacto |
|---|---|---|---|
| 🔴 CRÍTICO | App nativa con Capacitor (Android primero) | Alto | Muy alto |
| 🟠 ALTO | Stripe para coaches internacionales | Medio | Alto |
| 🟠 ALTO | Branding personalizado (logo del club en la app) | Medio | Alto |
| 🟡 MEDIO | Programa de referidos (1 mes gratis por referido) | Bajo | Muy alto |
| 🟡 MEDIO | API pública para integraciones (Enterprise) | Alto | Medio |

---

## PARTE 6 — STACK TECNOLÓGICO ACTUALIZADO

### Core (ya implementado)
- **Frontend:** React 18 + TypeScript + Vite
- **Estilos:** Tailwind CSS + shadcn/ui
- **Estado:** TanStack Query v5
- **Routing:** React Router v6
- **Backend:** Supabase (PostgreSQL + Auth + Realtime + Storage + Edge Functions)
- **Deploy:** Vercel

### A agregar (por fase)

| Feature | Tecnología | Librería/Servicio | Costo |
|---|---|---|---|
| IA rutinas | OpenAI GPT-4o-mini | `openai` npm package | ~$5-10/mes |
| WhatsApp notif. | Meta WhatsApp Cloud API | Fetch nativo (no SDK) | Gratis hasta 1000 conv/mes |
| WhatsApp flows | n8n self-hosted | Docker en VPS | $5-10/mes (VPS) |
| Pagos coach | MercadoPago SDK | `mercadopago` npm | 5.99%+IVA por tx |
| Pagos Woditos | Stripe | `@stripe/stripe-js` | 2.9%+$0.30 por tx |
| App nativa | Capacitor | `@capacitor/core` | $0 (Android) / $99/año (iOS) |
| Mensajes RT | Supabase Realtime | Ya incluido | $0 |
| Export CSV | PapaParse | `papaparse` | $0 |
| Gráficos prog. | Recharts | Ya instalado | $0 |
| Billing Woditos | RevenueCat | SDK móvil | Gratis hasta $2.5k MRR |

---

## PARTE 7 — ESTRATEGIA DE GO-TO-MARKET

### Cómo adquirir los primeros 100 coaches

1. **TikTok y Reels** — contenido del tipo "del WhatsApp al profesionalismo" mostrando el producto en uso real. El nicho de coaches de running/funcional en Argentina es muy activo en Instagram.

2. **Referidos con incentivo real** — cada coach que refiere un colega recibe 1 mes gratis del tier Pro. Crossfy usa exactamente esto y es "su principal fuente de crecimiento" (lo dicen explícitamente en su web).

3. **Freemium como viral loop** — el miembro usa la app, la ve linda, se la comenta a su coach de otro club, ese coach la descarga. El miembro es el canal de distribución.

4. **Comunidades de coaches** — grupos de WhatsApp y Facebook de coaches de running, funcional y entrenamiento al aire libre en Argentina, Chile, México. Post directo con demo en video.

5. **Diferenciador de precio en el mensaje** — "Todo lo que hace Crossfy, gratis hasta 15 miembros. Y después, $15 USD vs sus $68 USD". Es un mensaje que se explica solo.

### Métricas de éxito

- Mes 1-3: 50 clubs activos, 500 miembros registrados
- Mes 4-6: 200 clubs, 5 coaches Pro pagos
- Mes 7-12: 500 clubs, 50 coaches Pro pagos → ~$750 USD MRR
- Año 2: 2000 clubs, 300 Pro → $4.500 USD MRR

---

## PARTE 8 — RESUMEN EJECUTIVO

**Woditos tiene hoy el 70% de lo que necesita para ganarle a Crossfy en su nicho.**

Lo que falta es específico y construible:

1. **Rutinas** → el feature más pedido por coaches, Crossfy lo tiene, Woditos no. Es la prioridad #1 de Q2.
2. **WhatsApp** → el canal donde vive el coach LATAM. Una notificación bien enviada retiene más que cualquier feature de la app.
3. **IA** → generador de rutinas y WODs. Cuesta casi nada implementar, y es un diferenciador percibido enorme.
4. **Pagos** → cuando el coach cobra la cuota desde Woditos, deja de necesitar cualquier otra herramienta.
5. **Freemium agresivo** → 15 miembros gratis es la puerta de entrada. Crossfy no tiene freemium. Eso es la ventaja más grande que existe hoy.

**La frase que define la estrategia:**
> Crossfy cobra $68/mes desde el día 1 y apunta a gimnasios con estructura.
> Woditos es gratis hasta que el coach crece, y después cuesta menos de un cuarto del precio.
> En LATAM, ese modelo gana.

---

*Woditos Strategic Report 2026 — Uso interno*