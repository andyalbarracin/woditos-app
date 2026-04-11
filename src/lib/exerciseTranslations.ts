/**
 * Archivo: exerciseTranslations.ts
 * Ruta: src/lib/exerciseTranslations.ts
 * Última modificación: 2026-04-08
 * Descripción: Traducciones inglés → español para datos de free-exercise-db.
 *   v2.2: agrega sistema de traducción palabra-por-palabra como fallback
 *   inteligente, cubriendo los ~870 ejercicios que no tienen entrada manual.
 */

// ─── Partes del cuerpo ───────────────────────────────────────────
export const bodyPartES: Record<string, string> = {
  back:         'Espalda',
  cardio:       'Cardio',
  chest:        'Pecho',
  'lower arms': 'Antebrazos',
  'lower legs': 'Piernas (inf.)',
  neck:         'Cuello',
  shoulders:    'Hombros',
  'upper arms': 'Brazos',
  'upper legs': 'Piernas (sup.)',
  waist:        'Abdomen',
};

// ─── Equipamiento ────────────────────────────────────────────────
export const equipmentES: Record<string, string> = {
  'assisted':           'Asistido',
  'band':               'Banda elástica',
  'barbell':            'Barra',
  'body weight':        'Peso corporal',
  'body only':          'Peso corporal',
  'bosu ball':          'Bosu',
  'cable':              'Cable / Polea',
  'dumbbell':           'Mancuernas',
  'elliptical machine': 'Elíptica',
  'ez barbell':         'Barra EZ',
  'ez bar':             'Barra EZ',
  'foam roll':          'Foam roller',
  'hammer':             'Hammer',
  'kettlebell':         'Kettlebell',
  'kettlebells':        'Kettlebell',
  'leverage machine':   'Máquina',
  'machine':            'Máquina',
  'medicine ball':      'Pelota medicinal',
  'olympic barbell':    'Barra olímpica',
  'other':              'Otro',
  'resistance band':    'Banda de resistencia',
  'roller':             'Foam roller',
  'rope':               'Soga / Cuerda',
  'skierg machine':     'Ski Erg',
  'sled machine':       'Trineo',
  'smith machine':      'Máquina Smith',
  'stability ball':     'Pelota de estabilidad',
  'stationary bike':    'Bicicleta estática',
  'stepmill machine':   'Escaladora',
  'tire':               'Llanta / Caucho',
  'trap bar':           'Barra hexagonal',
  'upper body ergometer': 'Ergómetro de brazos',
  'weighted':           'Con peso',
  'wheel roller':       'Rueda abdominal',
};

// ─── Músculos objetivo ───────────────────────────────────────────
export const targetMuscleES: Record<string, string> = {
  'abductors':           'Abductores',
  'abs':                 'Abdominales',
  'abdominals':          'Abdominales',
  'adductors':           'Aductores',
  'biceps':              'Bíceps',
  'calves':              'Pantorrillas',
  'cardiovascular system': 'Sistema cardiovascular',
  'delts':               'Deltoides',
  'forearms':            'Antebrazos',
  'glutes':              'Glúteos',
  'hamstrings':          'Isquiotibiales',
  'hip flexors':         'Flexores de cadera',
  'lats':                'Dorsales',
  'levator scapulae':    'Elevador de la escápula',
  'lower back':          'Lumbar',
  'middle back':         'Espalda media',
  'pectorals':           'Pectorales',
  'quads':               'Cuádriceps',
  'quadriceps':          'Cuádriceps',
  'serratus anterior':   'Serrato anterior',
  'spine':               'Columna',
  'traps':               'Trapecios',
  'triceps':             'Tríceps',
  'upper back':          'Espalda alta',
  // Músculos adicionales de free-exercise-db
  'shoulders':           'Hombros',
  'chest':               'Pecho',
  'back':                'Espalda',
  'neck':                'Cuello',
  'inner thighs':        'Aductores',
  'outer thighs':        'Abductores',
  'it band':             'Banda IT',
  'iliopsoas':           'Iliopsoas',
  'soleus':              'Sóleo',
  'tibialis anterior':   'Tibial anterior',
  'wrists':              'Muñecas',
  'fingers':             'Dedos',
  'hands':               'Manos',
  'rotator cuff':        'Manguito rotador',
  'infraspinatus':       'Infraespinoso',
  'supraspinatus':       'Supraespinoso',
  'teres major':         'Redondo mayor',
  'teres minor':         'Redondo menor',
  'subscapularis':       'Subescapular',
  'pectoralis major':    'Pectoral mayor',
  'pectoralis minor':    'Pectoral menor',
  'coracobrachialis':    'Coracobraquial',
  'brachialis':          'Braquial',
  'brachioradialis':     'Braquiorradial',
  'pronator teres':      'Pronador redondo',
  'extensor carpi':      'Extensor del carpo',
  'flexor carpi':        'Flexor del carpo',
  'gastrocnemius':       'Gemelos',
  'peroneals':           'Peroneos',
  'anterior deltoid':    'Deltoides anterior',
  'lateral deltoid':     'Deltoides lateral',
  'posterior deltoid':   'Deltoides posterior',
  'rear deltoids':       'Deltoides posteriores',
  'front deltoids':      'Deltoides anteriores',
  'erector spinae':      'Erector de la columna',
  'multifidus':          'Multífido',
  'quadratus lumborum':  'Cuadrado lumbar',
  'transverse abdominis':'Transverso abdominal',
  'rectus abdominis':    'Recto abdominal',
  'external oblique':    'Oblicuo externo',
  'internal oblique':    'Oblicuo interno',
  'psoas':               'Psoas',
  'tensor fasciae latae':'Tensor de la fascia lata',
  'sartorius':           'Sartorio',
  'vastus lateralis':    'Vasto lateral',
  'vastus medialis':     'Vasto medial',
  'vastus intermedius':  'Vasto intermedio',
  'rectus femoris':      'Recto femoral',
  'biceps femoris':      'Bíceps femoral',
  'semimembranosus':     'Semimembranoso',
  'semitendinosus':      'Semitendinoso',
  'gluteus maximus':     'Glúteo mayor',
  'gluteus medius':      'Glúteo medio',
  'gluteus minimus':     'Glúteo menor',
};

// ─── Nombres completos de ejercicios (mapa manual) ───────────────
// Los más comunes en funcional, running y gym.
export const exerciseNameES: Record<string, string> = {
  // Core / Abdomen
  'plank':                              'Plancha',
  'crunch':                             'Crunch abdominal',
  'sit-up':                             'Abdominal completo',
  '3/4 sit-up':                         'Abdominal 3/4',
  'bicycle crunch':                     'Crunch bicicleta',
  'mountain climber':                   'Escalador de montaña',
  'mountain climbers':                  'Escaladores de montaña',
  'russian twist':                      'Rotación rusa',
  'leg raise':                          'Elevación de piernas',
  'flutter kicks':                      'Patadas flutter',
  'dead bug':                           'Insecto muerto',
  'hollow body hold':                   'Posición cóncava',
  'v-up':                               'V-up abdominal',
  'toe touch':                          'Toque de pies',
  'ab wheel rollout':                   'Rueda abdominal',
  'cable crunch':                       'Crunch con cable',
  'hanging knee raise':                 'Elevación de rodillas colgado',
  'hanging leg raise':                  'Elevación de piernas colgado',
  'toes-to-bar':                        'Pies a la barra',
  'l-sit':                              'Posición L',
  'dragon flag':                        'Bandera del dragón',

  // Pecho
  'push-up':                            'Flexión de brazos',
  'push-up wide':                       'Flexión ancha',
  'push-up close-grip':                 'Flexión cerrada',
  'diamond push-up':                    'Flexión diamante',
  'incline push-up':                    'Flexión inclinada',
  'decline push-up':                    'Flexión declinada',
  'chest dip':                          'Fondos en paralelas (pecho)',
  'bench press':                        'Press de banca',
  'incline bench press':                'Press de banca inclinado',
  'decline bench press':                'Press de banca declinado',
  'dumbbell fly':                       'Apertura con mancuernas',
  'dumbbell flye':                      'Apertura con mancuernas',
  'chest fly machine':                  'Mariposa (máquina)',
  'dumbbell bench press':               'Press de banca con mancuernas',
  'dumbbell incline bench press':       'Press inclinado con mancuernas',
  'cable fly':                          'Apertura con cable',
  'pec deck':                           'Mariposa en máquina',

  // Espalda
  'pull-up':                            'Dominada',
  'pullup':                             'Dominada',
  'chin-up':                            'Dominada supina',
  'lat pulldown':                       'Jalón al pecho',
  'seated row':                         'Remo sentado',
  'cable row':                          'Remo con cable',
  'bent over row':                      'Remo con barra',
  'barbell bent over row':              'Remo con barra',
  'dumbbell row':                       'Remo con mancuerna',
  'one arm dumbbell row':               'Remo unilateral con mancuerna',
  'face pull':                          'Face pull',
  'good morning':                       'Buenos días',
  'hyperextension':                     'Hiperextensión',
  'back extension':                     'Extensión de espalda',
  'deadlift':                           'Peso muerto',
  'sumo deadlift':                      'Peso muerto sumo',
  'romanian deadlift':                  'Peso muerto rumano',
  'stiff leg deadlift':                 'Peso muerto rígido',
  'rack pull':                          'Rack pull',
  'shrug':                              'Encogimiento de hombros',
  'barbell shrug':                      'Encogimiento con barra',
  'dumbbell shrug':                     'Encogimiento con mancuernas',
  'alternating kettlebell row':         'Remo alternado con kettlebell',
  't-bar row':                          'Remo en T',
  'inverted row':                       'Remo invertido',
  'seated cable row':                   'Remo sentado con cable',

  // Hombros
  'overhead press':                     'Press militar',
  'military press':                     'Press militar',
  'barbell overhead press':             'Press militar con barra',
  'dumbbell shoulder press':            'Press de hombros con mancuernas',
  'lateral raise':                      'Elevación lateral',
  'dumbbell lateral raise':             'Elevación lateral con mancuernas',
  'front raise':                        'Elevación frontal',
  'dumbbell front raise':               'Elevación frontal con mancuernas',
  'alternating deltoid raise':          'Elevación de deltoides alternada',
  'rear delt fly':                      'Elevación de deltoides posterior',
  'rear delt raise':                    'Elevación posterior',
  'arnold press':                       'Press Arnold',
  'upright row':                        'Remo al mentón',
  'cable lateral raise':                'Elevación lateral con cable',
  'alternating cable shoulder press':   'Press de hombros alternado con cable',
  'push press':                         'Push press',
  'handstand push-up':                  'Flexión invertida',

  // Bíceps
  'barbell curl':                       'Curl con barra',
  'dumbbell curl':                      'Curl con mancuernas',
  'dumbbell bicep curl':                'Curl de bíceps con mancuernas',
  'hammer curl':                        'Curl martillo',
  'dumbbell hammer curl':               'Curl martillo con mancuernas',
  'concentration curl':                 'Curl concentrado',
  'preacher curl':                      'Curl predicador',
  'incline dumbbell curl':              'Curl inclinado',
  'cable curl':                         'Curl con cable',
  'ez bar curl':                        'Curl con barra EZ',
  'spider curl':                        'Curl araña',

  // Tríceps
  'tricep dip':                         'Fondos en banco',
  'bench dip':                          'Fondos en banco',
  'tricep pushdown':                    'Extensión tríceps polea',
  'cable pushdown':                     'Jalón de tríceps',
  'rope pushdown':                      'Jalón de tríceps con cuerda',
  'skull crusher':                      'Press francés',
  'lying tricep extension':             'Extensión de tríceps acostado',
  'overhead tricep extension':          'Extensión tríceps sobre cabeza',
  'close-grip bench press':             'Press cerrado (tríceps)',
  'tricep kickback':                    'Patada de tríceps',
  'dumbbell tricep kickback':           'Patada de tríceps con mancuerna',
  'overhead dumbbell tricep extension': 'Extensión de tríceps sobre cabeza',

  // Piernas / Cuádriceps
  'squat':                              'Sentadilla',
  'back squat':                         'Sentadilla trasera',
  'barbell squat':                      'Sentadilla con barra',
  'front squat':                        'Sentadilla frontal',
  'goblet squat':                       'Sentadilla goblet',
  'sumo squat':                         'Sentadilla sumo',
  'hack squat':                         'Hack squat',
  'bulgarian split squat':              'Sentadilla búlgara',
  'split squat':                        'Sentadilla dividida',
  'pistol squat':                       'Sentadilla pistola',
  'jump squat':                         'Sentadilla con salto',
  'lunge':                              'Zancada',
  'reverse lunge':                      'Zancada inversa',
  'walking lunge':                      'Zancada caminando',
  'lateral lunge':                      'Zancada lateral',
  'step-up':                            'Subida al cajón',
  'box step-up':                        'Subida al cajón',
  'leg press':                          'Prensa de piernas',
  'leg extension':                      'Extensión de cuádriceps',
  'wall sit':                           'Silla en pared',
  'sissy squat':                        'Sissy squat',
  'single leg squat':                   'Sentadilla unilateral',

  // Glúteos / Isquiotibiales
  'hip thrust':                         'Hip thrust',
  'barbell hip thrust':                 'Hip thrust con barra',
  'glute bridge':                       'Puente de glúteos',
  'leg curl':                           'Curl de isquiotibiales',
  'lying leg curl':                     'Curl de isquiotibiales acostado',
  'seated leg curl':                    'Curl de isquiotibiales sentado',
  'cable kickback':                     'Patada de glúteo con cable',
  'donkey kick':                        'Patada de burro',
  'fire hydrant':                       'Hidrante de fuego',
  'clamshell':                          'Almeja',
  'nordic hamstring curl':              'Curl nórdico',

  // Pantorrillas
  'calf raise':                         'Elevación de talones',
  'standing calf raise':                'Elevación de talones de pie',
  'seated calf raise':                  'Elevación de talones sentado',
  'donkey calf raise':                  'Elevación de talones estilo burro',

  // Funcional / Full body
  'burpee':                             'Burpee',
  'box jump':                           'Salto al cajón',
  'box jump (depth jump)':              'Salto al cajón (salto en profundidad)',
  'thruster':                           'Thruster',
  'clean':                              'Clean',
  'power clean':                        'Power clean',
  'hang clean':                         'Hang clean',
  'clean and jerk':                     'Clean and jerk',
  'snatch':                             'Arranque',
  'power snatch':                       'Arranque de potencia',
  'kettlebell swing':                   'Swing con kettlebell',
  'american kettlebell swing':          'Swing americano con kettlebell',
  'turkish get-up':                     'Levantada turca',
  'wall ball':                          'Wall ball',
  'wall ball shot':                     'Wall ball',
  'double under':                       'Doble salto a la cuerda',
  'rope climb':                         'Trepa de cuerda',
  'muscle-up':                          'Muscle-up',
  'ring muscle-up':                     'Muscle-up en argollas',
  'bar muscle-up':                      'Muscle-up en barra',
  'kipping pull-up':                    'Dominada kipping',
  'slam ball':                          'Golpe de pelota',
  'battle rope':                        'Cuerda de batalla',
  'tire flip':                          'Volteo de llanta',
  'farmers walk':                       'Caminata del granjero',
  "farmer's walk":                      'Caminata del granjero',
  'suitcase carry':                     'Cargada de maleta',

  // Cardio / Running
  'jump rope':                          'Saltar la cuerda',
  'jumping jacks':                      'Saltos de tijera',
  'jumping jack':                       'Saltos de tijera',
  'high knees':                         'Rodillas al pecho corriendo',
  'high knee':                          'Rodillas al pecho corriendo',
  'butt kicks':                         'Talones al glúteo',
  'butt kick':                          'Talones al glúteo',
  'sprint':                             'Sprint',
  'lateral shuffle':                    'Desplazamiento lateral',
  'bear crawl':                         'Caminata del oso',
  'inchworm':                           'Oruga',
  'box step':                           'Step en cajón',

  // Movilidad / Estiramiento
  'hip flexor stretch':                 'Estiramiento flexor de cadera',
  "world's greatest stretch":           'El gran estiramiento mundial',
  'pigeon pose':                        'Postura de paloma',
  'thoracic rotation':                  'Rotación torácica',
  'ankle circles':                      'Círculos de tobillo',
  'cat-cow stretch':                    'Estiramiento gato-vaca',
  'child pose':                         'Postura del niño',
  "child's pose":                       'Postura del niño',
  'downward dog':                       'Perro boca abajo',
  'hip circle':                         'Círculos de cadera',
  'leg swings':                         'Balanceo de piernas',
  'arm circles':                        'Círculos de brazos',
  'neck tilt':                          'Inclinación de cuello',
  'shoulder roll':                      'Rodamiento de hombros',
  'seated hamstring stretch':           'Estiramiento de isquiotibiales sentado',
  '90/90 hamstring':                    'Estiramiento de isquiotibiales 90/90',
  '90/90 hamstring stretch':            'Estiramiento de isquiotibiales 90/90',

  // Muñeca / Antebrazo
  'wrist curl':                         'Curl de muñeca',
  'reverse wrist curl':                 'Curl de muñeca inverso',
  'wrist roller':                       'Rodillo de muñeca',
  'pronation':                          'Pronación',
  'supination':                         'Supinación',
  'wrist extension':                    'Extensión de muñeca',
  'wrist flexion':                      'Flexión de muñeca',
};

// ─── Traducción PALABRA A PALABRA (fallback inteligente) ─────────
// Cubre ejercicios muy específicos que no están en el mapa manual.
const wordMap: Record<string, string> = {
  // Equipamiento
  'dumbbell':         'Mancuernas',
  'barbell':          'Barra',
  'cable':            'Cable',
  'machine':          'Máquina',
  'kettlebell':       'Kettlebell',
  'band':             'Banda',
  'resistance':       'Con resistencia',
  'plate':            'Disco',
  'rope':             'Cuerda',
  'ez':               'EZ',
  'smith':            'Smith',
  // Posición
  'lying':            'Acostado',
  'seated':           'Sentado',
  'standing':         'De pie',
  'incline':          'Inclinado',
  'decline':          'Declinado',
  'prone':            'Prono',
  'supine':           'Supino',
  'overhead':         'Sobre cabeza',
  'behind':           'Detrás',
  'low':              'Bajo',
  'high':             'Alto',
  'inner':            'Interior',
  'outer':            'Exterior',
  // Movimiento
  'curl':             'Curl',
  'press':            'Press',
  'raise':            'Elevación',
  'row':              'Remo',
  'extension':        'Extensión',
  'flexion':          'Flexión',
  'fly':              'Apertura',
  'flye':             'Apertura',
  'pulldown':         'Jalón',
  'pushdown':         'Jalón de tríceps',
  'pullover':         'Pullover',
  'shrug':            'Encogimiento',
  'rotation':         'Rotación',
  'twist':            'Giro',
  'kick':             'Patada',
  'kickback':         'Patada',
  'swing':            'Swing',
  'thrust':           'Empuje',
  'squat':            'Sentadilla',
  'lunge':            'Zancada',
  'jump':             'Salto',
  'hop':              'Salto',
  'step':             'Paso',
  'push':             'Empuje',
  'pull':             'Tirón',
  'plank':            'Plancha',
  'bridge':           'Puente',
  'crunch':           'Crunch',
  'dip':              'Fondos',
  'crawl':            'Arrastre',
  'walk':             'Caminata',
  'carry':            'Cargada',
  'climb':            'Trepa',
  'run':              'Carrera',
  'sprint':           'Sprint',
  'skip':             'Salto',
  // Modificadores
  'alternating':      'Alternado',
  'single':           'Unilateral',
  'double':           'Doble',
  'reverse':          'Inverso',
  'close':            'Cerrado',
  'wide':             'Abierto',
  'narrow':           'Estrecho',
  'grip':             'Agarre',
  'palms':            'Palmas',
  'neutral':          'Neutro',
  'hammer':           'Martillo',
  'two':              'Dos',
  'one':              'Un',
  'three':            'Tres',
  // Partes del cuerpo como sustantivo
  'arm':              'Brazo',
  'arms':             'Brazos',
  'leg':              'Pierna',
  'legs':             'Piernas',
  'hip':              'Cadera',
  'hips':             'Cadera',
  'shoulder':         'Hombro',
  'shoulders':        'Hombros',
  'chest':            'Pecho',
  'back':             'Espalda',
  'neck':             'Cuello',
  'glute':            'Glúteo',
  'glutes':           'Glúteos',
  'hamstring':        'Isquiotibiales',
  'quad':             'Cuádriceps',
  'calf':             'Pantorrilla',
  'ab':               'Abdominal',
  'core':             'Core',
  'wrist':            'Muñeca',
  'forearm':          'Antebrazo',
  'knee':             'Rodilla',
  'ankle':            'Tobillo',
  'face':             'Cara',
  'upper':            'Superior',
  'lower':            'Inferior',
  'front':            'Frontal',
  'rear':             'Posterior',
  'lateral':          'Lateral',
  'deltoid':          'Deltoides',
  'bicep':            'Bíceps',
  'tricep':           'Tríceps',
  'pectoral':         'Pectoral',
  'trapezius':        'Trapecios',
  // Preposiciones/conectores (ignorar)
  'from':             '',
  'the':              '',
  'with':             'con',
  'and':              'y',
  'to':               'a',
  'on':               'en',
  'at':               'en',
  'in':               'en',
  'of':               'de',
  'up':               'arriba',
  'down':             'abajo',
  'over':             'sobre',
  'under':            'bajo',
  'bar':              'barra',
  'position':         'posición',
  'hang':             'colgado',
  'pulley':           'polea',
};

/**
 * Traduce un nombre de ejercicio al español.
 * 1. Búsqueda exacta en el mapa manual
 * 2. Búsqueda parcial (el nombre contiene una clave)
 * 3. Traducción palabra-por-palabra (fallback inteligente)
 */
export function translateExerciseName(nameEN: string): string {
  const lower = nameEN.toLowerCase();

  // 1. Búsqueda exacta
  if (exerciseNameES[lower]) return exerciseNameES[lower];

  // 2. Búsqueda parcial (nombre contiene una clave conocida)
  for (const [key, val] of Object.entries(exerciseNameES)) {
    if (lower.includes(key) && key.length > 4) return val;
  }

  // 3. Traducción palabra-por-palabra
  const words = nameEN.split(/[\s\-\/]+/);
  const translated = words
    .map(w => {
      const wl = w.toLowerCase().replace(/[^a-z0-9]/g, '');
      const t = wordMap[wl];
      if (t === '') return null;         // ignorar palabras vacías (the, from, etc.)
      if (t) return t;
      return w.charAt(0).toUpperCase() + w.slice(1); // capitalizar original
    })
    .filter(Boolean)
    .join(' ');

  return translated || nameEN;
}

/** Traduce la parte del cuerpo */
export function translateBodyPart(bp: string): string {
  return bodyPartES[bp.toLowerCase()] ?? bp;
}

/** Traduce el equipamiento */
export function translateEquipment(eq: string): string {
  return equipmentES[eq.toLowerCase()] ?? eq;
}

/** Traduce el músculo objetivo */
export function translateTarget(t: string): string {
  return targetMuscleES[t.toLowerCase()] ?? t;
}

/** Traduce instrucciones (devuelve las originales por ahora) */
export function translateInstructions(steps: string[]): string[] {
  return steps;
}

/** Tipo unificado de ejercicio */
export interface ExerciseDBItem {
  id: string;
  name: string;
  nameES: string;
  bodyPart: string;
  bodyPartES: string;
  equipment: string;
  equipmentES: string;
  target: string;
  targetES: string;
  gifUrl: string;
  secondaryMuscles: string[];
  instructions: string[];
}

/** Normaliza un ejercicio crudo al tipo interno */
export function normalizeExercise(raw: Record<string, unknown>): ExerciseDBItem {
  const nameRaw = String(raw.name ?? '');
  const bp      = String(raw.bodyPart ?? '');
  const eq      = String(raw.equipment ?? '');
  const tgt     = String(raw.target ?? '');

  return {
    id:              String(raw.id ?? ''),
    name:            nameRaw,
    nameES:          translateExerciseName(nameRaw),
    bodyPart:        bp,
    bodyPartES:      translateBodyPart(bp),
    equipment:       eq,
    equipmentES:     translateEquipment(eq),
    target:          tgt,
    targetES:        translateTarget(tgt),
    gifUrl:          String(raw.gifUrl ?? ''),
    secondaryMuscles: (raw.secondaryMuscles as string[]) ?? [],
    instructions:    translateInstructions((raw.instructions as string[]) ?? []),
  };
}

/** Lista de bodyParts disponibles para filtros */
export const BODY_PARTS_OPTIONS = Object.entries(bodyPartES).map(([en, es]) => ({
  value: en,
  label: es,
}));

/** Tipos de rutina */
export const ROUTINE_TYPES = [
  { value: 'custom',    label: 'Personalizada' },
  { value: 'wod',       label: 'WOD' },
  { value: 'amrap',     label: 'AMRAP' },
  { value: 'emom',      label: 'EMOM' },
  { value: 'for_time',  label: 'For Time' },
  { value: 'tabata',    label: 'Tabata' },
  { value: 'running',   label: 'Running' },
  { value: 'hiit',      label: 'HIIT' },
  { value: 'strength',  label: 'Fuerza' },
  { value: 'mobility',  label: 'Movilidad' },
];

/** Niveles de dificultad */
export const ROUTINE_LEVELS = [
  { value: 'beginner',     label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced',     label: 'Avanzado' },
];