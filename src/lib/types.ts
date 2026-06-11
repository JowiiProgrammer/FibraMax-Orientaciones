export type OrientationStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
export type ServiceType = 'general' | 'advanced' | 'maintenance' | 'specific_equipment' | 'group'

export interface Center {
  id: string
  name: string
  color: string        // Color del centro (para agrupar visualmente)
  shortCode: string    // Ej: 'GR', 'ML', 'BL'
}

export interface Monitor {
  id: string
  name: string
  color: string        // Color individual del monitor (para chips en calendario)
  centerId: string
  centerName: string
  centerColor: string
  centerShortCode: string
}

export interface Orientation {
  id: string
  subscriberName: string
  monitorId: string
  monitorName: string
  monitorColor: string
  centerName: string
  centerColor: string
  centerShortCode: string
  date: string        // YYYY-MM-DD
  startTime: string   // HH:MM
  endTime: string     // HH:MM
  status: OrientationStatus
  serviceType: ServiceType
  notes?: string
  createdAt: string
  feedback?: Feedback | null
}

export const STATUS_CONFIG: Record<OrientationStatus, { label: string; className: string; dotColor: string }> = {
  pending: {
    label: 'Pendiente',
    className: 'bg-secondary/60 text-muted-foreground border border-border',
    dotColor: 'bg-muted-foreground',
  },
  confirmed: {
    label: 'Confirmada',
    className: 'bg-success/20 text-success border border-success/30',
    dotColor: 'bg-success',
  },
  completed: {
    label: 'Completada',
    className: 'bg-muted text-muted-foreground border border-border',
    dotColor: 'bg-muted-foreground',
  },
  cancelled: {
    label: 'Cancelada',
    className: 'bg-destructive/10 text-destructive/70 border border-destructive/20',
    dotColor: 'bg-destructive/70',
  },
  no_show: {
    label: 'No vino',
    className: 'bg-warning/10 text-warning border border-warning/20',
    dotColor: 'bg-warning',
  },
}

export interface Feedback {
  id: string
  rating: number      // 1-5
  comment?: string | null
  created_at: string
}

export interface Tour {
  id: string
  monitorId: string
  monitorName: string
  monitorColor: string
  centerName: string
  centerColor: string
  centerShortCode: string
  date: string        // YYYY-MM-DD
  notes?: string
  createdAt: string
  feedback?: Feedback | null
}

// ── Material / Stock ────────────────────────────────────────────────────
export interface StockCount {
  id: string
  countedQty: number
  countedAt: string   // YYYY-MM-DD
  note?: string | null
}

export interface Material {
  id: string
  centerId: string
  centerName: string
  centerColor: string
  centerShortCode: string
  name: string
  category?: string | null
  expectedQty: number       // cuántas debería haber (stock objetivo)
  minQty: number            // umbral para reponer
  unit?: string | null      // "uds", "pares"…
  counts: StockCount[]      // recuentos ordenados de más reciente a más antiguo
  latest?: StockCount | null
  previous?: StockCount | null
}

export type MaterialStatus = 'ok' | 'low' | 'missing' | 'never'

export const MATERIAL_STATUS_CONFIG: Record<MaterialStatus, { label: string; className: string }> = {
  ok:      { label: 'OK',           className: 'bg-success/20 text-success border border-success/30' },
  low:     { label: 'Reponer',      className: 'bg-warning/15 text-warning border border-warning/30' },
  missing: { label: 'Faltan',       className: 'bg-destructive/15 text-destructive border border-destructive/30' },
  never:   { label: 'Sin recuento', className: 'bg-secondary/60 text-muted-foreground border border-border' },
}

export const SERVICE_CONFIG: Record<ServiceType, { label: string }> = {
  general: { label: 'Iniciación general' },
  advanced: { label: 'Nivel avanzado' },
  maintenance: { label: 'Repaso / Mantenimiento' },
  specific_equipment: { label: 'Máquina específica' },
  group: { label: 'Orientación grupal' },
}
