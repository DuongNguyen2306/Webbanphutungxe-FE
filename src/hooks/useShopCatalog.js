import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { mapApiProduct } from '../utils/mapApiProduct'

export function useShopCatalog() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [fromApi, setFromApi] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancel = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await api.get('/api/products')
        if (cancel) return
        const list = Array.isArray(data) ? data : []
        setProducts(list.map(mapApiProduct))
        setFromApi(true)
      } catch (e) {
        if (cancel) return
        setProducts([])
        setFromApi(false)
        setError(
          e.response?.data?.message ||
            'Không tải được danh sách sản phẩm. Hãy chạy backend (vd. port 5000) và thử lại.',
        )
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [])

  return { products, loading, fromApi, error }
}
