import { createContext, useContext, useState, createElement } from 'react'
import type { ReactNode } from 'react'
import type { Orientation, OrientationStatus, Tour, Monitor, Center } from '@/lib/types'
import { MOCK_ORIENTATIONS, MOCK_TOURS, MOCK_MONITORS, MOCK_CENTERS } from '@/lib/mock-data'

interface AppStore {
  // Orientaciones
  orientations: Orientation[]
  addOrientation: (o: Orientation) => void
  updateOrientation: (o: Orientation) => void
  updateOrientationStatus: (id: string, status: OrientationStatus) => void
  deleteOrientation: (id: string) => void

  // Tours
  tours: Tour[]
  addTour: (t: Tour) => void
  deleteTour: (id: string) => void

  // Configuración — Monitores
  monitors: Monitor[]
  addMonitor: (m: Monitor) => void
  updateMonitor: (m: Monitor) => void
  deleteMonitor: (id: string) => void

  // Configuración — Centros
  centers: Center[]
  addCenter: (c: Center) => void
  updateCenter: (c: Center) => void
  deleteCenter: (id: string) => void
}

const Ctx = createContext<AppStore | null>(null)

export function OrientationsProvider({ children }: { children: ReactNode }) {
  const [orientations, setOrientations] = useState<Orientation[]>([...MOCK_ORIENTATIONS])
  const [tours, setTours] = useState<Tour[]>([...MOCK_TOURS])
  const [monitors, setMonitors] = useState<Monitor[]>([...MOCK_MONITORS])
  const [centers, setCenters] = useState<Center[]>([...MOCK_CENTERS])

  // ── Orientaciones ──────────────────────────────────────────────────────────
  const addOrientation = (o: Orientation) => setOrientations(p => [o, ...p])
  const updateOrientation = (updated: Orientation) =>
    setOrientations(p => p.map(o => o.id === updated.id ? updated : o))
  const updateOrientationStatus = (id: string, status: OrientationStatus) =>
    setOrientations(p => p.map(o => o.id === id ? { ...o, status } : o))
  const deleteOrientation = (id: string) =>
    setOrientations(p => p.filter(o => o.id !== id))

  // ── Tours ──────────────────────────────────────────────────────────────────
  const addTour = (t: Tour) => setTours(p => [t, ...p])
  const deleteTour = (id: string) => setTours(p => p.filter(t => t.id !== id))

  // ── Monitores ──────────────────────────────────────────────────────────────
  const addMonitor = (m: Monitor) => setMonitors(p => [...p, m])
  const updateMonitor = (updated: Monitor) =>
    setMonitors(p => p.map(m => m.id === updated.id ? updated : m))
  const deleteMonitor = (id: string) => setMonitors(p => p.filter(m => m.id !== id))

  // ── Centros ────────────────────────────────────────────────────────────────
  const addCenter = (c: Center) => setCenters(p => [...p, c])
  const updateCenter = (updated: Center) =>
    setCenters(p => p.map(c => c.id === updated.id ? updated : c))
  const deleteCenter = (id: string) => setCenters(p => p.filter(c => c.id !== id))

  return createElement(Ctx.Provider, {
    value: {
      orientations, addOrientation, updateOrientation, updateOrientationStatus, deleteOrientation,
      tours, addTour, deleteTour,
      monitors, addMonitor, updateMonitor, deleteMonitor,
      centers, addCenter, updateCenter, deleteCenter,
    }
  }, children)
}

export function useOrientationStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useOrientationStore must be used within OrientationsProvider')
  return ctx
}
