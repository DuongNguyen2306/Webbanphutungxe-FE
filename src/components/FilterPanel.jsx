import { SlidersHorizontal, RotateCcw } from 'lucide-react'
import {
  BRAND_FILTER_IDS,
  VEHICLE_TYPES,
  PART_TYPES,
} from '../data/filterOptions'
import { BRANDS } from '../data/products'
import { PriceRangeSlider } from './PriceRangeSlider'

function toggleId(arr, id) {
  if (arr.includes(id)) return arr.filter((x) => x !== id)
  return [...arr, id]
}

export function FilterPanelContent({
  filters,
  priceDraft,
  absoluteMaxPrice,
  onChange,
  onPriceChange,
  onApplyPrice,
  onReset,
}) {
  const set = (patch) => onChange({ ...filters, ...patch })

  return (
    <div className="space-y-6 text-ink">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-bold text-ink">
          <SlidersHorizontal className="size-5 text-brand" />
          <span>Bộ lọc nâng cao</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 text-xs font-bold uppercase text-brand hover:underline"
        >
          <RotateCcw className="size-3.5" />
          Xóa lọc
        </button>
      </div>

      <fieldset className="space-y-2 border-0 p-0">
        <legend className="mb-2 text-xs font-extrabold uppercase tracking-wide text-gray-500">
          Hãng xe
        </legend>
        <div className="flex flex-col gap-2">
          {BRAND_FILTER_IDS.map((id) => (
            <label
              key={id}
              className="flex cursor-pointer items-center gap-2 text-sm font-medium"
            >
              <input
                type="checkbox"
                checked={filters.brands.includes(id)}
                onChange={() => set({ brands: toggleId(filters.brands, id) })}
                className="size-4 rounded border-gray-300 text-brand focus:ring-brand"
              />
              {BRANDS[id]?.label ?? id}
            </label>
          ))}
        </div>
        <p className="text-[11px] text-gray-500">
          Không chọn = hiển thị tất cả hãng.
        </p>
      </fieldset>

      <fieldset className="space-y-2 border-0 border-t border-gray-200 pt-4">
        <legend className="mb-2 text-xs font-extrabold uppercase tracking-wide text-gray-500">
          Dòng xe
        </legend>
        <div className="flex flex-col gap-2">
          {VEHICLE_TYPES.map((v) => (
            <label
              key={v.id}
              className="flex cursor-pointer items-center gap-2 text-sm font-medium"
            >
              <input
                type="checkbox"
                checked={filters.vehicles.includes(v.id)}
                onChange={() =>
                  set({ vehicles: toggleId(filters.vehicles, v.id) })
                }
                className="size-4 rounded border-gray-300 text-brand focus:ring-brand"
              />
              {v.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2 border-0 border-t border-gray-200 pt-4">
        <legend className="mb-2 text-xs font-extrabold uppercase tracking-wide text-gray-500">
          Danh mục phụ tùng
        </legend>
        <div className="flex flex-col gap-2">
          {PART_TYPES.map((p) => (
            <label
              key={p.id}
              className="flex cursor-pointer items-center gap-2 text-sm font-medium"
            >
              <input
                type="checkbox"
                checked={filters.parts.includes(p.id)}
                onChange={() => set({ parts: toggleId(filters.parts, p.id) })}
                className="size-4 rounded border-gray-300 text-brand focus:ring-brand"
              />
              {p.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3 border-0 border-t border-gray-200 pt-4">
        <legend className="mb-1 text-xs font-extrabold uppercase tracking-wide text-gray-500">
          Khoảng giá
        </legend>
        <PriceRangeSlider
          min={priceDraft.priceMin}
          max={priceDraft.priceMax}
          absoluteMax={absoluteMaxPrice}
          onChange={onPriceChange}
        />
        <button
          type="button"
          onClick={onApplyPrice}
          className="w-full rounded-lg bg-brand py-3 text-sm font-extrabold uppercase text-white hover:bg-brand-dark"
        >
          Áp dụng khoảng giá
        </button>
      </fieldset>

      <label className="flex cursor-pointer items-center gap-2 border-t border-gray-200 pt-4 text-sm font-semibold">
        <input
          type="checkbox"
          checked={filters.inStockOnly}
          onChange={(e) => set({ inStockOnly: e.target.checked })}
          className="size-4 rounded border-gray-300 text-brand focus:ring-brand"
        />
        Chỉ hiện còn hàng
      </label>

    </div>
  )
}

export function FilterPanelSidebar({
  filters,
  priceDraft,
  absoluteMaxPrice,
  onChange,
  onPriceChange,
  onApplyPrice,
  onReset,
}) {
  return (
    <aside className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <FilterPanelContent
        filters={filters}
        priceDraft={priceDraft}
        absoluteMaxPrice={absoluteMaxPrice}
        onChange={onChange}
        onPriceChange={onPriceChange}
        onApplyPrice={onApplyPrice}
        onReset={onReset}
      />
    </aside>
  )
}
