# WODITOS — Modelo Freemium SaaS

## Última actualización: 2026-03-11

---

## Estructura de Tiers

| Tier | Usuarios (coach + miembros) | Precio | Nombre |
|------|---------------------------|--------|--------|
| **Free** | 1 – 5 | Gratis | Starter |
| **Tier 1** | 6 – 22 | TBD | Pro |
| **Tier 2** | 23 – 50 | TBD | Team |
| **Enterprise** | 51 – 999 | TBD | Enterprise |

> "Usuarios" = suma total de coaches + miembros activos en la organización.

---

## Features por Tier

| Feature | Free | Pro | Team | Enterprise |
|---------|------|-----|------|-----------|
| Crear sesiones | ✅ | ✅ | ✅ | ✅ |
| Agenda + reservas | ✅ | ✅ | ✅ | ✅ |
| QR check-in | ✅ | ✅ | ✅ | ✅ |
| Feed / Crew social | ✅ | ✅ | ✅ | ✅ |
| Stories | ❌ | ✅ | ✅ | ✅ |
| Biblioteca (wiki) | ✅ (solo lectura) | ✅ (editar) | ✅ | ✅ |
| Crews/Grupos | 1 | 3 | 10 | Ilimitados |
| Analytics básicos | ✅ | ✅ | ✅ | ✅ |
| Analytics avanzados | ❌ | ❌ | ✅ | ✅ |
| Push notifications | ❌ | ✅ | ✅ | ✅ |
| Notas del coach | ❌ | ✅ | ✅ | ✅ |
| Multi-coach | ❌ | ❌ | ✅ (hasta 3) | ✅ (ilimitados) |
| Branding personalizado | ❌ | ❌ | ❌ | ✅ |
| API access | ❌ | ❌ | ❌ | ✅ |
| Soporte prioritario | ❌ | ❌ | ✅ | ✅ (dedicado) |
| Export de datos (CSV) | ❌ | ✅ | ✅ | ✅ |
| Almacenamiento media | 100MB | 1GB | 5GB | 25GB |

---

## Roadmap de Implementación

### Fase 1 — Fundación (actual)
- [x] App funcional sin restricciones de tier
- [x] Sistema de roles (coach/member)
- [x] RLS y seguridad base
- [x] Validación de inputs (Zod)
- [ ] Tabla `organizations` para multi-tenancy
- [ ] Tabla `subscriptions` para tracking de tier

### Fase 2 — Infraestructura de Billing
- [ ] Integrar RevenueCat o similar
- [ ] Crear tabla `organizations` con campo `tier`
- [ ] Crear tabla `subscriptions` (org_id, tier, status, period_start, period_end)
- [ ] Edge function para verificar tier en cada request crítico
- [ ] Middleware frontend para mostrar upgrade prompts

### Fase 3 — Feature Gating
- [ ] Helper `canAccess(feature: string): boolean` basado en tier
- [ ] Componente `<FeatureGate tier="pro">` wrapper
- [ ] Paywall UI para features bloqueadas
- [ ] Conteo de usuarios activos por organización
- [ ] Límites de crews por tier

### Fase 4 — Multi-tenancy
- [ ] Cada organización tiene su propio espacio aislado
- [ ] Admin de organización (owner) puede gestionar billing
- [ ] Invitaciones por link/email a la organización
- [ ] Subdominios personalizados (Enterprise)

### Fase 5 — Analytics y Reporting (Team+)
- [ ] Dashboard de métricas avanzadas
- [ ] Exportación CSV/PDF de reportes
- [ ] Comparativas entre crews
- [ ] Tendencias de asistencia a largo plazo

### Fase 6 — Enterprise
- [ ] API REST pública documentada
- [ ] Webhooks para integración con otros sistemas
- [ ] SSO (Single Sign-On)
- [ ] Branding white-label
- [ ] SLA y soporte dedicado

---

## Esquema de DB Propuesto (futuro)

```sql
-- Organizaciones (multi-tenancy)
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  tier text NOT NULL DEFAULT 'free', -- free, pro, team, enterprise
  owner_user_id uuid REFERENCES public.users(id),
  max_users int NOT NULL DEFAULT 5,
  created_at timestamptz DEFAULT now()
);

-- Membresía de org
CREATE TABLE public.org_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member', -- owner, admin, coach, member
  joined_at timestamptz DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- Suscripciones (integración con RevenueCat)
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider text NOT NULL, -- 'revenuecat', 'stripe', 'manual'
  provider_subscription_id text,
  tier text NOT NULL,
  status text NOT NULL DEFAULT 'active', -- active, past_due, cancelled, trialing
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## Integración con RevenueCat

### Flujo propuesto:
1. Usuario inicia upgrade desde la app
2. App llama a RevenueCat SDK para mostrar paywall
3. RevenueCat procesa el pago (App Store / Google Play / Stripe)
4. Webhook de RevenueCat notifica a nuestro Edge Function
5. Edge Function actualiza `subscriptions` y `organizations.tier`
6. Frontend detecta cambio de tier y desbloquea features

### Edge Function (webhook):
```
POST /functions/v1/revenuecat-webhook
- Verifica firma del webhook
- Actualiza subscription status
- Actualiza tier de la organización
- Envía notificación al usuario
```

---

## Notas de Implementación

- **No implementar restricciones aún**: La app funciona sin límites mientras desarrollamos
- **Tracking**: Agregar analytics de uso por feature para decidir qué monetizar
- **Pricing**: Definir precios después de validar con usuarios beta
- **Trial**: Considerar 14 días de trial del tier Pro para nuevos registros
