import { z } from 'zod'

// ── Regex helpers ──────────────────────────────────────────────────
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/
const SHORT_CODE_REGEX = /^[A-Z0-9]{2,3}$/

export const uuidSchema = z.string().regex(UUID_REGEX, 'ID inválido')
export const dateSchema = z.string().regex(DATE_REGEX, 'Fecha inválida')
export const timeSchema = z.string().regex(TIME_REGEX, 'Hora inválida')

// ── Orientación ────────────────────────────────────────────────────
export const orientationInsertSchema = z.object({
  subscriberName: z.string()
    .trim()
    .min(1, 'El nombre es requerido')
    .max(200, 'Nombre demasiado largo'),
  monitorId: uuidSchema,
  date: dateSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'no_show']),
  serviceType: z.enum(['general', 'advanced', 'maintenance', 'specific_equipment', 'group']),
  notes: z.string().max(2000, 'Notas demasiado largas').optional().nullable(),
}).refine(d => d.endTime > d.startTime, {
  message: 'La hora de fin debe ser posterior al inicio',
  path: ['endTime'],
})

// ── Tour ───────────────────────────────────────────────────────────
export const tourInsertSchema = z.object({
  monitorId: uuidSchema,
  date: dateSchema,
  notes: z.string().max(500).optional().nullable(),
})

// ── Feedback ───────────────────────────────────────────────────────
export const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().nullable(),
})

// ── Monitor ────────────────────────────────────────────────────────
export const monitorSchema = z.object({
  name: z.string().trim().min(1).max(100),
  color: z.string().regex(HEX_COLOR_REGEX, 'Color hexadecimal inválido'),
  centerId: uuidSchema,
})

// ── Centro ─────────────────────────────────────────────────────────
export const centerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  color: z.string().regex(HEX_COLOR_REGEX, 'Color hexadecimal inválido'),
  shortCode: z.string().regex(SHORT_CODE_REGEX, 'Código inválido (2-3 letras mayúsculas)'),
})

// ── Helper seguro para parsear ─────────────────────────────────────
// Lanza error genérico — nunca expone qué campo falló al exterior
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    // En desarrollo mostramos detalles; en producción, error genérico
    if (import.meta.env.DEV) {
      throw new Error(`Validation failed: ${result.error.message}`)
    }
    throw new Error('Los datos enviados no son válidos.')
  }
  return result.data
}
