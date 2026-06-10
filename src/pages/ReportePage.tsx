import { useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { Download, ChevronLeft, ChevronRight, BarChart2, TrendingUp, Users, Route, Star, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StarRating } from '@/components/feedback/FeedbackModal'
import { useOrientationStore } from '@/store/orientations-store'
import { generateMonthlyPDF } from '@/lib/report'
import { cn } from '@/lib/utils'
import type { Feedback } from '@/lib/types'

// Media y conteo de valoraciones a partir de una lista de feedbacks (con huecos)
function ratingOf(fbs: (Feedback | null | undefined)[]) {
  const r = fbs.filter((f): f is Feedback => Boolean(f))
  return { avg: r.length ? r.reduce((s, f) => s + f.rating, 0) / r.length : 0, count: r.length }
}

export function ReportePage() {
  const { orientations, tours, monitors, centers } = useOrientationStore()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [generating, setGenerating] = useState(false)

  const monthLabel = format(month, "MMMM yyyy", { locale: es })

  // ── Filtrar por mes ────────────────────────────────────────────────────────
  const inMonth = (date: string) => {
    try {
      return isWithinInterval(parseISO(date), { start: startOfMonth(month), end: endOfMonth(month) })
    } catch { return false }
  }

  const monthOrientations = useMemo(() => orientations.filter(o => inMonth(o.date)), [orientations, month])
  const monthTours = useMemo(() => tours.filter(t => inMonth(t.date)), [tours, month])

  // ── Stats globales ─────────────────────────────────────────────────────────
  const total = monthOrientations.length
  const completed = monthOrientations.filter(o => o.status === 'completed').length
  const noShow = monthOrientations.filter(o => o.status === 'no_show').length
  const cancelled = monthOrientations.filter(o => o.status === 'cancelled').length
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0

  // ── Valoraciones (feedback) ──────────────────────────────────────────────────
  const feedbackStats = useMemo(() => {
    const oFb = ratingOf(monthOrientations.map(o => o.feedback))
    const tFb = ratingOf(monthTours.map(t => t.feedback))
    const ratedSessions = oFb.count + tFb.count
    const totalSessions = monthOrientations.length + monthTours.length
    return {
      orientationAvg: oFb.avg, orientationCount: oFb.count,
      tourAvg: tFb.avg, tourCount: tFb.count,
      ratedSessions,
      coverage: totalSessions > 0 ? Math.round((ratedSessions / totalSessions) * 100) : 0,
    }
  }, [monthOrientations, monthTours])

  // ── Comentarios del mes ──────────────────────────────────────────────────────
  const comments = useMemo(() => {
    const items: { key: string; type: 'orientation' | 'tour'; who: string; monitor: string; rating: number; comment: string; date: string }[] = []
    for (const o of monthOrientations) {
      if (o.feedback?.comment) items.push({ key: `o-${o.id}`, type: 'orientation', who: o.subscriberName, monitor: o.monitorName, rating: o.feedback.rating, comment: o.feedback.comment, date: o.date })
    }
    for (const t of monthTours) {
      if (t.feedback?.comment) items.push({ key: `t-${t.id}`, type: 'tour', who: 'Tour', monitor: t.monitorName, rating: t.feedback.rating, comment: t.feedback.comment, date: t.date })
    }
    return items.sort((a, b) => b.date.localeCompare(a.date))
  }, [monthOrientations, monthTours])

  // ── Por centro ─────────────────────────────────────────────────────────────
  const centerStats = useMemo(() => centers.map(c => {
    const cO = monthOrientations.filter(o => o.centerName === c.name)
    const cT = monthTours.filter(t => t.centerName === c.name)
    const cCompleted = cO.filter(o => o.status === 'completed').length
    const cNoShow = cO.filter(o => o.status === 'no_show').length
    const cRate = cO.length > 0 ? Math.round((cCompleted / cO.length) * 100) : 0
    const cFb = ratingOf([...cO.map(o => o.feedback), ...cT.map(t => t.feedback)])
    return { center: c, total: cO.length, completed: cCompleted, noShow: cNoShow, tours: cT.length, rate: cRate, rating: cFb.avg, ratingCount: cFb.count }
  }).filter(r => r.total > 0 || r.tours > 0), [centers, monthOrientations, monthTours])

  // ── Por monitor ────────────────────────────────────────────────────────────
  const monitorStats = useMemo(() => monitors.map(m => {
    const mO = monthOrientations.filter(o => o.monitorId === m.id)
    const mT = monthTours.filter(t => t.monitorId === m.id)
    const mCompleted = mO.filter(o => o.status === 'completed').length
    const mNoShow = mO.filter(o => o.status === 'no_show').length
    const mRate = mO.length > 0 ? Math.round((mCompleted / mO.length) * 100) : 0
    const mFb = ratingOf([...mO.map(o => o.feedback), ...mT.map(t => t.feedback)])
    return { monitor: m, total: mO.length, completed: mCompleted, noShow: mNoShow, tours: mT.length, rate: mRate, rating: mFb.avg, ratingCount: mFb.count }
  }).filter(r => r.total > 0 || r.tours > 0)
    .sort((a, b) => b.total - a.total), [monitors, monthOrientations, monthTours])

  // ── Descarga PDF ───────────────────────────────────────────────────────────
  function handleDownload() {
    setGenerating(true)
    setTimeout(() => {
      generateMonthlyPDF({ month, orientations, tours, monitors, centers })
      setGenerating(false)
    }, 100)
  }

  const isEmpty = total === 0 && monthTours.length === 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-foreground flex items-center gap-3">
            <BarChart2 className="w-7 h-7 text-primary" />
            INFORMES
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Resumen mensual de orientaciones y tours
          </p>
        </div>
        <Button
          onClick={handleDownload}
          disabled={generating || isEmpty}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          {generating ? 'Generando...' : 'Descargar PDF'}
        </Button>
      </div>

      {/* Selector de mes */}
      <div className="fibra-card p-3 flex items-center gap-3 w-fit">
        <button
          onClick={() => setMonth(m => subMonths(m, 1))}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-display text-lg text-foreground capitalize min-w-[160px] text-center">
          {monthLabel}
        </span>
        <button
          onClick={() => setMonth(m => addMonths(m, 1))}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {isEmpty ? (
        <div className="fibra-card p-16 text-center">
          <BarChart2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Sin datos para {monthLabel}.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Cambia el mes o agrega orientaciones primero.
          </p>
        </div>
      ) : (
        <>
          {/* Stats globales */}
          <div>
            <h2 className="font-display text-lg text-foreground mb-3">RESUMEN GLOBAL</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Total orient.', value: total, color: 'text-foreground', icon: BarChart2 },
                { label: 'Completadas', value: completed, color: 'text-success', icon: TrendingUp },
                { label: 'No vinieron', value: noShow, color: 'text-warning', icon: Users },
                { label: 'Canceladas', value: cancelled, color: 'text-destructive', icon: Users },
                { label: 'Tasa', value: `${rate}%`, color: 'text-primary', icon: TrendingUp },
                { label: 'Tours', value: monthTours.length, color: 'text-info', icon: Route },
              ].map(s => (
                <div key={s.label} className="fibra-card p-4 text-center space-y-1">
                  <p className={cn('text-2xl font-display', s.color)}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Valoraciones */}
          <div>
            <h2 className="font-display text-lg text-foreground mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-warning fill-warning" /> VALORACIONES
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Media orientaciones', avg: feedbackStats.orientationAvg, count: feedbackStats.orientationCount },
                { label: 'Media tours', avg: feedbackStats.tourAvg, count: feedbackStats.tourCount },
              ].map(s => (
                <div key={s.label} className="fibra-card p-4 text-center space-y-1">
                  {s.count > 0 ? (
                    <>
                      <p className="text-2xl font-display text-warning">{s.avg.toFixed(1)}</p>
                      <div className="flex justify-center"><StarRating rating={Math.round(s.avg)} size="md" /></div>
                    </>
                  ) : (
                    <p className="text-2xl font-display text-muted-foreground/40">—</p>
                  )}
                  <p className="text-xs text-muted-foreground">{s.label}{s.count > 0 ? ` · ${s.count}` : ''}</p>
                </div>
              ))}
              <div className="fibra-card p-4 text-center space-y-1">
                <p className="text-2xl font-display text-foreground">{feedbackStats.ratedSessions}</p>
                <p className="text-xs text-muted-foreground">Sesiones valoradas</p>
              </div>
              <div className="fibra-card p-4 text-center space-y-1">
                <p className="text-2xl font-display text-primary">{feedbackStats.coverage}%</p>
                <p className="text-xs text-muted-foreground">Cobertura feedback</p>
              </div>
            </div>
          </div>

          {/* Por centro */}
          {centerStats.length > 0 && (
            <div>
              <h2 className="font-display text-lg text-foreground mb-3">POR CENTRO</h2>
              <div className="fibra-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/50 border-b border-border">
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Centro</th>
                      <th className="text-center px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Orient.</th>
                      <th className="text-center px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Completadas</th>
                      <th className="text-center px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">No vinieron</th>
                      <th className="text-center px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tours</th>
                      <th className="text-center px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tasa</th>
                      <th className="text-center px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Valoración</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {centerStats.map(({ center, total, completed, noShow, tours, rate, rating, ratingCount }) => (
                      <tr key={center.id} className="hover:bg-accent/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: center.color }} />
                            <span className="font-medium text-foreground">{center.name}</span>
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: center.color + '30', color: center.color }}
                            >
                              {center.shortCode}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center font-medium text-foreground">{total}</td>
                        <td className="px-3 py-3 text-center text-success font-medium">{completed}</td>
                        <td className="px-3 py-3 text-center text-warning">{noShow}</td>
                        <td className="px-3 py-3 text-center text-info">{tours}</td>
                        <td className="px-3 py-3 text-center">
                          <RateBar rate={rate} />
                        </td>
                        <td className="px-3 py-3 text-center">
                          <RatingCell avg={rating} count={ratingCount} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Por monitor */}
          {monitorStats.length > 0 && (
            <div>
              <h2 className="font-display text-lg text-foreground mb-3">POR MONITOR</h2>
              <div className="fibra-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/50 border-b border-border">
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Monitor</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Centro</th>
                      <th className="text-center px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Orient.</th>
                      <th className="text-center px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Completadas</th>
                      <th className="text-center px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">No vinieron</th>
                      <th className="text-center px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tours</th>
                      <th className="text-center px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tasa</th>
                      <th className="text-center px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Valoración</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {monitorStats.map(({ monitor, total, completed, noShow, tours, rate, rating, ratingCount }) => (
                      <tr key={monitor.id} className="hover:bg-accent/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                              style={{ backgroundColor: monitor.color }}
                            >
                              {monitor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <span className="font-medium text-foreground truncate max-w-[120px]">{monitor.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-[9px] font-bold px-1 rounded"
                              style={{ backgroundColor: monitor.centerColor + '30', color: monitor.centerColor }}
                            >
                              {monitor.centerShortCode}
                            </span>
                            {monitor.centerName}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center font-medium text-foreground">{total}</td>
                        <td className="px-3 py-3 text-center text-success hidden md:table-cell">{completed}</td>
                        <td className="px-3 py-3 text-center text-warning hidden md:table-cell">{noShow}</td>
                        <td className="px-3 py-3 text-center text-info">{tours}</td>
                        <td className="px-3 py-3 text-center">
                          <RateBar rate={rate} />
                        </td>
                        <td className="px-3 py-3 text-center">
                          <RatingCell avg={rating} count={ratingCount} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Comentarios */}
          {comments.length > 0 && (
            <div>
              <h2 className="font-display text-lg text-foreground mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" /> COMENTARIOS
              </h2>
              <div className="space-y-2">
                {comments.map(c => (
                  <div key={c.key} className="fibra-card p-3 flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      <StarRating rating={c.rating} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">{c.comment}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium text-foreground/80">{c.who}</span>
                        {' · '}{c.monitor}
                        {' · '}{format(parseISO(c.date), "d MMM", { locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function RatingCell({ avg, count }: { avg: number; count: number }) {
  if (count === 0) return <span className="text-xs text-muted-foreground/40">—</span>
  return (
    <div className="flex items-center gap-1.5 justify-center">
      <StarRating rating={Math.round(avg)} />
      <span className="text-xs font-medium text-foreground tabular-nums">{avg.toFixed(1)}</span>
      <span className="text-[10px] text-muted-foreground">({count})</span>
    </div>
  )
}

function RateBar({ rate }: { rate: number }) {
  const color = rate >= 80 ? '#3DBF6D' : rate >= 50 ? '#FFC300' : '#FF5280'
  return (
    <div className="flex items-center gap-2 justify-center">
      <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${rate}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums" style={{ color }}>{rate}%</span>
    </div>
  )
}
