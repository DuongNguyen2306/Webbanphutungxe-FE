import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, Reorder } from 'framer-motion'
import { api } from '../../api/client'
import { formatVnd } from '../../utils/format'
import { showUiToast } from '../../utils/uiToast'
import {
  GripVertical,
  Image as ImageIcon,
  Loader2,
  PackageOpen,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react'

const MAX_ITEMS = 12

function toProductList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.products)) return data.products
  return []
}

function getBestSellerEnabled(item) {
  if (typeof item?.bestSellerEnabled === 'boolean') return item.bestSellerEnabled
  if (typeof item?.isBestSeller === 'boolean') return item.isBestSeller
  if (typeof item?.showInBestSellers === 'boolean') return item.showInBestSellers
  const raw =
    item?.bestSellerEnabled ??
    item?.isBestSeller ??
    item?.showInBestSellers ??
    item?.bestSeller ??
    item?.featured
  if (typeof raw === 'number') return raw === 1
  if (typeof raw === 'string') {
    const normalized = raw.trim().toLowerCase()
    return ['1', 'true', 'yes', 'on'].includes(normalized)
  }
  return false
}

function getBestSellerOrder(item) {
  const n = Number(item?.bestSellerOrder ?? item?.bestSellerRank ?? item?.bestSellerPosition ?? 0)
  return Number.isFinite(n) ? n : 0
}

function getProductPrice(item) {
  const variants = Array.isArray(item?.variants) ? item.variants : []
  if (variants.length) {
    const prices = variants.map((v) => Number(v?.price)).filter((n) => Number.isFinite(n))
    if (prices.length) return Math.min(...prices)
  }
  return Number(item?.price ?? item?.salePrice ?? 0)
}

function getProductImage(item) {
  const images = Array.isArray(item?.images) ? item.images.filter(Boolean) : []
  if (images.length) return images[0]
  const variants = Array.isArray(item?.variants) ? item.variants : []
  for (const v of variants) {
    const vImages = Array.isArray(v?.images) ? v.images.filter(Boolean) : []
    if (vImages.length) return vImages[0]
  }
  return ''
}

function toProductId(item) {
  return String(item?._id || item?.id || '')
}

function buildUpdatePayload(product, enabled, order) {
  const safeOrder = Number.isFinite(Number(order)) ? Math.max(0, Number(order)) : 0
  return {
    ...product,
    bestSellerEnabled: enabled,
    bestSellerOrder: safeOrder,
    isBestSeller: enabled,
    showInBestSellers: enabled,
    bestSellerRank: safeOrder,
    bestSellerPosition: safeOrder,
  }
}

export function AdminBestSellersConfig() {
  const [allProducts, setAllProducts] = useState([])
  const [bestSellers, setBestSellers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState('')
  const [initialSnapshot, setInitialSnapshot] = useState('[]')

  async function load() {
    setLoading(true)
    try {
      const { data } = await api.get('/api/admin/products')
      const list = toProductList(data)
      setAllProducts(list)
      const preselected = [...list]
        .filter((item) => getBestSellerEnabled(item))
        .sort((a, b) => getBestSellerOrder(a) - getBestSellerOrder(b))
        .slice(0, MAX_ITEMS)
        .map((item, idx) => ({
          id: String(item._id || item.id),
          name: String(item.name || ''),
          price: getProductPrice(item),
          image: getProductImage(item),
          adImage: '',
          raw: item,
          order: idx,
        }))
      setBestSellers(preselected)
      setInitialSnapshot(
        JSON.stringify(
          preselected.map((item, idx) => ({
            id: item.id,
            order: idx,
            adImage: item.adImage || '',
          })),
        ),
      )
    } catch (err) {
      showUiToast(err?.response?.data?.message || 'Không tải được danh sách sản phẩm.', 'error')
      setAllProducts([])
      setBestSellers([])
      setInitialSnapshot('[]')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const selectedIds = useMemo(
    () => new Set(bestSellers.map((item) => item.id)),
    [bestSellers],
  )

  const warehouseItems = useMemo(() => {
    const q = String(query || '').trim().toLowerCase()
    return allProducts
      .filter((p) => !selectedIds.has(String(p._id || p.id)))
      .filter((p) => !q || String(p.name || '').toLowerCase().includes(q))
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'vi'))
  }, [allProducts, query, selectedIds])

  const snapshotNow = useMemo(
    () =>
      JSON.stringify(
        bestSellers.map((item, idx) => ({
          id: item.id,
          order: idx,
          adImage: item.adImage || '',
        })),
      ),
    [bestSellers],
  )
  const hasChanges = snapshotNow !== initialSnapshot

  function addBestSeller(product) {
    if (bestSellers.length >= MAX_ITEMS) {
      showUiToast(`Chỉ tối đa ${MAX_ITEMS} sản phẩm nổi bật.`, 'error')
      return
    }
    const id = String(product._id || product.id)
    if (!id || selectedIds.has(id)) return
    setBestSellers((prev) => [
      ...prev,
      {
        id,
        name: String(product.name || ''),
        price: getProductPrice(product),
        image: getProductImage(product),
        adImage: '',
        raw: product,
        order: prev.length,
      },
    ])
    setQuery('')
  }

  function removeBestSeller(id) {
    setBestSellers((prev) => prev.filter((item) => item.id !== id))
  }

  async function handleChangePromoImage(item) {
    try {
      const opener = window.openGooglePicker
      let pickedUrl = ''
      if (typeof opener === 'function') {
        const result = await opener({ multiple: false })
        pickedUrl = String(result?.[0]?.url || result?.[0]?.googleDriveUrl || '').trim()
      } else {
        pickedUrl = String(window.prompt('Nhập URL ảnh quảng cáo:', item.adImage || item.image || '') || '').trim()
      }
      if (!pickedUrl) return
      setBestSellers((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, adImage: pickedUrl } : x)),
      )
    } catch {
      showUiToast('Không đổi được ảnh quảng cáo. Vui lòng thử lại.', 'error')
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const currentEnabled = allProducts.filter((p) => getBestSellerEnabled(p))
      const selectedIdSet = new Set(bestSellers.map((item) => item.id))
      const disableTargets = currentEnabled.filter(
        (p) => !selectedIdSet.has(toProductId(p)),
      )

      await Promise.all([
        ...bestSellers.map((item, index) =>
          api.put(
            `/api/admin/products/${item.id}`,
            buildUpdatePayload(item.raw, true, index),
          ),
        ),
        ...disableTargets.map((item) =>
          api.put(
            `/api/admin/products/${toProductId(item)}`,
            buildUpdatePayload(item, false, getBestSellerOrder(item)),
          ),
        ),
      ])
      showUiToast('Đã lưu cấu hình sản phẩm nổi bật.')
      setInitialSnapshot(
        JSON.stringify(
          bestSellers.map((item, idx) => ({
            id: item.id,
            order: idx,
            adImage: item.adImage || '',
          })),
        ),
      )
      await load()
    } catch (err) {
      showUiToast(err?.response?.data?.message || 'Không lưu được cấu hình.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-3xl bg-[#F3F4F6] p-4 sm:p-5">
      <header className="mb-4">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Cấu hình Sản phẩm Nổi bật
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Kéo thả để sắp xếp thứ tự hiển thị trên website.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-gray-500">Đang tải dữ liệu sản phẩm...</p>
      ) : (
        <div className="grid h-[calc(100svh-13rem)] grid-cols-1 gap-4 lg:grid-cols-5">
          <section className="flex min-h-0 flex-col rounded-3xl bg-white p-4 shadow-sm lg:col-span-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm sản phẩm trong kho..."
                className="w-full rounded-2xl border border-gray-200 bg-[#F9FAFB] py-2.5 pl-10 pr-3 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-200"
              />
            </div>

            <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="space-y-2">
                {warehouseItems.map((item) => (
                  <div
                    key={item._id || item.id}
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-[#F9FAFB] p-2.5"
                  >
                    <div className="size-14 overflow-hidden rounded-xl bg-gray-100">
                      {getProductImage(item) ? (
                        <img src={getProductImage(item)} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-gray-900">{item.name}</p>
                      <p className="mt-0.5 text-xs font-bold text-teal-700">
                        {formatVnd(getProductPrice(item))}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addBestSeller(item)}
                      className="inline-flex items-center rounded-xl bg-teal-700 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-teal-800"
                    >
                      <Plus className="mr-1 size-3.5" />
                      Thêm
                    </button>
                  </div>
                ))}
                {warehouseItems.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-500">Không còn sản phẩm phù hợp để thêm.</p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="flex min-h-0 flex-col rounded-3xl bg-white p-4 shadow-sm lg:col-span-3">
            <h2 className="text-base font-extrabold text-slate-900">
              Sản phẩm sẽ hiện trên trang chủ
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Danh sách ưu tiên hiển thị (1, 2, 3...). Tối đa {MAX_ITEMS} sản phẩm.
            </p>

            <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
              {bestSellers.length === 0 ? (
                <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-[#F9FAFB] text-center">
                  <PackageOpen className="size-9 text-gray-400" />
                  <p className="mt-3 text-sm font-semibold text-gray-700">
                    Kéo sản phẩm vào đây hoặc nhấn dấu (+) để bắt đầu
                  </p>
                </div>
              ) : (
                <Reorder.Group axis="y" values={bestSellers} onReorder={setBestSellers} className="space-y-3">
                  <AnimatePresence initial={false}>
                    {bestSellers.map((item, idx) => (
                      <Reorder.Item
                        key={item.id}
                        value={item}
                        layout
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
                        whileDrag={{
                          scale: 1.02,
                          boxShadow: '0 18px 40px rgba(15, 23, 42, 0.22)',
                          zIndex: 20,
                        }}
                        className="group rounded-2xl border border-gray-200 bg-white p-3 shadow-sm"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <button
                            type="button"
                            className="inline-flex cursor-grab items-center self-start rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:text-gray-700 active:cursor-grabbing"
                            aria-label="Kéo thả sắp xếp"
                          >
                            <GripVertical className="size-4" />
                          </button>

                          <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                            {item.adImage || item.image ? (
                              <img src={item.adImage || item.image} alt={item.name} className="h-full w-full object-cover" />
                            ) : null}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm font-bold text-slate-900">{item.name}</p>
                            <p className="mt-1 text-sm font-extrabold text-teal-700">{formatVnd(item.price)}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => handleChangePromoImage(item)}
                                className="inline-flex items-center gap-1 rounded-lg border border-teal-200 px-2.5 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-50"
                              >
                                <ImageIcon className="size-3.5" />
                                Đổi ảnh từ Drive
                              </button>
                              <button
                                type="button"
                                onClick={() => removeBestSeller(item.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="size-3.5" />
                                Xóa
                              </button>
                            </div>
                          </div>

                          <span className="self-start rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                            #{idx + 1}
                          </span>
                        </div>
                      </Reorder.Item>
                    ))}
                  </AnimatePresence>
                </Reorder.Group>
              )}
            </div>
          </section>
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !hasChanges}
        className={`fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white shadow-xl transition ${
          hasChanges
            ? 'bg-teal-700 hover:bg-teal-800'
            : 'cursor-not-allowed bg-gray-400'
        } disabled:opacity-80`}
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Lưu thay đổi
      </button>
    </section>
  )
}
