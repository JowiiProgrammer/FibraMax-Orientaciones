import { useState } from 'react'
import { format } from 'date-fns'
import { Route } from 'lucide-react'
import { useOrientationStore } from '@/store/orientations-store'
import { StatusBadge } from '@/components/ui/badge'
import { StarRating } from '@/components/feedback/FeedbackModal'
import { Button } from '@/components/ui/button'
import { TourForm } from '@/components/tours/TourForm'
import type { Monitor } from '@/lib/types'
import { cn } from '@/lib/utils'

export function MonitoresPage() {
  const { orientations, tours, addTour, deleteTour, saveTourFeedback, monitors, centers } = useOrientationStore()
  const today = format(new Date(), 'yyyy-MM-dd')
  const [tourModal, setTourModal] = useState<Monitor | null>(null)

  // Agrupar monitores por centro
  const monitoresByCentre = centers.map(center => ({
    center,
    monitors: monitors.filter(m => m.centerId === center.id),
  })).filter(g => g.monitors.length > 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl text-foreground">MONITORES</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Carga de orientaciones y tours por centro</p>
      </div>

      {monitoresByCentre.map(({ center, monitors: centroMonitors }) => (
        <div key={center.id} className="space-y-3">
          {/* Header del centro */}
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: center.color }} />
            <h2 className="font-display text-xl text-foreground">{center.name.toUpperCase()}</h2>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded"
              style={{ backgroundColor: center.color + '20', color: center.color }}
            >
              {center.shortCode}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {centroMonitors.map(m => {
              const myOrientations = orientations
                .filter(o => o.monitorId === m.id)
                .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
              const toursToday = tours.filter(t => t.monitorId === m.id && t.date === today)
              const orientationsToday = myOrientations.filter(o => o.date === today && o.status !== 'cancelled')
              const upcoming = myOrientations.filter(o =>
                o.date >= today && (o.status === 'pending' || o.status === 'confirmed')
              )
              const completedOrientations = myOrientations.filter(o => o.status === 'completed').length
              const noShowCount = myOrientations.filter(o => o.status === 'no_show').length

              // Rating promedio del monitor
              const ratingsO = myOrientations.filter(o => o.feedback?.rating).map(o => o.feedback!.rating)
              const ratingsT = tours.filter(t => t.monitorId === m.id && t.feedback?.rating).map(t => t.feedback!.rating)
              const allRatings = [...ratingsO, ...ratingsT]
              const avgRating = allRatings.length > 0 ? Math.round(allRatings.reduce((a, b) => a + b, 0) / allRatings.length) : 0

              return (
                <div key={m.id} className="fibra-card overflow-hidden">
                  <div className="h-1 shrink-0" style={{ backgroundColor: m.color }} />

                  <div className="p-4">
                    {/* Monitor header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                          style={{ backgroundColor: m.color }}
                        >
                          {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{m.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">{center.name}</p>
                            {avgRating > 0 && <StarRating rating={avgRating} />}
                          </div>
                        </div>
                      </div>
                      {/* Botón tour rápido */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setTourModal(m)}
                        className="gap-1.5 shrink-0"
                      >
                        <Route className="w-3.5 h-3.5" />
                        <span className="text-xs">Tours</span>
                        {toursToday.length > 0 && (
                          <span
                            className="text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: m.color }}
                          >
                            {toursToday.length}
                          </span>
                        )}
                      </Button>
                    </div>

                    {/* Stats hoy */}
                    <div className="grid grid-cols-4 gap-1.5 mb-4">
                      {[
                        { label: 'Orient. hoy', value: orientationsToday.length, color: 'text-foreground' },
                        { label: 'Tours hoy', value: toursToday.length, color: 'text-info' },
                        { label: 'Completadas', value: completedOrientations, color: 'text-success' },
                        { label: 'No vinieron', value: noShowCount, color: 'text-warning' },
                      ].map(s => (
                        <div key={s.label} className="text-center bg-muted/30 rounded-md py-2">
                          <p className={cn('text-lg font-display', s.color)}>{s.value}</p>
                          <p className="text-[9px] text-muted-foreground leading-tight px-1">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Próximas orientaciones */}
                    <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin">
                      {upcoming.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          Sin orientaciones próximas
                        </p>
                      ) : (
                        upcoming.map(o => (
                          <div key={o.id} className="flex items-center gap-2 px-2 py-1.5 bg-muted/20 rounded-md">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{o.subscriberName}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {format(new Date(o.date + 'T12:00:00'), 'dd/MM')} · {o.startTime}
                              </p>
                            </div>
                            <StatusBadge status={o.status} size="sm" />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Modal de tours */}
      <TourForm
        open={!!tourModal}
        monitor={tourModal}
        toursToday={tourModal ? tours.filter(t => t.monitorId === tourModal.id && t.date === today) : []}
        onClose={() => setTourModal(null)}
        onAddTour={addTour}
        onDeleteTour={deleteTour}
        onSaveTourFeedback={saveTourFeedback}
      />
    </div>
  )
}
