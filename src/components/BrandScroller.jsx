import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '../api/client'
import { normalizeSearch } from '../utils/string'

export function BrandScroller() {
  const ref = useRef(null)
  const location = useLocation()
  const [categories, setCategories] = useState([])

  const activeCategory = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return normalizeSearch(String(params.get('category') || '').trim())
  }, [location.search])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await api.get('/api/categories')
        if (cancelled) return
        const rawList = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.categories)
              ? data.categories
              : []
        setCategories(
          rawList
            .map((item) => ({
              id: String(item?._id || item?.id || ''),
              name: String(item?.name || '').trim(),
            }))
            .filter((item) => item.id && item.name),
        )
      } catch {
        if (!cancelled) setCategories([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  function scroll(dir) {
    const el = ref.current
    if (!el) return
    const delta = Math.min(el.clientWidth * 0.85, 400) * dir
    el.scrollBy({ left: delta, behavior: 'smooth' })
  }

  return (
    <div className="relative rounded-lg border border-gray-200 bg-white py-3 shadow-sm">
      <p className="px-3 text-xs font-extrabold uppercase tracking-wide text-gray-600 md:px-12">
        Danh mục sản phẩm
      </p>
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
        className="mt-2 flex gap-3 overflow-x-auto scroll-smooth px-3 pb-1 pt-1 md:px-12 [scrollbar-width:thin]"
      >
        <Link
          to="/shop"
          className={`flex h-12 min-w-[120px] shrink-0 items-center justify-center rounded-md border px-4 text-sm font-extrabold tracking-wide transition ${
            !activeCategory
              ? 'border-brand bg-brand text-white shadow-sm'
              : 'border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tất cả
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/shop?category=${encodeURIComponent(category.name)}`}
            className={`flex h-14 min-w-[100px] shrink-0 items-center justify-center rounded-md border px-4 text-sm font-extrabold tracking-wide transition ${
              activeCategory === normalizeSearch(category.name)
                ? 'border-brand bg-brand text-white shadow-sm'
                : 'border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
