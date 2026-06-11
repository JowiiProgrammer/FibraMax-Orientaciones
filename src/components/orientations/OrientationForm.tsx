import { useState } from 'react'
import { format, addMinutes, parse, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { X, Clock, User, Calendar, AlertCircle, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Orientation, OrientationStatus, ServiceType } from '@/lib/types'
import { SERVICE_CONFIG } from '@/lib/types'
import { useOrientationStore } from '@/store/orientations-store'

interface OrientationFormProps {
  open: boolean
  onClose: () => void
  onSave: (o: Omit<Orientation, 'id' | 'createdAt'>) => void
  existingOrientations: Orientation[]
  editOrientation?: Orientation
}

// 06:00 → 23:00 en pasos de 30 min
const TIME_SLOTS = Array.from({ length: 35 }, (_, i) => {
  const totalMinutes = 6 * 60 + i * 30
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
  const m = String(totalMinutes % 60).padStart(2, '0')
  return `${h}:${m}`
})

export function OrientationForm({ open, onClose, onSave, existingOrientations, editOrientation }: OrientationFormProps) {
  const { monitors, centers } = useOrientationStore()
  const today = format(new Date(), 'yyyy-MM-dd')
  const [date, setDate] = useState(editOrientation?.date ?? today)
  const [startTime, setStartTime] = useState(editOrientation?.startTime ?? '09:00')
  const [monitorId, setMonitorId] = useState(editOrientation?.monitorId ?? '')
  const [selectedCenterId, setSelectedCenterId] = useState(
    editOrientation ? monitors.find(m => m.id === editOrientation.monitorId)?.centerId ?? '' : ''
  )
  const [subscriberName, setSubscriberName] = useState(editOrientation?.subscriberName ?? '')
  const [serviceType, setServiceType] = useState<ServiceType>(editOrientation?.serviceType ?? 'general')
  const [notes, setNotes] = useState(editOrientation?.notes ?? '')
  const [error, setError] = useState('')

  // En orientaciones completadas solo se permiten editar las notas (la valoración
  // se edita aparte, desde el detalle). El resto de campos quedan en solo lectura.
  const notesOnly = editOrientation?.status === 'completed'
  const readDate = editOrientation
    ? (() => { try { return format(parseISO(editOrientation.date), "EEEE d 'de' MMMM yyyy", { locale: es }) } catch { return editOrientation.date } })()
    : ''

  if (!open) return null

  const endTime = format(addMinutes(parse(startTime, 'HH:mm', new Date()), 35), 'HH:mm')

  // Monitores agrupados por centro (del store, no mock estático)
  const monitoresByCentre = centers.map(center => ({
    center,
    monitors: monitors.filter(m => m.centerId === center.id),
  })).filter(g => g.monitors.length > 0)

  function checkConflict() {
    if (!monitorId) return false
    const start = parse(startTime, 'HH:mm', new Date())
    const end = addMinutes(start, 35)
    return existingOrientations.some(o => {
      if (o.monitorId !== monitorId) return false
      if (o.date !== date) return false
      if (o.status === 'cancelled') return false
      if (editOrientation && o.id === editOrientation.id) return false
      const oStart = parse(o.startTime, 'HH:mm', new Date())
      const oEnd = addMinutes(oStart, 35)
      return start < oEnd && end > oStart
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!notesOnly) {
      if (!subscriberName.trim()) { setError('Introduce el nombre del abonado'); return }
      if (!monitorId) { setError('Selecciona un monitor'); return }
      if (date < today) { setError('La fecha no puede ser en el pasado'); return }
      if (checkConflict()) {
        setError('El monitor ya tiene una orientación solapada en ese horario (35 min de bloqueo)')
        return
      }
    }

    const monitor = monitors.find(m => m.id === monitorId)!
    onSave({
      subscriberName: subscriberName.trim(),
      monitorId,
      monitorName: monitor.name,
      monitorColor: monitor.color,
      centerName: monitor.centerName,
      centerColor: monitor.centerColor,
      centerShortCode: monitor.centerShortCode,
      date,
      startTime,
      endTime,
      status: (editOrientation?.status ?? 'pending') as OrientationStatus,
      serviceType,
      notes: notes.trim() || undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative w-full sm:max-w-lg bg-card border border-border shadow-2xl',
        'rounded-t-2xl sm:rounded-xl',
        'max-h-[92dvh] overflow-y-auto scrollbar-thin',
        'animate-scale-in'
      )}>
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="font-display text-xl text-foreground">
              {notesOnly ? 'EDITAR NOTAS' : editOrientation ? 'EDITAR ORIENTACIÓN' : 'NUEVA ORIENTACIÓN'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {notesOnly ? 'Orientación completada' : 'Duración: 30 min + 5 min margen'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-accent text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">

          {notesOnly ? (
            <div className="space-y-2">
              <div className="flex items-start gap-2 px-3 py-2.5 bg-info/10 border border-info/30 rounded-md text-xs text-info">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Orientación completada: solo puedes editar las notas. La valoración se edita desde el detalle de la orientación.</span>
              </div>
              <ReadField label="Abonado" value={editOrientation!.subscriberName} />
              <ReadField label="Monitor" value={`${editOrientation!.monitorName} · ${editOrientation!.centerShortCode}`} />
              <ReadField label="Fecha y hora" value={`${readDate} · ${editOrientation!.startTime}–${editOrientation!.endTime}`} />
              <ReadField label="Tipo de orientación" value={SERVICE_CONFIG[editOrientation!.serviceType]?.label ?? editOrientation!.serviceType} />
            </div>
          ) : (
          <>
          {/* Nombre abonado — texto libre */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Nombre del abonado
            </label>
            <input
              type="text"
              placeholder="Nombre y apellido..."
              value={subscriberName}
              onChange={e => setSubscriberName(e.target.value)}
              autoComplete="off"
              className="w-full h-10 px-3 text-sm bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Centro → Monitor */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Centro y monitor
            </label>

            {/* Selector de centro */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              <button
                type="button"
                onClick={() => { setSelectedCenterId(''); setMonitorId('') }}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-medium border transition-all',
                  !selectedCenterId
                    ? 'bg-secondary text-foreground border-border'
                    : 'bg-transparent text-muted-foreground border-border/50 hover:border-border'
                )}
              >
                Todos
              </button>
              {centers.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { setSelectedCenterId(c.id); setMonitorId('') }}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-medium border transition-all',
                    selectedCenterId === c.id
                      ? 'text-white border-transparent'
                      : 'bg-transparent text-muted-foreground border-border/50 hover:border-border'
                  )}
                  style={selectedCenterId === c.id ? { backgroundColor: c.color, borderColor: c.color } : {}}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Lista de monitores agrupada por centro */}
            <div className="space-y-3 max-h-52 overflow-y-auto scrollbar-thin pr-1">
              {monitoresByCentre
                .filter(g => !selectedCenterId || g.center.id === selectedCenterId)
                .map(({ center, monitors }) => (
                  <div key={center.id}>
                    {/* Cabecera de centro */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: center.color + '30', color: center.color }}
                      >
                        {center.shortCode}
                      </span>
                      <span className="text-xs text-muted-foreground">{center.name}</span>
                      <div className="flex-1 h-px bg-border/50" />
                    </div>
                    {/* Monitores del centro */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {monitors.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMonitorId(m.id)}
                          className={cn(
                            'h-9 px-3 text-xs font-medium rounded-md border transition-all text-left flex items-center gap-2',
                            monitorId === m.id
                              ? 'text-white border-transparent'
                              : 'border-border text-muted-foreground hover:text-foreground bg-input'
                          )}
                          style={monitorId === m.id
                            ? { backgroundColor: m.color + 'dd', borderColor: m.color }
                            : {}
                          }
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: m.color }}
                          />
                          {m.name.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Fecha + Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Fecha
              </label>
              <input
                type="date"
                value={date}
                min={today}
                onChange={e => setDate(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Hora inicio
              </label>
              <select
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {TIME_SLOTS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Hora fin automática */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/50 rounded-md border border-border text-sm text-muted-foreground">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <span>Fin: <span className="text-foreground font-medium">{endTime}</span> · 30 min + 5 margen</span>
          </div>

          {/* Tipo de servicio */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Tipo de orientación
            </label>
            <select
              value={serviceType}
              onChange={e => setServiceType(e.target.value as ServiceType)}
              className="w-full h-10 px-3 text-sm bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {Object.entries(SERVICE_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          </>
          )}

          {/* Notas */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Info relevante sobre el abonado o la orientación..."
              rows={2}
              className="w-full px-3 py-2.5 text-sm bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {notesOnly ? 'Guardar notas' : editOrientation ? 'Guardar cambios' : 'Agendar orientación'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Campo en solo lectura (usado al editar notas de una orientación completada)
function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2 bg-input/40 border border-border rounded-md">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  )
}
