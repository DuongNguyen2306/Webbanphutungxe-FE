import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { mapApiProduct } from '../utils/mapApiProduct'

export function useNewArrivals({ page = 1, limit = 10, enabled = true } = {}) {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled) {
      setItems([])
      setTotal(0)
      setLoading(false)
      setError(null)
      return undefined
    }
    let cancel = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await api.get('/api/products/new-arrivals', {
          params: { page, limit },
        })
        if (cancel) return
        const list = Array.isArray(data?.items) ? data.items : []
        const mapped = list
          .map((raw) => mapApiProduct(raw))
          .filter((p) => p.id)
        setItems(mapped)
        setTotal(Number(data?.total) || mapped.length)
      } catch {
        if (cancel) return
        setItems([])
        setTotal(0)
        setError('Chưa tải được hàng mới về. Vui lòng thử lại sau.')
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [page, limit, enabled])

  return { items, total, loading, error }
}
