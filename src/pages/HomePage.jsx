import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import { Header } from '../components/Header'
import { Hero } from '../components/Hero'
import { BrandScroller } from '../components/BrandScroller'
import { ProductSection } from '../components/ProductSection'
import { CatalogFeatureSection } from '../components/CatalogFeatureSection'
import { FilterPanelSidebar, FilterPanelContent } from '../components/FilterPanel'
import { PRICE_SLIDER_MAX, createDefaultFilterState } from '../data/filterOptions'
import { SiteFooter } from '../components/SiteFooter'
import { BestSellingShelf } from '../components/BestSellingShelf'
import { filterCatalog } from '../utils/catalogFilters'
import { useShopCatalog } from '../hooks/useShopCatalog'
import { normalizeSearch } from '../utils/string'

const BRAND_SECTION_LABEL = {
  vespa: 'VESPA',
  honda: 'HONDA',
  yamaha: 'YAMAHA',
  piaggio: 'PIAGGIO',
}

const BRAND_ORDER = ['vespa', 'honda', 'yamaha', 'piaggio']

export function HomePage() {
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [adv, setAdv] = useState(() => createDefaultFilterState())
  const [priceDraft, setPriceDraft] = useState(() => ({
    priceMin: 0,
    priceMax: PRICE_SLIDER_MAX,
  }))
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const { products, loading: catalogLoading, error: catalogError, absoluteMaxPrice } =
    useShopCatalog({
      priceMin: adv.priceMin,
      priceMax: adv.priceMax,
    })
  const prevAbsoluteMaxRef = useRef(PRICE_SLIDER_MAX)

  const headerBrand = adv.brands.length === 1 ? adv.brands[0] : 'all'
  const isSingleBrandView = adv.brands.length === 1
  const categoryQuery = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return String(params.get('category') || '').trim()
  }, [location.search])

  useEffect(() => {
    setAdv((prev) => {
      const prevAbsoluteMax = prevAbsoluteMaxRef.current
      const nextPriceMax =
        prev.priceMax === prevAbsoluteMax
          ? absoluteMaxPrice
          : prev.priceMax != null && prev.priceMax > absoluteMaxPrice
            ? absoluteMaxPrice
            : prev.priceMax

      if (nextPriceMax === prev.priceMax) return prev
      return { ...prev, priceMax: nextPriceMax }
    })
    setPriceDraft((prev) => {
      const nextPriceMax =
        prev.priceMax == null || prev.priceMax > absoluteMaxPrice
          ? absoluteMaxPrice
          : prev.priceMax
      if (nextPriceMax === prev.priceMax) return prev
      return { ...prev, priceMax: nextPriceMax }
    })
    prevAbsoluteMaxRef.current = absoluteMaxPrice
  }, [absoluteMaxPrice])

  const setHeaderBrand = useCallback((id) => {
    setAdv((a) => ({
      ...a,
      brands: id === 'all' ? [] : [id],
    }))
  }, [])

  const filtered = useMemo(() => {
    const byFilters = filterCatalog(products, { ...adv, search: searchQuery })
    if (!categoryQuery) return byFilters
    const normalizedCategory = normalizeSearch(categoryQuery)
    return byFilters.filter((p) =>
      normalizeSearch(p.categoryName || '').includes(normalizedCategory),
    )
  }, [products, adv, searchQuery, categoryQuery])

  const brandMatches = (p, b) =>
    (p.brand || '').toLowerCase() === (b || '').toLowerCase()

  const sections = useMemo(() => {
    if (adv.brands.length === 1) {
      const key = adv.brands[0]
      const label = BRAND_SECTION_LABEL[key] ?? key.toUpperCase()
      return [{ key, label, items: filtered }]
    }
    const main = BRAND_ORDER.map((b) => ({
      key: b,
      label: BRAND_SECTION_LABEL[b],
      items: filtered.filter((p) => brandMatches(p, b)),
    }))
    const otherItems = filtered.filter(
      (p) => !BRAND_ORDER.some((b) => brandMatches(p, b)),
    )
    const out = main.filter((s) => s.items.length > 0)
    if (otherItems.length > 0) {
      out.push({ key: 'other', label: 'Hãng khác', items: otherItems })
    }
    return out
  }, [filtered, adv.brands])

  const replacementProducts = useMemo(
    () => filtered.filter((p) => p.homeFeature === 'replacement').slice(0, 8),
    [filtered],
  )

  const tireProducts = useMemo(
    () => filtered.filter((p) => p.homeFeature === 'tires').slice(0, 8),
    [filtered],
  )

  const resetAdv = useCallback(() => {
    const next = createDefaultFilterState(absoluteMaxPrice)
    setAdv(next)
    setPriceDraft({ priceMin: next.priceMin, priceMax: next.priceMax })
  }, [absoluteMaxPrice])

  const applyPriceFilter = useCallback(() => {
    setAdv((prev) => ({
      ...prev,
      priceMin: priceDraft.priceMin,
      priceMax: priceDraft.priceMax,
    }))
  }, [priceDraft])

  const handleViewMoreBrand = useCallback((brandKey) => {
    const next = { ...createDefaultFilterState(absoluteMaxPrice), brands: [brandKey] }
    setAdv(next)
    setPriceDraft({ priceMin: next.priceMin, priceMax: next.priceMax })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [absoluteMaxPrice])

  const handleViewMoreSection = useCallback(
    (sectionKey) => {
      if (sectionKey === 'other') {
        const next = createDefaultFilterState(absoluteMaxPrice)
        setAdv(next)
        setPriceDraft({ priceMin: next.priceMin, priceMax: next.priceMax })
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      handleViewMoreBrand(sectionKey)
    },
    [absoluteMaxPrice, handleViewMoreBrand],
  )

  const applyReplacementFilter = useCallback(() => {
    const next = {
      ...createDefaultFilterState(absoluteMaxPrice),
      parts: ['shock', 'lighting', 'engine'],
    }
    setAdv(next)
    setPriceDraft({ priceMin: next.priceMin, priceMax: next.priceMax })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [absoluteMaxPrice])

  const applyTiresFilter = useCallback(() => {
    const next = {
      ...createDefaultFilterState(absoluteMaxPrice),
      parts: ['tires_wheels'],
    }
    setAdv(next)
    setPriceDraft({ priceMin: next.priceMin, priceMax: next.priceMax })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [absoluteMaxPrice])

  useEffect(() => {
    if (!searchQuery.trim()) return
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [searchQuery])

  return (
    <div className="min-h-svh bg-page font-sans text-ink">
      <Header
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        brandFilter={headerBrand}
        onBrandFilterChange={setHeaderBrand}
      />

      <Hero />

      {catalogError ? (
        <div className="mx-auto w-full max-w-[1600px] px-4 pt-3 xl:px-10">
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-900">
            {catalogError}{' '}
            <span className="font-normal text-red-800">
              (API: <code className="rounded bg-red-100 px-1">/api/products</code>)
            </span>
          </p>
        </div>
      ) : null}

      {catalogLoading ? (
        <div className="mx-auto w-full max-w-[1600px] px-4 py-8 text-center text-sm text-gray-500 xl:px-10">
          Đang tải danh mục sản phẩm...
        </div>
      ) : null}

      {!catalogLoading ? (
        <>
          <div className="mx-auto w-full max-w-[1600px] space-y-4 px-4 py-5 xl:px-10">
            <BrandScroller />

            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="w-full rounded-lg border-2 border-brand bg-white py-3 text-sm font-extrabold uppercase text-brand xl:hidden"
            >
              Mở bộ lọc nâng cao
            </button>
          </div>

          <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-6 px-4 pb-12 xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-8 xl:px-10">
            <div className="hidden xl:block">
              <div className="sticky top-28">
                <FilterPanelSidebar
                  filters={adv}
                  priceDraft={priceDraft}
                  absoluteMaxPrice={absoluteMaxPrice}
                  onChange={setAdv}
                  onPriceChange={(priceMin, priceMax) => setPriceDraft({ priceMin, priceMax })}
                  onApplyPrice={applyPriceFilter}
                  onReset={resetAdv}
                />
              </div>
            </div>

            <div className="min-w-0">
              {sections.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center">
                  <p className="text-lg font-semibold text-gray-600">
                    Không có sản phẩm phù hợp bộ lọc.
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Thử nới khoảng giá hoặc bỏ bớt tiêu chí.
                  </p>
                  <button
                    type="button"
                    onClick={resetAdv}
                    className="mt-4 text-sm font-bold text-brand underline"
                  >
                    Xóa tất cả bộ lọc
                  </button>
                </div>
              ) : (
                sections.map((s) => (
                  <ProductSection
                    key={s.key}
                    brandDisplayName={s.label}
                    products={s.items}
                    onViewMore={() => handleViewMoreSection(s.key)}
                    showViewMore={adv.brands.length !== 1}
                  />
                ))
              )}

              {!isSingleBrandView ? (
                <div className="mt-6">
                  <CatalogFeatureSection
                    title="Phụ tùng thay thế"
                    products={replacementProducts}
                    onViewAll={applyReplacementFilter}
                    imageAspect="square"
                  />
                  <CatalogFeatureSection
                    title="Vỏ xe máy (Lốp xe)"
                    products={tireProducts}
                    onViewAll={applyTiresFilter}
                    imageAspect="tire"
                  />
                </div>
              ) : null}

              <section
                id="tra-cuu-don"
                className="mt-8 rounded-lg border border-gray-200 bg-white px-6 py-9 text-center text-sm text-gray-600"
              >
                <p className="font-semibold text-ink">Tra cứu đơn hàng</p>
                <p className="mt-1">
                  Xem lịch sử đơn hàng đã đặt trong tài khoản của bạn.
                </p>
                <Link
                  to="/profile"
                  className="mt-4 inline-flex items-center rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark"
                >
                  Xem lịch sử đơn hàng
                </Link>
              </section>
            </div>
          </div>
          {mobileFilterOpen && (
            <div
              className="fixed inset-0 z-[60] flex flex-col bg-black/40 xl:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Bộ lọc"
            >
              <div className="mt-auto max-h-[88vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-base font-extrabold">Bộ lọc</span>
                  <button
                    type="button"
                    onClick={() => setMobileFilterOpen(false)}
                    className="rounded-full p-2 hover:bg-page"
                    aria-label="Đóng"
                  >
                    <X className="size-5" />
                  </button>
                </div>
                <FilterPanelContent
                  filters={adv}
                  priceDraft={priceDraft}
                  absoluteMaxPrice={absoluteMaxPrice}
                  onChange={setAdv}
                  onPriceChange={(priceMin, priceMax) => setPriceDraft({ priceMin, priceMax })}
                  onReset={() => {
                    resetAdv()
                    setMobileFilterOpen(false)
                  }}
                  onApplyPrice={() => {
                    applyPriceFilter()
                    setMobileFilterOpen(false)
                  }}
                />
              </div>
            </div>
          )}
        </>
      ) : null}

      <BestSellingShelf products={products} />

      <SiteFooter />
    </div>
  )
}
