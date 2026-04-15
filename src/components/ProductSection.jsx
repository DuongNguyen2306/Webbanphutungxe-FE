import { SectionDivider } from './SectionDivider'
import { ProductCard } from './ProductCard'
import { listPrice } from '../utils/catalogFilters'

export function ProductSection({
  brandDisplayName,
  products,
  onViewMore,
  showViewMore = true,
}) {
  if (!products.length) return null

  return (
    <section className="w-full">
      <SectionDivider brandName={brandDisplayName} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-5 xl:grid-cols-4 2xl:grid-cols-6 2xl:gap-6">
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
          />
        ))}
      </div>

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
