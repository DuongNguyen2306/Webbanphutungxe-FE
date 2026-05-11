import { useEffect, useState } from 'react'
import { api } from '../api/client'

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
        const rawList = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.categories)
              ? data.categories
              : []
        const normalized = rawList
          .map((item) => ({
            id: String(item?._id || item?.id || ''),
            name: String(item?.name || '').trim(),
          }))
          .filter((item) => item.id && item.name)
        setCategories(normalized)
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
