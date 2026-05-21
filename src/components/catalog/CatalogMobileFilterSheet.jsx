import { FilterPanelCatalogFilters } from './FilterPanelCatalogFilters'

/**
 * Nội dung Bottom Sheet bộ lọc — chỉnh draft, áp dụng qua footer của sheet.
 */
export function CatalogMobileFilterSheet({
  draft,
  absoluteMaxPrice,
  onDraftFiltersChange,
  onDraftPriceChange,
}) {
  if (!draft) return null

  return (
    <FilterPanelCatalogFilters
      filters={draft.filters}
      priceDraft={draft.priceDraft}
      absoluteMaxPrice={absoluteMaxPrice}
      onChange={onDraftFiltersChange}
      onPriceChange={onDraftPriceChange}
      showInlinePriceApply={false}
    />
  )
}

export function CatalogFilterSheetFooter({ onReset, onApply, applying = false }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={onReset}
        disabled={applying}
        className="rounded-lg border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-60"
      >
        Xóa bộ lọc
      </button>
      <button
        type="button"
        onClick={onApply}
        disabled={applying}
        className="rounded-lg bg-brand py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
      >
        Áp dụng
      </button>
    </div>
  )
}
