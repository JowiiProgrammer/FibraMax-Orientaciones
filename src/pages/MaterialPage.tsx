import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Package, Plus, ClipboardList, MapPin, Pencil, Trash2, X, History, AlertTriangle, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOrientationStore } from '@/store/orientations-store'
import { useMaterials, materialStatus } from '@/store/materials'
import type { MaterialInput } from '@/store/materials'
import type { Material } from '@/lib/types'
import { MATERIAL_STATUS_CONFIG } from '@/lib/types'
import { cn } from '@/lib/utils'

export function MaterialPage() {
  const { centers } = useOrientationStore()
  const { materials, isLoading, addMaterial, updateMaterial, deleteMaterial, recordCount } = useMaterials()

  const [filterCenterId, setFilterCenterId] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editMaterial, setEditMaterial] = useState<Material | undefined>()
  const [countOpen, setCountOpen] = useState(false)
  const [historyMaterial, setHistoryMaterial] = useState<Material | null>(null)

  const filtered = useMemo(
    () => materials.filter(m => !filterCenterId || m.centerId === filterCenterId),
    [materials, filterCenterId],
  )

  // ── Resumen / análisis ──────────────────────────────────────────────────
  const summary = useMemo(() => {
    let counted = 0, missing = 0, low = 0, never = 0
    for (const m of filtered) {
      const st = materialStatus(m)
      if (m.latest) counted += m.latest.countedQty
      if (m.latest && m.latest.countedQty < m.expectedQty) missing += m.expectedQty - m.latest.countedQty
      if (st === 'low') low++
      if (st === 'never') never++
    }
    return { total: filtered.length, counted, missing, low, never }
  }, [filtered])

  function handleSaveMaterial(input: MaterialInput) {
    if (editMaterial) updateMaterial(editMaterial.id, input).catch(() => {})
    else addMaterial(input).catch(() => {})
    setFormOpen(false)
    setEditMaterial(undefined)
  }

  const isEmpty = materials.length === 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-foreground flex items-center gap-3">
            <Package className="w-7 h-7 text-primary" />
            MATERIAL
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Control de stock por recuentos periódicos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCountOpen(true)} disabled={isEmpty} className="gap-2">
            <ClipboardList className="w-4 h-4" /> Nuevo recuento
          </Button>
          <Button onClick={() => { setEditMaterial(undefined); setFormOpen(true) }} className="gap-2">
            <Plus className="w-4 h-4" /> Material
          </Button>
        </div>
      </div>

      {/* Filtro de centros */}
      <div className="flex items-center gap-1 flex-wrap">
        <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <button
          onClick={() => setFilterCenterId('')}
          className={cn(
            'px-2 py-1 rounded text-xs font-medium border transition-all',
            !filterCenterId ? 'bg-secondary text-foreground border-border' : 'text-muted-foreground border-border/50 hover:border-border',
          )}
        >
          Todos los centros
        </button>
        {centers.map(c => (
          <button
            key={c.id}
            onClick={() => setFilterCenterId(filterCenterId === c.id ? '' : c.id)}
            className={cn(
              'px-2 py-1 rounded text-xs font-medium border transition-all',
              filterCenterId === c.id ? 'text-white border-transparent' : 'text-muted-foreground border-border/50 hover:border-border',
            )}
            style={filterCenterId === c.id ? { backgroundColor: c.color, borderColor: c.color } : {}}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Materiales" value={summary.total} className="text-foreground" />
        <SummaryCard label="Unidades contadas" value={summary.counted} className="text-info" />
        <SummaryCard label="Faltan (vs esperado)" value={summary.missing} className="text-destructive" />
        <SummaryCard label="A reponer" value={summary.low} className="text-warning" />
      </div>

      {isLoading ? (
        <div className="fibra-card p-16 text-center text-sm text-muted-foreground">Cargando…</div>
      ) : isEmpty ? (
        <div className="fibra-card p-16 text-center">
          <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Aún no hay material registrado.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Pulsa “Material” para añadir el primero.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="fibra-card p-12 text-center text-sm text-muted-foreground">
          No hay material en este centro.
        </div>
      ) : (
        <div className="fibra-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/50 border-b border-border">
                <Th className="text-left">Material</Th>
                <Th className="text-left hidden sm:table-cell">Centro</Th>
                <Th>Esperado</Th>
                <Th>Mín.</Th>
                <Th>Último recuento</Th>
                <Th className="hidden md:table-cell">Δ anterior</Th>
                <Th>Faltan</Th>
                <Th>Estado</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(m => {
                const st = materialStatus(m)
                const latestQty = m.latest?.countedQty ?? null
                const missing = latestQty !== null && latestQty < m.expectedQty ? m.expectedQty - latestQty : 0
                const delta = m.latest && m.previous ? m.latest.countedQty - m.previous.countedQty : null
                return (
                  <tr key={m.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{m.name}</div>
                      {m.category && <div className="text-[11px] text-muted-foreground">{m.category}</div>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: m.centerColor + '30', color: m.centerColor }}>
                        {m.centerShortCode}
                      </span>
                      <span className="text-muted-foreground ml-2">{m.centerName}</span>
                    </td>
                    <td className="px-3 py-3 text-center text-foreground">{m.expectedQty}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">{m.minQty}</td>
                    <td className="px-3 py-3 text-center">
                      {latestQty !== null ? (
                        <div>
                          <span className="font-semibold text-foreground tabular-nums">{latestQty}</span>
                          <div className="text-[10px] text-muted-foreground">
                            {format(parseISO(m.latest!.countedAt), 'd MMM yyyy', { locale: es })}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center hidden md:table-cell">
                      <DeltaBadge delta={delta} />
                    </td>
                    <td className="px-3 py-3 text-center">
                      {missing > 0 ? <span className="text-destructive font-semibold tabular-nums">-{missing}</span> : <span className="text-muted-foreground/40">0</span>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={cn('inline-block px-2 py-0.5 rounded-full text-[10px] font-medium', MATERIAL_STATUS_CONFIG[st].className)}>
                        {MATERIAL_STATUS_CONFIG[st].label}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconBtn title="Histórico" onClick={() => setHistoryMaterial(m)}><History className="w-4 h-4" /></IconBtn>
                        <IconBtn title="Editar" onClick={() => { setEditMaterial(m); setFormOpen(true) }}><Pencil className="w-4 h-4" /></IconBtn>
                        <IconBtn title="Eliminar" onClick={() => { if (confirm(`¿Eliminar "${m.name}"? Se conserva el histórico.`)) deleteMaterial(m.id).catch(() => {}) }}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </IconBtn>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <MaterialFormModal
          key={editMaterial?.id ?? 'new'}
          material={editMaterial}
          centers={centers}
          defaultCenterId={filterCenterId}
          onClose={() => { setFormOpen(false); setEditMaterial(undefined) }}
          onSave={handleSaveMaterial}
        />
      )}

      {countOpen && (
        <CountModal
          materials={materials}
          centers={centers}
          defaultCenterId={filterCenterId}
          onClose={() => setCountOpen(false)}
          onSave={(entries, date, note) => { recordCount(entries, date, note).catch(() => {}); setCountOpen(false) }}
        />
      )}

      {historyMaterial && (
        <HistoryModal material={historyMaterial} onClose={() => setHistoryMaterial(null)} />
      )}
    </div>
  )
}

// ── Subcomponentes ─────────────────────────────────────────────────────
function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn('px-3 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider', className)}>{children}</th>
}

function SummaryCard({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className="fibra-card p-4 text-center space-y-1">
      <p className={cn('text-2xl font-display', className)}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function IconBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button title={title} onClick={onClick} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
      {children}
    </button>
  )
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-muted-foreground/40">—</span>
  if (delta === 0) return <span className="text-muted-foreground inline-flex items-center gap-0.5"><Minus className="w-3 h-3" />0</span>
  if (delta < 0) return <span className="text-destructive inline-flex items-center gap-0.5 font-medium"><TrendingDown className="w-3.5 h-3.5" />{delta}</span>
  return <span className="text-success inline-flex items-center gap-0.5 font-medium"><TrendingUp className="w-3.5 h-3.5" />+{delta}</span>
}

// ── Modal: alta / edición de material ───────────────────────────────────
function MaterialFormModal({
  material, centers, defaultCenterId, onClose, onSave,
}: {
  material?: Material
  centers: { id: string; name: string; color: string; shortCode: string }[]
  defaultCenterId: string
  onClose: () => void
  onSave: (input: MaterialInput) => void
}) {
  const [name, setName] = useState(material?.name ?? '')
  const [centerId, setCenterId] = useState(material?.centerId ?? defaultCenterId ?? '')
  const [category, setCategory] = useState(material?.category ?? '')
  const [expectedQty, setExpectedQty] = useState(String(material?.expectedQty ?? 0))
  const [minQty, setMinQty] = useState(String(material?.minQty ?? 0))
  const [unit, setUnit] = useState(material?.unit ?? '')
  const [error, setError] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Introduce el nombre del material'); return }
    if (!centerId) { setError('Selecciona un centro'); return }
    onSave({
      name: name.trim(),
      centerId,
      category: category.trim() || null,
      expectedQty: Math.max(0, parseInt(expectedQty) || 0),
      minQty: Math.max(0, parseInt(minQty) || 0),
      unit: unit.trim() || null,
    })
  }

  return (
    <ModalShell title={material ? 'EDITAR MATERIAL' : 'NUEVO MATERIAL'} onClose={onClose}>
      <form onSubmit={submit} className="p-5 space-y-4">
        <Field label="Nombre">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Banda elástica, candado…" autoComplete="off" className={inputCls} />
        </Field>
        <Field label="Centro">
          <select value={centerId} onChange={e => setCenterId(e.target.value)} className={inputCls}>
            <option value="">Selecciona un centro</option>
            {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Categoría (opcional)">
          <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Ej: Accesorios, Cardio…" autoComplete="off" className={inputCls} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Esperado">
            <input type="number" min={0} value={expectedQty} onChange={e => setExpectedQty(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Mínimo">
            <input type="number" min={0} value={minQty} onChange={e => setMinQty(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Unidad">
            <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="uds" autoComplete="off" className={inputCls} />
          </Field>
        </div>
        {error && <ErrorBox>{error}</ErrorBox>}
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button type="submit" className="flex-1">{material ? 'Guardar cambios' : 'Añadir material'}</Button>
        </div>
      </form>
    </ModalShell>
  )
}

// ── Modal: nuevo recuento ───────────────────────────────────────────────
function CountModal({
  materials, centers, defaultCenterId, onClose, onSave,
}: {
  materials: Material[]
  centers: { id: string; name: string; color: string; shortCode: string }[]
  defaultCenterId: string
  onClose: () => void
  onSave: (entries: { materialId: string; countedQty: number }[], date: string, note?: string) => void
}) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [centerId, setCenterId] = useState(defaultCenterId || centers[0]?.id || '')
  const [date, setDate] = useState(today)
  const [note, setNote] = useState('')
  const [values, setValues] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  const centerMaterials = materials.filter(m => m.centerId === centerId)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const entries = centerMaterials
      .filter(m => values[m.id] !== undefined && values[m.id] !== '')
      .map(m => ({ materialId: m.id, countedQty: Math.max(0, parseInt(values[m.id]) || 0) }))
    if (entries.length === 0) { setError('Introduce al menos una cantidad'); return }
    onSave(entries, date, note.trim() || undefined)
  }

  return (
    <ModalShell title="NUEVO RECUENTO" onClose={onClose}>
      <form onSubmit={submit} className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Centro">
            <select value={centerId} onChange={e => { setCenterId(e.target.value); setValues({}) }} className={inputCls}>
              {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Fecha">
            <input type="date" value={date} max={today} onChange={e => setDate(e.target.value)} className={inputCls} />
          </Field>
        </div>

        {centerMaterials.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No hay material en este centro. Añádelo primero.</p>
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto scrollbar-thin pr-1">
            <div className="flex items-center justify-between px-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>Material</span><span>Unidades contadas</span>
            </div>
            {centerMaterials.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-3 py-2 bg-input/40 border border-border rounded-md">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{m.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    esperado {m.expectedQty}{m.latest ? ` · últ. ${m.latest.countedQty}` : ''}
                  </p>
                </div>
                <input
                  type="number" min={0} inputMode="numeric"
                  value={values[m.id] ?? ''}
                  onChange={e => setValues(v => ({ ...v, [m.id]: e.target.value }))}
                  placeholder="—"
                  className="w-20 h-9 px-2 text-sm text-center bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            ))}
          </div>
        )}

        <Field label="Nota (opcional)">
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ej: recuento mensual" autoComplete="off" className={inputCls} />
        </Field>

        {error && <ErrorBox>{error}</ErrorBox>}
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button type="submit" className="flex-1" disabled={centerMaterials.length === 0}>Guardar recuento</Button>
        </div>
      </form>
    </ModalShell>
  )
}

// ── Modal: histórico de un material ─────────────────────────────────────
function HistoryModal({ material, onClose }: { material: Material; onClose: () => void }) {
  return (
    <ModalShell title="HISTÓRICO" onClose={onClose}>
      <div className="p-5 space-y-3">
        <div>
          <p className="font-medium text-foreground">{material.name}</p>
          <p className="text-xs text-muted-foreground">
            {material.centerName} · esperado {material.expectedQty} · mínimo {material.minQty}
          </p>
        </div>
        {material.counts.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <AlertTriangle className="w-4 h-4" /> Sin recuentos todavía.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-80 overflow-y-auto scrollbar-thin pr-1">
            {material.counts.map((c, i) => {
              const prev = material.counts[i + 1]
              const delta = prev ? c.countedQty - prev.countedQty : null
              return (
                <div key={c.id} className="flex items-center justify-between px-3 py-2 bg-input/40 border border-border rounded-md">
                  <div>
                    <p className="text-sm text-foreground">{format(parseISO(c.countedAt), "d 'de' MMM yyyy", { locale: es })}</p>
                    {c.note && <p className="text-[10px] text-muted-foreground">{c.note}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <DeltaBadge delta={delta} />
                    <span className="text-sm font-semibold text-foreground tabular-nums w-10 text-right">{c.countedQty}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </ModalShell>
  )
}

// ── Shells / helpers de UI ──────────────────────────────────────────────
const inputCls = 'w-full h-10 px-3 text-sm bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{children}
    </div>
  )
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-card border border-border shadow-2xl rounded-t-2xl sm:rounded-xl max-h-[92dvh] overflow-y-auto scrollbar-thin animate-scale-in">
        <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between z-10">
          <h2 className="font-display text-xl text-foreground">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-accent text-muted-foreground"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
