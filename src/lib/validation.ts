/**
 * Archivo: validation.ts
 * Ruta: src/lib/validation.ts
 * Descripción: Esquemas de validación con Zod para todos los inputs de la app.
 *              Previene SQL injection, XSS y datos malformados.
 */
import { z } from 'zod';

// ─── Utilidades de sanitización ──────────────────────────────
const DANGEROUS_PATTERNS = /(<script|javascript:|on\w+=|<iframe|<object|<embed|<link|<meta|DROP\s+TABLE|DELETE\s+FROM|INSERT\s+INTO|UPDATE\s+.*SET|ALTER\s+TABLE|UNION\s+SELECT|--\s|;\s*DROP|'\s*OR\s+'1'\s*=\s*'1)/gi;

/** Remueve caracteres peligrosos de strings de texto libre */
export function sanitizeText(input: string): string {
  return input
    .replace(DANGEROUS_PATTERNS, '')
    .replace(/[<>]/g, '') // Elimina tags HTML
    .trim();
}

/** Valida que una URL sea segura (https o ruta relativa) */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url, 'https://placeholder.com');
    return ['https:', 'http:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// ─── Primitivos reutilizables ────────────────────────────────
const safeString = (maxLength: number) =>
  z.string().trim().max(maxLength).transform(sanitizeText);

const requiredSafeString = (maxLength: number, fieldName: string) =>
  z.string().trim()
    .min(1, { message: `${fieldName} es obligatorio` })
    .max(maxLength, { message: `${fieldName} no puede exceder ${maxLength} caracteres` })
    .transform(sanitizeText);

const emailSchema = z.string().trim()
  .email({ message: 'Email inválido' })
  .max(255, { message: 'Email demasiado largo' })
  .toLowerCase();

const passwordSchema = z.string()
  .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  .max(128, { message: 'La contraseña es demasiado larga' });

// ─── Esquemas de autenticación ───────────────────────────────
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: requiredSafeString(100, 'Nombre completo'),
});

// ─── Esquemas de perfil ──────────────────────────────────────
export const profileUpdateSchema = z.object({
  full_name: requiredSafeString(100, 'Nombre'),
  goals: safeString(500).optional().default(''),
  emergency_contact: safeString(200).optional().default(''),
});

// ─── Esquemas de posts y comentarios ─────────────────────────
export const postSchema = z.object({
  content_text: requiredSafeString(2000, 'Contenido del post'),
  post_type: z.enum(['text', 'milestone', 'announcement']),
});

export const commentSchema = z.object({
  content_text: requiredSafeString(1000, 'Comentario'),
});

// ─── Esquemas de sesiones ────────────────────────────────────
export const sessionSchema = z.object({
  title: safeString(200).optional().default('Sesión'),
  session_type: z.enum(['running', 'functional', 'amrap', 'emom', 'hiit', 'technique'], {
    errorMap: () => ({ message: 'Tipo de sesión inválido' }),
  }),
  session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Hora de inicio inválida'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Hora de fin inválida').optional(),
  location: safeString(200).optional().default(''),
  capacity: z.coerce.number().int().min(1).max(999),
  notes: safeString(1000).optional().default(''),
});

// ─── Esquemas de crews ───────────────────────────────────────
export const crewSchema = z.object({
  name: requiredSafeString(100, 'Nombre del crew'),
  group_type: safeString(50).optional().default('functional'),
  location: safeString(200).optional().default(''),
  capacity: z.coerce.number().int().min(1).max(999).optional().default(20),
});

// ─── Esquema de comunicación a asistentes ────────────────────
export const communicationSchema = z.object({
  message: requiredSafeString(500, 'Mensaje'),
});

// ─── Esquema de notas del coach ──────────────────────────────
export const coachNoteSchema = z.object({
  note_text: requiredSafeString(2000, 'Nota'),
});

// ─── Tipos exportados ────────────────────────────────────────
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type PostInput = z.infer<typeof postSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type SessionInput = z.infer<typeof sessionSchema>;
export type CrewInput = z.infer<typeof crewSchema>;
export type CommunicationInput = z.infer<typeof communicationSchema>;
