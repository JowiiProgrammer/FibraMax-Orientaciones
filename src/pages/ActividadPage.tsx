import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Activity, Plus, Pencil, Trash2, RefreshCw, Calendar, Users, Route, Star, MapPin } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

// ── Tipos ──────────────────────────────────────────────────────────
interface AuditEntry {
  id: number
  table_name: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  record_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  changed_fields: string[] | null
  changed_at: string
  client_addr: string | null
}

// ── Config visual por tabla y operación ───────────────────────────
const TABLE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  orientations:         { label: 'Orientación',  icon: Calendar, color: '#DF3E6F' },
  tours:                { label: 'Tour',          icon: Route,    color: '#3B82F6' },
  monitors:             { label: 'Monitor',       icon: Users,    color: '#10B981' },
  centers:              { label: 'Centro',        icon: MapPin,   color: '#F59E0B' },
  orientation_feedback: { label: 'Feedback',      icon: Star,     color: '#FFC300' },
  tour_feedback:        { label: 'Feedback tour', icon: Star,     color: '#FFC300' },
}

const OP_CONFIG: Record<string, { label: string; className: string }> = {
  INSERT: { label: 'Creado',     className: 'bg-success/20 text-success border border-success/30' },
  UPDATE: { label: 'Modificado', className: 'bg-info/20 text-info border border-info/30' },
  DELETE: { label: 'Eliminado',  className: 'bg-destructive/15 text-destructive border border-destructive/30' },
}

// ── Etiqueta legible para campo ────────────────────────────────────
function fieldLabel(field: string): string {
  const map: Record<string, string> = {
    subscriber_name: 'Abonado', monitor_id: 'Monitor', date: 'Fecha',
    start_time: 'Hora inicio', end_time: 'Hora fin', status: 'Estado',
    service_type: 'Tipo', notes: 'Notas', rating: 'Valoración',
    comment: 'Comentario', name: 'Nombre', color: 'Color',
    short_code: 'Código', center_id: 'Centro', is_active: 'Activo',
  }
  return map[field] ?? field
}

// ── Valor legible ──────────────────────────────────────────────────
function renderValue(key: string, val: unknown): string {
  if (val === null || val === undefined) return '—'
  if (key === 'rating') return '★'.repeat(Number(val))
  if (key === 'status') {
    const s: Record<string, string> = {
      pending: 'Pendiente', confirmed: 'Confirmada', completed: 'Completada',
      cancelled: 'Cancelada', no_show: 'No vino',
    }
    return s[String(val)] ?? String(val)
  }
  if (key === 'service_type') {
    const t: Record<string, string> = {
      general: 'Iniciación', advanced: 'Avanzado', maintenance: 'Mantenimiento',
      specific_equipment: 'Máquina', group: 'Grupal',
    }
    return t[String(val)] ?? String(val)
  }
  return String(val)
}

// ── Fetcher ────────────────────────────────────────────────────────
async function fetchAuditLog(limit: number): Promise<AuditEntry[]> {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('changed_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as AuditEntry[]
}

// ── Componente principal ───────────────────────────────────────────
export function ActividadPage() {
  const [limit, setLimit] = useState(50)
  const [filterOp, setFilterOp] = useState<string>('all')
  const [filterTable, setFilterTable] = useState<string>('all')

  const { data: entries = [], isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['audit_log', limit],
    queryFn: () => fetchAuditLog(limit),
    refetchInterval: 30_000,  // auto-refresh cada 30s
  })

  const filtered = entries
    .filter(e => filterOp === 'all' || e.operation === filterOp)
    .filter(e => filterTable === 'all' || e.table_name === filterTable)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-foreground flex items-center gap-3">
            <Activity className="w-7 h-7 text-primary" />
            ACTIVIDAD
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Registro inmutable de todos los cambios · Actualiza cada 30s
            {dataUpdatedAt > 0 && (
              <span className="ml-2 text-muted-foreground/60">
                · Última sync: {format(new Date(dataUpdatedAt), 'HH:mm:ss')}
              </span>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Operación */}
        <div className="flex items-center gap-1 bg-card border border-border rounded-md p-1">
          {(['all', 'INSERT', 'UPDATE', 'DELETE'] as const).map(op => (
            <button
              key={op}
              onClick={() => setFilterOp(op)}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                filterOp === op ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {op === 'all' ? 'Todo' : op === 'INSERT' ? 'Creados' : op === 'UPDATE' ? 'Modificados' : 'Eliminados'}
            </button>
          ))}
        </div>

        {/* Tabla */}
        <select
          value={filterTable}
          onChange={e => setFilterTable(e.target.value)}
          className="h-9 px-2 text-xs bg-card border border-border rounded-md text-muted-foreground focus:outline-none"
        >
          <option value="all">Todas las tablas</option>
          {Object.entries(TABLE_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}s</option>
          ))}
        </select>

        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} registros
        </span>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="fibra-card h-14 animate-pulse bg-muted/30" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="fibra-card p-16 text-center">
          <Activity className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Sin actividad registrada aún.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Ejecuta el SQL de <code>003_audit_log.sql</code> en Supabase y realiza alguna acción en la app.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map(entry => (
            <AuditRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      {/* Cargar más */}
      {entries.length === limit && (
        <div className="text-center pt-2">
          <Button variant="outline" size="sm" onClick={() => setLimit(l => l + 100)}>
            Cargar 100 más
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Fila individual del audit log ─────────────────────────────────
function AuditRow({ entry }: { entry: AuditEntry }) {
  const [expanded, setExpanded] = useState(false)
  const tbl = TABLE_CONFIG[entry.table_name] ?? { label: entry.table_name, icon: Activity, color: '#888' }
  const op  = OP_CONFIG[entry.operation]
  const Icon = tbl.icon

  // Etiqueta principal del registro (subscriber_name, name, etc.)
  const mainLabel = (() => {
    const d = entry.new_data ?? entry.old_data ?? {}
    return (d.subscriber_name ?? d.name ?? entry.record_id?.slice(0, 8) ?? '—') as string
  })()

  return (
    <div
      className="fibra-card overflow-hidden cursor-pointer hover:bg-accent/30 transition-colors"
      onClick={() => setExpanded(v => !v)}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Icono tabla */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: tbl.color + '25' }}
        >
          <Icon className="w-4 h-4" style={{ color: tbl.color }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-foreground truncate">{mainLabel}</p>
            <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', op.className)}>
              {entry.operation === 'INSERT' ? <Plus className="inline w-2.5 h-2.5 mr-0.5" /> :
               entry.operation === 'UPDATE' ? <Pencil className="inline w-2.5 h-2.5 mr-0.5" /> :
               <Trash2 className="inline w-2.5 h-2.5 mr-0.5" />}
              {op.label}
            </span>
            <span className="text-[10px] text-muted-foreground">{tbl.label}</span>
          </div>

          {/* Campos cambiados (UPDATE) */}
          {entry.changed_fields && entry.changed_fields.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Cambió: {entry.changed_fields.map(fieldLabel).join(', ')}
            </p>
          )}
        </div>

        {/* Timestamp + IP */}
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">
            {format(parseISO(entry.changed_at), "d MMM · HH:mm", { locale: es })}
          </p>
          {entry.client_addr && (
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">{String(entry.client_addr)}</p>
          )}
        </div>
      </div>

      {/* Detalle expandido */}
      {expanded && (entry.old_data || entry.new_data) && (
        <div className="border-t border-border px-4 py-3 bg-muted/20 grid sm:grid-cols-2 gap-3 text-xs">
          {entry.old_data && (
            <div>
              <p className="font-medium text-muted-foreground mb-1.5 uppercase tracking-wider text-[10px]">
                {entry.operation === 'DELETE' ? 'Registro eliminado' : 'Antes'}
              </p>
              <div className="space-y-1">
                {Object.entries(entry.old_data).map(([k, v]) => (
                  <div key={k} className="flex items-start gap-2">
                    <span className="text-muted-foreground/60 shrink-0 w-24 truncate">{fieldLabel(k)}</span>
                    <span className={cn('text-foreground/80 break-all', entry.operation === 'UPDATE' && 'line-through text-destructive/60')}>
                      {renderValue(k, v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {entry.new_data && entry.operation !== 'DELETE' && (
            <div>
              <p className="font-medium text-muted-foreground mb-1.5 uppercase tracking-wider text-[10px]">
                {entry.operation === 'INSERT' ? 'Registro creado' : 'Después'}
              </p>
              <div className="space-y-1">
                {Object.entries(entry.new_data).map(([k, v]) => (
                  <div key={k} className="flex items-start gap-2">
                    <span className="text-muted-foreground/60 shrink-0 w-24 truncate">{fieldLabel(k)}</span>
                    <span className="text-foreground/80 break-all">{renderValue(k, v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
