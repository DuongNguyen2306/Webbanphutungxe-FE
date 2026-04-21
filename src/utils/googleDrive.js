function extractGoogleDriveFileId(url) {
  const raw = String(url || '').trim()
  if (!raw) return ''
  const fromPath = raw.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fromPath?.[1]) return fromPath[1]
  const fromQuery = raw.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (fromQuery?.[1]) return fromQuery[1]
  return ''
}

export function isGoogleDriveUrl(url) {
  const raw = String(url || '').trim()
  if (!raw) return false
  return /(^https?:\/\/)?(drive|docs)\.google\.com\//i.test(raw)
}

/**
 * Nhập nhiều link Google Drive: mỗi dòng một link.
 * Trả về danh sách link đã trim + unique theo lowercase.
 */
export function normalizeGoogleDriveInput(rawInput) {
  const values = String(rawInput || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  const out = []
  const seen = new Set()
  values.forEach((url) => {
    const key = url.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    out.push(url)
  })
  return out
}

export function getGoogleDrivePreviewUrl(url) {
  const id = extractGoogleDriveFileId(url)
  if (!id) return String(url || '').trim()
  return `https://drive.google.com/thumbnail?id=${id}&sz=w1200`
}
