import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, List, CalendarDays, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/badge'
import { OrientationForm } from '@/components/orientations/OrientationForm'
import { OrientationDetail } from '@/components/orientations/OrientationDetail'
import { WeekCalendar } from '@/components/orientations/WeekCalendar'
import { useOrientationStore } from '@/store/orientations-store'
import type { Orientation, OrientationStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

type ViewMode = 'calendar' | 'list'

export function OrientationsPage() {
  const { orientations, addOrientation, updateOrientation, updateOrientationStatus, saveFeedback, monitors, centers } = useOrientationStore()
  const [view, setView] = useState<ViewMode>('calendar')
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [formOpen, setFormOpen] = useState(false)
  const [editOrientation, setEditOrientation] = useState<Orientation | undefined>()
  const [detailOrientation, setDetailOrientation] = useState<Orientation | null>(null)
  const [filterStatus, setFilterStatus] = useState<OrientationStatus | 'all'>('all')
  const [filterMonitorId, setFilterMonitorId] = useState('')
  const [filterCenterId, setFilterCenterId] = useState('')

  const filtered = useMemo(() => {
    return orientations
      .filter(o => filterStatus === 'all' || o.status === filterStatus)
      .filter(o => !filterMonitorId || o.monitorId === filterMonitorId)
      .filter(o => !filterCenterId || o.centerName === filterCenterId)
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
  }, [orientations, filterStatus, filterMonitorId, filterCenterId])

  // Monitores del centro seleccionado (para el filtro de monitor)
  const availableMonitors = filterCenterId
    ? monitors.filter(m => m.centerName === filterCenterId)
    : monitors

  function handleSave(data: Omit<Orientation, 'id' | 'createdAt'>) {
    if (editOrientation) {
      updateOrientation({ ...data, id: editOrientation.id, createdAt: editOrientation.createdAt })
        .catch(console.error)
    } else {
      addOrientation(data).catch(console.error)
    }
    setEditOrientation(undefined)
  }

  const pendingCount = orientations.filter(o => o.status === 'pending').length
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayCount = orientations.filter(o => o.date === todayStr && o.status !== 'cancelled').length

  const STATUS_LABELS: Record<string, string> = {
    all: 'Todas', pending: 'Pendientes', confirmed: 'Confirmadas',
    completed: 'Completadas', cancelled: 'Canceladas',
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-foreground">ORIENTACIONES</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {todayCount} hoy · <span className="text-warning">{pendingCount} pendientes</span>
          </p>
        </div>
        <Button onClick={() => { setEditOrientation(undefined); setFormOpen(true) }}>
          <Plus className="w-4 h-4" />
          Nueva
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-2">
        {/* Row 1: estado + view toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-card border border-border rounded-md p-1">
            {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  'px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap',
                  filterStatus === s ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1 bg-card border border-border rounded-md p-1">
            <button
              onClick={() => setView('calendar')}
              className={cn('p-1.5 rounded transition-colors', view === 'calendar' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground')}
            >
              <CalendarDays className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('list')}
              className={cn('p-1.5 rounded transition-colors', view === 'list' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Row 2: filtro centro + monitor */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Centros */}
          <div className="flex items-center gap-1 flex-wrap">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <button
              onClick={() => { setFilterCenterId(''); setFilterMonitorId('') }}
              className={cn(
                'px-2 py-1 rounded text-xs font-medium border transition-all',
                !filterCenterId ? 'bg-secondary text-foreground border-border' : 'text-muted-foreground border-border/50 hover:border-border'
              )}
            >
              Todos los centros
            </button>
            {centers.map(c => (
              <button
                key={c.id}
                onClick={() => { setFilterCenterId(filterCenterId === c.name ? '' : c.name); setFilterMonitorId('') }}
                className={cn(
                  'px-2 py-1 rounded text-xs font-medium border transition-all',
                  filterCenterId === c.name ? 'text-white border-transparent' : 'text-muted-foreground border-border/50 hover:border-border'
                )}
                style={filterCenterId === c.name ? { backgroundColor: c.color, borderColor: c.color } : {}}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Monitor (depende del centro) */}
          {availableMonitors.length > 0 && (
            <select
              value={filterMonitorId}
              onChange={e => setFilterMonitorId(e.target.value)}
              className="h-8 px-2 text-xs bg-card border border-border rounded-md text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Todos los monitores</option>
              {availableMonitors.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Content */}
      {view === 'calendar' ? (
        <div className="fibra-card overflow-hidden" style={{ height: 'calc(100vh - 280px)', minHeight: '460px' }}>
          <WeekCalendar
            currentWeek={currentWeek}
            onWeekChange={setCurrentWeek}
            orientations={filtered}
            onSelectOrientation={setDetailOrientation}
            filterMonitorId={filterMonitorId}
            filterCenterId={filterCenterId}
          />
        </div>
      ) : (
        <ListView orientations={filtered} onSelect={setDetailOrientation} />
      )}

      {/* Modals */}
      <OrientationForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditOrientation(undefined) }}
        onSave={handleSave}
        existingOrientations={orientations}
        editOrientation={editOrientation}
      />

      <OrientationDetail
        orientation={detailOrientation}
        onClose={() => setDetailOrientation(null)}
        onConfirm={id => updateOrientationStatus(id, 'confirmed')}
        onComplete={id => updateOrientationStatus(id, 'completed')}
        onCancel={id => updateOrientationStatus(id, 'cancelled')}
        onNoShow={id => updateOrientationStatus(id, 'no_show')}
        onEdit={o => { setEditOrientation(o); setFormOpen(true) }}
        onSaveFeedback={saveFeedback}
      />
    </div>
  )
}

function ListView({ orientations, onSelect }: { orientations: Orientation[]; onSelect: (o: Orientation) => void }) {
  if (orientations.length === 0) {
    return (
      <div className="fibra-card p-12 text-center">
        <p className="text-muted-foreground text-sm">No hay orientaciones con estos filtros.</p>
      </div>
    )
  }

  let lastDate = ''

  return (
    <div className="space-y-1">
      {orientations.map(o => {
        const showDate = o.date !== lastDate
        lastDate = o.date
        return (
          <div key={o.id}>
            {showDate && (
              <div className="px-1 py-2 mt-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {format(new Date(o.date + 'T12:00:00'), "EEEE, d 'de' MMMM", { locale: es })}
                </p>
              </div>
            )}
            <button
              onClick={() => onSelect(o)}
              className="w-full fibra-card p-3.5 flex items-center gap-3 hover:bg-accent/50 transition-colors text-left"
            >
              <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: o.monitorColor }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground truncate">{o.subscriberName}</p>
                  {/* Badge de centro */}
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: o.centerColor + '30', color: o.centerColor }}
                  >
                    {o.centerShortCode}
                  </span>
                  <StatusBadge status={o.status} size="sm" />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {o.startTime} – {o.endTime} · {o.monitorName}
                </p>
              </div>
            </button>
          </div>
        )
      })}
    </div>
  )
}
