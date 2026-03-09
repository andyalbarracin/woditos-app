/**
 * Edge Function: seed-dummy-users
 * Crea usuarios dummy para testing de Woditos.
 * Solo puede ejecutarse una vez - verifica si los usuarios ya existen.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DummyUser {
  email: string
  password: string
  fullName: string
  role: 'coach' | 'member'
  avatarUrl: string | null
  goals: string
  experienceLevel: string
}

const DUMMY_USERS: DummyUser[] = [
  {
    email: 'coach@woditos.app',
    password: 'Woditos2024!',
    fullName: 'Carlos Entrenador',
    role: 'coach',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
    goals: 'Ayudar a mis atletas a superar sus límites',
    experienceLevel: 'advanced',
  },
  {
    email: 'maria@woditos.app',
    password: 'Woditos2024!',
    fullName: 'María González',
    role: 'member',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
    goals: 'Correr mi primer maratón en 2026',
    experienceLevel: 'intermediate',
  },
  {
    email: 'juan@woditos.app',
    password: 'Woditos2024!',
    fullName: 'Juan Pérez',
    role: 'member',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juan',
    goals: 'Mejorar mi resistencia y perder 10kg',
    experienceLevel: 'basic',
  },
  {
    email: 'sofia@woditos.app',
    password: 'Woditos2024!',
    fullName: 'Sofía Martínez',
    role: 'member',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia',
    goals: 'Competir en CrossFit Games algún día',
    experienceLevel: 'advanced',
  },
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const createdUsers: { email: string; id: string }[] = []
    const errors: string[] = []

    // Crear usuarios en Auth
    for (const user of DUMMY_USERS) {
      // Verificar si ya existe
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const exists = existingUsers?.users?.some(u => u.email === user.email)
      
      if (exists) {
        errors.push(`${user.email} ya existe, omitido`)
        continue
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirmar para testing
        user_metadata: { full_name: user.fullName }
      })

      if (authError) {
        errors.push(`Error creando ${user.email}: ${authError.message}`)
        continue
      }

      if (authData.user) {
        createdUsers.push({ email: user.email, id: authData.user.id })
        
        // Actualizar rol en users table (el trigger ya creó el registro)
        await supabaseAdmin
          .from('users')
          .update({ role: user.role })
          .eq('id', authData.user.id)

        // Actualizar profile con datos adicionales
        await supabaseAdmin
          .from('profiles')
          .update({
            full_name: user.fullName,
            avatar_url: user.avatarUrl,
            goals: user.goals,
            experience_level: user.experienceLevel,
            birth_date: user.role === 'coach' ? '1985-03-15' : '1995-07-22',
            emergency_contact: '+54 11 5555-' + Math.floor(1000 + Math.random() * 9000),
          })
          .eq('user_id', authData.user.id)
      }
    }

    // Obtener IDs de los usuarios creados
    const { data: allUsers } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .in('email', DUMMY_USERS.map(u => u.email))

    if (!allUsers || allUsers.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No se encontraron usuarios para asignar data',
        errors 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const userMap = new Map(allUsers.map(u => [u.email, u.id]))
    const coachId = userMap.get('coach@woditos.app')
    const mariaId = userMap.get('maria@woditos.app')
    const juanId = userMap.get('juan@woditos.app')
    const sofiaId = userMap.get('sofia@woditos.app')

    // Group IDs (de los grupos existentes)
    const GROUP_PALERMO = 'a1111111-1111-1111-1111-111111111111'
    const GROUP_BELGRANO = 'a2222222-2222-2222-2222-222222222222'
    const GROUP_COSTANERA = 'a3333333-3333-3333-3333-333333333333'

    // Session IDs (de las sesiones existentes)
    const sessions = [
      'e0a01e87-5f8c-456e-b55e-ad98ba4eeeec',
      '55ed4b90-5789-400c-a737-f08502e82f45',
      '5b7dc7d8-7e04-4a3f-a9cb-11c6048c9b89',
      '248e2cf6-5b19-4e10-addd-c5d106c25c2f',
      'dc574943-8248-4efe-9023-59b0b0bd0470',
    ]

    // 1. Group Memberships
    const memberships = [
      { user_id: coachId, group_id: GROUP_PALERMO, membership_status: 'active' },
      { user_id: coachId, group_id: GROUP_BELGRANO, membership_status: 'active' },
      { user_id: mariaId, group_id: GROUP_PALERMO, membership_status: 'active' },
      { user_id: juanId, group_id: GROUP_BELGRANO, membership_status: 'active' },
      { user_id: sofiaId, group_id: GROUP_PALERMO, membership_status: 'active' },
      { user_id: sofiaId, group_id: GROUP_COSTANERA, membership_status: 'active' },
    ].filter(m => m.user_id) // Filtrar nulls

    for (const m of memberships) {
      await supabaseAdmin.from('group_memberships').upsert(m, { onConflict: 'user_id,group_id' }).select()
    }

    // 2. Posts
    const posts = [
      { author_user_id: mariaId, content_text: '¡Hoy completé 10km en menos de 50 minutos! 🏃‍♀️💪 El entrenamiento está dando frutos.', post_type: 'milestone', visibility: 'all_members' },
      { author_user_id: juanId, content_text: 'Primera semana de entrenamiento funcional completada. Los burpees me destruyeron pero acá seguimos 😅', post_type: 'text', visibility: 'all_members' },
      { author_user_id: sofiaId, content_text: '🔥 Nuevo PR en peso muerto: 85kg! Gracias @coach por la corrección de técnica.', post_type: 'milestone', visibility: 'all_members' },
      { author_user_id: coachId, content_text: '📢 Recordatorio: Mañana sesión especial de técnica de carrera a las 7AM en Palermo. ¡No falten!', post_type: 'announcement', visibility: 'all_members' },
      { author_user_id: mariaId, content_text: 'El crew de Palermo es lo mejor que me pasó este año. Gracias por el apoyo constante 🧡', post_type: 'text', visibility: 'all_members' },
    ].filter(p => p.author_user_id)

    for (const p of posts) {
      await supabaseAdmin.from('posts').insert(p)
    }

    // 3. Stories (que no expiren por 24h)
    const futureExpiry = new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString() // 23h desde ahora
    const stories = [
      { author_user_id: mariaId, media_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800', expires_at: futureExpiry },
      { author_user_id: sofiaId, media_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', expires_at: futureExpiry },
      { author_user_id: coachId, media_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800', expires_at: futureExpiry },
    ].filter(s => s.author_user_id)

    for (const s of stories) {
      await supabaseAdmin.from('stories').insert(s)
    }

    // 4. Reservations + Attendance
    const attendanceRecords = [
      { session_id: sessions[0], user_id: mariaId, attendance_status: 'present', checkin_time: new Date().toISOString(), notes: 'Excelente actitud' },
      { session_id: sessions[0], user_id: juanId, attendance_status: 'late', checkin_time: new Date().toISOString(), notes: 'Llegó 10min tarde' },
      { session_id: sessions[0], user_id: sofiaId, attendance_status: 'present', checkin_time: new Date().toISOString() },
      { session_id: sessions[1], user_id: mariaId, attendance_status: 'present', checkin_time: new Date().toISOString() },
      { session_id: sessions[1], user_id: sofiaId, attendance_status: 'present', checkin_time: new Date().toISOString() },
      { session_id: sessions[2], user_id: juanId, attendance_status: 'absent', notes: 'Avisó que no podía' },
      { session_id: sessions[2], user_id: mariaId, attendance_status: 'present', checkin_time: new Date().toISOString() },
    ].filter(a => a.user_id)

    for (const a of attendanceRecords) {
      await supabaseAdmin.from('attendance').upsert(a, { onConflict: 'session_id,user_id' })
    }

    // 5. Reservations para próximas sesiones
    const reservations = [
      { session_id: sessions[3], user_id: mariaId, reservation_status: 'confirmed' },
      { session_id: sessions[3], user_id: sofiaId, reservation_status: 'confirmed' },
      { session_id: sessions[3], user_id: juanId, reservation_status: 'confirmed' },
      { session_id: sessions[4], user_id: mariaId, reservation_status: 'confirmed' },
      { session_id: sessions[4], user_id: sofiaId, reservation_status: 'confirmed' },
    ].filter(r => r.user_id)

    for (const r of reservations) {
      await supabaseAdmin.from('reservations').upsert(r, { onConflict: 'session_id,user_id' })
    }

    // 6. Achievements
    const achievements = [
      { user_id: mariaId, title: 'Primera Semana', description: 'Completaste tu primera semana de entrenamiento', achievement_type: 'first_month' },
      { user_id: mariaId, title: 'Racha de 5', description: '5 días consecutivos entrenando', achievement_type: 'attendance_streak' },
      { user_id: sofiaId, title: 'PR Personal', description: 'Superaste tu mejor marca en peso muerto', achievement_type: 'personal_record' },
      { user_id: juanId, title: 'Bienvenido', description: 'Tu primera sesión con Woditos', achievement_type: 'first_month' },
    ].filter(a => a.user_id)

    for (const a of achievements) {
      await supabaseAdmin.from('achievements').insert(a)
    }

    return new Response(JSON.stringify({
      success: true,
      created: createdUsers.map(u => u.email),
      message: 'Usuarios dummy creados con éxito',
      data_inserted: {
        memberships: memberships.length,
        posts: posts.length,
        stories: stories.length,
        attendance: attendanceRecords.length,
        reservations: reservations.length,
        achievements: achievements.length,
      },
      errors: errors.length > 0 ? errors : undefined,
      credentials: {
        coach: { email: 'coach@woditos.app', password: 'Woditos2024!' },
        maria: { email: 'maria@woditos.app', password: 'Woditos2024!' },
        juan: { email: 'juan@woditos.app', password: 'Woditos2024!' },
        sofia: { email: 'sofia@woditos.app', password: 'Woditos2024!' },
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
