import type { Orientation, Monitor, Center, Tour } from './types'
import { format, addDays, subDays } from 'date-fns'

const today = new Date()
const fmt = (d: Date) => format(d, 'yyyy-MM-dd')

// ─── CENTROS ──────────────────────────────────────────────────────────────────
export const MOCK_CENTERS: Center[] = [
  { id: 'c1', name: 'Granollers',  color: '#F59E0B', shortCode: 'GR' },
  { id: 'c2', name: 'Mollet',      color: '#3B82F6', shortCode: 'ML' },
  { id: 'c3', name: 'Blanes',      color: '#10B981', shortCode: 'BL' },
  { id: 'c4', name: 'Mataró',      color: '#8B5CF6', shortCode: 'MT' },
  { id: 'c5', name: 'Cabrera',     color: '#EC4899', shortCode: 'CB' },
  { id: 'c6', name: 'Sabadell',    color: '#06B6D4', shortCode: 'SB' },
  { id: 'c7', name: 'Premià',      color: '#F97316', shortCode: 'PM' },
]

// ─── MONITORES (2 por centro) ─────────────────────────────────────────────────
export const MOCK_MONITORS: Monitor[] = [
  // Granollers
  { id: 'm1', name: 'Carla Martínez',  color: '#F59E0B', centerId: 'c1', centerName: 'Granollers', centerColor: '#F59E0B', centerShortCode: 'GR' },
  { id: 'm2', name: 'Rafa Soler',      color: '#D97706', centerId: 'c1', centerName: 'Granollers', centerColor: '#F59E0B', centerShortCode: 'GR' },
  // Mollet
  { id: 'm3', name: 'Jordi Puig',      color: '#3B82F6', centerId: 'c2', centerName: 'Mollet',     centerColor: '#3B82F6', centerShortCode: 'ML' },
  { id: 'm4', name: 'Neus Vidal',      color: '#2563EB', centerId: 'c2', centerName: 'Mollet',     centerColor: '#3B82F6', centerShortCode: 'ML' },
  // Blanes
  { id: 'm5', name: 'Sara López',      color: '#10B981', centerId: 'c3', centerName: 'Blanes',     centerColor: '#10B981', centerShortCode: 'BL' },
  { id: 'm6', name: 'Marc Torrent',    color: '#059669', centerId: 'c3', centerName: 'Blanes',     centerColor: '#10B981', centerShortCode: 'BL' },
  // Mataró
  { id: 'm7', name: 'Laia Pons',       color: '#8B5CF6', centerId: 'c4', centerName: 'Mataró',     centerColor: '#8B5CF6', centerShortCode: 'MT' },
  { id: 'm8', name: 'Pau Roca',        color: '#7C3AED', centerId: 'c4', centerName: 'Mataró',     centerColor: '#8B5CF6', centerShortCode: 'MT' },
  // Cabrera
  { id: 'm9',  name: 'Miriam Fonts',   color: '#EC4899', centerId: 'c5', centerName: 'Cabrera',    centerColor: '#EC4899', centerShortCode: 'CB' },
  { id: 'm10', name: 'Toni Masó',      color: '#DB2777', centerId: 'c5', centerName: 'Cabrera',    centerColor: '#EC4899', centerShortCode: 'CB' },
  // Sabadell
  { id: 'm11', name: 'Ivet Camps',     color: '#06B6D4', centerId: 'c6', centerName: 'Sabadell',   centerColor: '#06B6D4', centerShortCode: 'SB' },
  { id: 'm12', name: 'Gerard Batlle',  color: '#0891B2', centerId: 'c6', centerName: 'Sabadell',   centerColor: '#06B6D4', centerShortCode: 'SB' },
  // Premià
  { id: 'm13', name: 'Marta Esteve',   color: '#F97316', centerId: 'c7', centerName: 'Premià',     centerColor: '#F97316', centerShortCode: 'PM' },
  { id: 'm14', name: 'Dani Ferrer',    color: '#EA580C', centerId: 'c7', centerName: 'Premià',     centerColor: '#F97316', centerShortCode: 'PM' },
]

// ─── ORIENTACIONES de ejemplo ──────────────────────────────────────────────────
export const MOCK_ORIENTATIONS: Orientation[] = [
  // Hoy — Granollers
  {
    id: 'o1', subscriberName: 'Antonio García',
    monitorId: 'm1', monitorName: 'Carla Martínez', monitorColor: '#F59E0B',
    centerName: 'Granollers', centerColor: '#F59E0B', centerShortCode: 'GR',
    date: fmt(today), startTime: '09:00', endTime: '09:35',
    status: 'confirmed', serviceType: 'general',
    notes: 'Primera vez en el gimnasio.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'o2', subscriberName: 'María Fernández',
    monitorId: 'm1', monitorName: 'Carla Martínez', monitorColor: '#F59E0B',
    centerName: 'Granollers', centerColor: '#F59E0B', centerShortCode: 'GR',
    date: fmt(today), startTime: '11:00', endTime: '11:35',
    status: 'pending', serviceType: 'advanced',
    createdAt: new Date().toISOString(),
  },
  // Hoy — Mollet
  {
    id: 'o3', subscriberName: 'Luis Rodríguez',
    monitorId: 'm3', monitorName: 'Jordi Puig', monitorColor: '#3B82F6',
    centerName: 'Mollet', centerColor: '#3B82F6', centerShortCode: 'ML',
    date: fmt(today), startTime: '17:00', endTime: '17:35',
    status: 'pending', serviceType: 'specific_equipment',
    notes: 'Quiere aprender cardio.',
    createdAt: new Date().toISOString(),
  },
  // Hoy — Blanes
  {
    id: 'o4', subscriberName: 'Elena Torres',
    monitorId: 'm5', monitorName: 'Sara López', monitorColor: '#10B981',
    centerName: 'Blanes', centerColor: '#10B981', centerShortCode: 'BL',
    date: fmt(today), startTime: '18:30', endTime: '19:05',
    status: 'confirmed', serviceType: 'general',
    createdAt: new Date().toISOString(),
  },
  // Ayer — Mollet
  {
    id: 'o5', subscriberName: 'Pablo Sánchez',
    monitorId: 'm3', monitorName: 'Jordi Puig', monitorColor: '#3B82F6',
    centerName: 'Mollet', centerColor: '#3B82F6', centerShortCode: 'ML',
    date: fmt(subDays(today, 1)), startTime: '10:00', endTime: '10:35',
    status: 'completed', serviceType: 'maintenance',
    createdAt: new Date().toISOString(),
  },
  // Ayer — Granollers
  {
    id: 'o6', subscriberName: 'Ana Moreno',
    monitorId: 'm2', monitorName: 'Rafa Soler', monitorColor: '#D97706',
    centerName: 'Granollers', centerColor: '#F59E0B', centerShortCode: 'GR',
    date: fmt(subDays(today, 1)), startTime: '16:00', endTime: '16:35',
    status: 'no_show', serviceType: 'general',
    notes: 'No avisó.',
    createdAt: new Date().toISOString(),
  },
  // Mañana — Cabrera
  {
    id: 'o7', subscriberName: 'Carlos Jiménez',
    monitorId: 'm9', monitorName: 'Miriam Fonts', monitorColor: '#EC4899',
    centerName: 'Cabrera', centerColor: '#EC4899', centerShortCode: 'CB',
    date: fmt(addDays(today, 1)), startTime: '10:30', endTime: '11:05',
    status: 'pending', serviceType: 'general',
    createdAt: new Date().toISOString(),
  },
  // Mañana — Mataró
  {
    id: 'o8', subscriberName: 'Lucía Ruiz',
    monitorId: 'm7', monitorName: 'Laia Pons', monitorColor: '#8B5CF6',
    centerName: 'Mataró', centerColor: '#8B5CF6', centerShortCode: 'MT',
    date: fmt(addDays(today, 1)), startTime: '19:00', endTime: '19:35',
    status: 'confirmed', serviceType: 'advanced',
    notes: 'Quiere rutina de fuerza.',
    createdAt: new Date().toISOString(),
  },
  // +2 días — Sabadell
  {
    id: 'o9', subscriberName: 'Antonio García',
    monitorId: 'm11', monitorName: 'Ivet Camps', monitorColor: '#06B6D4',
    centerName: 'Sabadell', centerColor: '#06B6D4', centerShortCode: 'SB',
    date: fmt(addDays(today, 2)), startTime: '09:30', endTime: '10:05',
    status: 'pending', serviceType: 'maintenance',
    createdAt: new Date().toISOString(),
  },
  // +3 días — Premià
  {
    id: 'o10', subscriberName: 'Luis Rodríguez',
    monitorId: 'm13', monitorName: 'Marta Esteve', monitorColor: '#F97316',
    centerName: 'Premià', centerColor: '#F97316', centerShortCode: 'PM',
    date: fmt(addDays(today, 3)), startTime: '11:30', endTime: '12:05',
    status: 'pending', serviceType: 'group',
    notes: 'Grupo de 3 personas nuevas.',
    createdAt: new Date().toISOString(),
  },
]

// ─── TOURS de ejemplo ──────────────────────────────────────────────────────────
export const MOCK_TOURS: Tour[] = [
  {
    id: 't1', monitorId: 'm1', monitorName: 'Carla Martínez', monitorColor: '#F59E0B',
    centerName: 'Granollers', centerColor: '#F59E0B', centerShortCode: 'GR',
    date: fmt(today), notes: 'Pareja nueva', createdAt: new Date().toISOString(),
  },
  {
    id: 't2', monitorId: 'm1', monitorName: 'Carla Martínez', monitorColor: '#F59E0B',
    centerName: 'Granollers', centerColor: '#F59E0B', centerShortCode: 'GR',
    date: fmt(today), createdAt: new Date().toISOString(),
  },
  {
    id: 't3', monitorId: 'm3', monitorName: 'Jordi Puig', monitorColor: '#3B82F6',
    centerName: 'Mollet', centerColor: '#3B82F6', centerShortCode: 'ML',
    date: fmt(today), notes: 'Grupo de 3', createdAt: new Date().toISOString(),
  },
  {
    id: 't4', monitorId: 'm5', monitorName: 'Sara López', monitorColor: '#10B981',
    centerName: 'Blanes', centerColor: '#10B981', centerShortCode: 'BL',
    date: fmt(subDays(today, 1)), createdAt: new Date().toISOString(),
  },
]
