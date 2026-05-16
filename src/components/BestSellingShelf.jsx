import { useMemo, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { SectionDivider } from './SectionDivider'
import { CatalogSectionViewMore } from './catalog/CatalogSectionViewMore'
import { ProductShelfCard } from './catalog/ProductShelfCard'
import {
  PRODUCT_SHELF_ITEM_CLASS,
  PRODUCT_SHELF_RAIL_CLASS,
} from './catalog/productShelfLayout'

export function BestSellingShelf({
  items = [],
  loading = false,
  error = null,
  embedded = false,
  onViewMore,
  showViewMore = true,
}) {
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

  const innerClass = embedded ? 'w-full' : 'mx-auto max-w-[1600px] px-4 xl:px-10'

  if (!loading && !error && !rows.length) return null

  return (
    <section className={embedded ? 'w-full' : 'border-t border-gray-200 bg-white py-6'}>
      <div className={innerClass}>
        <SectionDivider title="Sản phẩm bán chạy" variant="plain" />

        <div className="relative">
          <button
            type="button"
            onClick={() => scrollRail(-380)}
            className="absolute -left-1 top-1/2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition hover:bg-gray-50 md:flex"
            aria-label="Cuộn trái"
          >
            <ChevronLeft className="size-5 text-gray-700" />
          </button>
          <button
            type="button"
            onClick={() => scrollRail(380)}
            className="absolute -right-1 top-1/2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition hover:bg-gray-50 md:flex"
            aria-label="Cuộn phải"
          >
            <ChevronRight className="size-5 text-gray-700" />
          </button>

          {loading ? (
            <p className="py-4 text-center text-sm text-gray-500">Đang tải sản phẩm bán chạy...</p>
          ) : error ? (
            <p className="py-4 text-center text-sm text-red-600">{error}</p>
          ) : (
            <div ref={railRef} className={PRODUCT_SHELF_RAIL_CLASS}>
              {rows.map((entry) => {
                const p = entry.product
                return (
                  <div key={p.id} className={PRODUCT_SHELF_ITEM_CLASS}>
                    <ProductShelfCard
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
                      badgeTags={p.badgeTags}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
        {showViewMore && rows.length > 0 && !loading ? (
          <CatalogSectionViewMore onClick={onViewMore} />
        ) : null}
      </div>
    </section>
  )
}
