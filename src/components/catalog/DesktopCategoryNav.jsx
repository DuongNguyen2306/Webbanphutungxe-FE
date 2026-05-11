import { Package } from 'lucide-react'

/**
 * Sidebar desktop — danh mục từ BE (id + name). Chữ ~13px.
 */
export function DesktopCategoryNav({
  categories,
  loading,
  selectedCategoryId,
  onCategorySelect,
}) {
  function btnClass(active) {
    return [
      'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] font-medium leading-snug transition',
      active
        ? 'bg-brand/10 text-brand ring-1 ring-brand/30'
        : 'text-ink hover:bg-gray-50',
    ].join(' ')
  }

  const isAll = !selectedCategoryId

  return (
    <nav aria-label="Danh mục sản phẩm" className="pb-1">
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-gray-500">
        Danh mục
      </p>
      {loading ? (
        <p className="text-[13px] text-gray-500">Đang tải danh mục…</p>
      ) : null}
      <ul className="space-y-0.5">
        <li>
          <button
            type="button"
            onClick={() => onCategorySelect(null)}
            className={btnClass(isAll)}
          >
            <span className="flex size-[18px] shrink-0 items-center justify-center text-[15px] leading-none">
              ✦
            </span>
            Tất cả
          </button>
        </li>
        {categories.map((c) => {
          const active = selectedCategoryId === c.id
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onCategorySelect(c.id)}
                className={btnClass(active)}
              >
                <Package className="size-[18px] shrink-0 text-current opacity-80" strokeWidth={2} />
                <span className="min-w-0 break-words">{c.name}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
