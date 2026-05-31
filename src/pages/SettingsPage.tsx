import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, Settings, MapPin, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOrientationStore } from '@/store/orientations-store'
import type { Monitor, Center } from '@/lib/types'
import { cn } from '@/lib/utils'

// ─── Colores disponibles para monitores ────────────────────────────────────────
const PALETTE = [
  '#F59E0B','#D97706','#EF4444','#DC2626','#EC4899','#DB2777',
  '#8B5CF6','#7C3AED','#3B82F6','#2563EB','#06B6D4','#0891B2',
  '#10B981','#059669','#F97316','#EA580C','#14B8A6','#0D9488',
]

type Tab = 'centers' | 'monitors'

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>('centers')

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl text-foreground flex items-center gap-3">
          <Settings className="w-7 h-7 text-primary" />
          CONFIGURACIÓN
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gestiona centros, monitores y ajustes generales</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-border rounded-lg p-1 w-fit">
        {([
          { key: 'centers', label: 'Centros', icon: MapPin },
          { key: 'monitors', label: 'Monitores', icon: User },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              tab === t.key ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'centers' && <CentersSettings />}
      {tab === 'monitors' && <MonitorsSettings />}
    </div>
  )
}

// ─── CENTROS ────────────────────────────────────────────────────────────────────
function CentersSettings() {
  const { centers, addCenter, updateCenter, deleteCenter } = useOrientationStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formColor, setFormColor] = useState(PALETTE[0])
  const [formCode, setFormCode] = useState('')

  function startEdit(c: Center) {
    setEditingId(c.id)
    setFormName(c.name)
    setFormColor(c.color)
    setFormCode(c.shortCode)
    setCreating(false)
  }

  function startCreate() {
    setCreating(true)
    setEditingId(null)
    setFormName('')
    setFormColor(PALETTE[0])
    setFormCode('')
  }

  function cancel() {
    setEditingId(null)
    setCreating(false)
  }

  function saveEdit() {
    if (!formName.trim() || !formCode.trim()) return
    updateCenter({ id: editingId!, name: formName.trim(), color: formColor, shortCode: formCode.trim().toUpperCase().slice(0, 3) })
    cancel()
  }

  function saveCreate() {
    if (!formName.trim() || !formCode.trim()) return
    addCenter({ id: `c-${Date.now()}`, name: formName.trim(), color: formColor, shortCode: formCode.trim().toUpperCase().slice(0, 3) })
    cancel()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-foreground">CENTROS ({centers.length})</h2>
        <Button size="sm" onClick={startCreate}>
          <Plus className="w-4 h-4" />
          Nuevo centro
        </Button>
      </div>

      {/* Form nuevo centro */}
      {creating && (
        <CenterForm
          name={formName} setName={setFormName}
          color={formColor} setColor={setFormColor}
          code={formCode} setCode={setFormCode}
          onSave={saveCreate} onCancel={cancel}
          title="Nuevo centro"
        />
      )}

      {/* Lista */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {centers.map(c => (
          <div key={c.id} className="fibra-card overflow-hidden">
            <div className="h-1" style={{ backgroundColor: c.color }} />
            {editingId === c.id ? (
              <div className="p-4">
                <CenterForm
                  name={formName} setName={setFormName}
                  color={formColor} setColor={setFormColor}
                  code={formCode} setCode={setFormCode}
                  onSave={saveEdit} onCancel={cancel}
                  title="Editar centro"
                />
              </div>
            ) : (
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: c.color }}>
                    {c.shortCode}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">Código: {c.shortCode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(c)}
                    className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteCenter(c.id)}
                    className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function CenterForm({ name, setName, color, setColor, code, setCode, onSave, onCancel, title }: {
  name: string; setName: (v: string) => void
  color: string; setColor: (v: string) => void
  code: string; setCode: (v: string) => void
  onSave: () => void; onCancel: () => void
  title: string
}) {
  return (
    <div className="space-y-3 p-3 bg-muted/20 rounded-lg border border-border">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
      <div className="grid grid-cols-3 gap-2">
        <input
          placeholder="Nombre" value={name} onChange={e => setName(e.target.value)}
          className="col-span-2 h-9 px-3 text-sm bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <input
          placeholder="Código" value={code} maxLength={3} onChange={e => setCode(e.target.value.toUpperCase())}
          className="h-9 px-3 text-sm bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring uppercase font-mono"
        />
      </div>
      <ColorPicker value={color} onChange={setColor} />
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onCancel} className="flex-1"><X className="w-3.5 h-3.5" />Cancelar</Button>
        <Button size="sm" onClick={onSave} className="flex-1"><Check className="w-3.5 h-3.5" />Guardar</Button>
      </div>
    </div>
  )
}

// ─── MONITORES ──────────────────────────────────────────────────────────────────
function MonitorsSettings() {
  const { monitors, centers, addMonitor, updateMonitor, deleteMonitor } = useOrientationStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [filterCenter, setFilterCenter] = useState('')

  const [formName, setFormName] = useState('')
  const [formColor, setFormColor] = useState(PALETTE[0])
  const [formCenterId, setFormCenterId] = useState(centers[0]?.id ?? '')

  function getCenter(centerId: string) {
    return centers.find(c => c.id === centerId)
  }

  function startEdit(m: Monitor) {
    setEditingId(m.id)
    setFormName(m.name)
    setFormColor(m.color)
    setFormCenterId(m.centerId)
    setCreating(false)
  }

  function startCreate() {
    setCreating(true)
    setEditingId(null)
    setFormName('')
    setFormColor(PALETTE[0])
    setFormCenterId(centers[0]?.id ?? '')
  }

  function cancel() { setEditingId(null); setCreating(false) }

  function saveEdit() {
    if (!formName.trim() || !formCenterId) return
    const center = getCenter(formCenterId)!
    updateMonitor({
      id: editingId!, name: formName.trim(), color: formColor,
      centerId: center.id, centerName: center.name,
      centerColor: center.color, centerShortCode: center.shortCode,
    })
    cancel()
  }

  function saveCreate() {
    if (!formName.trim() || !formCenterId) return
    const center = getCenter(formCenterId)!
    addMonitor({
      id: `m-${Date.now()}`, name: formName.trim(), color: formColor,
      centerId: center.id, centerName: center.name,
      centerColor: center.color, centerShortCode: center.shortCode,
    })
    cancel()
  }

  const filteredMonitors = filterCenter
    ? monitors.filter(m => m.centerId === filterCenter)
    : monitors

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="font-display text-lg text-foreground">MONITORES ({monitors.length})</h2>
        <div className="flex items-center gap-2">
          <select
            value={filterCenter}
            onChange={e => setFilterCenter(e.target.value)}
            className="h-8 px-2 text-xs bg-card border border-border rounded-md text-muted-foreground focus:outline-none"
          >
            <option value="">Todos los centros</option>
            {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Button size="sm" onClick={startCreate}>
            <Plus className="w-4 h-4" />
            Nuevo monitor
          </Button>
        </div>
      </div>

      {creating && (
        <MonitorForm
          name={formName} setName={setFormName}
          color={formColor} setColor={setFormColor}
          centerId={formCenterId} setCenterId={setFormCenterId}
          centers={centers}
          onSave={saveCreate} onCancel={cancel}
          title="Nuevo monitor"
        />
      )}

      {/* Lista agrupada por centro (si no hay filtro) */}
      <div className="space-y-4">
        {(filterCenter ? [{ center: getCenter(filterCenter)!, monitors: filteredMonitors }] : centers.map(c => ({
          center: c,
          monitors: monitors.filter(m => m.centerId === c.id),
        }))).filter(g => g.monitors.length > 0 && g.center).map(({ center, monitors: centroMons }) => (
          <div key={center.id}>
            {!filterCenter && (
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: center.color }} />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{center.name}</span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {centroMons.map(m => (
                <div key={m.id} className="fibra-card overflow-hidden">
                  {editingId === m.id ? (
                    <div className="p-3">
                      <MonitorForm
                        name={formName} setName={setFormName}
                        color={formColor} setColor={setFormColor}
                        centerId={formCenterId} setCenterId={setFormCenterId}
                        centers={centers}
                        onSave={saveEdit} onCancel={cancel}
                        title="Editar monitor"
                      />
                    </div>
                  ) : (
                    <div className="p-3 flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: m.color }}
                      >
                        {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="text-[9px] font-bold px-1 rounded"
                            style={{ backgroundColor: m.centerColor + '30', color: m.centerColor }}
                          >
                            {m.centerShortCode}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{m.centerName}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEdit(m)}
                          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteMonitor(m.id)}
                          className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MonitorForm({ name, setName, color, setColor, centerId, setCenterId, centers, onSave, onCancel, title }: {
  name: string; setName: (v: string) => void
  color: string; setColor: (v: string) => void
  centerId: string; setCenterId: (v: string) => void
  centers: Center[]
  onSave: () => void; onCancel: () => void
  title: string
}) {
  return (
    <div className="space-y-3 p-3 bg-muted/20 rounded-lg border border-border">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
      <input
        placeholder="Nombre del monitor" value={name} onChange={e => setName(e.target.value)}
        className="w-full h-9 px-3 text-sm bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <select
        value={centerId} onChange={e => setCenterId(e.target.value)}
        className="w-full h-9 px-3 text-sm bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <ColorPicker value={color} onChange={setColor} />
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onCancel} className="flex-1"><X className="w-3.5 h-3.5" />Cancelar</Button>
        <Button size="sm" onClick={onSave} className="flex-1"><Check className="w-3.5 h-3.5" />Guardar</Button>
      </div>
    </div>
  )
}

// ─── Color picker compartido ───────────────────────────────────────────────────
function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Color</p>
      <div className="flex flex-wrap gap-1.5">
        {PALETTE.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={cn(
              'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
              value === c ? 'border-white scale-110' : 'border-transparent'
            )}
            style={{ backgroundColor: c }}
          />
        ))}
        {/* Input hex libre */}
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-6 h-6 rounded-full cursor-pointer border-0 bg-transparent p-0"
          title="Color personalizado"
        />
      </div>
    </div>
  )
}
