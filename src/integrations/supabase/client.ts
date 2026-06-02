import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Mensaje genérico — no expone nombres de variables en producción
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Configuration error: missing required environment variables.')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,  // Sin auth todavía; no persistir sesiones vacías
    autoRefreshToken: false,
  },
})

// Logger seguro: en producción no expone detalles internos a la consola del browser
export function logError(context: string, err: unknown): void {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, err)
  }
  // En producción: silencioso. Cuando se integre un servicio de monitoring
  // (Sentry, Datadog), añadirlo aquí en lugar de console.error.
}
