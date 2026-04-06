import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { formatVnd } from '../../utils/format'

export function AdminInventory() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const { data } = await api.get('/api/admin/products')
      setProducts(data)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function toggleAvailability(productId, variantId, isAvailable) {
    await api.patch(
      `/api/admin/products/${productId}/variants/${variantId}/availability`,
      { isAvailable },
    )
    load()
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Đang tải tồn kho...</p>
  }

  const rows = []
  for (const p of products) {
    for (const v of p.variants || []) {
      rows.push({ product: p, variant: v })
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
        Tồn kho nhanh
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-gray-600">
        Bật/tắt <span className="font-semibold text-gray-800">còn hàng</span> cho
        từng biến thể một chạm — không cần mở form chỉnh sửa đầy đủ.
      </p>
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Sản phẩm</th>
                <th className="px-4 py-3">Biến thể</th>
                <th className="px-4 py-3">Giá</th>
                <th className="px-4 py-3">Còn hàng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(({ product: p, variant: v }) => {
                const label =
                  [v.typeName, v.color, v.size]
                    .filter((x) => x && String(x).trim())
                    .join(' · ') || 'Mặc định'
                return (
                  <tr key={`${p._id}-${v._id}`} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {p.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{label}</td>
                    <td className="px-4 py-3 font-semibold text-brand">
                      {formatVnd(v.price)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          toggleAvailability(p._id, v._id, !v.isAvailable)
                        }
                        className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
                          v.isAvailable
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        {v.isAvailable ? 'Còn' : 'Hết'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
          Chưa có biến thể.
        </p>
      ) : null}
    </div>
  )
}
