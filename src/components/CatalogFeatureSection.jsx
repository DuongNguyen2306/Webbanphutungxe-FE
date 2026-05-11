import { ProductCard } from './ProductCard'
import { listPrice } from '../utils/catalogFilters'

export function CatalogFeatureSection({
  title,
  products,
  imageAspect = 'square',
  gridClassName = 'grid min-h-0 grid-cols-2 items-stretch gap-2 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 2xl:gap-6',
  compactCardsOnMobile = true,
  bestSellerIds = null,
}) {
  if (!products.length) return null

  const bs =
    bestSellerIds instanceof Set ? bestSellerIds : bestSellerIds ? new Set(bestSellerIds) : null

  return (
    <section className="mb-10">
      <div className="border-b border-gray-200 bg-white px-3 pb-4 pt-4 sm:px-4">
        <h2 className="text-lg font-extrabold uppercase tracking-tight text-ink sm:text-xl">
          {title}
        </h2>
        <div className="mt-2 h-1 w-20 rounded-full bg-brand" />
      </div>

      <div className={`bg-page py-4 sm:px-0 ${gridClassName}`}>
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
            imageAspect={imageAspect}
            compactOnMobile={compactCardsOnMobile}
            bestseller={bs ? bs.has(String(p.id)) || bs.has(p.id) : false}
          />
        ))}
      </div>
    </section>
  )
}
