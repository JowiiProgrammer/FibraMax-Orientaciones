import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, CheckCircle, Clock, AlertTriangle, TrendingUp, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/badge'
import { useOrientationStore } from '@/store/orientations-store'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

export function DashboardPage() {
  const { orientations, centers } = useOrientationStore()
  const navigate = useNavigate()
  const today = format(new Date(), 'yyyy-MM-dd')

  const todayOrientations = orientations
    .filter(o => o.date === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const pending = orientations.filter(o => o.status === 'pending').length
  const confirmedToday = orientations.filter(o => o.date === today && o.status === 'confirmed').length
  const completedTotal = orientations.filter(o => o.status === 'completed').length
  const noShow = orientations.filter(o => o.status === 'no_show').length

  const stats = [
    { label: 'Pendientes de confirmar', value: pending, icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Confirmadas hoy', value: confirmedToday, icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Total completadas', value: completedTotal, icon: TrendingUp, color: 'text-info', bg: 'bg-info/10' },
    { label: 'No se presentaron', value: noShow, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
  ]

  // Carga por centro
  const centerLoad = centers.map(c => ({
    center: c,
    total: orientations.filter(o => o.centerName === c.name && o.date >= today && (o.status === 'pending' || o.status === 'confirmed')).length,
    today: orientations.filter(o => o.centerName === c.name && o.date === today && o.status !== 'cancelled').length,
  })).filter(c => c.total > 0 || c.today > 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-foreground">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: es }).toUpperCase()}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Panel de orientaciones FibraMax</p>
        </div>
        <Button onClick={() => navigate('/orientaciones')}>
          <Plus className="w-4 h-4" />
          Nueva orientación
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="fibra-card p-4 space-y-2">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', s.bg)}>
              <s.icon className={cn('w-4 h-4', s.color)} />
            </div>
            <p className={cn('text-2xl font-display', s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Carga por centro */}
      {centerLoad.length > 0 && (
        <div className="fibra-card p-4 space-y-3">
          <h2 className="font-display text-lg text-foreground">CARGA POR CENTRO</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {centerLoad.map(({ center, total, today: todayCount }) => (
              <div key={center.id} className="flex items-center gap-2.5 p-3 bg-muted/30 rounded-lg border border-border">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: center.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{center.name}</p>
                  <p className="text-[10px] text-muted-foreground">{todayCount} hoy</p>
                </div>
                <span className="text-base font-display shrink-0" style={{ color: center.color }}>{total}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today */}
      <div className="fibra-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            HOY — {todayOrientations.length} ORIENTACIONES
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/orientaciones')}>
            Ver todas →
          </Button>
        </div>
        {todayOrientations.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No hay orientaciones agendadas para hoy.
          </p>
        ) : (
          <div className="space-y-2">
            {todayOrientations.map(o => (
              <div key={o.id} className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg hover:bg-muted/40 transition-colors">
                <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: o.monitorColor }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{o.subscriberName}</p>
                    {/* Centro badge */}
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: o.centerColor + '30', color: o.centerColor }}
                    >
                      {o.centerShortCode}
                    </span>
                    <StatusBadge status={o.status} size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {o.startTime} · {o.monitorName}
                  </p>
                </div>
                <span className="text-xs font-medium text-muted-foreground shrink-0">{o.startTime}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
