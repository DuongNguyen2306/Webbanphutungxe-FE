import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Header } from '../components/Header'
import { Hero } from '../components/Hero'
import { ProductSection } from '../components/ProductSection'
import { FilterPanelContent } from '../components/FilterPanel'
import { FilterPanelAccordionSidebar } from '../components/FilterPanelAccordion'
import { CatalogMobileCategoryRail } from '../components/catalog/CatalogMobileCategoryRail'
import { CatalogFilterBottomSheet } from '../components/catalog/CatalogFilterBottomSheet'
import { DesktopCategoryNav } from '../components/catalog/DesktopCategoryNav'
import {
  PRICE_SLIDER_MAX,
  PRICE_SLIDER_MIN,
  createDefaultFilterState,
} from '../data/filterOptions'
import { SiteFooter } from '../components/SiteFooter'
import { BestSellingShelf } from '../components/BestSellingShelf'
import { NewArrivalsShelf } from '../components/NewArrivalsShelf'
import { filterCatalog } from '../utils/catalogFilters'
import { useShopCatalog } from '../hooks/useShopCatalog'
import { useBestSellers } from '../hooks/useBestSellers'
import { useNewArrivals } from '../hooks/useNewArrivals'
import { useShopCategories } from '../hooks/useShopCategories'
import { findCategoryByQuery } from '../utils/normalizeApiCategories'
import { isExcludedStorefrontCategoryName } from '../utils/categorySlug'
import { normalizeSearch } from '../utils/string'
import { sortCatalogProducts, applyStorefrontDefaultOrdering } from '../utils/sortCatalogProducts'

const BRAND_SECTION_LABEL = {
  vespa: 'VESPA',
  honda: 'HONDA',
  yamaha: 'YAMAHA',
  piaggio: 'PIAGGIO',
}

const BRAND_ORDER = ['vespa', 'honda', 'yamaha', 'piaggio']
const NEW_ARRIVALS_SECTION = 'new-arrivals'
const BEST_SELLERS_SECTION = 'best-sellers'
const HANG_MOI_VE_TITLE = 'Hàng mới về'
const BAN_CHAY_TITLE = 'Sản phẩm bán chạy'

/** Số sản phẩm mỗi trang trong từng khối (VESPA, Hãng khác, …). */
const CATALOG_PAGE_SIZE = 12

/** Giữ đúng lưới sản phẩm khi API chưa trả về — tránh khoảng trắng / nhảy layout khi bỏ chữ “Đang tải…”. */
function HomeCatalogSkeleton() {
  return (
    <div className="space-y-10" aria-busy="true" aria-label="Đang tải danh mục sản phẩm">
      {[0, 1].map((block) => (
        <div key={block} className="w-full">
          <div className="mb-4 h-8 max-w-[220px] animate-pulse rounded-md bg-gray-200" />
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 2xl:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm"
              >
                <div className="aspect-[5/6] animate-pulse bg-gray-200" />
                <div className="space-y-2 p-3">
                  <div className="h-3 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function HomePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [, setSearchParams] = useSearchParams()
  const { categories, loading: categoriesLoading } = useShopCategories()
  const [searchQuery, setSearchQuery] = useState('')
  const [adv, setAdv] = useState(() => createDefaultFilterState())
  const [priceDraft, setPriceDraft] = useState(() => ({
    priceMin: 0,
    priceMax: PRICE_SLIDER_MAX,
  }))
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [sortBy, setSortBy] = useState('default')
  /** Trang phân trang theo từng khối hãng (key = section key). */
  const [pagesBySection, setPagesBySection] = useState({})

  const sectionQuery = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return String(params.get('section') || '').trim().toLowerCase()
  }, [location.search])

  const isNewArrivalsView = sectionQuery === NEW_ARRIVALS_SECTION
  const isBestSellersView = sectionQuery === BEST_SELLERS_SECTION
  const isFeaturedSectionView = isNewArrivalsView || isBestSellersView

  const categoryQuery = useMemo(() => {
    if (isFeaturedSectionView) return ''
    const params = new URLSearchParams(location.search)
    return String(params.get('category') || '').trim()
  }, [location.search, isFeaturedSectionView])

  const categoryIdQuery = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return String(params.get('categoryId') || '').trim()
  }, [location.search])

  const selectedCategory = useMemo(() => {
    if (categoryIdQuery && categories.length) {
      return categories.find((c) => c.id === categoryIdQuery) ?? null
    }
    if (categoryQuery && categories.length) {
      return findCategoryByQuery(categories, categoryQuery)
    }
    return null
  }, [categories, categoryIdQuery, categoryQuery])

  const catalogCategoryParam = useMemo(() => {
    if (isFeaturedSectionView) return null
    if (selectedCategory) return selectedCategory.slug || selectedCategory.name
    if (categoryQuery) return categoryQuery
    if (categoryIdQuery) return categoryIdQuery
    return null
  }, [isFeaturedSectionView, selectedCategory, categoryQuery, categoryIdQuery])

  const selectedCategoryId = selectedCategory?.id ?? (categoryIdQuery || '')
  const catalogListTitle = useMemo(() => {
    if (isNewArrivalsView) return HANG_MOI_VE_TITLE
    if (isBestSellersView) return BAN_CHAY_TITLE
    if (selectedCategory?.name?.trim()) return selectedCategory.name.trim()
    if (adv.brands.length === 1) {
      const key = adv.brands[0]
      if (key === '' || key == null) return 'Hãng khác'
      return BRAND_SECTION_LABEL[key] ?? String(key).toUpperCase()
    }
    if (
      adv.brands.length > 1 &&
      adv.brands.every(
        (b) => !BRAND_ORDER.some((main) => main === String(b || '').toLowerCase()),
      )
    ) {
      return 'Hãng khác'
    }
    return 'Danh sách sản phẩm'
  }, [isNewArrivalsView, isBestSellersView, selectedCategory, adv.brands])

  const menuCategories = useMemo(
    () => categories.filter((c) => !isExcludedStorefrontCategoryName(c.name)),
    [categories],
  )

  const { products: catalogProducts, loading: catalogLoading, error: catalogError, absoluteMaxPrice } =
    useShopCatalog({
      priceMin: adv.priceMin,
      priceMax: adv.priceMax,
      category: isFeaturedSectionView ? null : catalogCategoryParam,
    })

  /** Chỉ hiện shelf Hàng mới về / Bán chạy trên trang chủ «Tất cả» chưa lọc. */
  const hasActiveCatalogNarrowing = useMemo(() => {
    if (isFeaturedSectionView) return true
    if (categoryIdQuery || categoryQuery) return true
    if (adv.brands.length > 0) return true
    if (adv.parts.length > 0 || adv.vehicles.length > 0) return true
    if (adv.inStockOnly) return true
    if (String(searchQuery || '').trim()) return true
    if (sortBy !== 'default') return true
    if (adv.priceMin > PRICE_SLIDER_MIN) return true
    if (
      absoluteMaxPrice > 0 &&
      adv.priceMax != null &&
      adv.priceMax < absoluteMaxPrice
    ) {
      return true
    }
    return false
  }, [
    isFeaturedSectionView,
    categoryIdQuery,
    categoryQuery,
    adv.brands.length,
    adv.parts.length,
    adv.vehicles.length,
    adv.inStockOnly,
    adv.priceMin,
    adv.priceMax,
    searchQuery,
    sortBy,
    absoluteMaxPrice,
  ])

  const showHomeBlocks = !hasActiveCatalogNarrowing
  const {
    items: newArrivalShelfItems,
    loading: newArrivalShelfLoading,
    error: newArrivalShelfError,
    total: newArrivalShelfTotal,
  } = useNewArrivals({ page: 1, limit: 10, enabled: showHomeBlocks })
  const {
    items: newArrivalListItems,
    loading: newArrivalListLoading,
    error: newArrivalListError,
  } = useNewArrivals({ page: 1, limit: 100, enabled: isNewArrivalsView })
  const {
    items: bestSellerItems,
    loading: bestSellerLoading,
    error: bestSellerError,
  } = useBestSellers({ page: 1, limit: 10, enabled: showHomeBlocks })
  const {
    items: bestSellerListItems,
    loading: bestSellerListLoading,
    error: bestSellerListError,
  } = useBestSellers({ page: 1, limit: 100, enabled: isBestSellersView })
  const bestSellerListProducts = useMemo(
    () =>
      bestSellerListItems
        .map((row) => row?.product)
        .filter((p) => p?.id),
    [bestSellerListItems],
  )
  const products = isNewArrivalsView
    ? newArrivalListItems
    : isBestSellersView
      ? bestSellerListProducts
      : catalogProducts
  const listLoading = isNewArrivalsView
    ? newArrivalListLoading
    : isBestSellersView
      ? bestSellerListLoading
      : catalogLoading
  const listError = isNewArrivalsView
    ? newArrivalListError
    : isBestSellersView
      ? bestSellerListError
      : catalogError
  const prevAbsoluteMaxRef = useRef(PRICE_SLIDER_MAX)

  const bestSellerIdSet = useMemo(() => {
    const ids = new Set()
    for (const row of bestSellerItems) {
      const id = row?.product?.id
      if (id != null && id !== '') ids.add(String(id))
    }
    return ids
  }, [bestSellerItems])

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

  useEffect(() => {
    setPagesBySection({})
  }, [
    categoryIdQuery,
    categoryQuery,
    searchQuery,
    sortBy,
    adv.brands.join(','),
    adv.parts.join(','),
    adv.vehicles.join(','),
    adv.priceMin,
    adv.priceMax,
    adv.inStockOnly,
  ])

  const filtered = useMemo(() => {
    return filterCatalog(products, { ...adv, search: searchQuery })
  }, [products, adv, searchQuery])

  const brandMatches = (p, b) =>
    (p.brand || '').toLowerCase() === (b || '').toLowerCase()

  const sections = useMemo(() => {
    const sortItems = (items) => {
      const base = sortCatalogProducts(items, sortBy)
      if (sortBy !== 'default') return base
      return applyStorefrontDefaultOrdering(base)
    }
    if (catalogCategoryParam || isFeaturedSectionView || adv.brands.length > 0) {
      const items = sortItems(filtered)
      if (!items.length) return []
      const sectionKey = isNewArrivalsView
        ? 'new-arrivals'
        : isBestSellersView
          ? 'best-sellers'
          : adv.brands.length > 0
            ? adv.brands.length === 1
              ? adv.brands[0] || 'other'
              : 'other'
            : 'category'
      return [{ key: sectionKey, label: catalogListTitle, items }]
    }
    const main = BRAND_ORDER.map((b) => ({
      key: b,
      label: BRAND_SECTION_LABEL[b],
      items: sortItems(filtered.filter((p) => brandMatches(p, b))),
    }))
    const otherItems = sortItems(
      filtered.filter((p) => !BRAND_ORDER.some((b) => brandMatches(p, b))),
    )
    const out = main.filter((s) => s.items.length > 0)
    if (otherItems.length > 0) {
      out.push({ key: 'other', label: 'Hãng khác', items: otherItems })
    }
    return out
  }, [filtered, adv.brands, sortBy, catalogCategoryParam, isFeaturedSectionView, catalogListTitle])

  const resetAdv = useCallback(() => {
    const next = createDefaultFilterState(absoluteMaxPrice)
    setAdv(next)
    setPriceDraft({ priceMin: next.priceMin, priceMax: next.priceMax })
  }, [absoluteMaxPrice])

  /** Xóa mọi điều kiện hiển thị catalog: bộ lọc cột + danh mục URL + tìm kiếm + sắp xếp (tránh “bấm Xóa mà vẫn trống” vì còn ?categoryId=). */
  const clearAllCatalogFilters = useCallback(() => {
    resetAdv()
    setSearchQuery('')
    setSortBy('default')
    setSearchParams(
      (prev) => {
        const nextParams = new URLSearchParams(prev)
        nextParams.delete('categoryId')
        nextParams.delete('category')
        nextParams.delete('section')
        return nextParams
      },
      { replace: true },
    )
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [resetAdv, setSearchParams])

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
        /** Các hãng không thuộc nhóm Vespa/Honda/Yamaha/Piaggio — lọc đúng nhóm này (tránh “reset” trùng state nên không thấy gì đổi). */
        const seen = new Set()
        const otherBrands = []
        for (const p of filtered) {
          if (BRAND_ORDER.some((b) => brandMatches(p, b))) continue
          const raw = String(p.brand ?? '').trim()
          const dedupeKey = raw.toLowerCase() || '__empty__'
          if (seen.has(dedupeKey)) continue
          seen.add(dedupeKey)
          otherBrands.push(raw)
        }
        const next =
          otherBrands.length > 0
            ? { ...createDefaultFilterState(absoluteMaxPrice), brands: otherBrands }
            : createDefaultFilterState(absoluteMaxPrice)
        setAdv(next)
        setPriceDraft({ priceMin: next.priceMin, priceMax: next.priceMax })
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      handleViewMoreBrand(sectionKey)
    },
    [absoluteMaxPrice, handleViewMoreBrand, filtered],
  )

  /** Danh mục — GET /api/products?category= (slug hoặc tên từ menu). */
  const handleCategorySelect = useCallback(
    (categoryId) => {
      setAdv((prev) => ({ ...prev, brands: [], parts: [] }))
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete('section')
          if (categoryId == null || categoryId === '') {
            next.delete('categoryId')
            next.delete('category')
          } else {
            const cat = menuCategories.find((c) => c.id === String(categoryId))
            next.delete('categoryId')
            if (cat?.slug) next.set('category', cat.slug)
            else if (cat?.name) next.set('category', cat.name)
            else next.set('category', String(categoryId))
          }
          return next
        },
        { replace: true },
      )
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [setSearchParams, menuCategories],
  )

  /** Block hàng mới về — GET /api/products/new-arrivals (không dùng ?category=). */
  const handleNewArrivalsSelect = useCallback(() => {
    setAdv((prev) => ({ ...prev, brands: [], parts: [] }))
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('categoryId')
        next.delete('category')
        next.set('section', NEW_ARRIVALS_SECTION)
        return next
      },
      { replace: true },
    )
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [setSearchParams])

  const handleBestSellersSelect = useCallback(() => {
    setAdv((prev) => ({ ...prev, brands: [], parts: [] }))
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('categoryId')
        next.delete('category')
        next.set('section', BEST_SELLERS_SECTION)
        return next
      },
      { replace: true },
    )
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [setSearchParams])

  const anySectionPageBeyondFirst = useMemo(
    () => Object.values(pagesBySection).some((p) => (p ?? 1) > 1),
    [pagesBySection],
  )

  const showCatalogBack = anySectionPageBeyondFirst || hasActiveCatalogNarrowing

  const handleCatalogBack = useCallback(() => {
    if (anySectionPageBeyondFirst) {
      setPagesBySection({})
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (isFeaturedSectionView) {
      handleCategorySelect(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (categoryIdQuery || categoryQuery) {
      handleCategorySelect(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (adv.brands.length > 0 || adv.parts.length > 0 || adv.vehicles.length > 0 || adv.inStockOnly) {
      resetAdv()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (sortBy !== 'default') {
      setSortBy('default')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (
      adv.priceMin > PRICE_SLIDER_MIN ||
      (absoluteMaxPrice > 0 &&
        adv.priceMax != null &&
        adv.priceMax < absoluteMaxPrice)
    ) {
      resetAdv()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (String(searchQuery || '').trim()) {
      setSearchQuery('')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    navigate(-1)
  }, [
    anySectionPageBeyondFirst,
    isFeaturedSectionView,
    categoryIdQuery,
    categoryQuery,
    adv.brands.length,
    adv.parts.length,
    adv.vehicles.length,
    adv.inStockOnly,
    adv.priceMin,
    adv.priceMax,
    searchQuery,
    sortBy,
    absoluteMaxPrice,
    handleCategorySelect,
    resetAdv,
    navigate,
  ])

  useEffect(() => {
    if (!searchQuery.trim()) return
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [searchQuery])

  return (
    <div className="min-h-svh bg-page font-sans text-ink">
      <Header searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />

      <CatalogMobileCategoryRail
        categories={categories}
        loading={categoriesLoading}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={handleCategorySelect}
        onOpenFilters={() => setMobileFilterOpen(true)}
      />

      <Hero />

      {listError ? (
        <div className="mx-auto w-full max-w-[1600px] px-4 pt-3 xl:px-10">
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-900">
            {listError}
          </p>
        </div>
      ) : null}

      <>
          <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-4 px-2 pb-12 pt-2 md:grid-cols-[230px_minmax(0,1fr)] md:gap-6 md:px-5 md:pt-4 xl:px-10">
            <div className="hidden md:flex md:w-[230px] md:shrink-0 md:flex-col">
              <div className="sticky top-28 max-h-[calc(100vh-7rem)] overflow-y-auto overscroll-contain rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                <DesktopCategoryNav
                  categories={menuCategories}
                  loading={categoriesLoading}
                  selectedCategoryId={selectedCategoryId}
                  newArrivalsActive={isNewArrivalsView}
                  onCategorySelect={handleCategorySelect}
                  onNewArrivalsSelect={handleNewArrivalsSelect}
                />
                <FilterPanelAccordionSidebar
                  filters={adv}
                  priceDraft={priceDraft}
                  absoluteMaxPrice={absoluteMaxPrice}
                  onChange={setAdv}
                  onPriceChange={(priceMin, priceMax) =>
                    setPriceDraft({ priceMin, priceMax })
                  }
                  onApplyPrice={applyPriceFilter}
                  onReset={clearAllCatalogFilters}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div
                id="catalog-list-top"
                className="mb-4 flex flex-wrap items-center gap-3 md:mb-5 md:gap-4"
              >
                {showCatalogBack ? (
                  <button
                    type="button"
                    onClick={handleCatalogBack}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-ink shadow-sm transition hover:border-brand hover:text-brand"
                  >
                    <ChevronLeft className="size-4" strokeWidth={2.5} aria-hidden />
                    Quay lại
                  </button>
                ) : null}
                <h2 className="text-base font-extrabold tracking-tight text-ink md:text-xl">
                  {catalogListTitle}
                </h2>
              </div>
              {showHomeBlocks ? (
                <div className="mb-2 space-y-1">
                  {(newArrivalShelfLoading || newArrivalShelfTotal > 0) && !newArrivalShelfError ? (
                    <NewArrivalsShelf
                      embedded
                      items={newArrivalShelfItems}
                      loading={newArrivalShelfLoading}
                      error={newArrivalShelfError}
                      onViewMore={handleNewArrivalsSelect}
                    />
                  ) : null}
                  <BestSellingShelf
                    embedded
                    items={bestSellerItems}
                    loading={bestSellerLoading}
                    error={bestSellerError}
                    onViewMore={handleBestSellersSelect}
                  />
                </div>
              ) : null}
              {listLoading && products.length === 0 ? (
                <HomeCatalogSkeleton />
              ) : sections.length === 0 ? (
                !listError ? (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center">
                    <p className="text-lg font-semibold text-gray-600">
                      Không có sản phẩm phù hợp bộ lọc.
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      Thử nới khoảng giá hoặc bỏ bớt tiêu chí.
                    </p>
                    <button
                      type="button"
                      onClick={clearAllCatalogFilters}
                      className="mt-4 text-sm font-bold text-brand underline"
                    >
                      Xóa tất cả bộ lọc
                    </button>
                  </div>
                ) : null
              ) : (
                sections.map((s) => {
                  const total = s.items.length
                  const totalPages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE))
                  const rawPage = pagesBySection[s.key] ?? 1
                  const page = Math.min(Math.max(1, rawPage), totalPages)
                  const start = (page - 1) * CATALOG_PAGE_SIZE
                  const slice = s.items.slice(start, start + CATALOG_PAGE_SIZE)
                  const onPageChange = (nextPage) => {
                    const clamped = Math.min(Math.max(1, nextPage), totalPages)
                    setPagesBySection((prev) => ({ ...prev, [s.key]: clamped }))
                    document
                      .getElementById('catalog-list-top')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                  const pagination = {
                    page,
                    totalPages,
                    totalItems: total,
                    onPageChange,
                  }
                  return (
                    <ProductSection
                      key={s.key === '' ? '__empty_brand__' : s.key}
                      brandDisplayName={s.label}
                      products={slice}
                      onViewMore={() => handleViewMoreSection(s.key)}
                      showViewMore={
                        !catalogCategoryParam &&
                        !isFeaturedSectionView &&
                        adv.brands.length === 0
                      }
                      bestSellerIds={bestSellerIdSet}
                      pagination={pagination}
                      sectionDividerVariant={
                        s.key === 'category' ||
                        s.key === 'new-arrivals' ||
                        s.key === 'best-sellers'
                          ? 'plain'
                          : 'brand'
                      }
                    />
                  )
                })
              )}

            </div>
          </div>
          <CatalogFilterBottomSheet
            open={mobileFilterOpen}
            onClose={() => setMobileFilterOpen(false)}
            title="Lọc & sắp xếp"
          >
            <FilterPanelContent
              filters={adv}
              priceDraft={priceDraft}
              absoluteMaxPrice={absoluteMaxPrice}
              onChange={setAdv}
              onPriceChange={(priceMin, priceMax) =>
                setPriceDraft({ priceMin, priceMax })
              }
              sortBy={sortBy}
              onSortChange={(v) => {
                setSortBy(v)
              }}
              onReset={() => {
                clearAllCatalogFilters()
                setMobileFilterOpen(false)
              }}
              onApplyPrice={() => {
                applyPriceFilter()
                setMobileFilterOpen(false)
              }}
            />
          </CatalogFilterBottomSheet>
      </>

      <SiteFooter />
    </div>
  )
}
