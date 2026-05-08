import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Layers, Search, X } from 'lucide-react'
import { api } from '../../api/client'
import { formatVnd } from '../../utils/format'

function variantDisplayName(v) {
  const dk = String(v?.displayKey || v?.key || '').trim()
  if (dk) return dk
  const av =
    v?.attributeValues && typeof v.attributeValues === 'object'
      ? Object.values(v.attributeValues)
          .map((x) => String(x || '').trim())
          .filter(Boolean)
          .join(' / ')
      : ''
  if (av) return av
  const legacy = [v?.typeName, v?.color, v?.size]
    .map((x) => String(x || '').trim())
    .filter(Boolean)
    .join(' / ')
  if (legacy) return legacy
  return String(v?._id || v?.id || 'Biến thể')
}

function variantSearchBlob(v) {
  const name = variantDisplayName(v).toLowerCase()
  const sku = String(v?.sku || '').toLowerCase()
  let attrs = ''
  if (v?.attributeValues && typeof v.attributeValues === 'object') {
    attrs = Object.entries(v.attributeValues)
      .map(([k, val]) => `${k} ${val}`)
      .join(' ')
      .toLowerCase()
  }
  return `${name} ${sku} ${attrs}`
}

function categoryPayloadFromProduct(p) {
  const c = p?.category
  if (c == null) return ''
  if (typeof c === 'string') return c.trim()
  return String(c?.name ?? '').trim()
}

/** Hiển thị danh mục trên header (tránh [object Object]) */
function categoryLabelFromProduct(p) {
  const raw = categoryPayloadFromProduct(p)
  if (raw) return raw
  const c = p?.category
  if (c?.name != null && typeof c.name === 'object') {
    const nested = c.name.vi ?? c.name.en ?? c.name.default
    if (typeof nested === 'string') return nested.trim()
  }
  return ''
}

function toNumberOrNull(value) {
  if (value === '' || value == null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function buildProductPutPayload(product, mergedVariants) {
  const bestSellerEnabled =
    typeof product?.bestSellerEnabled === 'boolean'
      ? product.bestSellerEnabled
      : Boolean(product?.isBestSeller ?? product?.showInBestSellers)
  const bestSellerOrder = Number(
    product?.bestSellerOrder ?? product?.bestSellerRank ?? product?.bestSellerPosition ?? 0,
  )
  const order = Number.isFinite(bestSellerOrder) && bestSellerOrder >= 0 ? bestSellerOrder : 0

  return {
    name: String(product?.name || '').trim(),
    category: categoryPayloadFromProduct(product),
    description: product?.description ?? '',
    images: Array.isArray(product?.images) ? [...product.images] : [],
    brand: product?.brand ?? 'honda',
    vehicleType: product?.vehicleType ?? 'scooter',
    partCategory: product?.partCategory ?? 'accessories',
    homeFeature: product?.homeFeature ?? null,
    showOnStorefront: product?.showOnStorefront !== false,
    bestSellerEnabled,
    bestSellerOrder: order,
    soldCount: Math.max(0, Number(product?.soldCount ?? 0) || 0),
    isBestSeller: bestSellerEnabled,
    showInBestSellers: bestSellerEnabled,
    bestSellerRank: order,
    bestSellerPosition: order,
    hasVariants: true,
    videoUrl: product?.videoUrl != null ? String(product.videoUrl).trim() : '',
    attributes: Array.isArray(product?.attributes) ? product.attributes : [],
    variants: mergedVariants,
  }
}

function mergeVariantIntoList(product, variantId, updates) {
  return (product?.variants || []).map((v) => {
    const id = String(v?._id || v?.id || '')
    if (id !== String(variantId)) return v
    const next = { ...v, ...updates }
    if (updates.images !== undefined) {
      const imgs = Array.isArray(updates.images) ? updates.images.filter(Boolean) : []
      next.images = imgs
      next.image = imgs[0] || ''
    }
    return next
  })
}

export function AdminProductVariantsPage() {
  const { productId } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchFilter, setSearchFilter] = useState('')
  const [toast, setToast] = useState({ message: '', tone: 'success' })

  const [drawerVariant, setDrawerVariant] = useState(null)
  const [formPrice, setFormPrice] = useState('')
  const [formOriginalPrice, setFormOriginalPrice] = useState('')
  const [formSku, setFormSku] = useState('')
  const [formStock, setFormStock] = useState('')
  const [formImagesText, setFormImagesText] = useState('')
  const [formAttrValues, setFormAttrValues] = useState({})
  const [formAvailable, setFormAvailable] = useState(true)

  const [savingPrices, setSavingPrices] = useState(false)
  const [savingAvailability, setSavingAvailability] = useState(false)
  const [savingDetails, setSavingDetails] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSearchFilter(searchInput.trim().toLowerCase()), 200)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    if (!toast.message) return undefined
    const t = setTimeout(() => setToast({ message: '', tone: 'success' }), 2600)
    return () => clearTimeout(t)
  }, [toast.message])

  const loadProduct = useCallback(async () => {
    if (!productId) return null
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get(`/api/admin/products/${productId}`)
      setProduct(data)
      return data
    } catch (err) {
      setProduct(null)
      const msg = err.response?.data?.message || 'Không tải được sản phẩm.'
      setError(msg)
      setToast({ message: msg, tone: 'error' })
      return null
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    loadProduct()
  }, [loadProduct])

  const variants = useMemo(
    () => (Array.isArray(product?.variants) ? product.variants : []),
    [product],
  )

  const attributeNames = useMemo(() => {
    const attrs = product?.attributes
    if (!Array.isArray(attrs)) return []
    return attrs.map((a) => String(a?.name || '').trim()).filter(Boolean)
  }, [product])

  const filteredVariants = useMemo(() => {
    if (!searchFilter) return variants
    return variants.filter((v) => variantSearchBlob(v).includes(searchFilter))
  }, [variants, searchFilter])

  function openDrawer(v, sourceProduct = product) {
    const names = Array.isArray(sourceProduct?.attributes)
      ? sourceProduct.attributes.map((a) => String(a?.name || '').trim()).filter(Boolean)
      : []
    setDrawerVariant(v)
    setFormPrice(String(v?.price ?? ''))
    setFormOriginalPrice(
      v?.originalPrice != null && v.originalPrice !== '' ? String(v.originalPrice) : '',
    )
    setFormSku(String(v?.sku ?? ''))
    const st = v?.stock ?? v.stockQuantity
    setFormStock(st != null && st !== '' ? String(st) : '')
    const imgs = Array.isArray(v?.images) && v.images.length ? v.images : v?.image ? [v.image] : []
    setFormImagesText(imgs.filter(Boolean).join('\n'))
    setFormAvailable(v?.isAvailable !== false)
    const av = v?.attributeValues && typeof v.attributeValues === 'object' ? { ...v.attributeValues } : {}
    const next = {}
    names.forEach((name) => {
      next[name] = av[name] != null ? String(av[name]) : ''
    })
    setFormAttrValues(next)
  }

  function closeDrawer() {
    setDrawerVariant(null)
  }

  useEffect(() => {
    if (!drawerVariant) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') closeDrawer()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerVariant])

  const drawerVariantId = drawerVariant
    ? String(drawerVariant._id || drawerVariant.id || '')
    : ''

  async function savePrices() {
    if (!productId || !drawerVariantId) return
    const price = toNumberOrNull(formPrice)
    if (price == null || price < 0) {
      setToast({ message: 'Giá bán không hợp lệ.', tone: 'error' })
      return
    }
    const orig = toNumberOrNull(formOriginalPrice)
    const row = { variantId: drawerVariantId, price: Number(price) }
    if (orig != null) row.originalPrice = Number(orig)

    setSavingPrices(true)
    try {
      await api.patch(`/api/admin/products/${productId}/variant-prices`, {
        variantPrices: [row],
      })
      setToast({ message: 'Đã cập nhật giá.', tone: 'success' })
      const refreshed = await loadProduct()
      const v = (refreshed?.variants || []).find(
        (x) => String(x._id || x.id) === drawerVariantId,
      )
      if (v) openDrawer(v, refreshed)
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Không lưu được giá.',
        tone: 'error',
      })
    } finally {
      setSavingPrices(false)
    }
  }

  async function saveAvailability() {
    if (!productId || !drawerVariantId) return
    setSavingAvailability(true)
    try {
      await api.patch(
        `/api/admin/products/${productId}/variants/${drawerVariantId}/availability`,
        { isAvailable: Boolean(formAvailable) },
      )
      setToast({ message: 'Đã cập nhật trạng thái còn hàng.', tone: 'success' })
      const refreshed = await loadProduct()
      const v = (refreshed?.variants || []).find(
        (x) => String(x._id || x.id) === drawerVariantId,
      )
      if (v) openDrawer(v, refreshed)
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Không cập nhật được trạng thái.',
        tone: 'error',
      })
    } finally {
      setSavingAvailability(false)
    }
  }

  async function saveVariantDetails() {
    if (!productId || !drawerVariantId || !product) return
    const images = formImagesText
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter(Boolean)

    const attributeValues = { ...drawerVariant.attributeValues }
    attributeNames.forEach((name) => {
      const val = String(formAttrValues[name] ?? '').trim()
      if (val) attributeValues[name] = val
      else delete attributeValues[name]
    })

    const stockVal = formStock.trim()
    const updates = {
      sku: formSku.trim(),
      images,
      image: images[0] || '',
      attributeValues,
    }
    if (stockVal === '') {
      updates.stock = undefined
      updates.stockQuantity = undefined
    } else {
      const n = Number(stockVal)
      if (!Number.isFinite(n) || n < 0) {
        setToast({ message: 'Tồn kho phải là số ≥ 0 hoặc để trống.', tone: 'error' })
        return
      }
      updates.stock = n
      updates.stockQuantity = n
    }

    const mergedVariants = mergeVariantIntoList(product, drawerVariantId, updates)

    setSavingDetails(true)
    try {
      const payload = buildProductPutPayload(product, mergedVariants)
      await api.put(`/api/admin/products/${productId}`, payload)
      setToast({ message: 'Đã lưu thông tin biến thể.', tone: 'success' })
      const refreshed = await loadProduct()
      const v = (refreshed?.variants || []).find(
        (x) => String(x._id || x.id) === drawerVariantId,
      )
      if (v) openDrawer(v, refreshed)
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Không lưu được. Kiểm tra dữ liệu gửi lên.',
        tone: 'error',
      })
    } finally {
      setSavingDetails(false)
    }
  }

  const field =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20'

  const selectedId = drawerVariant ? String(drawerVariant._id || drawerVariant.id || '') : ''

  /** Khối form chỉnh biến thể — dùng chung panel desktop & drawer mobile */
  const variantEditForm = drawerVariant ? (
    <div className="space-y-6 px-5 pb-6 pt-2 lg:px-6 lg:pb-6">
      <section className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">Giá</h3>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Giá bán</label>
          <input
            type="number"
            min={0}
            value={formPrice}
            onChange={(e) => setFormPrice(e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Giá gốc (tuỳ chọn)</label>
          <input
            type="number"
            min={0}
            value={formOriginalPrice}
            onChange={(e) => setFormOriginalPrice(e.target.value)}
            className={field}
          />
        </div>
        <button
          type="button"
          disabled={savingPrices}
          onClick={savePrices}
          className="w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-95 disabled:opacity-50"
        >
          {savingPrices ? 'Đang lưu…' : 'Lưu giá'}
        </button>
      </section>

      <section className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">Hiển thị cửa hàng</h3>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
          <input
            type="checkbox"
            className="size-4 rounded border-gray-300 text-brand focus:ring-brand"
            checked={formAvailable}
            onChange={(e) => setFormAvailable(e.target.checked)}
          />
          Còn hàng (hiển thị cho khách)
        </label>
        <button
          type="button"
          disabled={savingAvailability}
          onClick={saveAvailability}
          className="w-full rounded-xl border border-gray-300 bg-white py-2.5 text-sm font-bold text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {savingAvailability ? 'Đang cập nhật…' : 'Cập nhật trạng thái'}
        </button>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">
          SKU · Tồn · Ảnh · Phân loại
        </h3>
        <p className="text-[11px] leading-relaxed text-gray-500">
          Lưu mục này gửi lại toàn bộ danh sách biến thể; chỉ dòng đang sửa thay đổi.
        </p>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">SKU</label>
          <input value={formSku} onChange={(e) => setFormSku(e.target.value)} className={field} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Tồn kho</label>
          <input
            type="number"
            min={0}
            placeholder="Để trống nếu không giới hạn số"
            value={formStock}
            onChange={(e) => setFormStock(e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            URL ảnh (mỗi dòng một link)
          </label>
          <textarea
            value={formImagesText}
            onChange={(e) => setFormImagesText(e.target.value)}
            rows={4}
            className={field}
            placeholder="https://..."
          />
        </div>
        {attributeNames.length ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-700">Phân loại</p>
            {attributeNames.map((name) => (
              <div key={name}>
                <label className="mb-1 block text-[11px] text-gray-600">{name}</label>
                <input
                  value={formAttrValues[name] ?? ''}
                  onChange={(e) =>
                    setFormAttrValues((prev) => ({ ...prev, [name]: e.target.value }))
                  }
                  className={field}
                />
              </div>
            ))}
          </div>
        ) : null}
        <button
          type="button"
          disabled={savingDetails}
          onClick={saveVariantDetails}
          className="w-full rounded-xl bg-gray-900 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {savingDetails ? 'Đang lưu…' : 'Lưu chi tiết biến thể'}
        </button>
      </section>
    </div>
  ) : null

  if (loading && !product) {
    return (
      <div>
        <p className="text-sm text-gray-500">Đang tải sản phẩm...</p>
      </div>
    )
  }

  if (error && !product) {
    return (
      <div className="space-y-3">
        <Link to="/admin/products" className="text-sm font-semibold text-brand hover:underline">
          ← Danh sách sản phẩm
        </Link>
        <p className="text-sm font-semibold text-red-600">{error}</p>
      </div>
    )
  }

  const productName = String(product?.name || 'Sản phẩm')
  const catLabel = categoryLabelFromProduct(product)

  const panelTitle = drawerVariant ? (
    <div className="border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white px-5 py-4 lg:rounded-t-2xl">
      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
        Biến thể đang chỉnh
      </p>
      <p className="mt-1 line-clamp-2 text-base font-bold text-gray-900">
        {variantDisplayName(drawerVariant)}
      </p>
      <p className="mt-1 font-mono text-[11px] text-gray-500">ID: {selectedId}</p>
    </div>
  ) : null

  return (
    <div className="pb-8">
      <Link
        to="/admin/variants"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-brand"
      >
        <ArrowLeft className="size-4" />
        Trung tâm biến thể
      </Link>

      {/* Hero — trang đích riêng, không như popup */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-brand/5" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-brand">
              <Layers className="size-6" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <nav className="mb-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-gray-500">
                <Link to="/admin/variants" className="font-medium hover:text-brand">
                  Biến thể
                </Link>
                <span>/</span>
                <span className="line-clamp-1 max-w-[200px] font-medium text-gray-700 sm:max-w-md">
                  {productName}
                </span>
                <span>/</span>
                <span className="font-semibold text-gray-900">Chi tiết</span>
              </nav>
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 lg:text-3xl">
                Quản lý biến thể
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
                Trang riêng cho từng sản phẩm: xem nhanh SKU / giá / tồn, chỉnh bên phải (màn hình lớn) hoặc
                khối trượt (điện thoại).
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-800">
                  {variants.length} biến thể
                </span>
                {catLabel ? (
                  <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700">
                    {catLabel}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col xl:flex-row">
            <Link
              to={`/admin/products/${productId}/edit`}
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-800 shadow-sm transition hover:bg-gray-50"
            >
              Sửa sản phẩm
            </Link>
            <Link
              to={`/admin/products/${productId}/prices`}
              className="inline-flex items-center justify-center rounded-xl border border-brand/30 bg-brand/5 px-4 py-2.5 text-sm font-bold text-brand shadow-sm transition hover:bg-brand/10"
            >
              Chỉnh giá nhanh
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 lg:grid lg:grid-cols-1 lg:gap-8 xl:grid-cols-[1fr_minmax(380px,440px)] xl:items-start">
        {/* Cột danh sách */}
        <div className="min-w-0 space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên biến thể, SKU, thuộc tính…"
              className={`${field} pl-10`}
              autoComplete="off"
            />
          </div>

          {variants.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
              <p className="text-sm font-medium text-gray-700">Chưa có biến thể</p>
              <p className="mt-2 text-sm text-gray-500">
                Thêm biến thể trong form sản phẩm đầy đủ.
              </p>
              <Link
                to={`/admin/products/${productId}/edit`}
                className="mt-4 inline-block text-sm font-bold text-brand hover:underline"
              >
                Mở form sản phẩm →
              </Link>
            </div>
          ) : filteredVariants.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500">
              Không có dòng nào khớp. Thử bỏ bớt từ khóa.
            </div>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
                <div className="border-b border-gray-100 bg-gray-50/90 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Danh sách — click dòng hoặc «Sửa» để chỉnh bên phải
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-gray-200 bg-gray-50/50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Biến thể</th>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3">Giá</th>
                        <th className="px-4 py-3">Giá gốc</th>
                        <th className="px-4 py-3">Tồn</th>
                        <th className="px-4 py-3">Còn hàng</th>
                        <th className="w-24 px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredVariants.map((v) => {
                        const vid = String(v._id || v.id)
                        const st = v.stock ?? v.stockQuantity
                        const isSel = selectedId && vid === selectedId
                        return (
                          <tr
                            key={vid}
                            className={`cursor-pointer transition-colors ${
                              isSel
                                ? 'bg-red-50/90 ring-1 ring-inset ring-brand/25'
                                : 'hover:bg-gray-50/90'
                            }`}
                            onClick={() => openDrawer(v)}
                          >
                            <td className="max-w-[220px] px-4 py-3 font-medium text-gray-900">
                              <span className="line-clamp-2">{variantDisplayName(v)}</span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-800">
                              {String(v.sku || '').trim() || '—'}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 font-semibold text-brand">
                              {formatVnd(v.price)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                              {v.originalPrice != null && v.originalPrice !== ''
                                ? formatVnd(v.originalPrice)
                                : '—'}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {st != null && st !== '' ? String(st) : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                                  v.isAvailable !== false
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-gray-200 text-gray-600'
                                }`}
                              >
                                {v.isAvailable !== false ? 'Còn' : 'Hết'}
                              </span>
                            </td>
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => openDrawer(v)}
                                className="rounded-lg border border-brand/40 bg-white px-3 py-1.5 text-xs font-bold text-brand shadow-sm hover:bg-brand/5"
                              >
                                Sửa
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <ul className="space-y-3 md:hidden">
                {filteredVariants.map((v) => {
                  const vid = String(v._id || v.id)
                  const st = v.stock ?? v.stockQuantity
                  const isSel = selectedId && vid === selectedId
                  return (
                    <li
                      key={vid}
                      className={`rounded-2xl border p-4 shadow-sm transition-colors ${
                        isSel
                          ? 'border-brand/40 bg-red-50/50 ring-1 ring-brand/20'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <p className="font-semibold text-gray-900">{variantDisplayName(v)}</p>
                      <p className="mt-1 font-mono text-xs text-gray-600">
                        SKU: {String(v.sku || '').trim() || '—'}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3 text-sm">
                        <span className="font-bold text-brand">{formatVnd(v.price)}</span>
                        {v.originalPrice != null && v.originalPrice !== '' ? (
                          <span className="text-gray-500 line-through">
                            {formatVnd(v.originalPrice)}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Tồn: {st != null && st !== '' ? st : '—'} ·{' '}
                        <span
                          className={
                            v.isAvailable !== false ? 'text-emerald-700' : 'text-gray-500'
                          }
                        >
                          {v.isAvailable !== false ? 'Còn hàng' : 'Hết hàng'}
                        </span>
                      </p>
                      <button
                        type="button"
                        onClick={() => openDrawer(v)}
                        className="mt-3 w-full rounded-xl border border-brand/30 bg-brand/5 py-2.5 text-sm font-bold text-brand"
                      >
                        Mở chỉnh sửa
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>

        {/* Panel cố định — chỉ desktop */}
        <aside className="mt-8 hidden min-h-[320px] xl:sticky xl:top-5 xl:mt-0 xl:block">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md ring-1 ring-black/[0.03]">
            {drawerVariant ? (
              <>
                {panelTitle}
                <div className="max-h-[calc(100vh-12rem)] overflow-y-auto overscroll-contain">
                  {variantEditForm}
                </div>
              </>
            ) : (
              <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-12 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                  <Layers className="size-7" />
                </div>
                <p className="mt-4 text-sm font-semibold text-gray-800">Chọn một biến thể</p>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-500">
                  Click một dòng trong bảng hoặc nút «Sửa» để chỉnh giá, tồn và SKU tại đây — không cần
                  đóng trang.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Drawer — chỉ mobile / tablet */}
      {drawerVariant ? (
        <div className="fixed inset-0 z-[100] flex justify-end xl:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            aria-label="Đóng"
            onClick={closeDrawer}
          />
          <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex flex-shrink-0 items-start justify-between gap-2 border-b border-gray-100 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase text-gray-500">Chỉnh biến thể</p>
                <p className="mt-0.5 font-semibold text-gray-900">
                  {variantDisplayName(drawerVariant)}
                </p>
                <p className="mt-1 font-mono text-[11px] text-gray-500">ID: {selectedId}</p>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="rounded-xl p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Đóng"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{variantEditForm}</div>
          </div>
        </div>
      ) : null}

      {toast.message ? (
        <div
          className={`fixed bottom-4 right-4 z-[130] max-w-sm rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-lg ${
            toast.tone === 'error' ? 'bg-red-600' : 'bg-emerald-600'
          }`}
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  )
}
