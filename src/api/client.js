import axios from 'axios'

/**
 * Trong production, luôn ưu tiên BE host tuyệt đối.
 * Chỉ dùng VITE_API_URL khi đó là URL đầy đủ dạng http/https.
 * Token: `localStorage.thaivu_token` → header Authorization Bearer.
 */
const DEFAULT_API_URL = 'https://thaivu-backend.onrender.com'
const rawEnvApiUrl = String(import.meta.env.VITE_API_URL || '').trim()
const hasAbsoluteApiUrl = /^https?:\/\//i.test(rawEnvApiUrl)
const baseURL = (hasAbsoluteApiUrl ? rawEnvApiUrl : DEFAULT_API_URL).replace(/\/$/, '')

export const api = axios.create({
  baseURL,
})

api.interceptors.request.use((config) => {
  const t = localStorage.getItem('thaivu_token')
  if (t) {
    config.headers.Authorization = `Bearer ${t}`
  }
  const isFormData =
    typeof FormData !== 'undefined' && config.data instanceof FormData
  if (!isFormData && !config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json'
  }
  return config
})
