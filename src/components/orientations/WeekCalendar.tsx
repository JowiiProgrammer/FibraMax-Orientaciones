import { format, startOfWeek, addDays, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Orientation } from '@/lib/types'
import { cn } from '@/lib/utils'

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6) // 06:00 → 23:00

interface WeekCalendarProps {
  currentWeek: Date
  onWeekChange: (d: Date) => void
  orientations: Orientation[]
  onSelectOrientation: (o: Orientation) => void
  filterMonitorId: string
  filterCenterId: string
}

export function WeekCalendar({ currentWeek, onWeekChange, orientations, onSelectOrientation, filterMonitorId, filterCenterId }: WeekCalendarProps) {
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const filtered = orientations
    .filter(o => !filterMonitorId || o.monitorId === filterMonitorId)
    .filter(o => !filterCenterId || o.centerName === filterCenterId)

  function getSlots(day: Date, hour: number) {
    const dateStr = format(day, 'yyyy-MM-dd')
    return filtered.filter(o => {
      if (o.date !== dateStr) return false
      const [h] = o.startTime.split(':').map(Number)
      return h === hour
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Week nav */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card/50 shrink-0">
        <button
          onClick={() => onWeekChange(addDays(currentWeek, -7))}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="font-display text-base text-foreground flex-1 text-center">
          {format(weekStart, "d MMM", { locale: es }).toUpperCase()} – {format(addDays(weekStart, 6), "d MMM yyyy", { locale: es }).toUpperCase()}
        </h3>
        <button
          onClick={() => onWeekChange(addDays(currentWeek, 7))}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-[52px_repeat(7,1fr)] border-b border-border bg-card/30 shrink-0">
        <div />
        {days.map(day => (
          <div
            key={day.toISOString()}
            className={cn(
              'py-2 text-center border-l border-border',
              isToday(day) && 'bg-primary/5'
            )}
          >
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {format(day, 'EEE', { locale: es })}
            </p>
            <p className={cn(
              'text-base font-display leading-tight',
              isToday(day) ? 'text-primary' : 'text-foreground'
            )}>
              {format(day, 'd')}
            </p>
          </div>
        ))}
      </div>

      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {HOURS.map(hour => (
          <div key={hour} className="grid grid-cols-[52px_repeat(7,1fr)] border-b border-border/40 min-h-[56px]">
            <div className="px-2 pt-1 text-right">
              <span className="text-[10px] text-muted-foreground/50 tabular-nums">{hour}:00</span>
            </div>
            {days.map(day => {
              const slots = getSlots(day, hour)
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'border-l border-border/40 p-0.5 space-y-0.5 min-h-[56px]',
                    isToday(day) && 'bg-primary/[0.02]'
                  )}
                >
                  {slots.map(o => (
                    <OrientationChip key={o.id} orientation={o} onClick={() => onSelectOrientation(o)} />
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function OrientationChip({ orientation: o, onClick }: { orientation: Orientation; onClick: () => void }) {
  const isCancelled = o.status === 'cancelled'
  const isNoShow = o.status === 'no_show'

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-1.5 py-1 rounded text-[11px] font-medium transition-all hover:opacity-80 active:scale-[0.98]',
        isCancelled && 'opacity-30 line-through',
        isNoShow && 'opacity-50'
      )}
      style={{
        backgroundColor: o.monitorColor + '22',
        borderLeft: `2.5px solid ${o.monitorColor}`,
      }}
    >
      {/* Centro badge + nombre abonado */}
      <div className="flex items-center gap-1 mb-0.5">
        <span
          className="text-[9px] font-bold px-1 rounded-sm leading-tight"
          style={{ backgroundColor: o.centerColor + '40', color: o.centerColor }}
        >
          {o.centerShortCode}
        </span>
        <p className="truncate text-foreground/90 leading-tight">{o.subscriberName.split(' ')[0]}</p>
      </div>
      <p className="text-[10px] text-muted-foreground/70 leading-tight">
        {o.startTime} · {o.monitorName.split(' ')[0]}
      </p>
    </button>
  )
}
