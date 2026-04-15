import { ChevronRight } from 'lucide-react'
import { ProductCard } from './ProductCard'
import { listPrice } from '../utils/catalogFilters'

export function CatalogFeatureSection({
  title,
  products,
  onViewAll,
  imageAspect = 'square',
  gridClassName = 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-5 xl:grid-cols-4 2xl:grid-cols-6 2xl:gap-6',
}) {
  if (!products.length) return null

  return (
    <section className="mb-10">
      <div className="flex items-center justify-end bg-gray-100 px-3 py-2 sm:px-4">
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex items-center gap-1 rounded-md border-2 border-brand bg-transparent px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-brand transition hover:bg-brand hover:text-white"
        >
          Xem tất cả
          <ChevronRight className="size-4" strokeWidth={2.5} />
        </button>
      </div>

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
