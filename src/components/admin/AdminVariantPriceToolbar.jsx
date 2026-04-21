export function AdminVariantPriceToolbar({
  productName,
  primaryLabel,
  filterValue,
  primaryOptions,
  loading,
  onFilterChange,
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
            Chỉnh giá theo phân loại
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {productName || 'Đang tải tên sản phẩm...'}
          </p>
        </div>
        {loading ? (
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
            Đang tải...
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
          Lọc theo {primaryLabel}
        </label>
        <select
          value={filterValue}
          onChange={(e) => onFilterChange(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        >
          <option value="ALL">Tất cả</option>
          {primaryOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.value} ({item.count})
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
