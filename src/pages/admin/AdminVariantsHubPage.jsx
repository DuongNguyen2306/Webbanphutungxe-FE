import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layers, Search } from 'lucide-react'
import { api } from '../../api/client'

function toProductList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.products)) return data.products
  if (Array.isArray(data?.items)) return data.items
  return []
}

export function AdminVariantsHubPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => {
      const name = String(p?.name || '').toLowerCase()
      const id = String(p?._id || p?.id || '')
      return name.includes(q) || id.includes(q)
    })
  }, [products, query])

  const field =
    'w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20'

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-brand">
              <Layers className="size-6" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                Biến thể sản phẩm
              </h1>
              <p className="mt-2 max-w-xl text-sm text-gray-600">
                Trang riêng trong admin — chọn một sản phẩm để mở bảng SKU, giá và tồn. Không nằm trong
                form danh sách sản phẩm.
              </p>
            </div>
          </div>
          <Link
            to="/admin/products"
            className="shrink-0 self-start rounded-xl border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-bold text-gray-800 hover:bg-gray-100"
          >
            Danh sách sản phẩm
          </Link>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm tên sản phẩm hoặc ID…"
          className={`${field} pl-10`}
          autoComplete="off"
        />
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Đang tải…</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500">
          {products.length === 0 ? 'Chưa có sản phẩm.' : 'Không khớp từ khóa.'}
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Sản phẩm</th>
                  <th className="px-4 py-3">Biến thể</th>
                  <th className="w-40 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => {
                  const id = String(p._id || p.id)
                  const n = Array.isArray(p.variants) ? p.variants.length : 0
                  return (
                    <tr key={id} className="hover:bg-gray-50/80">
                      <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                      <td className="px-4 py-3 text-gray-600">{n} loại</td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/variants/${id}`}
                          className="inline-flex rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:brightness-95"
                        >
                          Mở trang biến thể
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
