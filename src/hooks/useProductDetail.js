import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { mapApiProduct } from '../utils/mapApiProduct'

export function useProductDetail(id) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fromApi, setFromApi] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) {
      setProduct(null)
      setLoading(false)
      setFromApi(false)
      setError(null)
      return
    }
    let cancel = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await api.get(`/api/products/${id}`)
        if (cancel) return
        setProduct(mapApiProduct(data))
        setFromApi(true)
      } catch (e) {
        if (cancel) return
        setProduct(null)
        setFromApi(false)
        if (e.response?.status === 404) {
          setError('Không tìm thấy sản phẩm.')
        } else {
          setError('Không tải được thông tin sản phẩm. Vui lòng thử lại sau.')
        }
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [id])

  return { product, loading, fromApi, error }
}
