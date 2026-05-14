import { SectionDivider } from './SectionDivider'
import { ProductCard } from './ProductCard'
import { CatalogPagination } from './catalog/CatalogPagination'
import { listPrice } from '../utils/catalogFilters'

export function ProductSection({
  brandDisplayName,
  products,
  onViewMore,
  showViewMore = true,
  gridClassName = 'grid min-h-0 grid-cols-2 items-stretch gap-2 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 2xl:gap-6',
  compactCardsOnMobile = true,
  bestSellerIds = null,
  pagination = null,
}) {
  if (!products.length) return null

  const bs =
    bestSellerIds instanceof Set ? bestSellerIds : bestSellerIds ? new Set(bestSellerIds) : null

  return (
    <section className="w-full">
      <SectionDivider brandName={brandDisplayName} />

      <div className={gridClassName}>
        {products.map((p) => (
          <ProductCard
            key={p.id}
            productId={p.id}
            name={p.name}
            originalPrice={p.originalPrice}
            salePrice={listPrice(p)}
            soldCount={p.soldCount}
            discountTag={p.discountTag}
            image={p.image}
            isAvailable={p.isAvailable}
            variants={p.variants}
            priceFrom={p.priceFrom}
            compactOnMobile={compactCardsOnMobile}
            bestseller={bs ? bs.has(String(p.id)) || bs.has(p.id) : false}
          />
        ))}
      </div>

      {pagination ? (
        <CatalogPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          onPageChange={pagination.onPageChange}
        />
      ) : null}

      {showViewMore && (
        <div className="pt-6">
          <button
            type="button"
            onClick={onViewMore}
            className="rounded-lg border-2 border-brand bg-transparent px-5 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand transition hover:bg-brand hover:text-white"
          >
            Xem thêm... &gt;
          </button>
        </div>
      )}
    </section>
  )
}
