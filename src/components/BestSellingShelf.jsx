import { useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from './ProductCard'

/**
 * Thanh sản phẩm bán chạy — ưu tiên sort theo soldCount (API); nếu không có dữ liệu thì giữ thứ tử catalog.
 */
export function BestSellingShelf({ products = [] }) {
  const railRef = useRef(null)

  const items = useMemo(() => {
    if (!products.length) return []
    const ranked = [...products].sort((a, b) => {
      const sa = Number(a.soldCount)
      const sb = Number(b.soldCount)
      const ha = Number.isFinite(sa) && sa > 0
      const hb = Number.isFinite(sb) && sb > 0
      if (ha && hb && sb !== sa) return sb - sa
      if (ha && !hb) return -1
      if (!ha && hb) return 1
      return 0
    })
    const seen = new Set()
    const out = []
    for (const p of ranked) {
      if (out.length >= 16) break
      if (!p?.id || seen.has(p.id)) continue
      seen.add(p.id)
      out.push(p)
    }
    return out.length ? out : products.slice(0, 16)
  }, [products])

  function scrollRail(delta) {
    const el = railRef.current
    if (el) el.scrollBy({ left: delta, behavior: 'smooth' })
  }

  if (!items.length) return null

  return (
    <section className="border-t border-gray-200 bg-white py-8">
      <div className="mx-auto max-w-[1600px] px-4 xl:px-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold uppercase tracking-wide text-ink sm:text-lg">
              Sản phẩm bán chạy
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Gợi ý theo lượt bán (dữ liệu từ cửa hàng); kéo ngang để xem thêm.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center text-sm font-bold text-brand hover:underline"
            aria-label="Mở danh sách sản phẩm bán chạy"
          >
            <ChevronRight className="size-4" strokeWidth={2.8} />
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
              <div key={p.id} className="w-[150px] shrink-0 sm:w-[168px]">
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
