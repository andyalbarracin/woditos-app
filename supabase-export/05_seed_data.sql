-- ============================================================
-- WODITOS — SEED DATA
-- Archivo: 05_seed_data.sql
-- ⚠️ IMPORTANTE: Los users se crean via Auth (dashboard o API).
--    Este archivo solo inserta datos en las tablas públicas.
--    Primero creá los usuarios en Auth > Users con estos emails:
--      1. figo.albarra@gmail.com (luego UPDATE role = 'super_admin')
--      2. coach@woditos.app
--      3. maria@woditos.app
--      4. juan@woditos.app
--      5. sofia@woditos.app
--    El trigger handle_new_user creará automáticamente filas en
--    users y profiles. Después ejecutá este seed para actualizar
--    los datos.
-- ============================================================

-- ─── NOTA: Reemplazá estos UUIDs con los IDs reales que genera
--    Supabase Auth al crear cada usuario. Los de abajo son los
--    del proyecto original. ─────────────────────────────────────

-- IDs de referencia (reemplazar con los reales):
-- Andy (super_admin): 72992516-21c9-4895-9744-1692a8ab5064
-- Coach Carlos:       076f7c17-6e0a-4e74-8c73-9a7c3004115e
-- María:              a75c3da4-0bc9-4b81-97c9-5cbdb7d47e3c
-- Juan:               532aa0b8-347d-4190-8f89-c8b57fcab2df
-- Sofía:              40e8cf75-85b0-471a-8696-ba4f4021409f

-- ─── Actualizar roles ────────────────────────────────────────
UPDATE public.users SET role = 'super_admin' WHERE email = 'figo.albarra@gmail.com';
UPDATE public.users SET role = 'coach' WHERE email = 'coach@woditos.app';

-- ─── Actualizar profiles ─────────────────────────────────────
UPDATE public.profiles SET
  full_name = 'Andy',
  avatar_url = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  experience_level = 'intermediate',
  goals = 'Correr mi primer maratón en menos de 4 horas. Mejorar fuerza funcional para prevenir lesiones.'
WHERE user_id = (SELECT id FROM public.users WHERE email = 'figo.albarra@gmail.com');

UPDATE public.profiles SET
  full_name = 'Carlos Entrenador',
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
  birth_date = '1985-03-15',
  emergency_contact = '+54 11 5555-9719',
  experience_level = 'advanced',
  goals = 'Ayudar a mis atletas a superar sus límites'
WHERE user_id = (SELECT id FROM public.users WHERE email = 'coach@woditos.app');

UPDATE public.profiles SET
  full_name = 'María González',
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
  birth_date = '1995-07-22',
  emergency_contact = '+54 11 5555-2381',
  experience_level = 'intermediate',
  goals = 'Correr mi primer maratón en 2026'
WHERE user_id = (SELECT id FROM public.users WHERE email = 'maria@woditos.app');

UPDATE public.profiles SET
  full_name = 'Juan Pérez',
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juan',
  birth_date = '1995-07-22',
  emergency_contact = '+54 11 5555-2419',
  experience_level = 'basic',
  goals = 'Mejorar mi resistencia y perder 10kg'
WHERE user_id = (SELECT id FROM public.users WHERE email = 'juan@woditos.app');

UPDATE public.profiles SET
  full_name = 'Sofía Martínez',
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia',
  birth_date = '1995-07-22',
  emergency_contact = '+54 11 5555-8490',
  experience_level = 'advanced',
  goals = 'Competir en CrossFit Games algún día'
WHERE user_id = (SELECT id FROM public.users WHERE email = 'sofia@woditos.app');

-- ─── Groups ──────────────────────────────────────────────────
INSERT INTO public.groups (id, name, description, group_type, location, capacity, coach_id, cover_image_url, status) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Crew Palermo Runners', 'Grupo de running en los bosques de Palermo. Salimos martes, jueves y sábados.', 'running', 'Bosques de Palermo, CABA', 25, (SELECT id FROM public.users WHERE email = 'figo.albarra@gmail.com'), 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600', 'active'),
  ('a2222222-2222-2222-2222-222222222222', 'Crew Funcional Belgrano', 'Entrenamiento funcional al aire libre en Barrancas de Belgrano.', 'functional', 'Barrancas de Belgrano, CABA', 20, (SELECT id FROM public.users WHERE email = 'figo.albarra@gmail.com'), 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600', 'active'),
  ('a3333333-3333-3333-3333-333333333333', 'Crew Costanera Sur', 'Running y funcional en la Costanera Sur. Grupo mixto para todos los niveles.', 'hybrid', 'Costanera Sur, CABA', 30, (SELECT id FROM public.users WHERE email = 'figo.albarra@gmail.com'), 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600', 'active');

-- ─── Group Memberships ───────────────────────────────────────
-- (Usando subqueries para los user_ids)
INSERT INTO public.group_memberships (group_id, user_id, membership_status) VALUES
  ('a1111111-1111-1111-1111-111111111111', (SELECT id FROM public.users WHERE email = 'figo.albarra@gmail.com'), 'active'),
  ('a2222222-2222-2222-2222-222222222222', (SELECT id FROM public.users WHERE email = 'figo.albarra@gmail.com'), 'active'),
  ('a3333333-3333-3333-3333-333333333333', (SELECT id FROM public.users WHERE email = 'figo.albarra@gmail.com'), 'active'),
  ('a1111111-1111-1111-1111-111111111111', (SELECT id FROM public.users WHERE email = 'coach@woditos.app'), 'active'),
  ('a2222222-2222-2222-2222-222222222222', (SELECT id FROM public.users WHERE email = 'coach@woditos.app'), 'active'),
  ('a1111111-1111-1111-1111-111111111111', (SELECT id FROM public.users WHERE email = 'maria@woditos.app'), 'active'),
  ('a2222222-2222-2222-2222-222222222222', (SELECT id FROM public.users WHERE email = 'maria@woditos.app'), 'active'),
  ('a3333333-3333-3333-3333-333333333333', (SELECT id FROM public.users WHERE email = 'maria@woditos.app'), 'active'),
  ('a2222222-2222-2222-2222-222222222222', (SELECT id FROM public.users WHERE email = 'juan@woditos.app'), 'active'),
  ('a1111111-1111-1111-1111-111111111111', (SELECT id FROM public.users WHERE email = 'juan@woditos.app'), 'active'),
  ('a1111111-1111-1111-1111-111111111111', (SELECT id FROM public.users WHERE email = 'sofia@woditos.app'), 'active'),
  ('a3333333-3333-3333-3333-333333333333', (SELECT id FROM public.users WHERE email = 'sofia@woditos.app'), 'active');

-- ─── Exercise Wiki ───────────────────────────────────────────
INSERT INTO public.exercise_wiki (name, category, goal, muscle_group, difficulty_level, description, technique, common_mistakes, contraindications, tags) VALUES
  ('AMRAP Funcional', 'cardio', 'Mejorar resistencia cardiovascular, fuerza resistencia y capacidad aeróbica/anaeróbica.', 'full_body', 'advanced', 'As Many Reps As Possible: circuito de ejercicios funcionales ejecutados a máxima intensidad durante un tiempo determinado.', '1. Definir el circuito (ej: 5 sentadillas + 5 flexiones + 5 burpees). 2. Iniciar cronómetro (ej: 12 minutos). 3. Completar la mayor cantidad de rondas posible. 4. Mantener buena técnica aunque baje el ritmo. 5. Registrar rondas para próxima sesión.', 'Sacrificar técnica por velocidad, no descansar cuando es necesario, no registrar el score.', 'Lesiones agudas. No apto para personas sin base de entrenamiento. Hidratarse adecuadamente.', ARRAY['amrap','circuito','funcional','resistencia']),
  ('Box Jumps', 'Pliometría', 'Potencia explosiva', 'Piernas', 'intermediate', 'Saltos al cajón para desarrollar potencia explosiva en piernas. Clave para velocidad en carrera.', 'Flexión de caderas y rodillas, brazos atrás, salto explosivo, aterrizá suave con ambos pies.', 'Aterrizar muy al borde, no abrir caderas arriba del cajón.', NULL, ARRAY['potencia','pliometría','explosivo']),
  ('Burpee', 'cardio', 'Mejorar capacidad cardiovascular, quemar grasa y desarrollar fuerza funcional de cuerpo completo.', 'full_body', 'intermediate', 'Ejercicio de cuerpo completo que combina fuerza y cardio en un solo movimiento.', '1. Desde de pie, caer en cuclillas. 2. Apoyar manos en el suelo. 3. Saltar los pies hacia atrás a posición de plancha. 4. Hacer una flexión. 5. Saltar los pies hacia las manos. 6. Saltar hacia arriba con brazos extendidos.', 'No completar la flexión, no bloquear los codos arriba, aterrizar con las rodillas bloqueadas.', 'Lesiones de muñeca, hombro o rodilla.', ARRAY['cardio','funcional','hiit','cuerpo-completo']),
  ('Burpees', 'Cardio', 'Resistencia cardiovascular', 'Cuerpo completo', 'intermediate', 'Ejercicio de cuerpo completo que combina sentadilla, plancha y salto. Ideal para HIIT.', 'Bajá al suelo con control, pecho toca el piso, salto explosivo arriba con las manos sobre la cabeza.', 'No tocar el pecho al piso, aterrizar con las rodillas trabadas.', NULL, ARRAY['hiit','cardio','funcional']),
  ('Dominadas', 'fuerza', 'Desarrollar fuerza en la espalda y bíceps.', 'espalda', 'advanced', 'Ejercicio de tirón con peso corporal que trabaja los dorsales, biceps y romboides.', '1. Agarre supino o prono, manos al ancho de hombros. 2. Colgar con brazos extendidos. 3. Activar escápulas antes de tirar. 4. Subir hasta que el mentón supere la barra. 5. Bajar de forma controlada.', 'Balanceo excesivo, no bajar completamente, no activar escápulas, usar inercia.', 'Lesiones agudas de hombro o codo. Hernias cervicales graves.', ARRAY['espalda','biceps','peso-corporal','traccion']),
  ('Fartlek', 'Running', 'Velocidad variable', 'Piernas', 'basic', 'Entrenamiento de velocidad variable. Combiná tramos rápidos con recuperación activa.', 'Alterná entre ritmos rápidos (30s-2min) y trotes suaves de recuperación. Usá referencias como postes.', 'No respetar las recuperaciones, ir siempre al mismo ritmo.', NULL, ARRAY['running','velocidad','fartlek']),
  ('Flexiones', 'fuerza', 'Desarrollar fuerza y resistencia en el tren superior.', 'pecho', 'basic', 'Ejercicio clásico de empuje que trabaja el pecho, hombros y triceps usando el peso corporal.', '1. Manos ligeramente más anchas que los hombros. 2. Cuerpo en línea recta. 3. Bajar hasta que el pecho casi toque el suelo. 4. Empujar hacia arriba hasta extensión completa.', 'Caderas caídas o elevadas, codos muy abiertos, rango incompleto.', 'Lesiones agudas de muñeca o hombro.', ARRAY['pecho','triceps','hombros','peso-corporal']),
  ('Mountain Climbers', 'Cardio', 'Cardio y core', 'Core', 'basic', 'Ejercicio dinámico de core y cardio. Simula correr en posición de plancha.', 'Posición de plancha alta, llevá rodillas al pecho alternando, manteniendo caderas bajas.', 'Subir mucho la cadera, no llevar rodillas al pecho.', NULL, ARRAY['cardio','core','dinámico']),
  ('Peso muerto', 'fuerza', 'Desarrollar fuerza en la cadena posterior.', 'espalda', 'intermediate', 'Ejercicio de cadena posterior por excelencia.', '1. Barra sobre el centro del pie. 2. Espalda recta, pecho elevado. 3. Empujar el suelo con los pies mientras se levanta la barra rozando las piernas.', 'Redondear la espalda baja, la barra se aleja del cuerpo.', 'Hernias discales. Lesiones lumbares activas.', ARRAY['fuerza','espalda','cadena-posterior','avanzado']),
  ('Peso Muerto', 'Fuerza', 'Fuerza posterior', 'Espalda baja', 'advanced', 'Levantamiento desde el suelo que trabaja toda la cadena posterior.', 'Agarre firme, caderas atrás, barra pegada al cuerpo, extensión completa arriba.', 'Redondear la espalda, tirar con los brazos, no activar core.', NULL, ARRAY['fuerza','posterior','compuesto']),
  ('Plancha Frontal', 'Core', 'Estabilidad', 'Core', 'basic', 'Isométrico fundamental para estabilidad del core.', 'Antebrazos y puntas de pies, cuerpo en línea recta, apretá glúteos y abdomen, mirá al piso.', 'Cadera muy arriba o muy abajo, no activar glúteos, aguantar la respiración.', NULL, ARRAY['core','isométrico','estabilidad']),
  ('Plancha isométrica', 'core', 'Fortalecer el core, mejorar la estabilidad postural.', 'core', 'basic', 'Ejercicio estático que fortalece el núcleo corporal completo.', '1. Apoyar antebrazos en el suelo, codos bajo los hombros. 2. Cuerpo en línea recta. 3. Activar abdomen y glúteos. 4. Respirar de forma controlada.', 'Caer de caderas, elevar los glúteos, no activar el core.', 'Dolor de muñeca agudo. Hernias abdominales sin tratamiento.', ARRAY['core','isometrico','estabilidad','postura']),
  ('Pull-ups', 'Fuerza', 'Fuerza de tracción', 'Espalda', 'advanced', 'Dominadas estrictas. Ejercicio fundamental de tracción para tren superior.', 'Agarre prono más ancho que hombros, tirá desde los codos, barbilla sobre la barra, bajá controlado.', 'Kipping sin control, no bajar completamente, cuello adelante.', NULL, ARRAY['tracción','espalda','fuerza']),
  ('Remo con Barra', 'Fuerza', 'Fuerza de tracción', 'Espalda', 'intermediate', 'Ejercicio clave para fortalecer la espalda y mejorar la postura del corredor.', 'Inclinación de 45°, tirá la barra hacia el ombligo, apretá los omóplatos, bajá controlado.', 'Usar impulso del cuerpo, no llevar la barra al pecho.', NULL, ARRAY['espalda','tracción','postura']),
  ('Running técnica', 'running', 'Correr de manera más eficiente, reducir impacto y prevenir lesiones.', 'piernas', 'basic', 'Trabajo de técnica de carrera para mejorar la eficiencia del movimiento.', '1. Caída del pie bajo el centro de masa. 2. Cadencia alta (170-180 pasos/min). 3. Brazos a 90°. 4. Mirada al frente. 5. Ligera inclinación del torso.', 'Talón adelante del cuerpo, postura encorvada, brazos cruzando la línea media.', 'Lesiones agudas de tobillo, rodilla o cadera.', ARRAY['running','tecnica','carrera','eficiencia']),
  ('Sentadilla', 'fuerza', 'Desarrollar fuerza y volumen en cuadriceps, glúteos e isquiotibiales.', 'piernas', 'basic', 'Ejercicio compuesto fundamental que trabaja el tren inferior completo.', '1. Pies a la altura de los hombros. 2. Bajar manteniendo la espalda recta. 3. Empujar desde los talones.', 'Rodillas hacia adentro, talones levantados, espalda redondeada.', 'Lesiones de rodilla o cadera sin rehabilitación previa.', ARRAY['funcional','piernas','fuerza','basico']),
  ('Sentadilla con Barra', 'Fuerza', 'Fuerza y potencia', 'Piernas', 'intermediate', 'Ejercicio compuesto fundamental para fortalecer tren inferior.', 'Pies a la anchura de hombros, baja hasta que muslos queden paralelos al piso, mantené la espalda recta.', 'Rodillas hacia adentro, talones despegados del piso, redondear la espalda baja.', NULL, ARRAY['fuerza','piernas','compuesto']),
  ('Sprints 400m', 'Running', 'Velocidad y VO2max', 'Piernas', 'advanced', 'Series de velocidad en 400 metros para mejorar el VO2max y la velocidad.', 'Arranque progresivo, mantené la técnica de carrera, brazos activos, cadencia alta.', 'Salir muy rápido y morir al final, perder la técnica.', NULL, ARRAY['running','velocidad','intervalos']),
  ('Swing con Kettlebell', 'Funcional', 'Potencia de cadera', 'Cadena posterior', 'intermediate', 'Movimiento balístico de cadera que desarrolla potencia para la carrera.', 'Bisagra de cadera, brazos relajados, empujá caderas hacia adelante explosivamente, kettlebell a altura de ojos.', 'Levantar con los brazos, sentadilla en vez de bisagra.', NULL, ARRAY['kettlebell','potencia','cadera']),
  ('Tempo Run 5K', 'Running', 'Umbral de lactato', 'Piernas', 'intermediate', 'Carrera a ritmo sostenido moderado-alto. Mejora el umbral de lactato.', 'Corré a un ritmo que puedas sostener hablando con dificultad, mantené constante durante 20-30 min.', 'Empezar muy rápido, no mantener ritmo constante.', NULL, ARRAY['running','tempo','resistencia']),
  ('Thruster', 'Funcional', 'Fuerza y resistencia', 'Cuerpo completo', 'advanced', 'Combinación de sentadilla frontal y press sobre cabeza.', 'Sentadilla profunda con barra/mancuernas en hombros, subí explosivo y presioná arriba.', 'No llegar a profundidad en la sentadilla, no extender brazos completamente.', NULL, ARRAY['funcional','compuesto','metcon']),
  ('Wall Balls', 'Funcional', 'Resistencia funcional', 'Cuerpo completo', 'basic', 'Sentadilla + lanzamiento de pelota medicinal.', 'Sentadilla profunda con pelota en el pecho, extensión explosiva y lanzar a la marca en la pared.', 'No llegar a profundidad, lanzar con los brazos en vez de las piernas.', NULL, ARRAY['funcional','metcon','resistencia']),
  ('Zancadas Caminando', 'Fuerza', 'Equilibrio y fuerza', 'Piernas', 'basic', 'Ejercicio unilateral que mejora equilibrio y fuerza de piernas.', 'Paso largo, rodilla trasera casi toca el piso, torso erguido, empujá con el talón delantero.', 'Rodilla delantera pasa la punta del pie, inclinarse hacia adelante.', NULL, ARRAY['piernas','unilateral','equilibrio']);

-- ─── Food Wiki ───────────────────────────────────────────────
INSERT INTO public.food_wiki (name, category, benefits, best_time_to_consume, performance_relation, examples, notes) VALUES
  ('Agua con Electrolitos', 'Hidratación', 'Reposición de sodio, potasio y magnesio perdidos en el sudor. Previene deshidratación.', 'Durante y después del entrenamiento', 'La deshidratación del 2% reduce el rendimiento un 20%. Los electrolitos son críticos en sesiones >60min.', 'Agua con limón y sal, bebidas isotónicas caseras, agua de coco.', 'En Buenos Aires en verano, hidratación es clave. Empezá hidratado.'),
  ('Antiinflamatorios naturales', 'suplementos', 'Reducen la inflamación crónica y el daño oxidativo causado por el ejercicio intenso.', 'Diariamente, especialmente los días de entrenamiento intenso.', 'Permiten mayor frecuencia de entrenamiento al reducir la fatiga acumulada y el dolor muscular.', 'Cúrcuma con pimienta negra, jengibre, cerezas ácidas, arándanos, té verde, omega-3', 'Son complemento de una dieta balanceada, no reemplazo.'),
  ('Arroz Integral', 'Cereales', 'Carbohidrato complejo, fibra, vitaminas B. Base energética para el deportista.', 'Almuerzo, 3-4hs antes de entrenar', 'Recarga de glucógeno muscular. La fibra mantiene energía estable durante la actividad.', 'Con pollo y verduras, sushi bowl, ensalada de arroz.', 'Cocinar con anticipación para tener siempre disponible.'),
  ('Avena', 'Cereales', 'Carbohidratos complejos de liberación lenta. Rica en fibra y vitaminas del grupo B.', 'Desayuno o 2hs antes de entrenar', 'Provee energía sostenida durante entrenamientos largos.', 'Overnight oats, porridge con frutas, granola casera.', 'Elegir avena integral, no instantánea.'),
  ('Banana', 'Frutas', 'Alta en potasio, carbohidratos de rápida absorción. Previene calambres y da energía inmediata.', 'Pre-entrenamiento (30 min antes)', 'Energía rápida para sesiones de alta intensidad. El potasio ayuda a prevenir calambres musculares.', 'Banana sola, con manteca de maní, en licuado con avena.', 'Fruta número 1 del corredor argentino.'),
  ('Batata / Boniato', 'Tubérculos', 'Carbohidrato complejo con bajo índice glucémico. Rico en vitamina A y antioxidantes.', 'Almuerzo o cena, 3hs antes de entrenar', 'Recarga de glucógeno sin picos de insulina. Ideal para corredores de fondo.', 'Al horno, puré, chips horneados, en ensalada.', 'Superior a la papa común para deportistas.'),
  ('Carbohidratos complejos', 'carbohidratos', 'Principal fuente de energía para el ejercicio de alta intensidad.', 'Pre-entrenamiento (2-3 horas antes) o post-entrenamiento.', 'El glucógeno muscular es el combustible clave para actividades de alta intensidad. 4-6g por kg de peso/día.', 'Avena, arroz integral, batata, pasta integral, pan integral, quinoa, legumbres, frutas', 'Evitar procesados y refinados. Los carbohidratos no son el enemigo.'),
  ('Dulce de Leche', 'Dulces', 'Carbohidratos simples y proteína láctea. Fuente rápida de energía post-esfuerzo.', 'Post-entrenamiento como premio', 'Recuperación de glucógeno rápida después de sesiones intensas. Usar con moderación.', 'En tostada integral, con banana, alfajor casero.', 'Un clásico argentino. Usarlo como recompensa post-entreno en porciones moderadas.'),
  ('Frutos Secos', 'Snacks', 'Grasas saludables, proteína vegetal, magnesio. Antiinflamatorios naturales.', 'Snack entre comidas o post-entreno', 'El magnesio previene calambres. Las grasas omega-3 reducen inflamación y mejoran recuperación.', 'Nueces, almendras, mix trail, manteca de maní natural.', 'Porción ideal: un puñado (30g). No excederse por su alta densidad calórica.'),
  ('Grasas saludables', 'grasas', 'Fundamentales para la producción de hormonas, absorción de vitaminas liposolubles y salud cardiovascular.', 'A lo largo del día. Evitar antes de entrenar.', 'Las grasas omega-3 reducen la inflamación post-ejercicio. Sostienen energía en ejercicios de larga duración.', 'Palta/aguacate, aceite de oliva, frutos secos, semillas de chia y lino, salmón, sardinas', 'No eliminar las grasas de la dieta. 25-35% de las calorías totales.'),
  ('Hidratación y electrolitos', 'hidratacion', 'Mantener una hidratación óptima mejora el rendimiento deportivo, la concentración y la recuperación.', 'Antes, durante y después del ejercicio. Mínimo 2-3 litros de agua al día.', 'Una deshidratación del 2% del peso corporal puede reducir el rendimiento hasta un 20%.', 'Agua, agua con limón, bebidas isotónicas naturales, coco, caldos, infusiones', 'Orina clara = buena hidratación. Orina oscura = tomar agua inmediatamente.'),
  ('Huevos', 'Proteínas', 'Proteína completa de alta biodisponibilidad. Contiene leucina clave para síntesis muscular.', 'Post-entrenamiento o desayuno', 'Reparación muscular post-ejercicio. 2-3 huevos aportan ~15g de proteína de alta calidad.', 'Revueltos, duros, omelette con verduras, shakshuka.', 'La yema tiene nutrientes esenciales, no la descartes.'),
  ('Pollo', 'Proteínas', 'Proteína magra, baja en grasa, alta en vitamina B6 para metabolismo energético.', 'Almuerzo o cena post-entrenamiento', 'Recuperación muscular. 150g aportan ~35g de proteína con muy poca grasa.', 'A la plancha, al horno con verduras, en ensalada, milanesa al horno.', 'Preferir pechuga. La piel suma grasa innecesaria.'),
  ('Proteínas de alto valor biológico', 'proteinas', 'Esenciales para la recuperación y construcción muscular.', 'Post-entrenamiento (dentro de los 30-60 minutos) y distribuidas a lo largo del día.', 'La ingesta adecuada acelera la recuperación muscular y reduce el DOMS. 1.6-2.2g por kg/día.', 'Pollo, pavo, huevos, claras, atún, salmón, carne magra, cottage, yogur griego, whey protein', 'Priorizar fuentes completas de origen animal.'),
  ('Yerba Mate', 'Infusiones', 'Antioxidantes, cafeína natural, mejora el enfoque mental. Tradición argentina.', 'Mañana o 1 hora antes de entrenar', 'La cafeína mejora el rendimiento en 3-5%. Los antioxidantes reducen la inflamación post-ejercicio.', 'Mate tradicional, tereré en verano, mate cocido.', 'No tomar con el estómago vacío antes de entrenamientos intensos.');

-- ─── Achievements ────────────────────────────────────────────
INSERT INTO public.achievements (user_id, achievement_type, title, description) VALUES
  ((SELECT id FROM public.users WHERE email = 'figo.albarra@gmail.com'), 'first_month', '🎉 Primer Mes', 'Completaste tu primer mes entrenando con Woditos.'),
  ((SELECT id FROM public.users WHERE email = 'figo.albarra@gmail.com'), 'attendance_streak', '🔥 Racha de 7', 'Asististe 7 días seguidos a entrenamientos.'),
  ((SELECT id FROM public.users WHERE email = 'figo.albarra@gmail.com'), 'personal_record', '🏅 PR en 10K', 'Nuevo récord personal: 48:32 en 10K.'),
  ((SELECT id FROM public.users WHERE email = 'maria@woditos.app'), 'first_month', 'Primera Semana', 'Completaste tu primera semana de entrenamiento'),
  ((SELECT id FROM public.users WHERE email = 'maria@woditos.app'), 'attendance_streak', 'Racha de 5', '5 días consecutivos entrenando'),
  ((SELECT id FROM public.users WHERE email = 'sofia@woditos.app'), 'personal_record', 'PR Personal', 'Superaste tu mejor marca en peso muerto'),
  ((SELECT id FROM public.users WHERE email = 'juan@woditos.app'), 'first_month', 'Bienvenido', 'Tu primera sesión con Woditos');

-- ─── Posts (ejemplo — los posts reales dependen de los user_ids) ──
INSERT INTO public.posts (author_user_id, content_text, post_type, visibility) VALUES
  ((SELECT id FROM public.users WHERE email = 'figo.albarra@gmail.com'), 'Tip del día: No olviden los ejercicios de movilidad antes de salir a correr. 5 minutos de activación pueden prevenir lesiones serias. 📚', 'text', 'all_members'),
  ((SELECT id FROM public.users WHERE email = 'figo.albarra@gmail.com'), 'Recordatorio: Este sábado Long Run de 12K por Palermo. Salimos 8am, ritmo cómodo. 🙌', 'announcement', 'all_members'),
  ((SELECT id FROM public.users WHERE email = 'figo.albarra@gmail.com'), '🏆 Record personal en los 10K de Costanera! 48:32 min. Vamos por más!', 'milestone', 'all_members'),
  ((SELECT id FROM public.users WHERE email = 'figo.albarra@gmail.com'), '💪 Hoy el crew de Belgrano la rompió en el circuito funcional. Orgullo total!', 'text', 'all_members'),
  ((SELECT id FROM public.users WHERE email = 'figo.albarra@gmail.com'), '🏃‍♂️ Arrancamos la semana con todo! Mañana Tempo 5K en Palermo. Llevar hidratación!', 'announcement', 'all_members'),
  ((SELECT id FROM public.users WHERE email = 'maria@woditos.app'), '¡Hoy completé 10km en menos de 50 minutos! 🏃‍♀️💪 El entrenamiento está dando frutos.', 'milestone', 'all_members'),
  ((SELECT id FROM public.users WHERE email = 'juan@woditos.app'), 'Primera semana de entrenamiento funcional completada. Los burpees me destruyeron pero acá seguimos 😅', 'text', 'all_members'),
  ((SELECT id FROM public.users WHERE email = 'sofia@woditos.app'), '🔥 Nuevo PR en peso muerto: 85kg! Gracias @coach por la corrección de técnica.', 'milestone', 'all_members'),
  ((SELECT id FROM public.users WHERE email = 'coach@woditos.app'), '📢 Recordatorio: Mañana sesión especial de técnica de carrera a las 7AM en Palermo. ¡No falten!', 'announcement', 'all_members'),
  ((SELECT id FROM public.users WHERE email = 'maria@woditos.app'), 'El crew de Palermo es lo mejor que me pasó este año. Gracias por el apoyo constante 🧡', 'text', 'all_members');

-- ─── Stories (con URLs de Unsplash — expiran en 24h desde insert) ──
INSERT INTO public.stories (author_user_id, media_url) VALUES
  ((SELECT id FROM public.users WHERE email = 'maria@woditos.app'), 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800'),
  ((SELECT id FROM public.users WHERE email = 'sofia@woditos.app'), 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800'),
  ((SELECT id FROM public.users WHERE email = 'coach@woditos.app'), 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800'),
  ((SELECT id FROM public.users WHERE email = 'juan@woditos.app'), 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&h=900&fit=crop');

-- ─── Sessions (fechas relativas — ajustar al correr) ─────────
-- Nota: Las fechas son hardcodeadas al original. Ajustar según necesidad.
INSERT INTO public.sessions (group_id, title, session_type, start_time, end_time, location, capacity, notes, status) VALUES
  ('a2222222-2222-2222-2222-222222222222', 'HIIT Tabata', 'hiit', now() - interval '7 days' + time '08:00', now() - interval '7 days' + time '09:00', 'Barrancas de Belgrano', 20, 'Tabata clásico 20/10 x 8.', 'completed'),
  ('a1111111-1111-1111-1111-111111111111', 'Easy Run', 'running', now() - interval '7 days' + time '20:00', now() - interval '7 days' + time '21:00', 'Bosques de Palermo', 25, 'Trote suave 8K.', 'completed'),
  ('a3333333-3333-3333-3333-333333333333', 'Running Costanera 10K', 'running', now() - interval '5 days' + time '21:00', now() - interval '5 days' + time '22:30', 'Costanera Sur', 30, '10K ritmo moderado.', 'completed'),
  ('a2222222-2222-2222-2222-222222222222', 'Circuito Funcional', 'functional', now() - interval '4 days' + time '08:00', now() - interval '4 days' + time '09:00', 'Barrancas de Belgrano', 20, 'Circuito de 6 estaciones.', 'completed'),
  ('a1111111-1111-1111-1111-111111111111', 'Intervalos 800m', 'running', now() - interval '3 days' + time '20:00', now() - interval '3 days' + time '21:00', 'Rosedal de Palermo', 25, '6x800m con 2 min recuperación.', 'completed'),
  ('a1111111-1111-1111-1111-111111111111', 'Running Palermo - Tempo 5K', 'running', now() + interval '1 day' + time '20:00', now() + interval '1 day' + time '21:00', 'Rosedal de Palermo', 25, 'Llevar hidratación. Ritmo objetivo: 5:30/km', 'scheduled'),
  ('a3333333-3333-3333-3333-333333333333', 'AMRAP Costanera', 'amrap', now() + interval '1 day' + time '21:00', now() + interval '1 day' + time '22:00', 'Costanera Sur', 30, '20 min AMRAP: 10 burpees, 15 sentadillas, 200m run.', 'scheduled'),
  ('a2222222-2222-2222-2222-222222222222', 'HIIT Full Body', 'hiit', now() + interval '2 days' + time '08:00', now() + interval '2 days' + time '09:00', 'Barrancas de Belgrano', 20, '40s trabajo / 20s descanso. 5 rondas.', 'scheduled'),
  ('a2222222-2222-2222-2222-222222222222', 'EMOM Fuerza + Core', 'emom', now() + interval '3 days' + time '08:00', now() + interval '3 days' + time '09:00', 'Barrancas de Belgrano', 20, 'Every Minute On the Minute: Sentadillas, push-ups, plancha.', 'scheduled'),
  ('a1111111-1111-1111-1111-111111111111', 'Fartlek en el Rosedal', 'running', now() + interval '3 days' + time '20:00', now() + interval '3 days' + time '21:00', 'Rosedal de Palermo', 25, 'Series de velocidad variable. 30s rápido / 60s trote.', 'scheduled'),
  ('a3333333-3333-3333-3333-333333333333', 'Running + Funcional Mix', 'functional', now() + interval '4 days' + time '21:00', now() + interval '4 days' + time '22:30', 'Costanera Sur', 30, 'Combinar 3K run con circuito funcional de 15 min. Repetir 2x.', 'scheduled'),
  ('a2222222-2222-2222-2222-222222222222', 'Técnica de Kettlebell', 'technique', now() + interval '5 days' + time '08:00', now() + interval '5 days' + time '09:00', 'Barrancas de Belgrano', 15, 'Clase técnica: swing, clean, press. Peso moderado.', 'scheduled'),
  ('a1111111-1111-1111-1111-111111111111', 'Long Run Sábado', 'running', now() + interval '6 days' + time '21:00', now() + interval '6 days' + time '23:00', 'Bosques de Palermo', 25, 'Carrera larga 12K a ritmo cómodo. Hidratación en km 6.', 'scheduled');
