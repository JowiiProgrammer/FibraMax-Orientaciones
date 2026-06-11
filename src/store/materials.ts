import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { materialSchema, stockCountSchema, uuidSchema, validateOrThrow } from '@/lib/validation'
import type { Material, StockCount } from '@/lib/types'
import type { DbMaterial, DbStockCount } from '@/integrations/supabase/db.types'

// ── Transformers DB → App ──────────────────────────────────────────────
function toStockCount(s: DbStockCount): StockCount {
  return { id: s.id, countedQty: s.counted_qty, countedAt: s.counted_at, note: s.note ?? undefined }
}

function toMaterial(m: DbMaterial): Material {
  const counts = (m.stock_counts ?? [])
    .map(toStockCount)
    .sort((a, b) => b.countedAt.localeCompare(a.countedAt) || b.id.localeCompare(a.id))
  return {
    id: m.id,
    centerId: m.center_id,
    centerName: m.centers?.name ?? '',
    centerColor: m.centers?.color ?? '#DF3E6F',
    centerShortCode: m.centers?.short_code ?? '??',
    name: m.name,
    category: m.category ?? undefined,
    expectedQty: m.expected_qty,
    minQty: m.min_qty,
    unit: m.unit ?? undefined,
    counts,
    latest: counts[0] ?? null,
    previous: counts[1] ?? null,
  }
}

async function fetchMaterials(): Promise<Material[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('*, centers(*), stock_counts(*)')
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return (data as DbMaterial[]).map(toMaterial)
}

function fail(msg: string, err: unknown): never {
  if (import.meta.env.DEV) console.error('[materials]', err)
  toast.error(msg)
  throw err
}

export interface MaterialInput {
  name: string
  centerId: string
  category?: string | null
  expectedQty: number
  minQty: number
  unit?: string | null
}

// ── Hook ───────────────────────────────────────────────────────────────
export function useMaterials() {
  const qc = useQueryClient()
  const { data: materials = [], isLoading } = useQuery({ queryKey: ['materials'], queryFn: fetchMaterials })

  // Realtime: refresca al instante cuando cambian materiales o recuentos.
  // Requiere materials/stock_counts en la publicación supabase_realtime.
  useEffect(() => {
    const ch = supabase
      .channel('db-materiales')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' },    () => qc.invalidateQueries({ queryKey: ['materials'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_counts' }, () => qc.invalidateQueries({ queryKey: ['materials'] }))
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [qc])

  const addMaterial = async (m: MaterialInput) => {
    const v = validateOrThrow(materialSchema, m)
    const { error } = await supabase.from('materials').insert({
      name: v.name, center_id: v.centerId, category: v.category ?? null,
      expected_qty: v.expectedQty, min_qty: v.minQty, unit: v.unit ?? null,
    })
    if (error) fail('No se pudo guardar el material.', error)
    toast.success('Material añadido')
    qc.invalidateQueries({ queryKey: ['materials'] })
  }

  const updateMaterial = async (id: string, m: MaterialInput) => {
    const safeId = validateOrThrow(uuidSchema, id)
    const v = validateOrThrow(materialSchema, m)
    const { error } = await supabase.from('materials').update({
      name: v.name, center_id: v.centerId, category: v.category ?? null,
      expected_qty: v.expectedQty, min_qty: v.minQty, unit: v.unit ?? null,
    }).eq('id', safeId)
    if (error) fail('No se pudo actualizar el material.', error)
    toast.success('Material actualizado')
    qc.invalidateQueries({ queryKey: ['materials'] })
  }

  // Borrado lógico: conserva el histórico de recuentos
  const deleteMaterial = async (id: string) => {
    const safeId = validateOrThrow(uuidSchema, id)
    const { error } = await supabase.from('materials').update({ is_active: false }).eq('id', safeId)
    if (error) fail('No se pudo eliminar el material.', error)
    toast.success('Material eliminado')
    qc.invalidateQueries({ queryKey: ['materials'] })
  }

  // Recuento por lote: una fila por material con su cantidad contada
  const recordCount = async (entries: { materialId: string; countedQty: number }[], countedAt: string, note?: string) => {
    const rows = entries.map(e => {
      const v = validateOrThrow(stockCountSchema, { materialId: e.materialId, countedQty: e.countedQty, countedAt, note })
      return { material_id: v.materialId, counted_qty: v.countedQty, counted_at: v.countedAt, note: v.note ?? null }
    })
    if (rows.length === 0) return
    const { error } = await supabase.from('stock_counts').insert(rows)
    if (error) fail('No se pudo guardar el recuento.', error)
    toast.success(`Recuento guardado (${rows.length})`)
    qc.invalidateQueries({ queryKey: ['materials'] })
  }

  return { materials, isLoading, addMaterial, updateMaterial, deleteMaterial, recordCount }
}

// ── Helper de estado (usado por la página) ─────────────────────────────
export function materialStatus(m: Material): import('@/lib/types').MaterialStatus {
  if (!m.latest) return 'never'
  if (m.latest.countedQty <= m.minQty) return 'low'
  if (m.latest.countedQty < m.expectedQty) return 'missing'
  return 'ok'
}
