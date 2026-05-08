import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { mapApiProduct } from '../utils/mapApiProduct'

export function useBestSellers({ page = 1, limit = 10 } = {}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancel = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await api.get('/api/products/best-sellers', {
          params: { page, limit },
        })
        if (cancel) return
        const list = Array.isArray(data?.items) ? data.items : []
        const mapped = list
          .map((entry) => {
            const productRaw = entry?.product
            if (!productRaw?._id) return null
            return {
              soldQuantity: Number(entry?.soldQuantity ?? 0),
              product: mapApiProduct(productRaw),
            }
          })
          .filter(Boolean)
        setItems(mapped)
      } catch (e) {
        if (cancel) return
        setItems([])
        setError('Chưa tải được danh sách sản phẩm bán chạy. Vui lòng thử lại sau.')
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [page, limit])

  return { items, loading, error }
}
