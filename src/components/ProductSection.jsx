import { SectionDivider } from './SectionDivider'
import { ProductCard } from './ProductCard'
import { CatalogPagination } from './catalog/CatalogPagination'
import { CatalogSectionViewMore } from './catalog/CatalogSectionViewMore'
import { listPrice } from '../utils/catalogFilters'

export function ProductSection({
  brandDisplayName,
  products,
  onViewMore,
  showViewMore = true,
  gridClassName = 'grid min-h-0 grid-cols-2 items-stretch gap-1.5 px-0.5 sm:gap-2 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 2xl:gap-6',
  compactCardsOnMobile = true,
  denseMobileCards = true,
  bestSellerIds = null,
  pagination = null,
  /** 'brand' = tiêu đề kiểu «Phụ kiện dành cho xe …»; 'plain' = chỉ hiện brandDisplayName */
  sectionDividerVariant = 'brand',
}) {
  if (!products.length) return null

  const bs =
    bestSellerIds instanceof Set ? bestSellerIds : bestSellerIds ? new Set(bestSellerIds) : null

  return (
    <section className="w-full">
      <SectionDivider brandName={brandDisplayName} variant={sectionDividerVariant} />

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
            denseMobile={denseMobileCards}
            bestseller={bs ? bs.has(String(p.id)) || bs.has(p.id) : false}
            badgeTags={p.badgeTags}
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

      {showViewMore ? <CatalogSectionViewMore onClick={onViewMore} /> : null}
    </section>
  )
}
