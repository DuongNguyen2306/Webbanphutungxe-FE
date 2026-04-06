import axios from 'axios'

/**
 * baseURL: để trống + Vite proxy `/api` → BE, hoặc `VITE_API_URL=http://localhost:5000` (CORS trên BE phải cho origin FE).
 * Token: `localStorage.thaivu_token` → header Authorization Bearer.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
})

api.interceptors.request.use((config) => {
  const t = localStorage.getItem('thaivu_token')
  if (t) {
    config.headers.Authorization = `Bearer ${t}`
  }
  return config
})
