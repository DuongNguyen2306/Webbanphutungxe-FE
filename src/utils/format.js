export function formatVnd(value) {
  if (value == null || Number.isNaN(value)) return ''
  return `${Number(value).toLocaleString('vi-VN')}đ`
}
