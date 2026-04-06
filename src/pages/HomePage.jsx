import { useCallback, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { Header } from '../components/Header'
import { Hero } from '../components/Hero'
import { BrandScroller } from '../components/BrandScroller'
import { ProductSection } from '../components/ProductSection'
import { CatalogFeatureSection } from '../components/CatalogFeatureSection'
import { FilterPanelSidebar, FilterPanelContent } from '../components/FilterPanel'
import { createDefaultFilterState } from '../data/filterOptions'
import { SiteFooter } from '../components/SiteFooter'
import { filterCatalog } from '../utils/catalogFilters'
import { useShopCatalog } from '../hooks/useShopCatalog'

const BRAND_SECTION_LABEL = {
  vespa: 'VESPA',
  honda: 'HONDA',
  yamaha: 'YAMAHA',
  piaggio: 'PIAGGIO',
}

const BRAND_ORDER = ['vespa', 'honda', 'yamaha', 'piaggio']

export function HomePage() {
  const { products, loading: catalogLoading, error: catalogError } =
    useShopCatalog()
  const [searchQuery, setSearchQuery] = useState('')
  const [adv, setAdv] = useState(() => createDefaultFilterState())
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  const headerBrand = adv.brands.length === 1 ? adv.brands[0] : 'all'

  const setHeaderBrand = useCallback((id) => {
    setAdv((a) => ({
      ...a,
      brands: id === 'all' ? [] : [id],
    }))
  }, [])

  const filtered = useMemo(
    () => filterCatalog(products, { ...adv, search: searchQuery }),
    [products, adv, searchQuery],
  )

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
    setAdv(createDefaultFilterState())
  }, [])

  const handleViewMoreBrand = useCallback((brandKey) => {
    setAdv({ ...createDefaultFilterState(), brands: [brandKey] })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleViewMoreSection = useCallback(
    (sectionKey) => {
      if (sectionKey === 'other') {
        setAdv(createDefaultFilterState())
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      handleViewMoreBrand(sectionKey)
    },
    [handleViewMoreBrand],
  )

  const applyReplacementFilter = useCallback(() => {
    setAdv({
      ...createDefaultFilterState(),
      parts: ['shock', 'lighting', 'engine'],
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const applyTiresFilter = useCallback(() => {
    setAdv({
      ...createDefaultFilterState(),
      parts: ['tires_wheels'],
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

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
        <div className="mx-auto max-w-[1400px] px-3 pt-2 sm:px-4 lg:px-6">
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-900">
            {catalogError}{' '}
            <span className="font-normal text-red-800">
              (API: <code className="rounded bg-red-100 px-1">/api/products</code> qua
              proxy → <code className="rounded bg-red-100 px-1">localhost:5000</code>)
            </span>
          </p>
        </div>
      ) : null}

      {catalogLoading ? (
        <div className="mx-auto max-w-[1400px] px-3 py-8 text-center text-sm text-gray-500 sm:px-4 lg:px-6">
          Đang tải danh mục sản phẩm...
        </div>
      ) : null}

      {!catalogLoading ? (
        <>
      <div className="mx-auto max-w-[1400px] space-y-4 px-3 py-4 sm:px-4 lg:px-6">
        <BrandScroller />

        <button
          type="button"
          onClick={() => setMobileFilterOpen(true)}
          className="w-full rounded-lg border-2 border-brand bg-white py-3 text-sm font-extrabold uppercase text-brand lg:hidden"
        >
          Mở bộ lọc nâng cao
        </button>
      </div>

      <div className="mx-auto flex max-w-[1400px] gap-6 px-3 pb-12 sm:px-4 lg:px-6">
        <div className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-28">
            <FilterPanelSidebar
              filters={adv}
              onChange={setAdv}
              onReset={resetAdv}
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
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

          <div className="mx-auto mt-6 max-w-[1400px]">
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

          <section
            id="tra-cuu-don"
            className="mx-auto mt-8 max-w-[1400px] rounded-lg border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-600"
          >
            <p className="font-semibold text-ink">Tra cứu đơn hàng</p>
            <p className="mt-1">
              Nhập mã đơn / SĐT đặt hàng — kết nối API backend khi sẵn sàng.
            </p>
          </section>
        </div>
      </div>

      {mobileFilterOpen && (
        <div
          className="fixed inset-0 z-[60] flex flex-col bg-black/40 lg:hidden"
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
              onChange={setAdv}
              onReset={() => {
                resetAdv()
                setMobileFilterOpen(false)
              }}
            />
            <button
              type="button"
              onClick={() => setMobileFilterOpen(false)}
              className="mt-6 w-full rounded-lg bg-brand py-3 text-sm font-extrabold uppercase text-white"
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}
        </>
      ) : null}

      <SiteFooter />
    </div>
  )
}
