import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { mapApiProduct } from '../utils/mapApiProduct'
import { PRICE_SLIDER_MAX } from '../data/filterOptions'

function getAbsoluteMaxPrice(rawData, mappedProducts) {
  const fromApi = Number(rawData?.absoluteMaxPrice)
  if (Number.isFinite(fromApi) && fromApi > 0) return Math.floor(fromApi)
  const maxFromProducts = mappedProducts.reduce(
    (m, p) => Math.max(m, Number(p.salePrice) || 0),
    0,
  )
  return maxFromProducts > 0 ? maxFromProducts : PRICE_SLIDER_MAX
}

/**
 * @param {{ priceMin?: number, priceMax?: number | null, category?: string | null }} [opts]
 * `category`: tên, slug hoặc ObjectId — GET /api/products?category=
 */
export function useShopCatalog({ priceMin = 0, priceMax = null, category = null } = {}) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [fromApi, setFromApi] = useState(false)
  const [error, setError] = useState(null)
  const [absoluteMaxPrice, setAbsoluteMaxPrice] = useState(PRICE_SLIDER_MAX)

  useEffect(() => {
    let cancel = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const params = {}
        if (Number(priceMin) > 0) {
          params.minPrice = Number(priceMin)
        }
        if (priceMax == null && Number(priceMin) > 0) {
          params.maxPrice = 999_999_999
        } else if (priceMax != null) {
          params.maxPrice = Number(priceMax)
        }
        const cat = String(category ?? '').trim()
        if (cat) params.category = cat

        const { data } = await api.get('/api/products', { params })
        if (cancel) return
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
            ? data.products
            : Array.isArray(data?.items)
              ? data.items
              : []
        const mapped = list.map(mapApiProduct)
        /** Giữ đúng thứ tự phần tử mảng từ BE — không sort lại ở client. */
        setProducts(mapped)
        setAbsoluteMaxPrice(getAbsoluteMaxPrice(data, mapped))
        setFromApi(true)
      } catch (e) {
        if (cancel) return
        setProducts([])
        setAbsoluteMaxPrice(PRICE_SLIDER_MAX)
        setFromApi(false)
        setError('Không tải được danh sách sản phẩm. Vui lòng thử lại sau ít phút.')
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [priceMin, priceMax, category])

  return { products, loading, fromApi, error, absoluteMaxPrice }
}
