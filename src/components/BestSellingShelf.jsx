import { useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from './ProductCard'

export function BestSellingShelf({ items = [], loading = false, error = null }) {
  const railRef = useRef(null)

  const rows = useMemo(() => {
    if (!items.length) return []
    const seen = new Set()
    const out = []
    for (const entry of items) {
      const p = entry?.product
      if (!p?.id || seen.has(p.id)) continue
      seen.add(p.id)
      out.push(entry)
    }
    return out
  }, [items])

  function scrollRail(delta) {
    const el = railRef.current
    if (el) el.scrollBy({ left: delta, behavior: 'smooth' })
  }

  return (
    <section className="border-t border-gray-200 bg-white py-8">
      <div className="mx-auto max-w-[1600px] px-4 xl:px-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold uppercase tracking-wide text-ink sm:text-lg">
              Sản phẩm bán chạy
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Gợi ý những sản phẩm được khách hàng mua nhiều.
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
            onClick={() => scrollRail(-380)}
            className="absolute left-0 top-1/2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition hover:bg-gray-50 md:flex"
            aria-label="Cuộn trái"
          >
            <ChevronLeft className="size-5 text-gray-700" />
          </button>
          <button
            type="button"
            onClick={() => scrollRail(380)}
            className="absolute right-0 top-1/2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition hover:bg-gray-50 md:flex"
            aria-label="Cuộn phải"
          >
            <ChevronRight className="size-5 text-gray-700" />
          </button>

          {loading ? (
            <p className="px-2 py-4 text-sm text-gray-500">Đang tải sản phẩm bán chạy...</p>
          ) : error ? (
            <p className="px-2 py-4 text-sm text-red-600">{error}</p>
          ) : !rows.length ? (
            <p className="px-2 py-4 text-sm text-gray-500">Chưa có dữ liệu bán chạy.</p>
          ) : (
            <div
              ref={railRef}
              className="flex items-stretch gap-3 overflow-x-auto scroll-smooth pb-1 pt-1 [scrollbar-width:thin] md:px-10"
            >
              {rows.map((entry) => {
                const p = entry.product
                return (
                  <div
                    key={p.id}
                    className="flex min-h-0 w-[178px] shrink-0 flex-col self-stretch sm:w-[200px]"
                  >
                    <div className="flex min-h-0 flex-1 flex-col">
                      <ProductCard
                        productId={p.id}
                        name={p.name}
                        originalPrice={p.originalPrice}
                        salePrice={p.salePrice}
                        soldCount={entry.soldQuantity}
                        discountTag={p.discountTag}
                        image={p.image}
                        isAvailable={p.isAvailable}
                        variants={p.variants}
                        priceFrom={Boolean(p.variants?.length > 1)}
                        variant="shelf"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
