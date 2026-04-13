/**
 * Archivo: Plans.tsx
 * Ruta: src/pages/Plans.tsx
 * Última modificación: 2026-04-13
 * Descripción: Página de planes de Woditos. Ruta protegida /planes.
 *   Muestra el plan actual del club y los planes disponibles.
 *   v1.0: contenido dummy — billing no implementado aún (fase beta).
 *   Los planes Pro+ y Enterprise están deshabilitados con aviso beta.
 */
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft, Sparkles, Check, Lock, Zap, Building2, Rocket, Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Tipos ─────────────────────────────────────────────────────
interface PlanFeature {
  text:     string;
  included: boolean;
  soon?:    boolean;
}

interface Plan {
  id:       string;
  name:     string;
  price:    string;
  period:   string;
  members:  string;
  icon:     React.ReactNode;
  color:    string;
  badge?:   string;
  features: PlanFeature[];
  disabled: boolean;
  current:  boolean;
}

// ── Datos de planes ───────────────────────────────────────────
const PLANS: Plan[] = [
  {
    id:      'free',
    name:    'Free',
    price:   '$0',
    period:  'siempre gratis',
    members: 'Hasta 15 miembros',
    icon:    <Users size={20} />,
    color:   'text-muted-foreground',
    features: [
      { text: 'Sesiones y agenda',         included: true  },
      { text: 'Reservas y asistencia',      included: true  },
      { text: 'Feed social y comunidad',    included: true  },
      { text: 'Biblioteca de ejercicios',   included: true  },
      { text: 'Módulo de rutinas',          included: true  },
      { text: 'Feedback post-sesión',       included: true  },
      { text: 'Analytics avanzados',        included: false },
      { text: 'Notificaciones WhatsApp',    included: false },
      { text: 'Multi-coach ilimitado',      included: false },
      { text: 'Export CSV de reportes',     included: false },
    ],
    disabled: false,
    current:  false,
  },
  {
    id:      'pro',
    name:    'Pro',
    price:   '$15 USD',
    period:  'por mes',
    members: 'Hasta 50 miembros',
    icon:    <Zap size={20} />,
    color:   'text-primary',
    badge:   'Tu plan actual',
    features: [
      { text: 'Todo lo de Free',                      included: true,  soon: false },
      { text: 'Hasta 50 miembros',                    included: true,  soon: false },
      { text: 'Analytics avanzados',                  included: true,  soon: true  },
      { text: 'Notificaciones WhatsApp',              included: true,  soon: true  },
      { text: 'Export CSV de reportes',               included: true,  soon: true  },
      { text: 'IA para generar rutinas',              included: true,  soon: true  },
      { text: 'Multi-coach (hasta 3)',                included: true,  soon: true  },
      { text: 'Multi-coach ilimitado',                included: false, soon: false },
      { text: 'Branding personalizado',               included: false, soon: false },
      { text: 'Soporte prioritario',                  included: false, soon: false },
    ],
    disabled: false,
    current:  true,
  },
  {
    id:      'pro_plus',
    name:    'Pro+',
    price:   '$35 USD',
    period:  'por mes',
    members: 'Hasta 150 miembros',
    icon:    <Sparkles size={20} />,
    color:   'text-accent',
    badge:   'Próximamente',
    features: [
      { text: 'Todo lo de Pro',              included: true  },
      { text: 'Hasta 150 miembros',          included: true  },
      { text: 'Multi-coach ilimitado',       included: true  },
      { text: 'Branding personalizado',      included: true  },
      { text: 'Soporte prioritario',         included: true  },
      { text: 'Integración de pagos MP',     included: true  },
      { text: 'Leaderboard y gamificación',  included: true  },
      { text: 'API pública',                 included: false },
      { text: 'White-label',                 included: false },
      { text: 'SLA y soporte dedicado',      included: false },
    ],
    disabled: true,
    current:  false,
  },
  {
    id:      'enterprise',
    name:    'Enterprise',
    price:   '$80 USD',
    period:  'por mes',
    members: 'Miembros ilimitados',
    icon:    <Building2 size={20} />,
    color:   'text-info',
    badge:   'Próximamente',
    features: [
      { text: 'Todo lo de Pro+',             included: true  },
      { text: 'Miembros ilimitados',         included: true  },
      { text: 'API pública documentada',     included: true  },
      { text: 'White-label',                 included: true  },
      { text: 'SSO / integraciones',         included: true  },
      { text: 'SLA y soporte dedicado',      included: true  },
      { text: 'Subdominios personalizados',  included: true  },
      { text: 'Facturación corporativa',     included: true  },
      { text: 'Onboarding personalizado',    included: true  },
      { text: 'Todo incluido',               included: true  },
    ],
    disabled: true,
    current:  false,
  },
];

// ── Componente ────────────────────────────────────────────────
export default function Plans() {
  const navigate    = useNavigate();
  const { clubMembership } = useAuth();

  const clubPlan    = clubMembership?.club?.plan || 'free';
  const clubName    = clubMembership?.club?.name || 'Tu club';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft size={16} /> Volver
        </button>
      </div>

      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-2">
          <Sparkles size={12} />
          {clubName}
        </div>
        <h1 className="font-display text-3xl font-extrabold text-foreground">
          Planes de Woditos
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto text-sm">
          Elegí el plan que mejor se adapte al tamaño y necesidades de tu club.
        </p>
      </div>

      {/* ── Banner beta ─────────────────────────────────────── */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex items-start gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15 shrink-0">
          <Rocket size={20} className="text-primary" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-foreground text-sm">
            🎉 Woditos está en fase beta — todos los clubs tienen Plan Pro gratis
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Mientras Woditos crece junto a vos, todos los usuarios tienen acceso completo al Plan Pro sin costo.
            Cuando lancemos nuevas funcionalidades premium y habilitemos los planes superiores,
            te avisaremos con anticipación para que puedas elegir si querés subir de plan.
            <strong className="text-foreground"> No habrá cambios sorpresa.</strong>
          </p>
        </div>
      </div>

      {/* ── Cards de planes ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map(plan => (
          <PlanCard key={plan.id} plan={plan} currentPlanId={clubPlan} />
        ))}
      </div>

      {/* ── Comparación de características ──────────────────── */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-display text-lg font-bold text-foreground">Comparación detallada</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-3 text-muted-foreground font-medium w-1/2">Funcionalidad</th>
                {PLANS.map(p => (
                  <th key={p.id} className={`text-center px-3 py-3 font-semibold text-xs ${p.disabled ? 'text-muted-foreground/50' : p.color}`}>
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                'Sesiones y agenda',
                'Reservas y asistencia QR',
                'Feed social y comunidad',
                'Módulo de rutinas',
                'Feedback post-sesión',
                'Analytics avanzados',
                'IA para generar rutinas',
                'Notificaciones WhatsApp',
                'Multi-coach',
                'Export CSV',
                'Integración de pagos',
                'Branding personalizado',
                'API pública',
                'Soporte dedicado',
              ].map((feature, i) => {
                const included: Record<string, boolean[]> = {
                  'Sesiones y agenda':           [true,  true,  true,  true ],
                  'Reservas y asistencia QR':    [true,  true,  true,  true ],
                  'Feed social y comunidad':     [true,  true,  true,  true ],
                  'Módulo de rutinas':           [true,  true,  true,  true ],
                  'Feedback post-sesión':        [true,  true,  true,  true ],
                  'Analytics avanzados':         [false, true,  true,  true ],
                  'IA para generar rutinas':     [false, true,  true,  true ],
                  'Notificaciones WhatsApp':     [false, true,  true,  true ],
                  'Multi-coach':                 [false, true,  true,  true ],
                  'Export CSV':                  [false, true,  true,  true ],
                  'Integración de pagos':        [false, false, true,  true ],
                  'Branding personalizado':      [false, false, true,  true ],
                  'API pública':                 [false, false, false, true ],
                  'Soporte dedicado':            [false, false, false, true ],
                };
                return (
                  <tr key={feature} className={i % 2 === 0 ? 'bg-muted/20' : ''}>
                    <td className="px-6 py-2.5 text-foreground/80">{feature}</td>
                    {(included[feature] || [false, false, false, false]).map((has, j) => (
                      <td key={j} className="text-center px-3 py-2.5">
                        {has
                          ? <span className={PLANS[j].disabled ? 'text-muted-foreground/40' : 'text-secondary'}>✓</span>
                          : <span className="text-muted-foreground/30 text-xs">—</span>
                        }
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Footer note ─────────────────────────────────────── */}
      <div className="text-center space-y-2 pb-4">
        <p className="text-xs text-muted-foreground">
          ¿Preguntas sobre los planes? Escribinos a{' '}
          <a href="mailto:woditos.soporte@gmail.com" className="text-primary hover:underline">
            woditos.soporte@gmail.com
          </a>
        </p>
        <p className="text-xs text-muted-foreground/60">
          Los precios están expresados en USD. Facturación mensual. Sin contratos de permanencia.
        </p>
      </div>
    </div>
  );
}

// ── Subcomponente PlanCard ────────────────────────────────────
function PlanCard({ plan, currentPlanId }: { plan: Plan; currentPlanId: string }) {
  const isCurrent = plan.id === currentPlanId || (plan.id === 'pro' && currentPlanId !== 'pro_plus' && currentPlanId !== 'enterprise');

  return (
    <div className={`relative rounded-xl border p-5 flex flex-col gap-4 transition-all ${
      plan.disabled
        ? 'border-border bg-card opacity-50 grayscale'
        : isCurrent
          ? 'border-primary/40 bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.15)]'
          : 'border-border bg-card hover:border-border/80'
    }`}>

      {/* Badge */}
      {plan.badge && (
        <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          plan.disabled
            ? 'bg-muted text-muted-foreground border border-border'
            : 'bg-primary text-primary-foreground'
        }`}>
          {plan.badge}
        </div>
      )}

      {/* Header del plan */}
      <div className="space-y-1 pt-1">
        <div className="flex items-center gap-2">
          <span className={plan.disabled ? 'text-muted-foreground/50' : plan.color}>{plan.icon}</span>
          <span className={`font-display font-bold text-lg ${plan.disabled ? 'text-muted-foreground/50' : 'text-foreground'}`}>
            {plan.name}
          </span>
          {plan.disabled && <Lock size={12} className="text-muted-foreground/50 ml-auto" />}
        </div>
        <div>
          <span className={`font-display font-extrabold text-2xl ${plan.disabled ? 'text-muted-foreground/40' : 'text-foreground'}`}>
            {plan.price}
          </span>
          <span className="text-xs text-muted-foreground ml-1">{plan.period}</span>
        </div>
        <p className={`text-xs ${plan.disabled ? 'text-muted-foreground/40' : 'text-muted-foreground'}`}>
          {plan.members}
        </p>
      </div>

      {/* Features */}
      <ul className="space-y-2 flex-1">
        {plan.features.slice(0, 7).map((f, i) => (
          <li key={i} className={`flex items-center gap-2 text-xs ${
            !f.included ? 'opacity-40' : plan.disabled ? 'opacity-50' : ''
          }`}>
            <span className={`shrink-0 ${f.included ? (plan.disabled ? 'text-muted-foreground' : f.soon ? 'text-muted-foreground/50' : 'text-secondary') : 'text-muted-foreground'}`}>
              {f.included ? <Check size={12} /> : <span className="text-[10px]">—</span>}
            </span>
            <span className={`flex-1 ${f.soon ? 'text-muted-foreground/60' : f.included ? 'text-foreground/80' : 'text-muted-foreground/60'}`}>
              {f.text}
            </span>
            {f.soon && !plan.disabled && (
              <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/50 border border-border/60 rounded px-1 py-0.5 leading-none">
                pronto
              </span>
            )}
          </li>
        ))}
      </ul>

      {/* CTA */}
      {!plan.disabled && (
        isCurrent ? (
          <div className="text-center py-2 rounded-lg bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            ✓ Plan activo · Gratis en beta
          </div>
        ) : (
          <Button variant="outline" size="sm" className="w-full text-xs" disabled>
            Disponible próximamente
          </Button>
        )
      )}

      {plan.disabled && (
        <div className="text-center py-2 rounded-lg bg-muted/50 text-xs text-muted-foreground/50 font-medium">
          🔒 Próximamente
        </div>
      )}
    </div>
  );
}