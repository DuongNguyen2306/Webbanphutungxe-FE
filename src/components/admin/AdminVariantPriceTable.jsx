import { formatVnd } from '../../utils/format'

function fieldClass(hasError) {
  return `w-full rounded-lg border px-2.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 ${
    hasError
      ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200'
      : 'border-gray-300 bg-white focus:border-brand focus:ring-brand/20'
  }`
}

export function AdminVariantPriceTable({
  rows,
  resolveInput,
  dirtySet,
  rowErrors,
  onInputChange,
  onResetRow,
}) {
  if (!rows.length) {
    return (
      <p className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
        Không có biến thể theo bộ lọc hiện tại.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs font-bold uppercase tracking-wide text-gray-500">
              <th className="px-3 py-3">Biến thể</th>
              <th className="px-3 py-3">SKU</th>
              <th className="px-3 py-3">Giá hiện tại</th>
              <th className="px-3 py-3">Giá gốc hiện tại</th>
              <th className="px-3 py-3">Giá mới</th>
              <th className="px-3 py-3">Giá gốc mới</th>
              <th className="px-3 py-3">Trạng thái</th>
              <th className="px-3 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => {
              const dirty = dirtySet.has(row.variantId)
              const error = rowErrors[row.variantId] || {}
              return (
                <tr key={row.variantId} className={dirty ? 'bg-brand/5' : 'bg-white'}>
                  <td className="px-3 py-3 text-sm font-semibold text-gray-800">
                    {row.displayKey}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-600">{row.sku || '-'}</td>
                  <td className="px-3 py-3 text-sm font-bold text-brand">
                    {formatVnd(row.price)}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-600">
                    {row.originalPrice != null ? formatVnd(row.originalPrice) : '-'}
                  </td>
                  <td className="px-3 py-3">
                    <input
                      type="number"
                      min="0"
                      value={resolveInput(row.variantId, 'price')}
                      onChange={(e) =>
                        onInputChange(row.variantId, 'price', e.target.value)
                      }
                      className={fieldClass(Boolean(error.price))}
                      placeholder="Bắt buộc"
                    />
                    {error.price ? (
                      <p className="mt-1 text-xs font-medium text-red-600">{error.price}</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">
                    <input
                      type="number"
                      min="0"
                      value={resolveInput(row.variantId, 'originalPrice')}
                      onChange={(e) =>
                        onInputChange(row.variantId, 'originalPrice', e.target.value)
                      }
                      className={fieldClass(Boolean(error.originalPrice))}
                      placeholder="Để trống nếu không dùng"
                    />
                    {error.originalPrice ? (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {error.originalPrice}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-xs font-semibold">
                    {dirty ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                        Đã thay đổi
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                        Chưa đổi
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      disabled={!dirty}
                      onClick={() => onResetRow(row.variantId)}
                      className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Reset dòng
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
