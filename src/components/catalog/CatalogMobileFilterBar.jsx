import { SlidersHorizontal } from 'lucide-react'
import {
  CATALOG_MOBILE_SORT_OPTIONS,
  getCatalogSortLabel,
} from '../../data/catalogSortOptions'

/**
 * Thanh lọc mobile (Phương án 1): Sắp xếp + mở Bottom Sheet bộ lọc.
 * Chỉ hiển thị dưới `md` — parent hoặc class `block md:hidden`.
 */
export function CatalogMobileFilterBar({
  sortBy,
  onSortChange,
  onOpenFilters,
  hasActiveFilters = false,
}) {
  const mobileSortValue = CATALOG_MOBILE_SORT_OPTIONS.some((o) => o.value === sortBy)
    ? sortBy
    : 'default'
  const sortLabel = getCatalogSortLabel(mobileSortValue, CATALOG_MOBILE_SORT_OPTIONS)

  return (
    <div className="block border-b border-gray-200 bg-white md:hidden">
      <div className="grid grid-cols-2 divide-x divide-gray-200">
        <div className="relative min-h-11">
          <label className="flex h-full cursor-pointer items-center justify-center gap-1 px-3 text-sm font-medium text-ink">
            <span className="truncate">
              Sắp xếp <span className="text-gray-500">{sortLabel}</span>
            </span>
            <span className="shrink-0 text-xs text-gray-400" aria-hidden>
              ⬇️
            </span>
          </label>
          <select
            value={mobileSortValue}
            onChange={(e) => onSortChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Sắp xếp sản phẩm"
          >
            {CATALOG_MOBILE_SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onOpenFilters}
          className="flex min-h-11 items-center justify-center gap-1.5 px-3 text-sm font-medium text-ink transition active:bg-gray-50"
        >
          <SlidersHorizontal className="size-4 shrink-0 text-gray-600" strokeWidth={2.25} aria-hidden />
          <span>Bộ lọc</span>
          <span className="text-xs" aria-hidden>
            🎛️
          </span>
          {hasActiveFilters ? (
            <span className="size-2 shrink-0 rounded-full bg-brand" aria-label="Đang có bộ lọc" />
          ) : null}
        </button>
      </div>
    </div>
  )
}
