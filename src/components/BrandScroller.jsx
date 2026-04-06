import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const BRAND_ITEMS = [
  { name: 'RCB', tone: 'bg-zinc-800 text-white' },
  { name: 'Michelin', tone: 'bg-blue-700 text-white' },
  { name: 'Dunlop', tone: 'bg-red-700 text-white' },
  { name: 'Motul', tone: 'bg-red-600 text-white' },
  { name: 'Öhlins', tone: 'bg-yellow-500 text-black' },
  { name: 'Brembo', tone: 'bg-red-600 text-white' },
  { name: 'DID', tone: 'bg-amber-500 text-black' },
  { name: 'YSS', tone: 'bg-slate-700 text-white' },
  { name: 'Rizoma', tone: 'bg-neutral-900 text-white' },
]

export function BrandScroller() {
  const ref = useRef(null)

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
          <div
            key={b.name}
            className={`flex h-14 min-w-[100px] shrink-0 items-center justify-center rounded-md px-4 text-sm font-extrabold tracking-wide ${b.tone}`}
          >
            {b.name}
          </div>
        ))}
      </div>
    </div>
  )
}
