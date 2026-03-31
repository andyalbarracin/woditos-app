/**
 * Archivo: MuscleDiagram.tsx
 * Ruta: src/components/library/MuscleDiagram.tsx
 * Última modificación: 2025-03-09
 * Descripción: Diagrama SVG anatómico simplificado de cuerpo humano (vista frontal
 *              y trasera). Resalta los músculos principales según el grupo muscular
 *              del ejercicio usando colores del design system (--primary, --secondary).
 */

/** Props del componente */
interface MuscleDiagramProps {
  /** Grupo muscular principal del ejercicio (ej: "piernas", "pecho", "core") */
  muscleGroup?: string | null;
  /** Categoría del ejercicio para determinar grupos secundarios */
  category?: string | null;
}

/**
 * Mapeo de grupo muscular → IDs de paths SVG que deben resaltarse.
 * Los IDs corresponden a elementos del diagrama SVG definido abajo.
 */
const MUSCLE_HIGHLIGHT_MAP: Record<string, string[]> = {
  piernas:    ['quads', 'hamstrings', 'calves', 'glutes'],
  cuadriceps: ['quads'],
  isquios:    ['hamstrings'],
  gluteos:    ['glutes'],
  pantorrillas:['calves'],
  pecho:      ['chest', 'shoulders-front'],
  espalda:    ['lats', 'traps', 'rhomboids'],
  hombros:    ['shoulders-front', 'shoulders-back'],
  biceps:     ['biceps'],
  triceps:    ['triceps'],
  core:       ['abs', 'obliques'],
  abdomen:    ['abs', 'obliques'],
  full_body:  ['quads', 'chest', 'lats', 'abs', 'shoulders-front'],
  running:    ['quads', 'hamstrings', 'calves', 'glutes', 'abs'],
};

/**
 * Resuelve qué músculos resaltar basado en muscle_group y category.
 * Hace una búsqueda tolerante (incluye términos parciales).
 */
function resolveHighlights(muscleGroup?: string | null, category?: string | null): string[] {
  const source = (muscleGroup || category || '').toLowerCase();
  const hits: string[] = [];
  Object.entries(MUSCLE_HIGHLIGHT_MAP).forEach(([key, ids]) => {
    if (source.includes(key)) ids.forEach(id => { if (!hits.includes(id)) hits.push(id); });
  });
  // Default: resaltar todo si no hay coincidencia
  return hits.length > 0 ? hits : ['quads', 'chest', 'abs'];
}

export default function MuscleDiagram({ muscleGroup, category }: MuscleDiagramProps) {
  const highlights = resolveHighlights(muscleGroup, category);

  /** Helper para determinar el color de un músculo según si está resaltado */
  const fill = (id: string) =>
    highlights.includes(id)
      ? 'hsl(16 100% 58% / 0.85)'   // --primary (naranja)
      : 'hsl(240 12% 18%)';           // --border (gris oscuro)

  const fillSecondary = (id: string) =>
    highlights.includes(id)
      ? 'hsl(165 100% 39% / 0.7)'   // --secondary (verde)
      : 'hsl(240 12% 18%)';

  return (
    <div className="flex flex-wrap gap-4 sm:gap-8 justify-center items-start py-4">
      {/* ─── VISTA FRONTAL ─────────────────────────────────────────────── */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-medium">Frontal</p>
        <svg width="110" height="220" viewBox="0 0 110 220" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Cabeza */}
          <ellipse cx="55" cy="16" rx="14" ry="15" fill="hsl(240 12% 22%)" />
          {/* Cuello */}
          <rect x="49" y="29" width="12" height="10" rx="3" fill="hsl(240 12% 22%)" />
          {/* Torso */}
          <rect x="30" y="38" width="50" height="55" rx="8" fill="hsl(240 12% 22%)" />
          {/* Pecho */}
          <ellipse id="chest-l" cx="43" cy="52" rx="10" ry="9" fill={fill('chest')} />
          <ellipse id="chest-r" cx="67" cy="52" rx="10" ry="9" fill={fill('chest')} />
          {/* Abdomen */}
          <rect id="abs" x="44" y="64" width="22" height="26" rx="4" fill={fill('abs')} />
          {/* Oblícuos */}
          <ellipse id="obl-l" cx="34" cy="73" rx="7" ry="12" fill={fill('obliques')} />
          <ellipse id="obl-r" cx="76" cy="73" rx="7" ry="12" fill={fill('obliques')} />
          {/* Hombros frontales */}
          <ellipse id="sh-fl" cx="22" cy="46" rx="9" ry="9" fill={fill('shoulders-front')} />
          <ellipse id="sh-fr" cx="88" cy="46" rx="9" ry="9" fill={fill('shoulders-front')} />
          {/* Biceps */}
          <rect id="bic-l" x="12" y="56" width="12" height="22" rx="5" fill={fill('biceps')} />
          <rect id="bic-r" x="86" y="56" width="12" height="22" rx="5" fill={fill('biceps')} />
          {/* Antebrazos */}
          <rect x="10" y="80" width="10" height="20" rx="4" fill="hsl(240 12% 22%)" />
          <rect x="90" y="80" width="10" height="20" rx="4" fill="hsl(240 12% 22%)" />
          {/* Caderas */}
          <rect x="30" y="92" width="50" height="16" rx="5" fill="hsl(240 12% 20%)" />
          {/* Cuadriceps */}
          <rect id="quad-l" x="30" y="108" width="21" height="50" rx="8" fill={fill('quads')} />
          <rect id="quad-r" x="59" y="108" width="21" height="50" rx="8" fill={fill('quads')} />
          {/* Rodillas */}
          <ellipse cx="40" cy="162" rx="11" ry="7" fill="hsl(240 12% 20%)" />
          <ellipse cx="70" cy="162" rx="11" ry="7" fill="hsl(240 12% 20%)" />
          {/* Pantorrillas (frente) */}
          <rect id="calf-lf" x="31" y="168" width="18" height="40" rx="7" fill={fill('calves')} />
          <rect id="calf-rf" x="61" y="168" width="18" height="40" rx="7" fill={fill('calves')} />
        </svg>
      </div>

      {/* ─── VISTA TRASERA ─────────────────────────────────────────────── */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-medium">Posterior</p>
        <svg width="110" height="220" viewBox="0 0 110 220" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Cabeza */}
          <ellipse cx="55" cy="16" rx="14" ry="15" fill="hsl(240 12% 22%)" />
          {/* Cuello */}
          <rect x="49" y="29" width="12" height="10" rx="3" fill="hsl(240 12% 22%)" />
          {/* Torso (espalda) */}
          <rect x="30" y="38" width="50" height="55" rx="8" fill="hsl(240 12% 22%)" />
          {/* Trapecios */}
          <path id="traps" d="M38 38 L55 48 L72 38 Q75 43 55 54 Q35 43 38 38Z" fill={fillSecondary('traps')} />
          {/* Dorsales */}
          <ellipse id="lat-l" cx="35" cy="66" rx="9" ry="16" fill={fillSecondary('lats')} />
          <ellipse id="lat-r" cx="75" cy="66" rx="9" ry="16" fill={fillSecondary('lats')} />
          {/* Romboides */}
          <rect id="rhom" x="42" y="52" width="26" height="20" rx="4" fill={fillSecondary('rhomboids')} />
          {/* Hombros traseros */}
          <ellipse id="sh-bl" cx="22" cy="46" rx="9" ry="9" fill={fillSecondary('shoulders-back')} />
          <ellipse id="sh-br" cx="88" cy="46" rx="9" ry="9" fill={fillSecondary('shoulders-back')} />
          {/* Triceps */}
          <rect id="tri-l" x="12" y="56" width="12" height="22" rx="5" fill={fillSecondary('triceps')} />
          <rect id="tri-r" x="86" y="56" width="12" height="22" rx="5" fill={fillSecondary('triceps')} />
          {/* Antebrazos */}
          <rect x="10" y="80" width="10" height="20" rx="4" fill="hsl(240 12% 22%)" />
          <rect x="90" y="80" width="10" height="20" rx="4" fill="hsl(240 12% 22%)" />
          {/* Glúteos */}
          <ellipse id="glut-l" cx="43" cy="104" rx="14" ry="12" fill={fill('glutes')} />
          <ellipse id="glut-r" cx="67" cy="104" rx="14" ry="12" fill={fill('glutes')} />
          {/* Isquios */}
          <rect id="ham-l" x="30" y="114" width="21" height="45" rx="8" fill={fill('hamstrings')} />
          <rect id="ham-r" x="59" y="114" width="21" height="45" rx="8" fill={fill('hamstrings')} />
          {/* Rodillas */}
          <ellipse cx="40" cy="162" rx="11" ry="7" fill="hsl(240 12% 20%)" />
          <ellipse cx="70" cy="162" rx="11" ry="7" fill="hsl(240 12% 20%)" />
          {/* Gemelos */}
          <rect id="calf-lb" x="31" y="168" width="18" height="40" rx="7" fill={fill('calves')} />
          <rect id="calf-rb" x="61" y="168" width="18" height="40" rx="7" fill={fill('calves')} />
        </svg>
      </div>

      {/* Leyenda */}
      <div className="flex flex-col justify-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(16 100% 58% / 0.85)' }} />
          <span className="text-muted-foreground">Principal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(165 100% 39% / 0.7)' }} />
          <span className="text-muted-foreground">Secundario</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-border" />
          <span className="text-muted-foreground">Inactivo</span>
        </div>
      </div>
    </div>
  );
}
