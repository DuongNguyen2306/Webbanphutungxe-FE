import { RotateCcw, SlidersHorizontal } from 'lucide-react'
import { CATALOG_SORT_OPTIONS } from '../data/catalogSortOptions'
import { FilterPanelCatalogFilters } from './catalog/FilterPanelCatalogFilters'

/**
 * Sidebar desktop: accordion + font nhỏ gọn (text-sm / icon 18).
 */
export function FilterPanelAccordionSidebar({
  filters,
  priceDraft,
  absoluteMaxPrice,
  onChange,
  onPriceChange,
  onApplyPrice,
  onReset,
  sortBy = 'default',
  onSortChange,
}) {
  return (
    <div className="mt-3 w-full min-w-0 border-t border-gray-200 pt-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-bold text-ink">
          <SlidersHorizontal className="size-[18px] text-brand" strokeWidth={2.5} />
          <span className="text-sm">Bộ lọc</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 text-[11px] font-bold uppercase text-brand hover:underline"
        >
          <RotateCcw className="size-3.5" />
          Xóa
        </button>
      </div>

      {onSortChange ? (
        <div className="mb-3 border-b border-gray-100 pb-3">
          <label className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-gray-500">
            Sắp xếp
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-2 pr-8 text-sm text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          >
            {CATALOG_SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <FilterPanelCatalogFilters
        filters={filters}
        priceDraft={priceDraft}
        absoluteMaxPrice={absoluteMaxPrice}
        onChange={onChange}
        onPriceChange={onPriceChange}
        showInlinePriceApply
        onApplyPrice={onApplyPrice}
      />
    </div>
  )
}
