import { SlidersHorizontal, RotateCcw } from 'lucide-react'
import {
  BRAND_FILTER_GROUPS,
  VEHICLE_TYPES,
} from '../data/filterOptions'
import { BRANDS } from '../data/products'
import { CATALOG_SORT_OPTIONS } from '../data/catalogSortOptions'
import { PriceRangeSlider } from './PriceRangeSlider'
import { usePartCategories } from '../hooks/usePartCategories'

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
  sortBy = 'default',
  onSortChange,
}) {
  const set = (patch) => onChange({ ...filters, ...patch })
  const { partCategories, loading: partCategoriesLoading } = usePartCategories()

  return (
    <div className="space-y-6 text-ink">
      {onSortChange ? (
        <div className="border-b border-gray-100 pb-4">
          <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-gray-500">
            Sắp xếp
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-3 pr-10 text-sm font-medium text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
          >
            {CATALOG_SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

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

      <fieldset className="space-y-3 border-0 p-0">
        <legend className="mb-1 text-xs font-extrabold uppercase tracking-wide text-gray-500">
          Hãng xe
        </legend>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => set({ brands: [] })}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
              filters.brands.length === 0
                ? 'border-brand bg-brand text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-brand/40'
            }`}
          >
            Tất cả hãng
          </button>
          <button
            type="button"
            onClick={() => set({ brands: ['vespa', 'piaggio'] })}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
              filters.brands.length === 2 &&
              filters.brands.includes('vespa') &&
              filters.brands.includes('piaggio')
                ? 'border-brand bg-brand text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-brand/40'
            }`}
          >
            Vespa + Piaggio
          </button>
          <button
            type="button"
            onClick={() => set({ brands: ['honda', 'yamaha'] })}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
              filters.brands.length === 2 &&
              filters.brands.includes('honda') &&
              filters.brands.includes('yamaha')
                ? 'border-brand bg-brand text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-brand/40'
            }`}
          >
            Honda + Yamaha
          </button>
        </div>
        <div className="space-y-4 border-t border-gray-100 pt-3">
          {BRAND_FILTER_GROUPS.map((group) => (
            <div key={group.id} className="space-y-2">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-gray-500">
                  {group.legend}
                </p>
                {group.hint ? (
                  <p className="text-[11px] text-gray-500">{group.hint}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                {group.ids.map((id) => (
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
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-500">
          Không chọn ô nào = hiện mọi hãng (mặc định).
        </p>
      </fieldset>

      <div className="border-t border-gray-200 pt-4">
        <fieldset className="space-y-2 border-0 p-0">
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
      </div>

      <div className="border-t border-gray-200 pt-4">
        <fieldset className="space-y-2 border-0 p-0">
          <legend className="mb-2 text-xs font-extrabold uppercase tracking-wide text-gray-500">
            Loại phụ tùng
          </legend>
          {partCategoriesLoading && partCategories.length === 0 ? (
            <p className="text-xs text-gray-500">Đang tải danh sách loại phụ tùng…</p>
          ) : (
            <div className="flex flex-col gap-2">
              {partCategories.map((p) => (
                <label
                  key={p.value}
                  className="flex cursor-pointer items-center gap-2 text-sm font-medium"
                >
                  <input
                    type="checkbox"
                    checked={filters.parts.includes(p.value)}
                    onChange={() => set({ parts: toggleId(filters.parts, p.value) })}
                    className="size-4 rounded border-gray-300 text-brand focus:ring-brand"
                  />
                  {p.label}
                </label>
              ))}
            </div>
          )}
        </fieldset>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <fieldset className="space-y-3 border-0 p-0">
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
      </div>

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
