import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { formatVnd } from '../../utils/format'

const PAGE_SIZE = 10

export function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/admin/products')
      setProducts(data)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE))
  const pagedProducts = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    if (page > totalPages) setPage(1)
  }, [page, totalPages])

  async function setStorefront(id, showOnStorefront) {
    try {
      await api.patch(`/api/admin/products/${id}`, { showOnStorefront })
      await load()
    } catch {
      /* toast optional */
    }
  }

  async function removeProduct(id, name) {
    if (!window.confirm(`Xóa sản phẩm "${name}"? Không thể hoàn tác.`)) return
    try {
      await api.delete(`/api/admin/products/${id}`)
      await load()
    } catch {
      window.alert('Không xóa được. Thử lại.')
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-gray-500">Đang tải danh sách sản phẩm...</p>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Sản phẩm
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Sửa / xóa, bật tắt hiển thị trên cửa hàng (danh sách & tìm kiếm).
          </p>
        </div>
        <Link
          to="/admin/products/new"
          className="inline-flex items-center rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark"
        >
          + Thêm sản phẩm
        </Link>
      </div>
      <ul className="mt-6 space-y-3">
        {pagedProducts.map((p) => {
          const visible = p.showOnStorefront !== false
          return (
            <li
              key={p._id}
              className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-gray-900">{p.name}</span>
                {!visible ? (
                  <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
                    Đang ẩn trên cửa hàng
                  </span>
                ) : null}
                <p className="mt-1 text-xs text-gray-500">
                  {p.category?.name} · {p.variants?.length || 0} biến thể
                </p>
              </div>
              <span className="shrink-0 font-semibold text-brand">
                từ{' '}
                {formatVnd(
                  p.variants?.length
                    ? Math.min(...p.variants.map((v) => v.price))
                    : 0,
                )}
              </span>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-gray-300 text-brand focus:ring-brand"
                    checked={visible}
                    onChange={(e) => setStorefront(p._id, e.target.checked)}
                  />
                  <span>Hiện trên cửa hàng</span>
                </label>
                <Link
                  to={`/admin/products/${p._id}/edit`}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  Sửa
                </Link>
                <button
                  type="button"
                  onClick={() => removeProduct(p._id, p.name)}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-100"
                >
                  Xóa
                </button>
              </div>
            </li>
          )
        })}
      </ul>
      {products.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            Trang {page} / {totalPages} · {products.length} sản phẩm
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      ) : null}
      {products.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
          Chưa có sản phẩm nào.
        </p>
      ) : null}
    </div>
  )
}
