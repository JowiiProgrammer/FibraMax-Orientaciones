import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Orientation, Tour, Monitor, Center } from './types'

// Colores corporativos FibraMax
const FIBRA_RED   = [223, 62, 111] as [number, number, number]
const DARK_BG     = [20, 20, 20]   as [number, number, number]
const GRAY_LIGHT  = [245, 245, 245] as [number, number, number]
const GRAY_MID    = [200, 200, 200] as [number, number, number]
const WHITE       = [255, 255, 255] as [number, number, number]
const TEXT_DARK   = [30, 30, 30]   as [number, number, number]

export interface MonthlyReportData {
  month: Date
  orientations: Orientation[]
  tours: Tour[]
  monitors: Monitor[]
  centers: Center[]
}

function orientationsInMonth(orientations: Orientation[], month: Date) {
  const start = startOfMonth(month)
  const end = endOfMonth(month)
  return orientations.filter(o => {
    try {
      return isWithinInterval(parseISO(o.date), { start, end })
    } catch { return false }
  })
}

function toursInMonth(tours: Tour[], month: Date) {
  const start = startOfMonth(month)
  const end = endOfMonth(month)
  return tours.filter(t => {
    try {
      return isWithinInterval(parseISO(t.date), { start, end })
    } catch { return false }
  })
}

export function generateMonthlyPDF({ month, orientations, tours, monitors, centers }: MonthlyReportData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const monthLabel = format(month, "MMMM yyyy", { locale: es }).toUpperCase()
  const monthOrientations = orientationsInMonth(orientations, month)
  const monthTours = toursInMonth(tours, month)

  // ── CABECERA ──────────────────────────────────────────────────────────────
  doc.setFillColor(...DARK_BG)
  doc.rect(0, 0, 210, 32, 'F')

  // Línea roja lateral
  doc.setFillColor(...FIBRA_RED)
  doc.rect(0, 0, 5, 32, 'F')

  doc.setTextColor(...WHITE)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('FIBRA MAX', 14, 13)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Informe mensual de orientaciones', 14, 20)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...FIBRA_RED)
  doc.text(monthLabel, 14, 28)

  // Fecha generación
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY_MID)
  const generated = `Generado el ${format(new Date(), "d 'de' MMMM yyyy 'a las' HH:mm", { locale: es })}`
  doc.text(generated, 210 - 14 - doc.getTextWidth(generated), 28)

  let y = 42

  // ── RESUMEN GLOBAL ────────────────────────────────────────────────────────
  const completed = monthOrientations.filter(o => o.status === 'completed').length
  const noShow = monthOrientations.filter(o => o.status === 'no_show').length
  const cancelled = monthOrientations.filter(o => o.status === 'cancelled').length
  const total = monthOrientations.length
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...TEXT_DARK)
  doc.text('RESUMEN DEL MES', 14, y)
  y += 6

  // Tarjetas de resumen
  const summaryCards = [
    { label: 'Total orientaciones', value: String(total) },
    { label: 'Completadas', value: String(completed) },
    { label: 'No se presentaron', value: String(noShow) },
    { label: 'Canceladas', value: String(cancelled) },
    { label: 'Tasa completado', value: `${rate}%` },
    { label: 'Tours realizados', value: String(monthTours.length) },
  ]

  const cardW = (210 - 28 - 5 * 4) / 6  // 6 tarjetas con gaps
  summaryCards.forEach((card, i) => {
    const x = 14 + i * (cardW + 4)
    doc.setFillColor(...GRAY_LIGHT)
    doc.roundedRect(x, y, cardW, 18, 2, 2, 'F')
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...FIBRA_RED)
    doc.text(card.value, x + cardW / 2, y + 9, { align: 'center' })
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(card.label, x + cardW / 2, y + 15, { align: 'center' })
  })

  y += 26

  // ── TABLA POR CENTRO ──────────────────────────────────────────────────────
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...TEXT_DARK)
  doc.text('POR CENTRO', 14, y)
  y += 4

  const centerRows = centers.map(c => {
    const cOrient = monthOrientations.filter(o => o.centerName === c.name)
    const cTours = monthTours.filter(t => t.centerName === c.name)
    const cCompleted = cOrient.filter(o => o.status === 'completed').length
    const cNoShow = cOrient.filter(o => o.status === 'no_show').length
    const cRate = cOrient.length > 0 ? Math.round((cCompleted / cOrient.length) * 100) : 0
    return [c.name, c.shortCode, String(cOrient.length), String(cCompleted), String(cNoShow), String(cTours.length), `${cRate}%`]
  }).filter(r => parseInt(r[2]) > 0 || parseInt(r[5]) > 0)

  if (centerRows.length === 0) {
    centerRows.push(['Sin datos para este mes', '', '0', '0', '0', '0', '—'])
  }

  autoTable(doc, {
    startY: y,
    head: [['Centro', 'Cód.', 'Orientaciones', 'Completadas', 'No vinieron', 'Tours', 'Tasa']],
    body: centerRows,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: {
      fillColor: DARK_BG,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: GRAY_LIGHT },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center', fontStyle: 'bold', textColor: FIBRA_RED },
    },
    margin: { left: 14, right: 14 },
  })

  y = (doc as any).lastAutoTable.finalY + 10

  // ── TABLA POR MONITOR ─────────────────────────────────────────────────────
  // Comprueba si hace falta nueva página
  if (y > 220) {
    doc.addPage()
    y = 20
  }

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...TEXT_DARK)
  doc.text('POR MONITOR', 14, y)
  y += 4

  const monitorRows = monitors.map(m => {
    const mOrient = monthOrientations.filter(o => o.monitorId === m.id)
    const mTours = monthTours.filter(t => t.monitorId === m.id)
    const mCompleted = mOrient.filter(o => o.status === 'completed').length
    const mNoShow = mOrient.filter(o => o.status === 'no_show').length
    const mRate = mOrient.length > 0 ? Math.round((mCompleted / mOrient.length) * 100) : 0
    return [m.name, m.centerName, String(mOrient.length), String(mCompleted), String(mNoShow), String(mTours.length), `${mRate}%`]
  }).filter(r => parseInt(r[2]) > 0 || parseInt(r[5]) > 0)
    .sort((a, b) => parseInt(b[2]) - parseInt(a[2]))  // ordenar por más orientaciones

  if (monitorRows.length === 0) {
    monitorRows.push(['Sin datos para este mes', '', '0', '0', '0', '0', '—'])
  }

  autoTable(doc, {
    startY: y,
    head: [['Monitor', 'Centro', 'Orientaciones', 'Completadas', 'No vinieron', 'Tours', 'Tasa']],
    body: monitorRows,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: {
      fillColor: DARK_BG,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: GRAY_LIGHT },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { textColor: [100, 100, 100] as [number, number, number] },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center', fontStyle: 'bold', textColor: FIBRA_RED },
    },
    margin: { left: 14, right: 14 },
  })

  // ── PIE DE PÁGINA ─────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const pageH = doc.internal.pageSize.getHeight()
    doc.setFillColor(...GRAY_LIGHT)
    doc.rect(0, pageH - 10, 210, 10, 'F')
    doc.setFillColor(...FIBRA_RED)
    doc.rect(0, pageH - 10, 5, 10, 'F')
    doc.setFontSize(7)
    doc.setTextColor(120, 120, 120)
    doc.text('FibraMax · Informe de Orientaciones', 14, pageH - 3.5)
    doc.text(`Página ${i} de ${pageCount}`, 210 - 14, pageH - 3.5, { align: 'right' })
  }

  const fileName = `fibra-orientaciones-${format(month, 'yyyy-MM')}.pdf`
  doc.save(fileName)
}
