import ExcelJS from 'exceljs'
import { Order } from '../models/Order.js'
import { formatAddressText } from './orderPresentation.js'
import { presentDbStatus } from './adminOrderPresentation.js'

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function isRealCalendarDate(y, m, d) {
  const dt = new Date(y, m - 1, d)
  return (
    dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
  )
}

/** @returns {{ start: string, end: string, from: Date, to: Date } | { error: string }} */
export function parseExportDateParams(startDate, endDate) {
  const start = String(startDate || '').trim()
  const end = String(endDate || '').trim()

  if (!start || !end) {
    return { error: 'Vui lòng chọn startDate và endDate (YYYY-MM-DD).' }
  }
  if (!ISO_DATE_RE.test(start) || !ISO_DATE_RE.test(end)) {
    return { error: 'Định dạng ngày phải là YYYY-MM-DD.' }
  }

  const [y1, m1, d1] = start.split('-').map(Number)
  const [y2, m2, d2] = end.split('-').map(Number)
  if (!isRealCalendarDate(y1, m1, d1) || !isRealCalendarDate(y2, m2, d2)) {
    return { error: 'Ngày không hợp lệ.' }
  }

  const from = new Date(y1, m1 - 1, d1, 0, 0, 0, 0)
  const to = new Date(y2, m2 - 1, d2, 23, 59, 59, 999)
  if (from.getTime() > to.getTime()) {
    return { error: 'startDate không được lớn hơn endDate.' }
  }

  return { start, end, from, to }
}

function resolveExportOrderCode(order) {
  const code = String(order.orderCode || '').trim()
  if (/^\d{6}$/.test(code)) return code
  const id = String(order._id || '')
  return id ? id.slice(-8) : '—'
}

function formatProductLines(items) {
  return (items || [])
    .map((it) => {
      const name = String(it?.name || 'Sản phẩm').trim()
      const variant = String(it?.variantLabel || '').trim()
      const qty = Math.max(1, Number(it?.quantity) || 1)
      const label = variant ? `${name} (${variant})` : name
      return `${label} x${qty}`
    })
    .join('; ')
}

function formatMoney(amount) {
  const n = Number(amount)
  if (!Number.isFinite(n)) return 0
  return n
}

/**
 * @param {string} startDate
 * @param {string} endDate
 * @returns {Promise<{ buffer: Buffer, filename: string } | { error: string }>}
 */
export async function buildOrdersExcelBuffer(startDate, endDate) {
  const parsed = parseExportDateParams(startDate, endDate)
  if ('error' in parsed) return { error: parsed.error }

  const rows = await Order.find({
    createdAt: { $gte: parsed.from, $lte: parsed.to },
  })
    .sort({ createdAt: -1 })
    .lean()

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'THÁI VŨ Admin'
  const sheet = workbook.addWorksheet('Báo cáo đơn hàng')

  sheet.columns = [
    { header: 'Mã đơn hàng', key: 'orderCode', width: 14 },
    { header: 'Ngày đặt', key: 'createdAt', width: 22 },
    { header: 'Tên KH', key: 'customerName', width: 24 },
    { header: 'SĐT', key: 'phone', width: 16 },
    { header: 'Địa chỉ', key: 'address', width: 40 },
    { header: 'Sản phẩm', key: 'products', width: 48 },
    { header: 'Tổng tiền', key: 'totalAmount', width: 16 },
    { header: 'Trạng thái', key: 'statusLabel', width: 18 },
    { header: 'Nhân viên xử lý', key: 'processedBy', width: 22 },
  ]

  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true }
  headerRow.alignment = { vertical: 'middle', wrapText: true }

  for (const order of rows) {
    const { statusLabel } = presentDbStatus(order.status)
    const createdAt = order.createdAt
      ? new Date(order.createdAt).toLocaleString('vi-VN')
      : ''
    sheet.addRow({
      orderCode: resolveExportOrderCode(order),
      createdAt,
      customerName: String(order.contact?.name || '').trim() || '—',
      phone: String(order.contact?.phone || '').trim() || '—',
      address: formatAddressText(order.shippingAddress) || '—',
      products: formatProductLines(order.items) || '—',
      totalAmount: formatMoney(order.totalAmount),
      statusLabel,
      processedBy: String(order.processedBy || '').trim() || '—',
    })
  }

  sheet.getColumn('totalAmount').numFmt = '#,##0'

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer())
  return {
    buffer,
    filename: `baocao-donhang-${parsed.start}_${parsed.end}.xlsx`,
  }
}
