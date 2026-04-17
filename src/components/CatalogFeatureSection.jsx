import { ProductCard } from './ProductCard'
import { listPrice } from '../utils/catalogFilters'

export function CatalogFeatureSection({
  title,
  products,
  imageAspect = 'square',
  gridClassName = 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-5 xl:grid-cols-4 2xl:grid-cols-6 2xl:gap-6',
}) {
  if (!products.length) return null

  return (
    <section className="mb-10">
      <div className="border-b border-gray-200 bg-white px-3 pb-4 pt-4 sm:px-4">
        <h2 className="text-lg font-extrabold uppercase tracking-tight text-ink sm:text-xl">
          {title}
        </h2>
        <div className="mt-2 h-1 w-20 rounded-full bg-brand" />
      </div>

      <div className={`bg-page px-2 py-4 sm:px-3 ${gridClassName}`}>
        {products.map((p) => (
          <ProductCard
            key={p.id}
            productId={p.id}
            name={p.name}
            originalPrice={p.originalPrice}
            salePrice={listPrice(p)}
            discountTag={p.discountTag}
            image={p.image}
            isAvailable={p.isAvailable}
            priceFrom={p.priceFrom}
            imageAspect={imageAspect}
          />
        ))}
      </div>
    </section>
  )
}
