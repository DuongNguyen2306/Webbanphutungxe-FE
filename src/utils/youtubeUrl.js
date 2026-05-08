/**
 * Trích YouTube video id từ URL thường gặp (watch, youtu.be, embed, shorts).
 * @param {string} raw
 * @returns {string|null}
 */
export function parseYouTubeVideoId(raw) {
  const s = String(raw || '').trim()
  if (!s) return null

  try {
    const u = new URL(s, 'https://www.youtube.com')
    const host = (u.hostname || '').replace(/^www\./i, '').toLowerCase()

    if (host === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0]
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      const parts = u.pathname.split('/').filter(Boolean)

      if (parts[0] === 'embed' && parts[1]) {
        return /^[a-zA-Z0-9_-]{11}$/.test(parts[1]) ? parts[1] : null
      }
      if (parts[0] === 'shorts' && parts[1]) {
        return /^[a-zA-Z0-9_-]{11}$/.test(parts[1]) ? parts[1] : null
      }

      const v = u.searchParams.get('v')
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v
    }
  } catch {
    return null
  }

  return null
}
