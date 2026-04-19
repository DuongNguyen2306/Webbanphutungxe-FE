import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import { formatVnd } from '../../utils/format'

const PAGE_SIZE = 10

function toProductList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.products)) return data.products
  if (Array.isArray(data?.items)) return data.items
  return []
}

export function AdminInventory() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/admin/products')
      setProducts(toProductList(data))
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const rows = useMemo(() => {
    const out = []
    for (const p of products) {
      for (const v of p?.variants || []) {
        out.push({ product: p, variant: v })
      }
    }
    return out
  }, [products])

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))

  const pagedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return rows.slice(start, start + PAGE_SIZE)
  }, [rows, page])

  useEffect(() => {
    if (page > totalPages) setPage(1)
  }, [page, totalPages])

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
              {pagedRows.map(({ product: p, variant: v }, idx) => {
                const label =
                  [v.typeName, v.color, v.size]
                    .filter((x) => x && String(x).trim())
                    .join(' · ') || 'Mặc định'
                const rowKey = `${p._id || p.id}-${v._id || v.id || v.sku || idx}`
                const price = v.price != null ? v.price : v.salePrice
                return (
                  <tr key={rowKey} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {p.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{label}</td>
                    <td className="px-4 py-3 font-semibold text-brand">
                      {formatVnd(price)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          toggleAvailability(
                            p._id || p.id,
                            v._id || v.id,
                            !v.isAvailable,
                          )
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
      {rows.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            Trang {page} / {totalPages} · {rows.length} biến thể
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((pg) => Math.max(1, pg - 1))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((pg) => pg + 1)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      ) : null}
      {rows.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
          Chưa có biến thể.
        </p>
      ) : null}
    </div>
  )
}
