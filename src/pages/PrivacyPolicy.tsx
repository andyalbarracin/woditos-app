/**
 * Archivo: PrivacyPolicy.tsx
 * Ruta: src/pages/PrivacyPolicy.tsx
 * Última modificación: 2026-04-10
 * Descripción: Política de Privacidad de Woditos. Ruta pública /privacidad.
 *   Cumple con Ley 25.326 de Protección de Datos Personales (Argentina).
 */
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import woditosLogo from '@/assets/woditos-logo.png';

const LAST_UPDATED = '10 de abril de 2026';
const CONTACT_EMAIL = 'woditos.soporte@gmail.com';

export default function PrivacyPolicy() {
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
            Política de Privacidad
          </h1>
          <p className="text-sm text-muted-foreground">
            Última actualización: {LAST_UPDATED}
          </p>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-foreground/80">
          Esta política describe cómo Woditos recopila, usa y protege tu información personal,
          en cumplimiento de la <strong>Ley 25.326 de Protección de Datos Personales</strong> de
          la República Argentina y sus normas reglamentarias.
        </div>

        {/* ── Secciones ───────────────────────────────────────── */}
        <Section number="1" title="¿Qué datos recopilamos?">
          <p>Al usar Woditos recopilamos los siguientes datos:</p>
          <SubSection title="Datos que vos nos proporcionás">
            <ul>
              <li><strong>Nombre completo</strong> — para identificarte dentro de tu club.</li>
              <li><strong>Dirección de email</strong> — para autenticación y comunicaciones del servicio.</li>
              <li><strong>Contraseña</strong> — almacenada de forma encriptada por Supabase Auth. Nunca la vemos.</li>
              <li><strong>Fecha de nacimiento</strong> — requerida al registrarse. Se usa para verificar que los menores cuenten con autorización de un adulto.</li>
              <li><strong>Peso corporal (kg)</strong> — opcional. Solo visible para vos y tu coach. Ayuda a personalizar el entrenamiento.</li>
              <li><strong>Frecuencia de actividad física</strong> — opcional. Indica cuántas veces por semana hacés actividad.</li>
              <li><strong>Foto de perfil</strong> — opcional. Solo si la subís vos.</li>
              <li><strong>Objetivos de entrenamiento</strong> — texto libre, opcional.</li>
              <li><strong>Contacto de emergencia</strong> — texto libre, opcional.</li>
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              Al completar tu perfil, declarás que todos los datos son verdaderos y fueron cargados voluntariamente por vos.
            </p>
          </SubSection>
          <SubSection title="Datos generados por el uso de la app">
            <ul>
              <li><strong>Historial de asistencia</strong> a sesiones: presente, tarde o ausente.</li>
              <li><strong>Reservas de sesiones.</strong></li>
              <li><strong>Feedback post-sesión</strong>: valoración (1-5), incomodidades y comentarios opcionales.</li>
              <li><strong>Notas del coach</strong> sobre tu progreso (solo visibles para el coach que las escribe).</li>
              <li><strong>Publicaciones y comentarios</strong> en el feed del club.</li>
              <li><strong>Rutinas asignadas</strong> por tu coach.</li>
            </ul>
          </SubSection>
          <SubSection title="Datos técnicos">
            <ul>
              <li>Token de sesión de autenticación (almacenado en localStorage por Supabase Auth).</li>
              <li>No recopilamos dirección IP, geolocalización ni datos del dispositivo.</li>
            </ul>
          </SubSection>
        </Section>

        <Section number="2" title="¿Para qué usamos tus datos?">
          <p>Usamos tu información exclusivamente para las siguientes finalidades:</p>
          <ul>
            <li>Crear y gestionar tu cuenta de usuario.</li>
            <li>Permitir que tu coach organice sesiones, tome asistencia y asigne rutinas.</li>
            <li>Enviarte notificaciones relacionadas con tu actividad dentro del club (reservas, feedback pendiente, anuncios).</li>
            <li>Mostrar estadísticas de tu progreso en tu perfil personal.</li>
            <li>Facilitar la comunicación dentro de tu comunidad deportiva.</li>
          </ul>
          <p className="mt-3">
            <strong>No usamos tus datos para publicidad, perfilamiento comercial ni los vendemos a terceros bajo ninguna circunstancia.</strong>
          </p>
        </Section>

        <Section number="3" title="¿Cómo se almacenan y protegen tus datos?">
          <ul>
            <li>Todos los datos se almacenan en <strong>Supabase</strong>, plataforma que opera sobre infraestructura de <strong>Amazon Web Services (AWS)</strong> en servidores con altos estándares de seguridad.</li>
            <li>Woditos implementa <strong>Row Level Security (RLS)</strong> en la base de datos: cada usuario solo puede acceder a sus propios datos o a los de su club, según su rol.</li>
            <li>Las contraseñas nunca se almacenan en texto plano — son gestionadas por Supabase Auth con encriptación bcrypt.</li>
            <li>La comunicación entre la app y los servidores se realiza siempre sobre <strong>HTTPS/TLS</strong>.</li>
            <li>Los datos de feedback, notas del coach y asistencia están protegidos con políticas de acceso por rol: un miembro no puede ver las notas que su coach escribió sobre él, ni el feedback de otros miembros.</li>
          </ul>
        </Section>

        <Section number="4" title="¿Con quién compartimos tus datos?">
          <SubSection title="Dentro de Woditos">
            <ul>
              <li>Tu <strong>nombre y foto de perfil</strong> son visibles para otros miembros y coaches de tu club.</li>
              <li>Tu <strong>asistencia y feedback</strong> son visibles para los coaches de tu club.</li>
              <li>Las <strong>notas del coach</strong> son privadas entre el coach que las escribe y los administradores del sistema.</li>
            </ul>
          </SubSection>
          <SubSection title="Terceros proveedores de servicio">
            <p>Woditos utiliza los siguientes proveedores para operar:</p>
            <ul>
              <li><strong>Supabase</strong> — base de datos y autenticación (AWS, GDPR compliant).</li>
              <li><strong>Google</strong> — autenticación OAuth opcional.</li>
              <li><strong>Vercel</strong> — hosting y entrega de la aplicación.</li>
              <li><strong>GitHub CDN</strong> — imágenes de ejercicios de la librería pública.</li>
            </ul>
            <p className="mt-2">Ninguno de estos proveedores utiliza tus datos personales para sus propios fines comerciales en el marco de este servicio.</p>
          </SubSection>
          <p className="mt-3 font-medium">
            No compartimos tus datos con empresas de publicidad, marketing ni terceros no mencionados en esta política.
          </p>
        </Section>

        <Section number="5" title="Tus derechos">
          <p>En virtud de la Ley 25.326, tenés los siguientes derechos sobre tus datos:</p>
          <ul>
            <li><strong>Acceso:</strong> podés solicitar una copia de todos los datos que tenemos sobre vos.</li>
            <li><strong>Rectificación:</strong> podés corregir tu nombre, email y demás datos de perfil directamente desde la app en cualquier momento.</li>
            <li><strong>Cancelación/Eliminación:</strong> podés solicitar la eliminación completa de tu cuenta y todos tus datos asociados escribiéndonos a {CONTACT_EMAIL}. Procesamos estas solicitudes en un plazo máximo de 30 días.</li>
            <li><strong>Oposición:</strong> podés oponerte al tratamiento de tus datos en cualquier momento contactándonos.</li>
          </ul>
          <p className="mt-3">
            Para ejercer cualquiera de estos derechos, escribinos a <strong>{CONTACT_EMAIL}</strong> indicando tu email de cuenta y la acción que querés tomar.
          </p>
        </Section>

        <Section number="6" title="Cookies y almacenamiento local">
          <p>
            Woditos no usa cookies de seguimiento ni de publicidad.
          </p>
          <p className="mt-2">
            <strong>Supabase Auth</strong> almacena el token de sesión en el <strong>localStorage</strong> de tu navegador. Este dato se usa únicamente para mantenerte autenticado y se elimina automáticamente al cerrar sesión. No contiene información personal más allá del identificador de sesión.
          </p>
          <p className="mt-2">
            No usamos herramientas de analytics de terceros (Google Analytics, Mixpanel, etc.).
          </p>
        </Section>

        <Section number="7" title="Datos de menores de edad">
          <p>
            Woditos puede ser utilizado por menores de edad en el contexto de clubes deportivos supervisados por un coach.
          </p>
          <ul>
            <li>Si sos menor de 18 años, necesitás la autorización de un padre, madre o tutor legal para registrarte.</li>
            <li>Los coaches son responsables de obtener el consentimiento parental correspondiente para los menores a su cargo.</li>
            <li>No recopilamos datos sensibles adicionales de menores más allá de los necesarios para la gestión deportiva.</li>
            <li>En ningún caso publicamos ni exponemos datos de menores a terceros.</li>
          </ul>
          <p className="mt-3">
            Si sos padre/madre/tutor y creés que un menor proporcionó datos sin tu consentimiento, contactanos en {CONTACT_EMAIL} para gestionar su eliminación inmediata.
          </p>
        </Section>

        <Section number="8" title="Retención de datos">
          <ul>
            <li>Los datos de tu cuenta y perfil se conservan mientras la cuenta esté activa.</li>
            <li>Al eliminar tu cuenta, eliminamos: perfil, historial de asistencia, feedback, reservas y notas asociadas.</li>
            <li>Las publicaciones en el feed del club pueden permanecer de forma anónima durante un período de hasta 90 días antes de su eliminación definitiva.</li>
            <li>Podemos retener información mínima (email hasheado) durante hasta 6 meses por razones de seguridad y prevención de fraude.</li>
          </ul>
        </Section>

        <Section number="9" title="Cambios en esta política">
          <p>
            Podemos actualizar esta Política de Privacidad ocasionalmente. Cuando lo hagamos, actualizaremos la fecha de "última actualización" al inicio de este documento y, si los cambios son significativos, te notificaremos por email o mediante un aviso en la app.
          </p>
          <p className="mt-2">
            El uso continuado de Woditos después de publicados los cambios implica la aceptación de la nueva política.
          </p>
        </Section>

        <Section number="10" title="Contacto">
          <p>Para cualquier consulta, reclamo o ejercicio de tus derechos sobre tus datos personales:</p>
          <div className="mt-3 bg-card border border-border rounded-lg p-4 text-sm">
            <p className="font-semibold text-foreground">Woditos</p>
            <p className="text-muted-foreground mt-1">Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a></p>
            <p className="text-muted-foreground">País de operación: República Argentina</p>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Si considerás que tus derechos no fueron atendidos, podés presentar una denuncia ante la
            <strong> Agencia de Acceso a la Información Pública (AAIP)</strong>, organismo de control de la Ley 25.326
            en Argentina (<a href="https://www.argentina.gob.ar/aaip" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.argentina.gob.ar/aaip</a>).
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