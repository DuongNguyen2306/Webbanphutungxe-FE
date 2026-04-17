import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const BRAND_ITEMS = [
  { name: 'RCB' },
  { name: 'Michelin' },
  { name: 'Dunlop' },
  { name: 'Motul' },
  { name: 'Öhlins' },
  { name: 'Brembo' },
  { name: 'DID' },
  { name: 'YSS' },
  { name: 'Rizoma' },
]

export function BrandScroller() {
  const ref = useRef(null)
  const [selectedBrand, setSelectedBrand] = useState('')

  function scroll(dir) {
    const el = ref.current
    if (!el) return
    const delta = Math.min(el.clientWidth * 0.85, 400) * dir
    el.scrollBy({ left: delta, behavior: 'smooth' })
  }

  return (
    <div className="relative rounded-lg border border-gray-200 bg-white py-3 shadow-sm">
      <button
        type="button"
        onClick={() => scroll(-1)}
        className="absolute left-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-gray-200 bg-white p-2 text-gray-600 shadow-sm hover:bg-page md:flex"
        aria-label="Cuộn trái"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        onClick={() => scroll(1)}
        className="absolute right-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-gray-200 bg-white p-2 text-gray-600 shadow-sm hover:bg-page md:flex"
        aria-label="Cuộn phải"
      >
        <ChevronRight className="size-5" />
      </button>

      <div
        ref={ref}
        className="flex gap-3 overflow-x-auto scroll-smooth px-3 pb-1 pt-1 md:px-12 [scrollbar-width:thin]"
      >
        {BRAND_ITEMS.map((b) => (
          <button
            type="button"
            key={b.name}
            onClick={() => setSelectedBrand((prev) => (prev === b.name ? '' : b.name))}
            className={`flex h-14 min-w-[100px] shrink-0 items-center justify-center rounded-md border px-4 text-sm font-extrabold tracking-wide transition ${
              selectedBrand === b.name
                ? 'border-brand bg-brand text-white shadow-sm'
                : 'border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-pressed={selectedBrand === b.name}
          >
            {b.name}
          </button>
        ))}
      </div>
    </div>
  )
}
