import { createContext, useContext, createElement, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import {
  orientationInsertSchema, tourInsertSchema, feedbackSchema,
  monitorSchema, centerSchema, uuidSchema, validateOrThrow,
} from '@/lib/validation'
import type { Orientation, OrientationStatus, Tour, Monitor, Center } from '@/lib/types'
import type { DbOrientation, DbTour, DbMonitor, DbCenter } from '@/integrations/supabase/db.types'

// ── Transformers DB → App types ────────────────────────────────────────
function toMonitor(m: DbMonitor): Monitor {
  return {
    id: m.id,
    name: m.name,
    color: m.color,
    centerId: m.center_id,
    centerName: m.centers?.name ?? '',
    centerColor: m.centers?.color ?? '#DF3E6F',
    centerShortCode: m.centers?.short_code ?? '??',
  }
}

function toCenter(c: DbCenter): Center {
  return { id: c.id, name: c.name, color: c.color, shortCode: c.short_code }
}

function toOrientation(o: DbOrientation): Orientation {
  const m = o.monitors
  return {
    id: o.id,
    subscriberName: o.subscriber_name,
    monitorId: o.monitor_id,
    monitorName: m?.name ?? '',
    monitorColor: m?.color ?? '#DF3E6F',
    centerName: m?.centers?.name ?? '',
    centerColor: m?.centers?.color ?? '#DF3E6F',
    centerShortCode: m?.centers?.short_code ?? '??',
    date: o.date,
    startTime: o.start_time.slice(0, 5),
    endTime: o.end_time.slice(0, 5),
    status: o.status,
    serviceType: o.service_type,
    notes: o.notes ?? undefined,
    createdAt: o.created_at,
    feedback: o.orientation_feedback ?? undefined,
  }
}

function toTour(t: DbTour): Tour {
  const m = t.monitors
  return {
    id: t.id,
    monitorId: t.monitor_id,
    monitorName: m?.name ?? '',
    monitorColor: m?.color ?? '#DF3E6F',
    centerName: m?.centers?.name ?? '',
    centerColor: m?.centers?.color ?? '#DF3E6F',
    centerShortCode: m?.centers?.short_code ?? '??',
    date: t.date,
    notes: t.notes ?? undefined,
    createdAt: t.created_at,
    feedback: t.tour_feedback ?? undefined,
  }
}

// ── Error handler — toast visible + log en dev ─────────────────────
function handleError(context: string, err: unknown): never {
  if (import.meta.env.DEV) console.error(`[${context}]`, err)
  const msg = err instanceof Error ? err.message : String(err)
  // Supabase RLS error
  if (msg.includes('row-level security')) {
    toast.error('Sin permiso para realizar esta acción.')
  } else if (msg.includes('violates check constraint')) {
    toast.error('Los datos no son válidos. Revisa el formulario.')
  } else if (msg.includes('network') || msg.includes('Failed to fetch')) {
    toast.error('Sin conexión. Comprueba tu internet.')
  } else {
    toast.error('Error al guardar. Inténtalo de nuevo.')
  }
  throw err
}

// ── Supabase fetchers ──────────────────────────────────────────────────
async function fetchOrientations(): Promise<Orientation[]> {
  const { data, error } = await supabase
    .from('orientations')
    .select('*, monitors(*, centers(*)), orientation_feedback(*)')
    .order('date', { ascending: false })
    .order('start_time', { ascending: true })
  if (error) throw error
  return (data as DbOrientation[]).map(toOrientation)
}

async function fetchTours(): Promise<Tour[]> {
  const { data, error } = await supabase
    .from('tours')
    .select('*, monitors(*, centers(*)), tour_feedback(*)')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as DbTour[]).map(toTour)
}

async function fetchMonitors(): Promise<Monitor[]> {
  const { data, error } = await supabase
    .from('monitors')
    .select('*, centers(*)')
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return (data as DbMonitor[]).map(toMonitor)
}

async function fetchCenters(): Promise<Center[]> {
  const { data, error } = await supabase
    .from('centers')
    .select('*')
    .order('name')
  if (error) throw error
  return (data as DbCenter[]).map(toCenter)
}

// ── Store context ──────────────────────────────────────────────────────
interface AppStore {
  // Data
  orientations: Orientation[]
  tours: Tour[]
  monitors: Monitor[]
  centers: Center[]
  isLoading: boolean

  // Orientaciones
  addOrientation: (o: Omit<Orientation, 'id' | 'createdAt'>) => Promise<void>
  updateOrientation: (o: Orientation) => Promise<void>
  updateOrientationStatus: (id: string, status: OrientationStatus) => Promise<void>
  deleteOrientation: (id: string) => Promise<void>

  // Feedback orientaciones
  saveFeedback: (orientationId: string, rating: number, comment?: string) => Promise<void>
  saveTourFeedback: (tourId: string, rating: number, comment?: string) => Promise<void>

  // Tours
  addTour: (t: Omit<Tour, 'id' | 'createdAt'>) => Promise<void>
  deleteTour: (id: string) => Promise<void>

  // Configuración
  addMonitor: (m: Omit<Monitor, 'id'>) => Promise<void>
  updateMonitor: (m: Monitor) => Promise<void>
  deleteMonitor: (id: string) => Promise<void>
  addCenter: (c: Omit<Center, 'id'>) => Promise<void>
  updateCenter: (c: Center) => Promise<void>
  deleteCenter: (id: string) => Promise<void>
}

const Ctx = createContext<AppStore | null>(null)

export function OrientationsProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()

  const { data: orientations = [], isLoading: loadO } = useQuery({ queryKey: ['orientations'], queryFn: fetchOrientations })
  const { data: tours       = [], isLoading: loadT } = useQuery({ queryKey: ['tours'],        queryFn: fetchTours })
  const { data: monitors    = [], isLoading: loadM } = useQuery({ queryKey: ['monitors'],     queryFn: fetchMonitors })
  const { data: centers     = [], isLoading: loadC } = useQuery({ queryKey: ['centers'],      queryFn: fetchCenters })

  const isLoading = loadO || loadT || loadM || loadC

  // ── Realtime ───────────────────────────────────────────────────────
  // Refresca al instante cuando cambian los datos (desde cualquier dispositivo).
  // Requiere que las tablas estén en la publicación `supabase_realtime`. Si no lo
  // están, no llegan eventos y el polling de React Query sigue cubriendo la
  // actualización — por lo que esto es seguro de desplegar aunque Realtime esté off.
  useEffect(() => {
    const channel = supabase
      .channel('db-orientaciones')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orientations' },        () => qc.invalidateQueries({ queryKey: ['orientations'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orientation_feedback' }, () => qc.invalidateQueries({ queryKey: ['orientations'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tours' },                () => qc.invalidateQueries({ queryKey: ['tours'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tour_feedback' },         () => qc.invalidateQueries({ queryKey: ['tours'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monitors' },              () => qc.invalidateQueries({ queryKey: ['monitors'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'centers' },               () => qc.invalidateQueries({ queryKey: ['centers'] }))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [qc])

  // ── Orientaciones ──────────────────────────────────────────────────
  const addOrientation = async (o: Omit<Orientation, 'id' | 'createdAt'>) => {
    const v = validateOrThrow(orientationInsertSchema, o)
    const { error } = await supabase.from('orientations').insert({
      subscriber_name: v.subscriberName,
      monitor_id: v.monitorId,
      date: v.date,
      start_time: v.startTime,
      end_time: v.endTime,
      status: v.status,
      service_type: v.serviceType,
      notes: v.notes ?? null,
    })
    if (error) handleError('addOrientation', error)
    toast.success('Orientación agendada')
    qc.invalidateQueries({ queryKey: ['orientations'] })
  }

  const updateOrientation = async (o: Orientation) => {
    const id = validateOrThrow(uuidSchema, o.id)
    const v = validateOrThrow(orientationInsertSchema, o)
    const { error } = await supabase.from('orientations').update({
      subscriber_name: v.subscriberName,
      monitor_id: v.monitorId,
      date: v.date,
      start_time: v.startTime,
      end_time: v.endTime,
      status: v.status,
      service_type: v.serviceType,
      notes: v.notes ?? null,
    }).eq('id', id)
    if (error) handleError('updateOrientation', error)
    toast.success('Orientación actualizada')
    qc.invalidateQueries({ queryKey: ['orientations'] })
  }

  const updateOrientationStatus = async (id: string, status: OrientationStatus) => {
    const { error } = await supabase.from('orientations').update({ status }).eq('id', id)
    if (error) handleError('updateStatus', error)
    qc.invalidateQueries({ queryKey: ['orientations'] })
  }

  const deleteOrientation = async (id: string) => {
    const safeId = validateOrThrow(uuidSchema, id)
    const { error } = await supabase.from('orientations').delete().eq('id', safeId)
    if (error) handleError('deleteOrientation', error)
    qc.invalidateQueries({ queryKey: ['orientations'] })
  }

  // ── Feedback ───────────────────────────────────────────────────────
  const saveFeedback = async (orientationId: string, rating: number, comment?: string) => {
    const safeId = validateOrThrow(uuidSchema, orientationId)
    const v = validateOrThrow(feedbackSchema, { rating, comment })
    const { error } = await supabase.from('orientation_feedback').upsert({
      orientation_id: safeId, rating: v.rating, comment: v.comment ?? null,
    }, { onConflict: 'orientation_id' })
    if (error) handleError('saveFeedback', error)
    toast.success('Valoración guardada')
    qc.invalidateQueries({ queryKey: ['orientations'] })
  }

  const saveTourFeedback = async (tourId: string, rating: number, comment?: string) => {
    const safeId = validateOrThrow(uuidSchema, tourId)
    const v = validateOrThrow(feedbackSchema, { rating, comment })
    const { error } = await supabase.from('tour_feedback').upsert({
      tour_id: safeId, rating: v.rating, comment: v.comment ?? null,
    }, { onConflict: 'tour_id' })
    if (error) handleError('saveTourFeedback', error)
    toast.success('Valoración guardada')
    qc.invalidateQueries({ queryKey: ['tours'] })
  }

  // ── Tours ──────────────────────────────────────────────────────────
  const addTour = async (t: Omit<Tour, 'id' | 'createdAt'>) => {
    const v = validateOrThrow(tourInsertSchema, t)
    const { error } = await supabase.from('tours').insert({
      monitor_id: v.monitorId, date: v.date, notes: v.notes ?? null,
    })
    if (error) handleError('addTour', error)
    toast.success('Tour registrado')
    qc.invalidateQueries({ queryKey: ['tours'] })
  }

  const deleteTour = async (id: string) => {
    const safeId = validateOrThrow(uuidSchema, id)
    const { error } = await supabase.from('tours').delete().eq('id', safeId)
    if (error) handleError('deleteTour', error)
    qc.invalidateQueries({ queryKey: ['tours'] })
  }

  // ── Monitores ──────────────────────────────────────────────────────
  const addMonitor = async (m: Omit<Monitor, 'id'>) => {
    const v = validateOrThrow(monitorSchema, m)
    const { error } = await supabase.from('monitors').insert({
      name: v.name, color: v.color, center_id: v.centerId,
    })
    if (error) handleError('addMonitor', error)
    toast.success('Monitor añadido')
    qc.invalidateQueries({ queryKey: ['monitors'] })
  }

  const updateMonitor = async (m: Monitor) => {
    const safeId = validateOrThrow(uuidSchema, m.id)
    const v = validateOrThrow(monitorSchema, m)
    const { error } = await supabase.from('monitors').update({
      name: v.name, color: v.color, center_id: v.centerId,
    }).eq('id', safeId)
    if (error) handleError('updateMonitor', error)
    toast.success('Monitor actualizado')
    qc.invalidateQueries({ queryKey: ['monitors'] })
  }

  const deleteMonitor = async (id: string) => {
    const safeId = validateOrThrow(uuidSchema, id)
    const { error } = await supabase.from('monitors').delete().eq('id', safeId)
    if (error) handleError('deleteMonitor', error)
    qc.invalidateQueries({ queryKey: ['monitors'] })
  }

  // ── Centros ────────────────────────────────────────────────────────
  const addCenter = async (c: Omit<Center, 'id'>) => {
    const v = validateOrThrow(centerSchema, c)
    const { error } = await supabase.from('centers').insert({
      name: v.name, color: v.color, short_code: v.shortCode,
    })
    if (error) handleError('addCenter', error)
    toast.success('Centro añadido')
    qc.invalidateQueries({ queryKey: ['centers'] })
  }

  const updateCenter = async (c: Center) => {
    const safeId = validateOrThrow(uuidSchema, c.id)
    const v = validateOrThrow(centerSchema, c)
    const { error } = await supabase.from('centers').update({
      name: v.name, color: v.color, short_code: v.shortCode,
    }).eq('id', safeId)
    if (error) handleError('updateCenter', error)
    toast.success('Centro actualizado')
    qc.invalidateQueries({ queryKey: ['centers'] })
  }

  const deleteCenter = async (id: string) => {
    const safeId = validateOrThrow(uuidSchema, id)
    const { error } = await supabase.from('centers').delete().eq('id', safeId)
    if (error) handleError('deleteCenter', error)
    qc.invalidateQueries({ queryKey: ['centers'] })
  }

  return createElement(Ctx.Provider, {
    value: {
      orientations, tours, monitors, centers, isLoading,
      addOrientation, updateOrientation, updateOrientationStatus, deleteOrientation,
      saveFeedback, saveTourFeedback,
      addTour, deleteTour,
      addMonitor, updateMonitor, deleteMonitor,
      addCenter, updateCenter, deleteCenter,
    }
  }, children)
}

export function useOrientationStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useOrientationStore must be used within OrientationsProvider')
  return ctx
}
