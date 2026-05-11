import { Package, SlidersHorizontal } from 'lucide-react'

/**
 * Dải pill danh mục — đã ẩn hoàn toàn theo yêu cầu UX mới:
 * - Trên mobile: dùng dropdown danh mục tích hợp trong Header (gọn hơn).
 * - Trên md+: dùng DesktopCategoryNav ở sidebar.
 * Giữ class `hidden` ở wrapper để component không chiếm chỗ ở bất kỳ breakpoint nào,
 * mà vẫn cho phép tái sử dụng nhanh nếu cần bật lại sau này.
 */
export function CatalogMobileCategoryRail({
  categories,
  loading,
  selectedCategoryId,
  onCategorySelect,
  onOpenFilters,
}) {
  const isAll = !selectedCategoryId

  return (
    <div className="hidden border-b border-gray-200/90 bg-page">
      <div className="scrollbar-hide flex items-center gap-1.5 overflow-x-auto overscroll-x-contain px-2 py-1">
        <button
          type="button"
          onClick={() => onCategorySelect(null)}
          className={[
            'flex shrink-0 items-center gap-1 rounded-full border py-1 pl-2 pr-2.5 text-[11px] font-bold leading-none transition [-webkit-tap-highlight-color:transparent] active:scale-[0.98]',
            isAll
              ? 'border-brand bg-brand text-white shadow-md shadow-brand/20'
              : 'border-brand/35 bg-white text-brand shadow-sm ring-1 ring-brand/15',
          ].join(' ')}
        >
          <span className="text-[12px] leading-none">✦</span>
          <span>Tất cả</span>
        </button>

        {loading ? (
          <span className="shrink-0 text-[11px] text-gray-500">…</span>
        ) : null}

        {categories.map((c) => {
          const active = selectedCategoryId === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onCategorySelect(c.id)}
              className={[
                'flex max-w-[9rem] shrink-0 items-center gap-1 rounded-full border py-1 px-2 text-[11px] font-semibold leading-none transition [-webkit-tap-highlight-color:transparent] active:scale-[0.98]',
                active
                  ? 'border-brand bg-brand text-white shadow-sm'
                  : 'border-gray-200 bg-white text-ink shadow-sm',
              ].join(' ')}
            >
              <Package className="size-3 shrink-0 opacity-90" strokeWidth={2.2} aria-hidden />
              <span className="truncate">{c.name}</span>
            </button>
          )
        })}

        <button
          type="button"
          onClick={onOpenFilters}
          className="ml-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-sm transition [-webkit-tap-highlight-color:transparent] active:scale-95"
          aria-label="Bộ lọc nâng cao"
        >
          <SlidersHorizontal className="size-3" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}
