import { format, parseISO, parse } from 'date-fns'
import { es } from 'date-fns/locale'
import { X, Clock, User, Calendar, FileText, CheckCircle, XCircle, AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/badge'
import type { Orientation } from '@/lib/types'
import { SERVICE_CONFIG } from '@/lib/types'
import { cn } from '@/lib/utils'

interface OrientationDetailProps {
  orientation: Orientation | null
  onClose: () => void
  onConfirm: (id: string) => void
  onComplete: (id: string) => void
  onCancel: (id: string) => void
  onNoShow: (id: string) => void
  onEdit: (o: Orientation) => void
}

export function OrientationDetail({
  orientation: o,
  onClose,
  onConfirm,
  onComplete,
  onCancel,
  onNoShow,
  onEdit,
}: OrientationDetailProps) {
  if (!o) return null

  const dateLabel = (() => {
    try {
      return format(parseISO(o.date), "EEEE, d 'de' MMMM", { locale: es })
    } catch {
      return o.date
    }
  })()

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative w-full sm:max-w-md bg-card border border-border shadow-2xl',
        'rounded-t-2xl sm:rounded-xl',
        'max-h-[90dvh] overflow-y-auto scrollbar-thin',
        'animate-scale-in'
      )}>
        {/* Accent bar */}
        <div className="h-1 rounded-t-2xl sm:rounded-t-xl" style={{ backgroundColor: o.monitorColor }} />

        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl text-foreground">{o.subscriberName.toUpperCase()}</h2>
            <StatusBadge status={o.status} size="sm" />
          </div>
          <button onClick={onClose} className="p-2 -mr-2 -mt-1 rounded-md hover:bg-accent text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info */}
        <div className="px-5 pb-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="fibra-card p-3 space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Fecha
              </p>
              <p className="text-sm font-medium text-foreground capitalize">{dateLabel}</p>
            </div>
            <div className="fibra-card p-3 space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Horario
              </p>
              <p className="text-sm font-medium text-foreground">{o.startTime} – {o.endTime}</p>
            </div>
          </div>

          <div className="fibra-card p-3 space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Monitor
            </p>
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: o.monitorColor }}
              />
              <p className="text-sm font-medium text-foreground">{o.monitorName}</p>
            </div>
          </div>

          <div className="fibra-card p-3 space-y-1">
            <p className="text-xs text-muted-foreground">Tipo de orientación</p>
            <p className="text-sm font-medium text-foreground">
              {SERVICE_CONFIG[o.serviceType]?.label ?? o.serviceType}
            </p>
          </div>

          {o.notes && (
            <div className="fibra-card p-3 space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Notas
              </p>
              <p className="text-sm text-foreground leading-relaxed">{o.notes}</p>
            </div>
          )}

          {/* Actions según estado */}
          {o.status === 'pending' && (
            <div className="space-y-2 pt-1">
              <Button className="w-full" onClick={() => { onConfirm(o.id); onClose() }}>
                <CheckCircle className="w-4 h-4" />
                Confirmar orientación
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => { onEdit(o); onClose() }}>
                  Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => { onCancel(o.id); onClose() }}>
                  <XCircle className="w-4 h-4" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {o.status === 'confirmed' && (
            <div className="space-y-2 pt-1">
              <Button className="w-full" variant="secondary" onClick={() => { onComplete(o.id); onClose() }}>
                <CheckCircle className="w-4 h-4" />
                Marcar completada
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => { onNoShow(o.id); onClose() }}>
                  <AlertCircle className="w-4 h-4" />
                  No vino
                </Button>
                <Button variant="destructive" size="sm" onClick={() => { onCancel(o.id); onClose() }}>
                  <XCircle className="w-4 h-4" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {(o.status === 'completed' || o.status === 'no_show') && (
            <div className="pt-1">
              <Button variant="outline" size="sm" className="w-full" onClick={() => { onEdit(o); onClose() }}>
                <RotateCcw className="w-4 h-4" />
                Reabrir / Editar
              </Button>
            </div>
          )}

          {o.status === 'cancelled' && (
            <div className="pt-1">
              <Button variant="outline" size="sm" className="w-full" onClick={() => { onEdit(o); onClose() }}>
                <RotateCcw className="w-4 h-4" />
                Reagendar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
