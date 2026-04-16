import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '../api/client'
import { mapApiProduct } from '../utils/mapApiProduct'
import { ProductCard } from './ProductCard'

function parseProductListResponse(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.products)) return data.products
  if (Array.isArray(data?.items)) return data.items
  return []
}

/**
 * Danh sách sản phẩm ngang (carousel) — dùng chung API GET /api/products với catalog.
 */
export function ProductRelatedShelf({ excludeProductId, categoryId }) {
  const railRef = useRef(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancel = false
    ;(async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/api/products')
        if (cancel) return
        const raw = parseProductListResponse(data)
        const mapped = raw.map(mapApiProduct)
        let rest = mapped.filter((p) => String(p.id) !== String(excludeProductId || ''))
        if (categoryId) {
          const same = rest.filter((p) => String(p.categoryId || '') === String(categoryId))
          const other = rest.filter((p) => String(p.categoryId || '') !== String(categoryId))
          rest = [...same, ...other]
        }
        setItems(rest.slice(0, 30))
      } catch {
        if (!cancel) setItems([])
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [excludeProductId, categoryId])

  function scrollRail(delta) {
    const el = railRef.current
    if (el) el.scrollBy({ left: delta, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <section className="border-t border-gray-200 bg-page/40 py-8">
        <div className="mx-auto max-w-[1200px] px-4">
          <p className="text-sm text-gray-500">Đang tải sản phẩm gợi ý...</p>
        </div>
      </section>
    )
  }

  if (!items.length) return null

  return (
    <section className="border-t border-gray-200 bg-page/40 py-8">
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-base font-extrabold uppercase tracking-wide text-ink sm:text-lg">
            Các sản phẩm khác của shop
          </h2>
          <Link
            to="/"
            className="text-sm font-bold text-brand hover:underline"
          >
            Xem tất cả &gt;
          </Link>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => scrollRail(-320)}
            className="absolute left-0 top-1/2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition hover:bg-gray-50 md:flex"
            aria-label="Cuộn trái"
          >
            <ChevronLeft className="size-5 text-gray-700" />
          </button>
          <button
            type="button"
            onClick={() => scrollRail(320)}
            className="absolute right-0 top-1/2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition hover:bg-gray-50 md:flex"
            aria-label="Cuộn phải"
          >
            <ChevronRight className="size-5 text-gray-700" />
          </button>

          <div
            ref={railRef}
            className="flex gap-3 overflow-x-auto scroll-smooth pb-1 pt-1 [scrollbar-width:thin] md:px-10"
          >
            {items.map((p) => (
              <div
                key={p.id}
                className="w-[150px] shrink-0 sm:w-[168px]"
              >
                <ProductCard
                  productId={p.id}
                  name={p.name}
                  originalPrice={p.originalPrice}
                  salePrice={p.salePrice}
                  discountTag={p.discountTag}
                  image={p.image}
                  isAvailable={p.isAvailable}
                  priceFrom={Boolean(p.variants?.length > 1)}
                  variant="shelf"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
