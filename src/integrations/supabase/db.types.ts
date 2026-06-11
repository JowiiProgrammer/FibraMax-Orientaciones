// Tipos manuales — sincronizados con supabase/migrations/001_initial_schema.sql

export type OrientationStatusDB = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
export type ServiceTypeDB = 'general' | 'advanced' | 'maintenance' | 'specific_equipment' | 'group'

export interface DbCenter {
  id: string
  name: string
  color: string
  short_code: string
  created_at: string
  updated_at: string
}

export interface DbMonitor {
  id: string
  name: string
  color: string
  center_id: string
  is_active: boolean
  created_at: string
  updated_at: string
  // Join
  centers?: DbCenter
}

export interface DbFeedback {
  id: string
  rating: number
  comment: string | null
  created_at: string
}

export interface DbOrientation {
  id: string
  subscriber_name: string
  monitor_id: string
  date: string
  start_time: string
  end_time: string
  status: OrientationStatusDB
  service_type: ServiceTypeDB
  notes: string | null
  created_at: string
  updated_at: string
  // Joins
  monitors?: DbMonitor & { centers?: DbCenter }
  orientation_feedback?: DbFeedback | null
}

export interface DbTour {
  id: string
  monitor_id: string
  date: string
  notes: string | null
  created_at: string
  // Joins
  monitors?: DbMonitor & { centers?: DbCenter }
  tour_feedback?: DbFeedback | null
}

export interface DbStockCount {
  id: string
  material_id: string
  counted_qty: number
  counted_at: string
  note: string | null
  created_at: string
}

export interface DbMaterial {
  id: string
  center_id: string
  name: string
  category: string | null
  expected_qty: number
  min_qty: number
  unit: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Joins
  centers?: DbCenter
  stock_counts?: DbStockCount[]
}
