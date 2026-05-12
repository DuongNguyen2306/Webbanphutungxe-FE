import { useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from './ProductCard'
import { showUiToast } from '../utils/uiToast'

function RelatedRail({ items, railRef, onScrollLeft, onScrollRight }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onScrollLeft}
        className="absolute left-0 top-1/2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition hover:bg-gray-50 md:flex"
        aria-label="Cuộn trái"
      >
        <ChevronLeft className="size-5 text-gray-700" />
      </button>
      <button
        type="button"
        onClick={onScrollRight}
        className="absolute right-0 top-1/2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition hover:bg-gray-50 md:flex"
        aria-label="Cuộn phải"
      >
        <ChevronRight className="size-5 text-gray-700" />
      </button>

      <div
        ref={railRef}
        className="flex items-stretch gap-2 overflow-x-auto scroll-smooth pb-1 pt-1 [scrollbar-width:thin] sm:gap-3 md:px-10"
      >
        {items.map((p) => (
          <div
            key={p.id}
            className="flex min-h-0 w-[46%] min-w-[46%] shrink-0 flex-col self-stretch sm:w-[178px] sm:min-w-[178px] md:w-[200px] md:min-w-[200px]"
          >
            <div className="flex min-h-0 flex-1 flex-col">
              <ProductCard
                productId={p.id}
                name={p.name}
                originalPrice={p.originalPrice}
                salePrice={p.salePrice}
                soldCount={p.soldCount}
                discountTag={p.discountTag}
                image={p.image}
                isAvailable={p.isAvailable}
                variants={p.variants}
                priceFrom={Boolean(p.variants?.length > 1)}
                variant="shelf"
                bestseller={Boolean(p.bestSellerEnabled)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Skeleton trung tính (không có tiêu đề "Sản phẩm cùng loại") — để khi BE trả
 * relatedByCategory=[], FE không bị "nháy" tiêu đề section rồi biến mất.
 */
function NeutralRailSkeleton() {
  return (
    <section aria-hidden>
      <div className="mb-3 h-5 w-44 animate-pulse rounded-md bg-gray-200" />
      <div className="flex gap-2 overflow-hidden sm:gap-3 md:px-10">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="h-56 w-[46%] min-w-[46%] shrink-0 animate-pulse rounded-lg bg-gray-200 sm:h-60 sm:w-[178px] sm:min-w-[178px] md:w-[200px] md:min-w-[200px]"
          />
        ))}
      </div>
    </section>
  )
}

/**
 * Hai block từ GET /api/products/:id/related — dữ liệu do parent truyền (fetch song song useProductDetail).
 */
export function ProductDetailRelatedSections({
  excludeProductId,
  relatedByCategory = [],
  relatedByBrand = [],
  loading = false,
  errorKind = null,
}) {
  const railCat = useRef(null)
  const railBrand = useRef(null)
  const serverToastRef = useRef(false)

  const ex = String(excludeProductId || '').trim()

  const byCategory = useMemo(
    () => relatedByCategory.filter((p) => !ex || String(p.id) !== ex),
    [relatedByCategory, ex],
  )
  const byBrand = useMemo(
    () => relatedByBrand.filter((p) => !ex || String(p.id) !== ex),
    [relatedByBrand, ex],
  )

  useEffect(() => {
    if (errorKind === 'server_error' && !serverToastRef.current) {
      serverToastRef.current = true
      showUiToast('Không tải được gợi ý sản phẩm.', 'error')
    }
    if (!errorKind) serverToastRef.current = false
  }, [errorKind])

  function scrollRail(ref, delta) {
    const el = ref?.current
    if (el) el.scrollBy({ left: delta, behavior: 'smooth' })
  }

  if (!loading && !byCategory.length && !byBrand.length) return null

  return (
    <div className="border-t border-gray-200 bg-page/40 py-8">
      <div className="mx-auto max-w-[1200px] space-y-10 px-4">
        {loading ? (
          <NeutralRailSkeleton />
        ) : (
          <>
            {byCategory.length > 0 ? (
              <section aria-labelledby="pdp-related-cat">
                <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2
                      id="pdp-related-cat"
                      className="text-base font-extrabold uppercase tracking-wide text-ink sm:text-lg"
                    >
                      Sản phẩm cùng loại
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500">Cùng loại phụ tùng</p>
                  </div>
                  <Link
                    to="/"
                    className="inline-flex items-center text-sm font-bold text-brand hover:underline"
                  >
                    Xem thêm
                    <ChevronRight className="size-4" strokeWidth={2.8} />
                  </Link>
                </div>
                <RelatedRail
                  items={byCategory}
                  railRef={railCat}
                  onScrollLeft={() => scrollRail(railCat, -320)}
                  onScrollRight={() => scrollRail(railCat, 320)}
                />
              </section>
            ) : byBrand.length > 0 ? (
              <section
                aria-labelledby="pdp-related-cat-empty"
                className="rounded-lg border border-dashed border-gray-200 bg-white/80 px-3 py-3"
              >
                <h2
                  id="pdp-related-cat-empty"
                  className="text-sm font-extrabold uppercase tracking-wide text-ink"
                >
                  Sản phẩm cùng loại
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Chưa có sản phẩm khác cùng loại phụ tùng để gợi ý — hệ thống chỉ hiển thị khi có ít nhất
                  một sản phẩm khác trùng loại (ví dụ cùng «bạt phủ», «gương»…) với sản phẩm này.
                </p>
              </section>
            ) : null}

            {byBrand.length > 0 ? (
              <section aria-labelledby="pdp-related-brand">
                <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                  <h2
                    id="pdp-related-brand"
                    className="text-base font-extrabold uppercase tracking-wide text-ink sm:text-lg"
                  >
                    Cùng hãng xe
                  </h2>
                  <Link
                    to="/"
                    className="inline-flex items-center text-sm font-bold text-brand hover:underline"
                  >
                    Xem thêm
                    <ChevronRight className="size-4" strokeWidth={2.8} />
                  </Link>
                </div>
                <RelatedRail
                  items={byBrand}
                  railRef={railBrand}
                  onScrollLeft={() => scrollRail(railBrand, -320)}
                  onScrollRight={() => scrollRail(railBrand, 320)}
                />
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
