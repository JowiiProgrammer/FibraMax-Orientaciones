import { useState } from 'react'
import { X, Route, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Monitor, Tour } from '@/lib/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface TourFormProps {
  open: boolean
  monitor: Monitor | null
  toursToday: Tour[]
  onClose: () => void
  onAddTour: (t: Tour) => void
  onDeleteTour: (id: string) => void
}

export function TourForm({ open, monitor, toursToday, onClose, onAddTour, onDeleteTour }: TourFormProps) {
  const [notes, setNotes] = useState('')

  if (!open || !monitor) return null

  function handleAdd() {
    if (!monitor) return
    onAddTour({
      id: `t-${Date.now()}`,
      monitorId: monitor.id,
      monitorName: monitor.name,
      monitorColor: monitor.color,
      centerName: monitor.centerName,
      centerColor: monitor.centerColor,
      centerShortCode: monitor.centerShortCode,
      date: format(new Date(), 'yyyy-MM-dd'),
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    })
    setNotes('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative w-full sm:max-w-sm bg-card border border-border shadow-2xl',
        'rounded-t-2xl sm:rounded-xl',
        'animate-scale-in'
      )}>
        {/* Barra de color del monitor */}
        <div className="h-1 rounded-t-2xl sm:rounded-t-xl" style={{ backgroundColor: monitor.color }} />

        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <Route className="w-4 h-4 text-primary" />
              <h2 className="font-display text-lg text-foreground">TOURS HOY</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {monitor.name} · {monitor.centerName}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-accent text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Contador de hoy */}
          <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-muted/30">
            <span className="text-sm text-muted-foreground">Tours completados hoy</span>
            <span
              className="text-3xl font-display"
              style={{ color: monitor.color }}
            >
              {toursToday.length}
            </span>
          </div>

          {/* Lista de tours de hoy */}
          {toursToday.length > 0 && (
            <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin">
              {toursToday.map((t, i) => (
                <div key={t.id} className="flex items-center gap-2 px-3 py-2 bg-muted/20 rounded-md">
                  <span
                    className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: monitor.color }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-xs text-muted-foreground flex-1 truncate">
                    {t.notes || format(new Date(t.createdAt), "HH:mm", { locale: es })}
                  </span>
                  <button
                    onClick={() => onDeleteTour(t.id)}
                    className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Añadir nuevo tour */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Nota del tour (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Grupo de 3 personas, pareja nueva..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="w-full h-10 px-3 text-sm bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <Button className="w-full" onClick={handleAdd}>
            <Route className="w-4 h-4" />
            Registrar tour
          </Button>
        </div>
      </div>
    </div>
  )
}
