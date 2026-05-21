/**
 * @param {string | Date | null | undefined} at
 * @returns {string}
 */
export function formatStatusHistoryAt(at) {
  const d = at instanceof Date ? at : new Date(at)
  if (!Number.isFinite(d.getTime())) return '—'
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

/**
 * @param {Record<string, unknown>} raw
 */
function normalizeHistoryItem(raw) {
  if (!raw || typeof raw !== 'object') return null
  const at = raw.at
  return {
    at,
    fromStatusLabel: String(raw.fromStatusLabel || '').trim() || '—',
    toStatusLabel: String(raw.toStatusLabel || '').trim() || '—',
    processedBy:
      raw.processedBy != null && String(raw.processedBy).trim()
        ? String(raw.processedBy).trim()
        : null,
    note: String(raw.note || '').trim(),
    isLegacy: Boolean(raw.isLegacy),
  }
}

/**
 * @param {Record<string, unknown> | null | undefined} order
 * @returns {ReturnType<typeof normalizeHistoryItem>[]}
 */
export function normalizeOrderStatusHistory(order) {
  const raw = Array.isArray(order?.statusHistory)
    ? order.statusHistory
    : Array.isArray(order?.processingHistory)
      ? order.processingHistory
      : []

  return raw
    .map(normalizeHistoryItem)
    .filter(Boolean)
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
}

export function formatProcessedByLabel(processedBy) {
  const name = String(processedBy || '').trim()
  return name ? `Nhân viên: ${name}` : '—'
}
