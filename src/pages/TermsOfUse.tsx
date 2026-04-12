/**
 * Archivo: TermsOfUse.tsx
 * Ruta: src/pages/TermsOfUse.tsx
 * Última modificación: 2026-04-10
 * Descripción: Términos de Uso de Woditos. Ruta pública /terminos.
 *   Ley aplicable: República Argentina.
 */
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import woditosLogo from '@/assets/woditos-logo.png';

const LAST_UPDATED = '10 de abril de 2026';
const CONTACT_EMAIL = 'woditos.soporte@gmail.com';

export default function TermsOfUse() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} /> Volver
          </button>
        </div>

        <div className="text-center space-y-3">
          <img src={woditosLogo} alt="Woditos" className="h-12 mx-auto" />
          <h1 className="font-display text-3xl font-extrabold text-foreground">
            Términos de Uso
          </h1>
          <p className="text-sm text-muted-foreground">
            Última actualización: {LAST_UPDATED}
          </p>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-foreground/80">
          Al registrarte o usar Woditos, aceptás estos Términos de Uso en su totalidad.
          Si no estás de acuerdo con alguna parte, no uses el servicio.
          Estos términos se rigen por las leyes de la <strong>República Argentina</strong>.
        </div>

        {/* ── Secciones ───────────────────────────────────────── */}
        <Section number="1" title="Descripción del servicio">
          <p>
            <strong>Woditos</strong> es una plataforma digital de gestión para comunidades de running y
            entrenamiento funcional. Permite a coaches organizar sesiones, gestionar asistencia,
            asignar rutinas y comunicarse con sus miembros. Los miembros pueden reservar sesiones,
            ver su progreso y participar en la comunidad de su club.
          </p>
          <p>
            Woditos es un servicio de organización deportiva. <strong>No reemplaza la orientación
            médica, nutricional ni de salud profesional.</strong> Cualquier decisión relacionada
            con tu salud debe tomarse en consulta con profesionales habilitados.
          </p>
        </Section>

        <Section number="2" title="Registro y responsabilidad de la cuenta">
          <ul>
            <li>Debés tener al menos 13 años para registrarte. Los menores de 18 requieren autorización de un padre, madre o tutor legal.</li>
            <li>Sos responsable de mantener la confidencialidad de tu contraseña y de todas las actividades realizadas desde tu cuenta.</li>
            <li>Debés proveer información verdadera, precisa y actualizada al registrarte. El uso de datos falsos puede resultar en la suspensión de la cuenta.</li>
            <li>Notificanos inmediatamente en {CONTACT_EMAIL} si sospechás que tu cuenta fue comprometida.</li>
            <li>Cada persona puede tener una sola cuenta. La creación de múltiples cuentas para evadir suspensiones está prohibida.</li>
          </ul>
        </Section>

        <Section number="3" title="Uso aceptable">
          <p>Al usar Woditos te comprometés a:</p>
          <ul>
            <li>No compartir tus credenciales de acceso con otras personas.</li>
            <li>No usar la plataforma para actividades ilegales, fraudulentas o que infrinjan derechos de terceros.</li>
            <li>No intentar acceder a cuentas, datos o sistemas sin autorización.</li>
            <li>No publicar contenido ofensivo, discriminatorio, violento o que acose a otros usuarios.</li>
            <li>No enviar spam ni mensajes masivos no solicitados a través del sistema de notificaciones.</li>
            <li>No intentar descompilar, hacer ingeniería inversa ni atacar la infraestructura de Woditos.</li>
            <li>No usar scripts automatizados, bots ni herramientas que generen carga indebida sobre el servicio.</li>
          </ul>
          <p className="mt-2">
            El incumplimiento de estas normas puede resultar en la suspensión inmediata y permanente de tu cuenta.
          </p>
        </Section>

        <Section number="4" title="Roles: Coach y Miembro">
          <SubSection title="Coaches">
            <ul>
              <li>Los coaches son responsables de la gestión de su club, sus sesiones y el contenido que publican.</li>
              <li>Al crear un club, el coach asume la responsabilidad de administrar los datos de sus miembros con diligencia y respeto.</li>
              <li>Los coaches no deben usar las notas, el feedback o los datos de asistencia de sus miembros para fines ajenos a la gestión deportiva.</li>
              <li>Los coaches son responsables de obtener el consentimiento de los padres/tutores de los menores que se unan a su club.</li>
              <li>Las invitaciones de coach deben enviarse solo a personas que aceptaron unirse al club.</li>
            </ul>
          </SubSection>
          <SubSection title="Miembros">
            <ul>
              <li>Los miembros son responsables de la veracidad de su información de perfil.</li>
              <li>Al reservar una sesión, el miembro se compromete a notificar al coach si no puede asistir con la mayor antelación posible.</li>
              <li>El feedback post-sesión debe ser honesto y respetuoso. No debe usarse para hacer comentarios difamatorios o falsos.</li>
            </ul>
          </SubSection>
        </Section>

        <Section number="5" title="Contenido generado por el usuario">
          <p>
            Woditos te permite publicar contenido: posts en el feed, comentarios, feedback y notas.
          </p>
          <ul>
            <li>Sos responsable del contenido que publicás. No debe violar derechos de terceros ni incumplir las leyes argentinas.</li>
            <li>Al publicar contenido, nos otorgás una licencia no exclusiva para mostrarlo dentro de la plataforma a los usuarios autorizados de tu club.</li>
            <li>No reclamamos propiedad sobre tu contenido. Podés eliminarlo en cualquier momento.</li>
            <li>Nos reservamos el derecho de eliminar contenido que viole estos Términos, sin previo aviso.</li>
          </ul>
        </Section>

        <Section number="6" title="Limitación de responsabilidad">
          <p>En la máxima medida permitida por la ley argentina:</p>
          <ul>
            <li><strong>Woditos no es responsable por lesiones, accidentes o daños a la salud</strong> que puedan ocurrir durante o en relación con las actividades físicas organizadas a través de la plataforma.</li>
            <li>Woditos no garantiza la disponibilidad ininterrumpida del servicio. Pueden producirse interrupciones por mantenimiento, fallas técnicas u otras causas fuera de nuestro control.</li>
            <li>No nos responsabilizamos por la pérdida de datos causada por circunstancias fuera de nuestro control razonable.</li>
            <li>La responsabilidad total de Woditos ante cualquier reclamo no puede exceder el monto pagado por el usuario en los últimos 12 meses (o $0 si el servicio fue gratuito).</li>
          </ul>
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 mt-2">
            <p className="font-semibold text-foreground">⚕️ Importante</p>
            <p>Woditos no es un servicio médico. Consultá siempre con un profesional de la salud antes de iniciar o modificar un plan de entrenamiento.</p>
          </div>
        </Section>

        <Section number="7" title="Propiedad intelectual">
          <ul>
            <li>El nombre <strong>Woditos</strong>, el logo, el diseño de la aplicación, el código fuente y los textos originales son propiedad de Woditos y están protegidos por las leyes de propiedad intelectual vigentes.</li>
            <li>Queda prohibida la reproducción, distribución o modificación de cualquier parte de la plataforma sin autorización escrita previa.</li>
            <li>Los ejercicios de la librería provienen de bases de datos públicas (free-exercise-db) y están bajo sus respectivas licencias de código abierto.</li>
            <li>El contenido que vos generás (posts, feedback, notas) es tuyo. Solo te pedimos la licencia de uso interno descripta en la sección 5.</li>
          </ul>
        </Section>

        <Section number="8" title="Suspensión y cancelación de cuenta">
          <SubSection title="Por tu parte">
            <p>Podés cancelar tu cuenta en cualquier momento escribiéndonos a {CONTACT_EMAIL}. Al hacerlo, tus datos serán eliminados conforme a nuestra Política de Privacidad.</p>
          </SubSection>
          <SubSection title="Por parte de Woditos">
            <p>Podemos suspender o terminar tu cuenta si:</p>
            <ul>
              <li>Violás estos Términos de Uso.</li>
              <li>Usás la plataforma de forma fraudulenta o abusiva.</li>
              <li>Tu comportamiento pone en riesgo la seguridad de otros usuarios o de la plataforma.</li>
              <li>Estás inactivo durante más de 24 meses consecutivos.</li>
            </ul>
            <p>En casos graves (fraude, acoso, contenido ilegal), la suspensión puede ser inmediata y sin previo aviso.</p>
          </SubSection>
        </Section>

        <Section number="9" title="Modificaciones al servicio y a los Términos">
          <p>
            Nos reservamos el derecho de modificar, suspender o discontinuar cualquier funcionalidad de Woditos en cualquier momento.
          </p>
          <p>
            Podemos actualizar estos Términos de Uso. Te notificaremos de cambios significativos por email o mediante un aviso en la app con al menos <strong>15 días de anticipación</strong>. El uso continuado del servicio después de esa fecha implica la aceptación de los nuevos términos.
          </p>
          <p>
            Si no aceptás los cambios, podés cancelar tu cuenta antes de que entren en vigencia.
          </p>
        </Section>

        <Section number="10" title="Ley aplicable y jurisdicción">
          <p>
            Estos Términos de Uso se rigen por las leyes de la <strong>República Argentina</strong>,
            incluyendo pero no limitado al Código Civil y Comercial de la Nación y la Ley 25.326
            de Protección de Datos Personales.
          </p>
          <p>
            Para cualquier controversia derivada de estos Términos, las partes se someten a la
            jurisdicción de los <strong>Tribunales Ordinarios de la Ciudad Autónoma de Buenos Aires</strong>,
            renunciando a cualquier otro fuero que pudiera corresponder.
          </p>
          <p>
            Para consultas, reclamos o ejercicio de derechos: <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>
          </p>
        </Section>

        {/* ── Footer ──────────────────────────────────────────── */}
        <footer className="text-center text-xs text-muted-foreground border-t border-border pt-6 space-y-1">
          <p>© 2026 Woditos. Todos los derechos reservados.</p>
          <p>Última actualización: {LAST_UPDATED}</p>
        </footer>
      </div>
    </div>
  );
}

// ── Componentes auxiliares ───────────────────────────────────

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card border border-border rounded-xl p-6 space-y-3">
      <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-3">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/15 text-primary text-sm font-bold shrink-0">
          {number}
        </span>
        {title}
      </h2>
      <div className="text-sm text-foreground/80 leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-foreground [&_a]:text-primary [&_a:hover]:underline">
        {children}
      </div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="font-semibold text-foreground text-sm">{title}</p>
      {children}
    </div>
  );
}