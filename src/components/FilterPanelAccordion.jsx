import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { ChevronDown, RotateCcw, SlidersHorizontal } from 'lucide-react'
import {
  BRAND_FILTER_GROUPS,
  VEHICLE_TYPES,
} from '../data/filterOptions'
import { BRANDS } from '../data/products'
import { PriceRangeSlider } from './PriceRangeSlider'
import { usePartCategories } from '../hooks/usePartCategories'

function toggleId(arr, id) {
  if (arr.includes(id)) return arr.filter((x) => x !== id)
  return [...arr, id]
}

const SORT_OPTIONS = [
  { value: 'default', label: 'Mặc định' },
  { value: 'price_asc', label: 'Giá thấp → cao' },
  { value: 'price_desc', label: 'Giá cao → thấp' },
  { value: 'name', label: 'Tên A → Z' },
]

function AccordionBlock({ title, defaultOpen, children }) {
  return (
    <Disclosure as="div" className="border-b border-gray-100 last:border-0" defaultOpen={defaultOpen}>
      {({ open }) => (
        <>
          <DisclosureButton className="flex w-full items-center justify-between py-2.5 text-left">
            <span className="text-sm font-bold text-ink">{title}</span>
            <ChevronDown
              className={`size-4 shrink-0 text-gray-400 transition duration-200 ${
                open ? 'rotate-180' : ''
              }`}
            />
          </DisclosureButton>
          <DisclosurePanel className="pb-3 pt-0">{children}</DisclosurePanel>
        </>
      )}
    </Disclosure>
  )
}

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
  const set = (patch) => onChange({ ...filters, ...patch })
  const { partCategories, loading: partCategoriesLoading } = usePartCategories()

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
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="space-y-0">
        <AccordionBlock title="Hãng xe" defaultOpen>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => set({ brands: [] })}
                className={`rounded-full border px-2.5 py-1 text-xs font-bold transition ${
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
                className={`rounded-full border px-2.5 py-1 text-xs font-bold transition ${
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
                className={`rounded-full border px-2.5 py-1 text-xs font-bold transition ${
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
            <div className="space-y-3 border-t border-gray-100 pt-2">
              {BRAND_FILTER_GROUPS.map((group) => (
                <div key={group.id} className="space-y-1.5">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-gray-500">
                      {group.legend}
                    </p>
                    {group.hint ? (
                      <p className="text-[11px] text-gray-500">{group.hint}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {group.ids.map((id) => (
                      <label
                        key={id}
                        className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink"
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
            <p className="text-[10px] text-gray-500">Không chọn = mọi hãng.</p>
          </div>
        </AccordionBlock>

        <AccordionBlock title="Dòng xe">
          <div className="flex flex-col gap-1.5">
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
        </AccordionBlock>

        <AccordionBlock title="Loại phụ tùng">
          {partCategoriesLoading && partCategories.length === 0 ? (
            <p className="text-xs text-gray-500">Đang tải…</p>
          ) : (
            <div className="flex flex-col gap-1.5">
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
        </AccordionBlock>

        <AccordionBlock title="Khoảng giá" defaultOpen>
          <div className="space-y-3">
            <PriceRangeSlider
              min={priceDraft.priceMin}
              max={priceDraft.priceMax}
              absoluteMax={absoluteMaxPrice}
              onChange={onPriceChange}
            />
            <button
              type="button"
              onClick={onApplyPrice}
              className="w-full rounded-lg bg-brand py-2.5 text-xs font-extrabold uppercase text-white hover:bg-brand-dark"
            >
              Áp dụng khoảng giá
            </button>
          </div>
        </AccordionBlock>
      </div>

      <label className="mt-3 flex cursor-pointer items-center gap-2 border-t border-gray-200 pt-3 text-sm font-semibold">
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
