export function normalizeSearch(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}
