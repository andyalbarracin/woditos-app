#!/usr/bin/env node
/**
 * Archivo: import_exercises.js
 * Ruta: scripts/import_exercises.js
 * Descripción: Descarga ~870 ejercicios de free-exercise-db, traduce las instrucciones
 *   al español con Claude API y genera el SQL para exercise_library en Supabase.
 *
 * USO:
 *   node scripts/import_exercises.js
 *
 * REQUIERE:
 *   - Node.js 18+ (ya lo tenés con el proyecto)
 *   - Anthropic API Key en variable de entorno o en .env
 *   - El archivo .env del proyecto (ya tiene VITE_SUPABASE_URL etc.)
 *
 * OUTPUT:
 *   - scripts/woditos_exercise_library.sql  ← ejecutar en Supabase SQL Editor
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ─── Configuración ────────────────────────────────────────────────
const EXERCISES_URL  = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMAGES_BASE    = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const BATCH_SIZE     = 12;   // ejercicios por llamada a la API (ajustar si hay rate limit)
const OUTPUT_FILE    = path.join(__dirname, 'woditos_exercise_library.sql');

// API Key: 1) variable de entorno ANTHROPIC_API_KEY, 2) .env del proyecto
let API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  try {
    const envFile = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
    const match   = envFile.match(/ANTHROPIC_API_KEY\s*=\s*(.+)/);
    if (match) API_KEY = match[1].trim().replace(/['"]/g, '');
  } catch (_) {}
}
if (!API_KEY) {
  console.error('\n❌  Falta ANTHROPIC_API_KEY.\n');
  console.error('  Opción A: ANTHROPIC_API_KEY=sk-ant-xxx node scripts/import_exercises.js');
  console.error('  Opción B: agrega ANTHROPIC_API_KEY=sk-ant-xxx a tu archivo .env\n');
  process.exit(1);
}

// ─── Mapeos de bodyPart ────────────────────────────────────────────
const MUSCLE_MAP = {
  abdominals:'waist',obliques:'waist',hamstrings:'upper legs',quadriceps:'upper legs',
  glutes:'upper legs',adductors:'upper legs',abductors:'upper legs',calves:'lower legs',
  chest:'chest',pectorals:'chest',biceps:'upper arms',triceps:'upper arms',
  forearms:'lower arms',lats:'back','middle back':'back','lower back':'back',
  traps:'back',rhomboids:'back',shoulders:'shoulders','front deltoids':'shoulders',
  neck:'neck','cardiovascular system':'cardio',
};
const CAT_MAP = { cardio:'cardio',stretching:'waist',plyometrics:'upper legs',powerlifting:'back',strongman:'back' };

function getBodyPart(ex) {
  const m = ex.primaryMuscles || [];
  const c = (ex.category || '').toLowerCase();
  if (c === 'cardio') return 'cardio';
  if (m.length && MUSCLE_MAP[m[0].toLowerCase()]) return MUSCLE_MAP[m[0].toLowerCase()];
  return CAT_MAP[c] || 'waist';
}

// ─── Helpers ──────────────────────────────────────────────────────
function esc(s) { return (s || '').replace(/'/g, "''"); }

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} para ${url}`));
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model:      'claude-haiku-4-5-20251001',  // más rápido y barato para traducción masiva
      max_tokens: 4096,
      system:     'You are a fitness translator. Return ONLY valid JSON, no explanation, no markdown fences.',
      messages:   [{ role: 'user', content: prompt }],
    });

    const req = https.request({
      hostname: 'api.anthropic.com',
      path:     '/v1/messages',
      method:   'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length':    Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message));
          resolve(parsed);
        } catch(e) { reject(new Error('Parse error: ' + data.slice(0, 200))); }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function generateSQL(exercises) {
  const CHUNK = 50;
  let sql = `-- Woditos Exercise Library — ${exercises.length} ejercicios con instrucciones en español
-- Generado automáticamente por scripts/import_exercises.js
-- EJECUTAR UNA SOLA VEZ en Supabase SQL Editor
-- Limpia la tabla antes de importar (por si ya hay datos):

TRUNCATE TABLE exercise_library RESTART IDENTITY CASCADE;

`;

  for (let i = 0; i < exercises.length; i += CHUNK) {
    const chunk = exercises.slice(i, i + CHUNK);
    const vals = chunk.map(ex => {
      const name     = esc(ex.name_es || ex.name);
      const name_en  = esc(ex.name);
      const bp       = getBodyPart(ex);
      const eq       = esc((ex.equipment || 'body only').toLowerCase());
      const tgt      = esc(ex.primaryMuscles?.[0] || 'abdominals');
      const gif      = ex.images?.[0] ? esc(IMAGES_BASE + ex.images[0]) : '';
      const ins      = ex.instructions_es || ex.instructions || [];
      const ins_sql  = ins.length
        ? `ARRAY[${ins.map(s => `'${esc(s)}'`).join(',')}]`
        : `ARRAY[]::text[]`;
      return `  (gen_random_uuid(),NULL,NULL,'${name}','${name_en}','${bp}','${eq}','${tgt}','${gif}',${ins_sql},true,NOW())`;
    });

    sql += `-- Ejercicios ${i+1}–${Math.min(i+CHUNK, exercises.length)}\n`;
    sql += `INSERT INTO exercise_library (id,club_id,created_by,name,name_en,body_part,equipment,target,gif_url,instructions,is_global,created_at)\nVALUES\n${vals.join(',\n')};\n\n`;
  }

  return sql;
}

// ─── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log('\n🏋️  Woditos — Import Exercise Library\n');

  // 1. Descargar ejercicios
  console.log('📥 Descargando ejercicios desde free-exercise-db...');
  const exercises = await fetchJSON(EXERCISES_URL);
  console.log(`✓ ${exercises.length} ejercicios descargados\n`);

  const numBatches = Math.ceil(exercises.length / BATCH_SIZE);
  const translated = new Array(exercises.length);
  let errors = 0;

  // 2. Traducir en batches
  for (let b = 0; b < numBatches; b++) {
    const start = b * BATCH_SIZE;
    const batch = exercises.slice(start, start + BATCH_SIZE);
    const pct   = Math.round((b / numBatches) * 100);

    process.stdout.write(`\r🔄 Batch ${b+1}/${numBatches} (${pct}%) — ej. ${start+1}–${Math.min(start+BATCH_SIZE, exercises.length)}  `);

    const input = batch.map((ex, j) => ({
      i:   start + j,
      n:   ex.name,
      ins: ex.instructions || [],
    }));

    const prompt = `Translate each exercise from English to Argentine Spanish.
For "n_es": translate the name. Keep gym terms used in Argentina as-is (press, curl, squat, deadlift, plank, burpee, etc.).
For "ins_es": translate ALL instructions to Spanish using "vos" (Argentine informal imperative). Be natural, like a fitness coach speaking.
Return ONLY a JSON array: [{"i":number,"n_es":"...","ins_es":["...","..."]}]

${JSON.stringify(input)}`;

    try {
      const resp   = await callClaude(prompt);
      const text   = resp.content[0].text.replace(/```json\n?|```/g, '').trim();
      const result = JSON.parse(text);

      for (const r of result) {
        translated[r.i] = {
          ...exercises[r.i],
          name_es:        r.n_es || exercises[r.i].name,
          instructions_es: r.ins_es || exercises[r.i].instructions,
        };
      }
    } catch (err) {
      errors++;
      console.warn(`\n  ⚠  Batch ${b+1} falló: ${err.message} — usando inglés como fallback`);
      for (let j = start; j < Math.min(start + BATCH_SIZE, exercises.length); j++) {
        if (!translated[j]) translated[j] = { ...exercises[j] };
      }
    }

    // Rate limit: pequeña pausa entre batches
    if (b < numBatches - 1) await sleep(400);
  }

  console.log(`\n\n✓ Traducción completada${errors > 0 ? ` (${errors} batches con fallback en inglés)` : ''}\n`);

  // 3. Generar SQL
  console.log('📝 Generando SQL...');
  const sql     = generateSQL(translated.filter(Boolean));
  const sizeKB  = Math.round(Buffer.byteLength(sql, 'utf8') / 1024);

  fs.writeFileSync(OUTPUT_FILE, sql, 'utf8');
  console.log(`✅ SQL generado: ${OUTPUT_FILE}`);
  console.log(`   Tamaño: ${sizeKB} KB | ${translated.length} ejercicios\n`);
  console.log('📋 PRÓXIMO PASO:');
  console.log('   1. Abrí Supabase SQL Editor (https://supabase.com/dashboard/project/xwjxpgqnscahvrseunus/sql)');
  console.log('   2. Hacé click en "New query" → cargá o pegá el archivo .sql');
  console.log('   3. Ejecutá y listo — las instrucciones estarán en español 🎉\n');
}

main().catch(err => {
  console.error('\n❌ Error fatal:', err.message);
  process.exit(1);
});