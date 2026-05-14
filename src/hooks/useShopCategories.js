import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { normalizeCategoriesPayload } from '../utils/normalizeApiCategories'

/**
 * Danh mục sản phẩm từ BE — GET /api/categories
 * @returns {{ categories: { id: string, name: string }[], loading: boolean }}
 */
export function useShopCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/api/categories')
        if (cancelled) return
        setCategories(normalizeCategoriesPayload(data))
      } catch {
        if (!cancelled) setCategories([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { categories, loading }
}
