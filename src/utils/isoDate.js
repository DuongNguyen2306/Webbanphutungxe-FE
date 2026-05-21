const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function toIsoDateString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Mặc định xuất Excel: đầu tháng → hôm nay. */
export function defaultMonthToTodayRange() {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
  return {
    startDate: toIsoDateString(start),
    endDate: toIsoDateString(today),
  }
}

function isRealCalendarDate(y, m, d) {
  const dt = new Date(y, m - 1, d)
  return (
    dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
  )
}

/**
 * @param {string} startDate
 * @param {string} endDate
 * @returns {string | null} Lỗi hiển thị cho user, null nếu hợp lệ.
 */
export function validateIsoDateRange(startDate, endDate) {
  const start = String(startDate || '').trim()
  const end = String(endDate || '').trim()
  if (!start || !end) return 'Vui lòng chọn Từ ngày và Đến ngày.'
  if (!ISO_DATE_RE.test(start) || !ISO_DATE_RE.test(end)) {
    return 'Định dạng ngày phải là YYYY-MM-DD.'
  }
  const [y1, m1, d1] = start.split('-').map(Number)
  const [y2, m2, d2] = end.split('-').map(Number)
  if (!isRealCalendarDate(y1, m1, d1) || !isRealCalendarDate(y2, m2, d2)) {
    return 'Ngày không hợp lệ.'
  }
  const from = new Date(y1, m1 - 1, d1)
  const to = new Date(y2, m2 - 1, d2)
  if (from.getTime() > to.getTime()) {
    return 'Từ ngày không được lớn hơn Đến ngày.'
  }
  return null
}
