import { presentDbStatus } from './adminOrderPresentation.js'

/**
 * @param {Date | string} at
 */
function toDate(at) {
  const d = at instanceof Date ? at : new Date(at)
  return Number.isFinite(d.getTime()) ? d : new Date()
}

/**
 * @param {string} dbStatus
 * @param {Date} [at]
 */
export function createInitialStatusHistoryEntry(dbStatus, at = new Date()) {
  const to = presentDbStatus(dbStatus)
  return {
    at: toDate(at),
    fromStatus: '',
    toStatus: String(dbStatus || '').toLowerCase(),
    fromStatusLabel: '—',
    toStatusLabel: to.statusLabel,
    processedBy: null,
    note: '',
    isLegacy: false,
  }
}

/**
 * @param {{ fromStatus: string, toStatus: string, processedBy?: string | null, note?: string, at?: Date }} params
 */
export function createStatusChangeEntry({
  fromStatus,
  toStatus,
  processedBy = null,
  note = '',
  at = new Date(),
}) {
  const from = presentDbStatus(fromStatus)
  const to = presentDbStatus(toStatus)
  const nv =
    processedBy != null && String(processedBy).trim()
      ? String(processedBy).trim()
      : null
  return {
    at: toDate(at),
    fromStatus: String(fromStatus || '').toLowerCase(),
    toStatus: String(toStatus || '').toLowerCase(),
    fromStatusLabel: from.statusLabel,
    toStatusLabel: to.statusLabel,
    processedBy: nv,
    note: String(note || '').trim(),
    isLegacy: false,
  }
}

function presentHistoryEntry(entry) {
  const from = presentDbStatus(entry?.fromStatus || '')
  const to = presentDbStatus(entry?.toStatus)
  return {
    at: toDate(entry?.at),
    fromStatus: String(entry?.fromStatus || '').toLowerCase(),
    toStatus: String(entry?.toStatus || '').toLowerCase(),
    fromStatusLabel:
      String(entry?.fromStatusLabel || '').trim() || from.statusLabel,
    toStatusLabel: String(entry?.toStatusLabel || '').trim() || to.statusLabel,
    processedBy:
      entry?.processedBy != null && String(entry.processedBy).trim()
        ? String(entry.processedBy).trim()
        : null,
    note: String(entry?.note || '').trim(),
    isLegacy: Boolean(entry?.isLegacy),
  }
}

/** Một bước suy đoán cho đơn cũ chưa có statusHistory. */
export function synthesizeLegacyStatusHistory(lean) {
  const to = presentDbStatus(lean?.status)
  const at = lean?.updatedAt || lean?.createdAt || new Date()
  const nv =
    lean?.processedBy != null && String(lean.processedBy).trim()
      ? String(lean.processedBy).trim()
      : null
  return [
    {
      at: toDate(at),
      fromStatus: 'pending',
      toStatus: String(lean?.status || 'pending').toLowerCase(),
      fromStatusLabel: 'Chờ xử lý',
      toStatusLabel: to.statusLabel,
      processedBy: nv,
      note: String(lean?.cancelNote || '').trim(),
      isLegacy: true,
    },
  ]
}

/**
 * @param {Record<string, unknown>} lean
 * @returns {ReturnType<typeof presentHistoryEntry>[]}
 */
export function resolveStatusHistory(lean) {
  const raw = Array.isArray(lean?.statusHistory)
    ? lean.statusHistory
    : Array.isArray(lean?.processingHistory)
      ? lean.processingHistory
      : null

  if (raw?.length) {
    return [...raw]
      .map(presentHistoryEntry)
      .sort((a, b) => toDate(a.at).getTime() - toDate(b.at).getTime())
  }

  return synthesizeLegacyStatusHistory(lean).map(presentHistoryEntry)
}
