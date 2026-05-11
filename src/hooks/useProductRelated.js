import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { mapApiProduct } from '../utils/mapApiProduct'

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

/** Tránh treo UI khi BE chưa có route / related chậm — ngắn hơn timeout mặc định axios */
const RELATED_REQUEST_MS = 15_000

/**
 * GET /api/products/:productId/related — song song với useProductDetail khi cùng productId.
 * relatedByBrand đã lọc trùng _id với relatedByCategory (polish).
 */
export function useProductRelated(productId) {
  const [relatedByCategory, setRelatedByCategory] = useState([])
  const [relatedByBrand, setRelatedByBrand] = useState([])
  const [loading, setLoading] = useState(false)
  /** 'ok' | 'client_error' | 'server_error' | 'network' */
  const [errorKind, setErrorKind] = useState(null)

  useEffect(() => {
    const id = String(productId || '').trim()
    if (!id) {
      setRelatedByCategory([])
      setRelatedByBrand([])
      setLoading(false)
      setErrorKind(null)
      return
    }

    let cancel = false
    ;(async () => {
      setLoading(true)
      setErrorKind(null)
      try {
        const fetchOnce = () =>
          api.get(`/api/products/${encodeURIComponent(id)}/related`, {
            timeout: RELATED_REQUEST_MS,
          })
        let res
        try {
          res = await fetchOnce()
        } catch (e) {
          if (e?.response?.status === 500) {
            await sleep(400)
            if (cancel) return
            res = await fetchOnce()
          } else {
            throw e
          }
        }
        if (cancel) return

        const data = res?.data || {}
        const rawCat = Array.isArray(data.relatedByCategory) ? data.relatedByCategory : []
        const rawBrand = Array.isArray(data.relatedByBrand) ? data.relatedByBrand : []

        const mapSafe = (arr) =>
          arr
            .slice(0, 10)
            .map((raw) => {
              try {
                return mapApiProduct(raw)
              } catch {
                return null
              }
            })
            .filter(Boolean)

        let cat = mapSafe(rawCat)
        let brand = mapSafe(rawBrand)

        const catIds = new Set(cat.map((p) => p.id))
        brand = brand.filter((p) => !catIds.has(p.id))

        setRelatedByCategory(cat)
        setRelatedByBrand(brand)
        setErrorKind(null)
      } catch (e) {
        if (cancel) return
        setRelatedByCategory([])
        setRelatedByBrand([])
        const status = e?.response?.status
        if (status === 400 || status === 404) {
          setErrorKind('client_error')
        } else if (status >= 500) {
          setErrorKind('server_error')
        } else {
          setErrorKind('network')
        }
      } finally {
        if (!cancel) setLoading(false)
      }
    })()

    return () => {
      cancel = true
    }
  }, [productId])

  return { relatedByCategory, relatedByBrand, loading, errorKind }
}
