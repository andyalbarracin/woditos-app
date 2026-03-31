/**
 * Archivo: Support.tsx
 * Ruta: src/pages/Support.tsx
 * Última modificación: 2026-03-30
 * Descripción: Página de soporte, preguntas frecuentes y tutorial de la app.
 *   Incluye guía para coaches y miembros, FAQ, y contacto de soporte.
 */
import woditosLogo from '@/assets/woditos-logo.png';
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

const slogans = [
  'La comunidad que te empuja.',
  'Kilómetros, fuerza y constancia.',
  'Entrenamiento real, gente real.',
  'Donde el esfuerzo se comparte.',
  'Sumá ritmo. Sumá equipo.',
  
];

function getSlogan() {
  return slogans[Math.floor(Math.random() * slogans.length)];
}

export default function Support() {
    const [copied, setCopied] = useState(false)

  const handleCopyEmail = async () => {
    await navigator.clipboard.writeText('woditos.soporte@gmail.com')
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }
  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-fade-in pb-12">

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="text-center space-y-3">
        <img src={woditosLogo} alt="Woditos" className="h-14 mx-auto" />
        <h1 className="font-display text-3xl font-extrabold text-foreground">
          Centro de Ayuda
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Todo lo que necesitás saber para sacarle el máximo provecho a Woditos.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ÍNDICE */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <nav className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="font-display text-lg font-bold text-foreground">Índice</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">General</p>
            <a href="#primeros-pasos" className="block text-primary hover:underline">→ Primeros pasos</a>
            <a href="#registro" className="block text-primary hover:underline">→ Registro y acceso</a>
            <a href="#navegacion" className="block text-primary hover:underline">→ Navegación de la app</a>
            <a href="#perfil" className="block text-primary hover:underline">→ Tu perfil</a>
            <a href="#notificaciones" className="block text-primary hover:underline">→ Notificaciones</a>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Para Miembros</p>
            <a href="#m-reservar" className="block text-primary hover:underline">→ Reservar sesiones</a>
            <a href="#m-agenda" className="block text-primary hover:underline">→ Tu agenda</a>
            <a href="#m-feedback" className="block text-primary hover:underline">→ Feedback post-sesión</a>
            <a href="#m-comunidad" className="block text-primary hover:underline">→ Comunidad y feed</a>
            <a href="#m-insights" className="block text-primary hover:underline">→ Insights y estadísticas</a>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Para Coaches</p>
            <a href="#c-crear-sesion" className="block text-primary hover:underline">→ Crear sesiones</a>
            <a href="#c-gestionar" className="block text-primary hover:underline">→ Tomar, soltar y eliminar sesiones</a>
            <a href="#c-asistencia" className="block text-primary hover:underline">→ Control de asistencia</a>
            <a href="#c-panel" className="block text-primary hover:underline">→ Coach Panel</a>
            <a href="#c-invitar" className="block text-primary hover:underline">→ Invitar coaches y miembros</a>
            <a href="#c-analytics" className="block text-primary hover:underline">→ Analytics</a>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Ayuda</p>
            <a href="#faq" className="block text-primary hover:underline">→ Preguntas frecuentes</a>
            <a href="#contacto" className="block text-primary hover:underline">→ Contacto de soporte</a>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* GENERAL */}
      {/* ═══════════════════════════════════════════════════════════ */}

      <section id="primeros-pasos" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Primeros pasos
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Woditos es una plataforma para comunidades de running y entrenamiento funcional. Conecta a coaches con sus alumnos, permitiendo gestionar sesiones grupales, asistencia, feedback y comunicación - todo en un solo lugar.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Hay dos roles principales: <strong>Coach</strong> (crea y gestiona sesiones, crews y miembros) y <strong>Miembro</strong> (reserva sesiones, recibe feedback y participa de la comunidad).
        </p>
         {/* <div className="bg-muted/30 border border-dashed border-border rounded-xl p-8 text-center text-xs text-muted-foreground">
                 📷 Imagen: Vista general de la app — dashboard de coach y miembro 
        </div>*/}
      </section>

      <section id="registro" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Registro y acceso
        </h2>

        <h3 className="font-display text-lg font-semibold text-foreground mt-4">Crear una cuenta</h3>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Podés registrarte de dos formas: con tu email y contraseña, o directamente con tu cuenta de Google. Al registrarte, elegís si sos <strong>Coach</strong> o <strong>Miembro</strong>.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>Como Miembro:</strong> necesitás un código de club que tu coach te comparte. Ingresalo durante el registro o en la pantalla de onboarding.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>Como Coach:</strong> podés crear tu propio club (se genera automáticamente un código para invitar miembros) o unirte a un club existente si otro coach te envió una invitación.
        </p>
         {/* <div className="bg-muted/30 border border-dashed border-border rounded-xl p-8 text-center text-xs text-muted-foreground">
                📷 Imagen: Pantalla de registro — selección de rol 

        </div>*/}

        <h3 className="font-display text-lg font-semibold text-foreground mt-4">Recuperar contraseña</h3>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Si olvidás tu contraseña, tocá <em>"¿Olvidaste tu contraseña?"</em> en la pantalla de login. Te enviaremos un email con un link para crear una contraseña nueva. El link expira en 24 horas.
        </p>
      </section>

      <section id="navegacion" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Navegación de la app
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>En computadora:</strong> usá la barra lateral (sidebar) a la izquierda. Podés colapsarla con el ícono de menú ☰ para tener más espacio.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>En celular:</strong> usá la barra de navegación en la parte inferior de la pantalla. Las opciones principales son: Inicio, Agenda, Crew (comunidad), Wiki (biblioteca) y Perfil. Los coaches tienen además el ícono de Coach Panel.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          En el header encontrás: el banner de tu próxima sesión, el badge de tu club, la campana de notificaciones, y tu avatar (tocalo para acceder a tu perfil, cambiar tema o cerrar sesión).
        </p>
         {/*<div className="bg-muted/30 border border-dashed border-border rounded-xl p-8 text-center text-xs text-muted-foreground">
               📷 Imagen: Navegación desktop (sidebar) y mobile (bottom nav)

        </div>*/}
      </section>

      <section id="perfil" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Tu perfil
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Desde tu perfil podés: cambiar tu foto (tocá sobre el avatar), editar tu nombre, definir tus objetivos de entrenamiento, y agregar un contacto de emergencia. También tenés tu código QR personal para check-in rápido en sesiones presenciales.
        </p>
        {/*<div className="bg-muted/30 border border-dashed border-border rounded-xl p-8 text-center text-xs text-muted-foreground">
                 📷 Imagen: Pantalla de perfil con stats y edición 

        </div>*/}
      </section>

      <section id="notificaciones" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Notificaciones
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          La campana 🔔 en el header te muestra notificaciones sobre: reservas nuevas, sesiones canceladas, feedback pendiente, anuncios del coach y recordatorios. Las notificaciones no leídas se marcan con un punto azul y un contador.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Podés marcar todas como leídas con un solo toque. Si tenés un navegador compatible, también podés activar notificaciones push para no perderte nada.
        </p>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MIEMBROS */}
      {/* ═══════════════════════════════════════════════════════════ */}

      <div className="border-t border-primary/30 pt-6">
        <h1 className="font-display text-2xl font-extrabold text-primary">
          🏃 Guía para Miembros
        </h1>
      </div>

      <section id="m-reservar" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Reservar sesiones
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Desde la página de <strong>Inicio</strong> o desde <strong>Agenda</strong>, podés ver las sesiones disponibles. Cada sesión muestra: horario, tipo (running, funcional, EMOM, etc.), crew, ubicación, coach asignado y lugares disponibles.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Tocá <strong>"Reservar"</strong> para confirmar tu lugar. Tu coach recibe una notificación automática. Si cambiás de opinión, podés cancelar la reserva antes de que empiece la sesión.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          La barra de lugares te indica cuántos quedan disponibles. Cuando quedan pocos (3 o menos), se muestra en rojo para que te apures.
        </p>
        {/* <div className="bg-muted/30 border border-dashed border-border rounded-xl p-8 text-center text-xs text-muted-foreground">
                 📷 Imagen: Card de sesión con botón Reservar y barra de lugares 

        </div>*/}
      </section>

      <section id="m-agenda" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Tu agenda
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          La <strong>Agenda</strong> te muestra la semana completa con todas las sesiones programadas. Los días que tienen sesiones se marcan con un punto naranja. Tocá un día para ver el detalle.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Navegá entre semanas con las flechas ← →. Tus sesiones reservadas aparecen con el badge "Reservado" y las sesiones pasadas se muestran como "Finalizada" o "Cerrada".
        </p>
      </section>

      <section id="m-feedback" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Feedback post-sesión
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Después de cada sesión a la que asististe, te aparece un modal para dejar tu feedback. Elegí un emoji del 1 al 5, indicá si tuviste alguna incomodidad (si la valoración es baja), y opcionalmente dejá una nota para tu coach.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Si cerrás el modal sin completarlo, queda como notificación pendiente en tu campana 🔔 - podés reabrirlo tocando esa notificación.
        </p>
      </section>

      <section id="m-comunidad" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Comunidad y feed
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          La sección <strong>Crew</strong> es el espacio social del club. Podés ver publicaciones de tu coach y compañeros, dar likes y comentar. Los posts pueden ser de texto, anuncios o logros compartidos.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          En la parte superior encontrás las Stories estilo Instagram - contenido efímero de tu comunidad.
        </p>
      </section>

      <section id="m-insights" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Insights y estadísticas
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          En tu <strong>Perfil</strong> encontrás estadísticas personales: racha de asistencia, sesiones totales, porcentaje de asistencia, y logros desbloqueados.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          La sección "Tu actividad" te muestra: sesiones esta semana vs la anterior, asistencia del mes, tu tipo de sesión favorito, tu compañero/a más frecuente, y tu coach del mes. También una frase motivadora basada en tu racha.
        </p>
         {/*  <div className="bg-muted/30 border border-dashed border-border rounded-xl p-8 text-center text-xs text-muted-foreground">
               📷 Imagen: Insights del miembro — cards de actividad semanal y mensual
        </div> */}

      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* COACHES */}
      {/* ═══════════════════════════════════════════════════════════ */}

      <div className="border-t border-secondary/30 pt-6">
        <h1 className="font-display text-2xl font-extrabold text-secondary">
          🏋️ Guía para Coaches
        </h1>
      </div>

      <section id="c-crear-sesion" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Crear sesiones
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Tocá <strong>"+ Nueva Sesión"</strong> desde el Inicio, la Agenda o el Coach Panel. Se abre un formulario donde configurás:
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>Crew</strong> → elegí uno existente o creá uno nuevo inline.
          <strong> Título</strong> → nombre descriptivo (ej: "AMRAP 20min", "Fartlek en el Rosedal").
          <strong> Tipo</strong> → Running, Funcional, AMRAP, EMOM, HIIT o Técnica.
          <strong> Fecha</strong> → calendario con días pasados bloqueados.
          <strong> Hora</strong> → selectores de hora y minuto en formato 24h.
          <strong> Duración</strong> → ajustable con botones +/- de 15 minutos; muestra la hora de fin automáticamente.
          <strong> Ubicación y capacidad</strong> → opcionales.
        </p>
        {/* <div className="bg-muted/30 border border-dashed border-border rounded-xl p-8 text-center text-xs text-muted-foreground">
                 📷 Imagen: Modal de crear sesión con calendar y selectores 

        </div>*/}
      </section>

      <section id="c-gestionar" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Tomar, soltar y eliminar sesiones
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>Tomar sesión →</strong> si hay sesiones sin coach asignado, aparecen en tu Dashboard con un botón "Tomar". Al tomarla, se te asigna como coach.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>Soltar sesión →</strong> si ya no podés dar una clase, tocá el ícono 👤⁻ en tu sesión. Se desasigna y vuelve a "sin coach". Los inscriptos reciben una notificación.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>Eliminar sesión →</strong> tocá el ícono 🗑️ para eliminarla permanentemente. Se pide confirmación y se informa cuántos inscriptos serán notificados. Solo puede eliminar quien la creó o un super_admin.
        </p>
      </section>

      <section id="c-asistencia" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Control de asistencia
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Desde <strong>Asistencias</strong> en el menú lateral, accedés al control completo. Seleccioná un día en el calendario y una sesión. Para cada inscripto, marcá:
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          ✓ <strong>Presente</strong> (verde) · ⏱ <strong>Tarde</strong> (amarillo) · ✕ <strong>Ausente</strong> (rojo).
          Tocá de nuevo el mismo estado para desmarcarlo. Podés escanear el QR personal del miembro para check-in rápido, o agregar miembros manualmente.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          También podés enviar un mensaje a todos los asistentes de la sesión desde la misma pantalla.
        </p>
        {/* <div className="bg-muted/30 border border-dashed border-border rounded-xl p-8 text-center text-xs text-muted-foreground">
          {/*  📷 Imagen: Pantalla de asistencia con toggles y QR scanner 
        </div>*/}
      </section>

      <section id="c-panel" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Coach Panel
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          El Coach Panel es tu centro de operaciones. Tiene cuatro tabs:
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>📅 Agenda →</strong> calendario mensual con tus sesiones. Seleccioná un día para ver el detalle: inscriptos, asistencia en tiempo real, y acciones de soltar/eliminar.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>👥 Miembros →</strong> lista de todos los miembros de tu club con su nivel de experiencia y estado.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>📊 Analytics →</strong> gráficos de sesiones por tipo, distribución de asistencia, y actividad semanal de los últimos 30 días.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>🔗 Invitar Coach →</strong> generá links de invitación para sumar coaches a tu club. Compartí el código de miembros con tus alumnos.
        </p>
        {/* <div className="bg-muted/30 border border-dashed border-border rounded-xl p-8 text-center text-xs text-muted-foreground">
                {/*  📷 Imagen: Coach Panel — vista de Agenda con calendario y detalle 

        </div>*/}
      </section>

      <section id="c-invitar" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Invitar coaches y miembros
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>Para invitar miembros:</strong> compartí el código de club que aparece en la tab "Invitar Coach" del Coach Panel. Tus alumnos lo ingresan al registrarse y quedan automáticamente vinculados a tu club.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>Para invitar coaches:</strong> generá un link de invitación desde la misma tab. Podés configurar el email sugerido y la fecha de expiración (1 a 30 días). El link se copia automáticamente al portapapeles. Podés revocarlo en cualquier momento.
        </p>
      </section>

      <section id="c-analytics" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Analytics
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          En la tab Analytics del Coach Panel encontrás tres visualizaciones de los últimos 30 días:
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>Sesiones por tipo →</strong> gráfico de barras que muestra cuántas sesiones hubo de cada tipo (running, funcional, EMOM, etc.).
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>Distribución de asistencia →</strong> gráfico de torta con el porcentaje de presentes, tardes y ausentes.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>Actividad semanal →</strong> sesiones dictadas y asistentes por semana, para identificar tendencias.
        </p>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* FAQ */}
      {/* ═══════════════════════════════════════════════════════════ */}

      <div className="border-t border-border pt-6">
        <h1 id="faq" className="font-display text-2xl font-extrabold text-foreground scroll-mt-20">
          Preguntas Frecuentes
        </h1>
      </div>

      <div className="space-y-4">
        {[
          {
            q: '¿Cómo me uno a un club si no tengo el código?',
            a: 'Pedile el código a tu coach. Él lo encuentra en Coach Panel → Invitar Coach. Es un código de 6 caracteres que ingresás al registrarte.',
          },
          {
            q: '¿Puedo pertenecer a más de un club?',
            a: 'Por ahora, cada usuario pertenece a un solo club. Esta funcionalidad se expandirá en futuras versiones.',
          },
          {
            q: '¿Qué pasa si mi coach elimina una sesión a la que me inscribí?',
            a: 'Recibís una notificación automática informándote que la sesión fue cancelada. Tu reserva se elimina sin que tengas que hacer nada.',
          },
          {
            q: '¿Puedo cancelar una reserva?',
            a: 'Sí, tocá "Cancelar" en tu sesión confirmada desde el Dashboard o la Agenda. Podés hacerlo en cualquier momento antes de que empiece la sesión.',
          },
          {
            q: '¿Qué significa "Cerrada" en una sesión?',
            a: 'Significa que la sesión ya terminó. No se puede reservar ni cancelar. Si asististe, tu coach puede marcar tu asistencia.',
          },
          {
            q: '¿Cómo cambio mi foto de perfil?',
            a: 'Andá a Perfil → pasá el mouse (o tocá) sobre tu avatar → aparece un ícono de cámara. Tocalo para subir una imagen nueva (máximo 20MB).',
          },
          {
            q: '¿Cómo funciona el QR personal?',
            a: 'En tu Perfil hay un botón de QR. Al tocarlo, se genera un código QR único. Tu coach lo escanea con la función de Asistencia para hacer check-in rápido sin buscar tu nombre.',
          },
          {
            q: '¿La app funciona offline?',
            a: 'No, Woditos requiere conexión a internet para funcionar correctamente. Todas las operaciones se sincronizan en tiempo real con el servidor.',
          },
          {
            q: '¿Cómo recupero mi contraseña?',
            a: 'En la pantalla de login, tocá "¿Olvidaste tu contraseña?". Ingresá tu email y te enviamos un link para crear una contraseña nueva.',
          },
          {
            q: '¿Cómo cierro sesión en el celular?',
            a: 'Tocá tu avatar en la esquina superior derecha del header. Se abre un menú con la opción "Cerrar sesión".',
          },
        ].map(({ q, a }, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm font-semibold text-foreground">{q}</p>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{a}</p>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* CONTACTO */}
      {/* ═══════════════════════════════════════════════════════════ */}

      <section id="contacto" className="scroll-mt-20">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center space-y-3">
          <h2 className="font-display text-xl font-bold text-foreground">¿Necesitás ayuda?</h2>
          <p className="text-sm text-muted-foreground">
            Si no encontrás la respuesta que buscás, escribinos y te respondemos a la brevedad.</p>
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold">
  <span>✉ woditos.soporte@gmail.com</span>

  <button
    type="button"
    onClick={handleCopyEmail}
    className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
    aria-label="Copiar email de soporte"
    title={copied ? 'Copiado' : 'Copiar email'}
  >
    {copied ? <Check size={16} /> : <Copy size={16} />}
  </button>

  {copied && (
    <span className="text-xs font-medium opacity-90">
      Copiado
    </span>
  )}
</div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* FOOTER */}
      {/* ═══════════════════════════════════════════════════════════ */}

      <footer className="text-center space-y-2 pt-4">
        <p className="text-sm text-foreground/60 italic">
          "{getSlogan()}"
        </p>
        <p className="text-xs text-muted-foreground">
          {/*© 2026 Woditos - Andres Albarracin. Todos los derechos reservados.*/}
        </p>
      </footer>
    </div>
  );
}