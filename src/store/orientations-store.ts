import { createContext, useContext, createElement } from 'react'
import type { ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
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

  // ── Orientaciones ──────────────────────────────────────────────────
  const addOrientation = async (o: Omit<Orientation, 'id' | 'createdAt'>) => {
    const { error } = await supabase.from('orientations').insert({
      subscriber_name: o.subscriberName,
      monitor_id: o.monitorId,
      date: o.date,
      start_time: o.startTime,
      end_time: o.endTime,
      status: o.status,
      service_type: o.serviceType,
      notes: o.notes ?? null,
    })
    if (error) throw error
    qc.invalidateQueries({ queryKey: ['orientations'] })
  }

  const updateOrientation = async (o: Orientation) => {
    const { error } = await supabase.from('orientations').update({
      subscriber_name: o.subscriberName,
      monitor_id: o.monitorId,
      date: o.date,
      start_time: o.startTime,
      end_time: o.endTime,
      status: o.status,
      service_type: o.serviceType,
      notes: o.notes ?? null,
    }).eq('id', o.id)
    if (error) throw error
    qc.invalidateQueries({ queryKey: ['orientations'] })
  }

  const updateOrientationStatus = async (id: string, status: OrientationStatus) => {
    const { error } = await supabase.from('orientations').update({ status }).eq('id', id)
    if (error) throw error
    qc.invalidateQueries({ queryKey: ['orientations'] })
  }

  const deleteOrientation = async (id: string) => {
    const { error } = await supabase.from('orientations').delete().eq('id', id)
    if (error) throw error
    qc.invalidateQueries({ queryKey: ['orientations'] })
  }

  // ── Feedback ───────────────────────────────────────────────────────
  const saveFeedback = async (orientationId: string, rating: number, comment?: string) => {
    const { error } = await supabase.from('orientation_feedback').upsert({
      orientation_id: orientationId, rating, comment: comment ?? null,
    }, { onConflict: 'orientation_id' })
    if (error) throw error
    qc.invalidateQueries({ queryKey: ['orientations'] })
  }

  const saveTourFeedback = async (tourId: string, rating: number, comment?: string) => {
    const { error } = await supabase.from('tour_feedback').upsert({
      tour_id: tourId, rating, comment: comment ?? null,
    }, { onConflict: 'tour_id' })
    if (error) throw error
    qc.invalidateQueries({ queryKey: ['tours'] })
  }

  // ── Tours ──────────────────────────────────────────────────────────
  const addTour = async (t: Omit<Tour, 'id' | 'createdAt'>) => {
    const { error } = await supabase.from('tours').insert({
      monitor_id: t.monitorId, date: t.date, notes: t.notes ?? null,
    })
    if (error) throw error
    qc.invalidateQueries({ queryKey: ['tours'] })
  }

  const deleteTour = async (id: string) => {
    const { error } = await supabase.from('tours').delete().eq('id', id)
    if (error) throw error
    qc.invalidateQueries({ queryKey: ['tours'] })
  }

  // ── Monitores ──────────────────────────────────────────────────────
  const addMonitor = async (m: Omit<Monitor, 'id'>) => {
    const { error } = await supabase.from('monitors').insert({
      name: m.name, color: m.color, center_id: m.centerId,
    })
    if (error) throw error
    qc.invalidateQueries({ queryKey: ['monitors'] })
  }

  const updateMonitor = async (m: Monitor) => {
    const { error } = await supabase.from('monitors').update({
      name: m.name, color: m.color, center_id: m.centerId,
    }).eq('id', m.id)
    if (error) throw error
    qc.invalidateQueries({ queryKey: ['monitors'] })
  }

  const deleteMonitor = async (id: string) => {
    const { error } = await supabase.from('monitors').delete().eq('id', id)
    if (error) throw error
    qc.invalidateQueries({ queryKey: ['monitors'] })
  }

  // ── Centros ────────────────────────────────────────────────────────
  const addCenter = async (c: Omit<Center, 'id'>) => {
    const { error } = await supabase.from('centers').insert({
      name: c.name, color: c.color, short_code: c.shortCode,
    })
    if (error) throw error
    qc.invalidateQueries({ queryKey: ['centers'] })
  }

  const updateCenter = async (c: Center) => {
    const { error } = await supabase.from('centers').update({
      name: c.name, color: c.color, short_code: c.shortCode,
    }).eq('id', c.id)
    if (error) throw error
    qc.invalidateQueries({ queryKey: ['centers'] })
  }

  const deleteCenter = async (id: string) => {
    const { error } = await supabase.from('centers').delete().eq('id', id)
    if (error) throw error
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
