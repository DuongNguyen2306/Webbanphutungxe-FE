import { ORDER_STATUS, normalizeOrderStatus } from '../constants/orderStatus'

export const PROCESSED_BY_MAX_LENGTH = 120

/** Trạng thái nên nhập tên NV khi chuyển sang các bước xử lý sau. */
export const PROCESSED_BY_ENCOURAGED_TARGETS = new Set([
  ORDER_STATUS.CONTACTING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.SHIPPING,
  ORDER_STATUS.COMPLETED,
])

/**
 * @param {string} processedBy
 * @returns {string | undefined}
 */
export function normalizeProcessedByInput(processedBy) {
  const trimmed = String(processedBy ?? '').trim()
  if (!trimmed) return undefined
  return trimmed.slice(0, PROCESSED_BY_MAX_LENGTH)
}

/** Trạng thái đích bắt buộc nhập tên nhân viên (trừ hủy đơn). */
export function isProcessedByRequiredForStatus(status) {
  return normalizeOrderStatus(String(status || '')) !== ORDER_STATUS.CANCELLED
}

/**
 * @param {string} processedBy
 * @param {string} targetStatus
 * @returns {string | null}
 */
export function validateProcessedByForStatusChange(processedBy, targetStatus) {
  if (!isProcessedByRequiredForStatus(targetStatus)) return null
  if (!normalizeProcessedByInput(processedBy)) {
    return 'Vui lòng nhập nhân viên xử lý.'
  }
  return null
}

/**
 * @param {string} status
 * @param {{ note?: string, processedBy?: string }} [opts]
 */
export function buildAdminStatusPatchPayload(status, opts = {}) {
  const payload = { status }
  if (status === ORDER_STATUS.CANCELLED) {
    payload.note = String(opts.note ?? '').trim()
  }
  const processed = normalizeProcessedByInput(opts.processedBy)
  if (processed) {
    payload.processedBy = processed
  } else if (isProcessedByRequiredForStatus(status)) {
    payload.processedBy = ''
  }
  return payload
}
