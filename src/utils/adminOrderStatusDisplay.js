/**
 * Tên NV từ danh sách/chi tiết đơn admin.
 * @param {{ processedBy?: string | null, employeeName?: string | null } | null | undefined} order
 */
export function resolveOrderProcessedBy(order) {
  const name = String(order?.processedBy ?? order?.employeeName ?? '').trim()
  return name || null
}

/**
 * Badge trạng thái admin: "Đang liên hệ" hoặc "Đang liên hệ: Ánh Dương".
 * @param {string} statusLabel
 * @param {string | null} processedBy
 */
export function buildAdminStatusBadgeText(statusLabel, processedBy) {
  const label = String(statusLabel || '').trim() || '—'
  if (!processedBy) return label
  return `${label}: ${processedBy}`
}
