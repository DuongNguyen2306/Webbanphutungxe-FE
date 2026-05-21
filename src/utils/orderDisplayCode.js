/**
 * Mã hiển thị cho admin/khách: ưu tiên orderCode 6 số, fallback _id rút gọn.
 * @param {{ orderCode?: string | null, _id?: string, orderId?: string } | null | undefined} order
 * @returns {{ display: string, isShortCode: boolean }}
 */
export function resolveOrderDisplayCode(order) {
  const code = String(order?.orderCode ?? '').trim()
  if (/^\d{6}$/.test(code)) {
    return { display: code, isShortCode: true }
  }
  const id = String(order?._id || order?.orderId || '').trim()
  if (!id) return { display: '—', isShortCode: false }
  return { display: id.slice(-8), isShortCode: false }
}

/**
 * @param {Parameters<typeof resolveOrderDisplayCode>[0]} order
 * @param {{ withHash?: boolean }} [opts]
 */
export function formatOrderDisplayCode(order, opts = {}) {
  const { display, isShortCode } = resolveOrderDisplayCode(order)
  if (display === '—') return '—'
  if (opts.withHash === false || isShortCode) return display
  return `#${display}`
}
