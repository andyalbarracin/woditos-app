/**
 * Archivo: Support.tsx
 * Ruta: src/pages/Support.tsx
 * Última modificación: 2026-04-14
 * Descripción: Página de soporte, preguntas frecuentes y tutorial de la app.
 *   v1.2: actualizada para Woditos v2.0 — rutinas, librería de ejercicios,
 *         detalle de sesión, beta y planes, navegación actualizada.
 */
import woditosLogo from '@/assets/woditos-logo.png';
import { Copy, Check, FileText, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

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
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = async () => {
    await navigator.clipboard.writeText('woditos.soporte@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-fade-in pb-12">

      {/* HEADER */}
      <div className="text-center space-y-3">
        <img src={woditosLogo} alt="Woditos" className="h-14 mx-auto" />
        <h1 className="font-display text-3xl font-extrabold text-foreground">
          Centro de Ayuda
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Todo lo que necesitás saber para sacarle el máximo provecho a Woditos.
        </p>
      </div>

      {/* BETA BANNER */}
      <div className="bg-primary/10 border border-primary/30 rounded-xl p-5 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🚀</span>
          <h2 className="font-display font-bold text-foreground">Woditos está en Beta</h2>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Estamos en fase beta abierta. Todos los clubes tienen acceso completo al <strong>Plan Pro</strong> sin costo mientras la plataforma crece. Cuando lancemos funcionalidades premium y habilitemos los planes superiores, te avisaremos con anticipación para que puedas decidir con tiempo.
        </p>
        <p className="text-sm text-muted-foreground">
          Tu feedback es clave — escribinos a woditos.soporte@gmail.com con sugerencias o reportes de errores.
        </p>
      </div>

      {/* ÍNDICE */}
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
            <a href="#planes" className="block text-primary hover:underline">→ Planes y Beta</a>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Para Miembros</p>
            <a href="#m-reservar" className="block text-primary hover:underline">→ Reservar sesiones</a>
            <a href="#m-agenda" className="block text-primary hover:underline">→ Tu agenda</a>
            <a href="#m-feedback" className="block text-primary hover:underline">→ Feedback post-sesión</a>
            <a href="#m-rutinas" className="block text-primary hover:underline">→ Rutinas asignadas</a>
            <a href="#m-comunidad" className="block text-primary hover:underline">→ Comunidad y feed</a>
            <a href="#m-insights" className="block text-primary hover:underline">→ Insights y estadísticas</a>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Para Coaches</p>
            <a href="#c-crear-sesion" className="block text-primary hover:underline">→ Crear sesiones</a>
            <a href="#c-detalle-sesion" className="block text-primary hover:underline">→ Detalle de sesión</a>
            <a href="#c-gestionar" className="block text-primary hover:underline">→ Tomar, soltar y eliminar</a>
            <a href="#c-asistencia" className="block text-primary hover:underline">→ Control de asistencia</a>
            <a href="#c-rutinas" className="block text-primary hover:underline">→ Rutinas</a>
            <a href="#c-panel" className="block text-primary hover:underline">→ Coach Panel</a>
            <a href="#c-invitar" className="block text-primary hover:underline">→ Invitar coaches y miembros</a>
            <a href="#c-analytics" className="block text-primary hover:underline">→ Analytics</a>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Recursos</p>
            <a href="#libreria" className="block text-primary hover:underline">→ Librería de ejercicios</a>
            <a href="#faq" className="block text-primary hover:underline">→ Preguntas frecuentes</a>
            <a href="#contacto" className="block text-primary hover:underline">→ Contacto de soporte</a>
            <a href="#legal" className="block text-primary hover:underline">→ Legal</a>
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
          Woditos es una plataforma para comunidades de running y entrenamiento funcional. Conecta a coaches con sus alumnos permitiendo gestionar sesiones grupales, rutinas de entrenamiento, asistencia, feedback y comunicación — todo en un solo lugar.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Hay dos roles principales: <strong>Coach</strong> (crea sesiones y rutinas, gestiona crews y miembros, analiza performance) y <strong>Miembro</strong> (reserva sesiones, recibe y completa rutinas, participa de la comunidad).
        </p>
      </section>

      <section id="registro" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Registro y acceso
        </h2>
        <h3 className="font-display text-lg font-semibold text-foreground mt-4">Crear una cuenta</h3>
        <p className="text-sm text-foreground/80 leading-relaxed">
          El registro tiene cuatro pasos: elegís tu rol (Coach o Miembro), configurás tu perfil, definís tus objetivos de entrenamiento, y conectás con tu club.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>Como Miembro:</strong> necesitás un código de club que tu coach te comparte. Ingresalo en el último paso del registro o en la pantalla de onboarding si lo saltás.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>Como Coach:</strong> podés crear tu propio club (se genera automáticamente un código para invitar miembros) o unirte a un club existente con una invitación de otro coach.
        </p>
        <h3 className="font-display text-lg font-semibold text-foreground mt-4">Recuperar contraseña</h3>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Tocá <em>"¿Olvidaste tu contraseña?"</em> en la pantalla de login. Ingresá tu email y te enviamos un link para crear una contraseña nueva (expira en 24 horas).
        </p>
      </section>

      <section id="navegacion" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Navegación de la app
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>En computadora:</strong> usá la barra lateral (sidebar) a la izquierda. Podés colapsarla con el ícono ☰ para tener más espacio. El logo Woditos te lleva al inicio.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>En celular:</strong> usá la barra de navegación inferior. Las opciones son: Inicio, Agenda, Crew, Wiki, Perfil, Rutinas. Los coaches tienen además el ícono Coach.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          En el header encontrás: el banner de tu próxima sesión (desktop), el badge de tu club (tocalo para ver los planes), la campana de notificaciones, y tu avatar (acceso a perfil, tema y logout).
        </p>
      </section>

      <section id="perfil" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Tu perfil
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Desde tu perfil podés: cambiar tu foto (tocá el avatar), editar tu nombre, definir objetivos de entrenamiento, y agregar un contacto de emergencia. También tenés tu código QR personal para check-in rápido en sesiones presenciales.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          La sección <strong>"Tu actividad"</strong> muestra: sesiones esta semana vs la anterior, asistencia del mes, tipo de sesión favorito, compañero/a más frecuente, coach del mes y frases motivadoras según tu racha.
        </p>
      </section>

      <section id="notificaciones" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Notificaciones
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          La campana 🔔 en el header muestra notificaciones sobre: reservas, sesiones canceladas, feedback pendiente, rutinas asignadas, anuncios del coach y recordatorios. Los no leídos se marcan con un punto y un contador.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Tocando una notificación de feedback pendiente, se reabre el modal directamente. Podés marcar todas como leídas con un solo toque.
        </p>
      </section>

      <section id="planes" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Planes y Beta
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Durante la fase beta, <strong>todos los clubes tienen Plan Pro activo sin costo</strong>. Esto incluye acceso a todas las funcionalidades actuales: rutinas, librería de ejercicios, analytics, invitaciones, y más.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Podés ver el estado de tu plan tocando el badge de tu club en el header (el punto naranja con el nombre). Desde ahí se accede a la página de Planes donde se detalla qué incluye cada nivel.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Cuando se habiliten los planes de pago, los clubes en beta recibirán un aviso anticipado y condiciones especiales para coaches fundadores.
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
          Desde <strong>Inicio</strong> o <strong>Agenda</strong> podés ver las sesiones disponibles. Cada sesión muestra: horario, tipo, crew, coach y lugares disponibles con barra de progreso.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Tocá <strong>"Reservar"</strong> para confirmar tu lugar (el coach recibe notificación). Podés cancelar en cualquier momento antes de que empiece la sesión.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Cuando quedan 3 o menos lugares, la barra se muestra en rojo para que te apures.
        </p>
      </section>

      <section id="m-agenda" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Tu agenda
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          La <strong>Agenda</strong> muestra la semana completa. Los días con sesiones tienen un punto naranja. Las sesiones pasadas aparecen como "Finalizada" o "Cerrada" y no se pueden reservar ni cancelar.
        </p>
      </section>

      <section id="m-feedback" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Feedback post-sesión
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Después de cada sesión aparece un modal para dejar tu feedback: elegí un emoji del 1 al 5, indicá si tuviste incomodidades (si la valoración es baja) y dejá una nota opcional para tu coach.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Si cerrás el modal sin completarlo, queda como notificación pendiente en tu campana 🔔 para reabrirlo después.
        </p>
      </section>

      <section id="m-rutinas" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Rutinas asignadas
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          En la sección <strong>Rutinas</strong> encontrás dos tabs: <strong>Pendientes</strong> (rutinas que tu coach te asignó para hacer) e <strong>Historial</strong> (rutinas que ya completaste).
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Tocá una rutina para ver el detalle de ejercicios. Cuando estés listo, tocá <strong>"Completar"</strong> para registrar tu resultado: cómo te sentiste (emoji), RPE (esfuerzo percibido del 1 al 10), tiempo total, y pesos/reps por ejercicio de forma opcional.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Al completar una rutina, tu coach recibe una notificación automática con tu resultado.
        </p>
      </section>

      <section id="m-comunidad" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Comunidad y feed
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          La sección <strong>Crew</strong> es el espacio social del club. Podés ver publicaciones de tu coach y compañeros, dar likes y comentar. En la parte superior están las Stories estilo Instagram — contenido efímero de tu comunidad.
        </p>
      </section>

      <section id="m-insights" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Insights y estadísticas
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          En tu <strong>Perfil</strong> encontrás estadísticas personales: racha de asistencia, sesiones totales, porcentaje de asistencia y logros desbloqueados. La sección "Tu actividad" detalla patrones de entrenamiento y compara semanas.
        </p>
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
          Tocá <strong>"+ Nueva Sesión"</strong> desde el Inicio, la Agenda o el Coach Panel. Configurás: crew, título, tipo (Running, Funcional, AMRAP, EMOM, HIIT, Técnica), fecha, hora, duración (botones +/- de 15 min), ubicación y capacidad.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          También podés asignar una rutina a la sesión directamente desde el módulo de Rutinas.
        </p>
      </section>

      <section id="c-detalle-sesion" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Detalle de sesión
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Desde la Agenda, tocando una sesión accedés a su página de detalle con tres tabs:
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>👥 Asistencia →</strong> listado de inscriptos con estado de asistencia (presente / tarde / ausente).
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>📋 Rutinas →</strong> rutinas asignadas a esta sesión con estado de completado por cada miembro.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>📝 Notas →</strong> notas internas del coach para la sesión.
        </p>
      </section>

      <section id="c-gestionar" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Tomar, soltar y eliminar sesiones
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>Tomar sesión →</strong> las sesiones sin coach aparecen en tu Dashboard con botón "Tomar".
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>Soltar sesión →</strong> tocá el ícono 👤⁻ para desasignarte. Los inscriptos reciben una notificación.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>Eliminar sesión →</strong> tocá 🗑️ para eliminarla permanentemente (se pide confirmación). Solo puede eliminarla quien la creó o un super_admin.
        </p>
      </section>

      <section id="c-asistencia" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Control de asistencia
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Desde <strong>Sesiones</strong> en el menú, seleccioná un día y una sesión. Para cada inscripto marcá: ✓ Presente · ⏱ Tarde · ✕ Ausente. Tocá de nuevo el mismo estado para desmarcarlo.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Podés escanear el QR personal del miembro para check-in rápido, agregar miembros manualmente, o enviar un mensaje a todos los asistentes desde la misma pantalla.
        </p>
      </section>

      <section id="c-rutinas" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Rutinas
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Desde <strong>Rutinas</strong> en el menú podés crear y gestionar rutinas de entrenamiento para tu club. Al crear una rutina configurás:
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>Nombre y tipo</strong> (Fuerza, Cardio, Funcional, Movilidad, etc.) · <strong>Nivel</strong> (Principiante, Intermedio, Avanzado) · <strong>Duración estimada</strong> · <strong>Ejercicios</strong> con series, repeticiones y peso opcionales.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Los ejercicios se seleccionan desde una librería de +870 ejercicios categorizados. Podés buscar por nombre, grupo muscular o equipo.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Una vez creada, podés <strong>asignar la rutina a una sesión</strong> (usando el calendario para elegir el día y seleccionando la sesión) o asignarla directamente a miembros específicos.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Cuando un miembro completa una rutina, recibís una notificación con su resultado (feeling, RPE, tiempo y pesos registrados).
        </p>
      </section>

      <section id="c-panel" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Coach Panel
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Tu centro de operaciones con cinco tabs:
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>📅 Agenda →</strong> calendario mensual con tus sesiones por día, asistencia rápida y botones de acción.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>👥 Miembros →</strong> lista de todos los miembros del club con nivel de experiencia y estado.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>📊 Analytics →</strong> sesiones por tipo, distribución de asistencia y actividad semanal (últimos 30 días). Incluye análisis de feedback emocional de miembros.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>📋 Rutinas →</strong> acceso rápido a tus rutinas y botón "Nueva Rutina".
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>🔗 Invitar →</strong> generá links de invitación para sumar coaches a tu club.
        </p>
      </section>

      <section id="c-invitar" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Invitar coaches y miembros
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>Para miembros:</strong> compartí el código de club de 6 caracteres que aparece en la tab "Invitar". El miembro lo ingresa al registrarse o en el onboarding.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>Para coaches:</strong> generá un link de invitación con email sugerido y fecha de expiración (1 a 30 días).
        </p>
      </section>

      <section id="c-analytics" className="space-y-4 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold text-foreground border-b border-border pb-2">
          Analytics
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          En Analytics del Coach Panel encontrás visualizaciones de los últimos 30 días: <strong>Sesiones por tipo</strong> (barras), <strong>Distribución de asistencia</strong> (torta), <strong>Actividad semanal</strong> (sesiones y asistentes) y <strong>Feedback emocional</strong> de miembros por sesión.
        </p>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* LIBRERÍA */}
      {/* ═══════════════════════════════════════════════════════════ */}

      <section id="libreria" className="space-y-4 scroll-mt-20">
        <div className="border-t border-border pt-6">
          <h1 className="font-display text-2xl font-extrabold text-foreground scroll-mt-20">
            📚 Librería de Ejercicios
          </h1>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed">
          En la sección <strong>Wiki → Librería</strong> encontrás más de 870 ejercicios categorizados por grupo muscular y equipo, con fotos de posición inicial y final, instrucciones paso a paso en español, y músculos trabajados.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Podés filtrar por grupo muscular (abdomen, pecho, espalda, piernas, hombros, etc.) o buscar por nombre. Los ejercicios con el badge <strong>"✓ Instrucciones en español"</strong> tienen instrucciones completas traducidas directamente en la plataforma.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          La librería también es el banco de ejercicios que usan los coaches al armar rutinas.
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
            a: 'Pedile el código a tu coach. Lo encuentra en Coach Panel → Invitar. Es un código de 6 caracteres que ingresás al registrarte o en el onboarding.',
          },
          {
            q: '¿Puedo pertenecer a más de un club?',
            a: 'Por ahora, cada usuario pertenece a un solo club. Esta funcionalidad se expandirá en versiones futuras.',
          },
          {
            q: '¿Qué pasa si mi coach elimina una sesión a la que me inscribí?',
            a: 'Recibís una notificación automática informándote la cancelación. Tu reserva se elimina sin que tengas que hacer nada.',
          },
          {
            q: '¿Cómo completo una rutina que me asignó mi coach?',
            a: 'Andá a Rutinas → Pendientes. Tocá la rutina y luego "Completar". Se abre un modal donde podés registrar cómo te sentiste, el esfuerzo percibido (RPE), el tiempo total y los pesos usados en cada ejercicio.',
          },
          {
            q: '¿El coach ve los resultados cuando completo una rutina?',
            a: 'Sí, tu coach recibe una notificación con tu resultado y puede ver el historial desde el detalle de sesión o desde tu perfil de miembro.',
          },
          {
            q: '¿Las rutinas vienen con instrucciones en español?',
            a: 'Los ejercicios de la librería tienen instrucciones en español. Al ver el detalle de un ejercicio, un badge verde confirma si tiene instrucciones completas en español.',
          },
          {
            q: '¿Cómo cancelo una reserva?',
            a: 'Tocá "Cancelar" en tu sesión confirmada desde el Dashboard o la Agenda, antes de que empiece.',
          },
          {
            q: '¿Qué significa "Cerrada" en una sesión?',
            a: 'Que la sesión ya terminó. No se puede reservar ni cancelar. Si asististe, tu coach puede marcar tu asistencia.',
          },
          {
            q: '¿Cómo cambio mi foto de perfil?',
            a: 'Andá a Perfil y tocá tu avatar. Aparece un ícono de cámara para subir una imagen nueva (máximo 20MB).',
          },
          {
            q: '¿Cómo funciona el QR personal?',
            a: 'En tu Perfil hay un botón de QR. Tu coach lo escanea desde Sesiones → Asistencia para hacer check-in rápido sin buscar tu nombre.',
          },
          {
            q: '¿Por qué todos tienen Plan Pro gratis?',
            a: 'Woditos está en fase beta. Todos los clubes tienen acceso completo al Plan Pro sin costo mientras la plataforma crece y se estabiliza. Cuando se habiliten planes de pago, se avisará con tiempo.',
          },
          {
            q: '¿La app funciona sin internet?',
            a: 'No, Woditos requiere conexión a internet. Todas las operaciones se sincronizan en tiempo real con el servidor.',
          },
          {
            q: '¿Cómo cierro sesión en el celular?',
            a: 'Tocá tu avatar en la esquina superior derecha del header. Se abre un menú con "Cerrar sesión".',
          },
        ].map(({ q, a }, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm font-semibold text-foreground">{q}</p>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{a}</p>
          </div>
        ))}
      </div>

      {/* CONTACTO */}
      <section id="contacto" className="scroll-mt-20">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center space-y-3">
          <h2 className="font-display text-xl font-bold text-foreground">¿Necesitás ayuda?</h2>
          <p className="text-sm text-muted-foreground">
            Si no encontrás la respuesta que buscás, escribinos y te respondemos a la brevedad.
          </p>
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
              <span className="text-xs font-medium opacity-90">Copiado</span>
            )}
          </div>
        </div>
      </section>

      {/* LEGAL */}
      <section id="legal" className="scroll-mt-20">
        <div className="border-t border-border pt-6 mb-4">
          <h1 className="font-display text-2xl font-extrabold text-foreground">Legal</h1>
          <p className="text-sm text-muted-foreground mt-1">Documentos legales y políticas de Woditos.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/terminos"
            className="group flex items-start gap-4 bg-card border border-border rounded-xl p-5 hover:border-primary/50 hover:bg-primary/5 transition-all">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
              <FileText size={20} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                Términos de Uso
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Condiciones de uso del servicio, responsabilidades y reglas de la plataforma.
              </p>
            </div>
          </Link>
          <Link to="/privacidad"
            className="group flex items-start gap-4 bg-card border border-border rounded-xl p-5 hover:border-primary/50 hover:bg-primary/5 transition-all">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
              <ShieldCheck size={20} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                Política de Privacidad
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Cómo recopilamos, usamos y protegemos tus datos personales (Ley 25.326).
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center space-y-2 pt-4">
        <p className="text-sm text-foreground/60 italic">"{getSlogan()}"</p>
        <p className="text-xs text-muted-foreground">© 2026 Woditos. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}