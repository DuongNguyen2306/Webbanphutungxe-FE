import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { api } from '../../api/client'
import { formatVnd } from '../../utils/format'

const PAGE_SIZE = 10
const BEST_SELLER_FILTERS = {
  all: 'Tất cả',
  enabled: 'Chỉ sản phẩm bán chạy',
  disabled: 'Chưa bật bán chạy',
}

function getBestSellerEnabled(product) {
  if (typeof product?.bestSellerEnabled === 'boolean') return product.bestSellerEnabled
  if (typeof product?.isBestSeller === 'boolean') return product.isBestSeller
  if (typeof product?.showInBestSellers === 'boolean') return product.showInBestSellers
  return false
}

function getBestSellerOrder(product) {
  const n = Number(
    product?.bestSellerOrder ?? product?.bestSellerRank ?? product?.bestSellerPosition ?? 0,
  )
  return Number.isFinite(n) && n >= 0 ? n : 0
}

function getSoldCount(product) {
  const n = Number(product?.soldCount ?? 0)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

/** Chuỗi hiển thị danh mục (tránh [object Object] khi category là object không có .name) */
function getCategoryDisplay(product) {
  const c = product?.category
  if (c == null) return ''
  if (typeof c === 'string') return c.trim()
  if (typeof c?.name === 'string') return c.name.trim()
  if (c.name != null && typeof c.name === 'object') {
    const nested = c.name.vi ?? c.name.en ?? c.name.default
    if (typeof nested === 'string') return nested.trim()
  }
  if (typeof c?.title === 'string') return c.title.trim()
  if (typeof c?.label === 'string') return c.label.trim()
  return ''
}

export function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [bestSellerFilter, setBestSellerFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

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

  const filteredProducts = useMemo(() => {
    let list = products
    if (bestSellerFilter === 'enabled') list = list.filter((p) => getBestSellerEnabled(p))
    else if (bestSellerFilter === 'disabled') list = list.filter((p) => !getBestSellerEnabled(p))

    const q = String(searchQuery || '').trim().toLowerCase()
    if (!q) return list

    return list.filter((p) => {
      const name = String(p.name || '').toLowerCase()
      const cat = getCategoryDisplay(p).toLowerCase()
      const variantBlob = (p.variants || [])
        .flatMap((v) => [
          v?.sku,
          v?.typeName,
          v?.color,
          v?.size,
        ])
        .filter(Boolean)
        .map((x) => String(x).toLowerCase())
        .join(' ')
      const blob = `${name} ${cat} ${variantBlob}`
      return blob.includes(q)
    })
  }, [products, bestSellerFilter, searchQuery])
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))
  const pagedProducts = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    if (page > totalPages) setPage(1)
  }, [page, totalPages])

  useEffect(() => {
    setPage(1)
  }, [searchQuery])

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
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0 sm:max-w-xs">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Lọc nhanh bán chạy
          </label>
          <select
            value={bestSellerFilter}
            onChange={(e) => {
              setBestSellerFilter(e.target.value)
              setPage(1)
            }}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            {Object.entries(BEST_SELLER_FILTERS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0 flex-1 sm:max-w-md">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Tìm kiếm
          </label>
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tên sản phẩm, danh mục, SKU hoặc biến thể..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-800 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              autoComplete="off"
            />
          </div>
        </div>
      </div>
      <ul className="mt-6 space-y-3">
        {pagedProducts.map((p) => {
          const visible = p.showOnStorefront !== false
          const bestSellerEnabled = getBestSellerEnabled(p)
          const bestSellerOrder = getBestSellerOrder(p)
          const soldCount = getSoldCount(p)
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
                  {getCategoryDisplay(p) || 'Chưa gán danh mục'} ·{' '}
                  {p.variants?.length || 0} biến thể
                </p>
                <div className="mt-2 grid gap-2 text-xs text-gray-600 sm:grid-cols-3">
                  <div>
                    <p className="font-semibold text-gray-500">Bán chạy</p>
                    <span
                      className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 font-bold ${
                        bestSellerEnabled
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {bestSellerEnabled ? 'Bật' : 'Tắt'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-500">Thứ tự</p>
                    <p className="mt-0.5 font-bold text-gray-800">{bestSellerOrder}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-500">Đã bán hiển thị</p>
                    <p className="mt-0.5 font-bold text-gray-800">{soldCount}</p>
                  </div>
                </div>
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
                <Link
                  to={`/admin/variants/${p._id}`}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  Biến thể
                </Link>
                <Link
                  to={`/admin/products/${p._id}/prices`}
                  className="rounded-lg border border-brand/30 bg-brand/5 px-3 py-1.5 text-sm font-semibold text-brand hover:bg-brand/10"
                >
                  Chỉnh giá
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
            Trang {page} / {totalPages} · {filteredProducts.length}/{products.length} sản phẩm
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
      {filteredProducts.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
          {products.length === 0
            ? 'Chưa có sản phẩm.'
            : 'Không có sản phẩm phù hợp bộ lọc hoặc từ khóa tìm kiếm.'}
        </p>
      ) : null}
    </div>
  )
}
