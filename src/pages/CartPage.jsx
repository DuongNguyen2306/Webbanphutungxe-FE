import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { Header } from '../components/Header'
import { SiteFooter } from '../components/SiteFooter'
import { CheckoutSuccessModal } from '../components/CheckoutSuccessModal'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import { formatVnd } from '../utils/format'

export function CartPage() {
  const {
    items,
    toggleSelect,
    toggleSelectAll,
    allSelected,
    someSelected,
    selectedTotal,
    selectedItems,
    setLineQuantity,
    removeLine,
    removeSelectedLines,
    lineLoadingMap,
    cartSyncing,
    cartReady,
    cartError,
    mergeError,
    needsMergeRetry,
    retryMergeGuestCart,
  } = useCart()

  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('all')
  const [contact, setContact] = useState({
    name: '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
  })
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [wards, setWards] = useState([])
  const [address, setAddress] = useState({
    provinceCode: '',
    provinceName: '',
    districtCode: '',
    districtName: '',
    wardCode: '',
    wardName: '',
    detail: '',
    note: '',
  })
  const [loadingProvince, setLoadingProvince] = useState(false)
  const [loadingDistrict, setLoadingDistrict] = useState(false)
  const [loadingWard, setLoadingWard] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [error, setError] = useState('')
  const [successOpen, setSuccessOpen] = useState(false)
  const selectAllRef = useRef(null)

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected && !allSelected
    }
  }, [someSelected, allSelected])

  useEffect(() => {
    if (user) {
      setContact((c) => ({
        ...c,
        email: c.email || user.email || '',
        phone: c.phone || user.phone || '',
      }))
    }
  }, [user])

  useEffect(() => {
    if (!checkoutOpen || provinces.length) return
    let cancel = false
    setLoadingProvince(true)
    fetch('https://provinces.open-api.vn/api/p/')
      .then((r) => r.json())
      .then((data) => {
        if (cancel) return
        setProvinces(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (cancel) return
        setProvinces([])
      })
      .finally(() => {
        if (!cancel) setLoadingProvince(false)
      })
    return () => {
      cancel = true
    }
  }, [checkoutOpen, provinces.length])

  async function handleProvinceChange(code) {
    const province = provinces.find((p) => String(p.code) === String(code))
    setAddress((prev) => ({
      ...prev,
      provinceCode: String(code || ''),
      provinceName: province?.name || '',
      districtCode: '',
      districtName: '',
      wardCode: '',
      wardName: '',
    }))
    setDistricts([])
    setWards([])
    if (!code) return
    setLoadingDistrict(true)
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`)
      const data = await res.json()
      setDistricts(Array.isArray(data?.districts) ? data.districts : [])
    } catch {
      setDistricts([])
    } finally {
      setLoadingDistrict(false)
    }
  }

  async function handleDistrictChange(code) {
    const district = districts.find((d) => String(d.code) === String(code))
    setAddress((prev) => ({
      ...prev,
      districtCode: String(code || ''),
      districtName: district?.name || '',
      wardCode: '',
      wardName: '',
    }))
    setWards([])
    if (!code) return
    setLoadingWard(true)
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`)
      const data = await res.json()
      setWards(Array.isArray(data?.wards) ? data.wards : [])
    } catch {
      setWards([])
    } finally {
      setLoadingWard(false)
    }
  }

  function handleWardChange(code) {
    const ward = wards.find((w) => String(w.code) === String(code))
    setAddress((prev) => ({
      ...prev,
      wardCode: String(code || ''),
      wardName: ward?.name || '',
    }))
  }

  const invalidMongo = selectedItems.some((x) => !x.mongoOk)

  async function handleCheckout(e) {
    e.preventDefault()
    setError('')
    if (!selectedItems.length) {
      setError('Vui lòng chọn ít nhất một sản phẩm để thanh toán.')
      return
    }
    if (invalidMongo) {
      setError(
        'Giỏ có sản phẩm ngoài kho MongoDB (chế độ offline). Khởi động API + seed hoặc thêm SP từ admin.',
      )
      return
    }
    if (!contact.name.trim()) {
      setError('Vui lòng nhập họ và tên.')
      return
    }
    if (!/^\d{10}$/.test(String(contact.phone || '').replace(/\D/g, ''))) {
      setError('Số điện thoại phải gồm đúng 10 chữ số.')
      return
    }
    if (!address.provinceCode || !address.districtCode || !address.wardCode) {
      setError('Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện và Phường/Xã.')
      return
    }
    if (!address.detail.trim()) {
      setError('Vui lòng nhập địa chỉ cụ thể.')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/api/orders', {
        contact: {
          name: contact.name.trim(),
          email: contact.email?.trim() || '',
          phone: String(contact.phone || '').replace(/\D/g, ''),
        },
        shippingAddress: {
          provinceCode: address.provinceCode,
          provinceName: address.provinceName,
          districtCode: address.districtCode,
          districtName: address.districtName,
          wardCode: address.wardCode,
          wardName: address.wardName,
          detail: address.detail.trim(),
          note: address.note.trim(),
        },
        totalAmount: selectedTotal,
        items: selectedItems.map((x) => ({
          productId: x.productId,
          variantId: x.variantId,
          name: x.name,
          variantLabel: x.variantLabel,
          quantity: x.quantity,
          price: x.salePrice,
        })),
      })
      await removeSelectedLines()
      setSuccessOpen(true)
      setCheckoutOpen(false)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Không gửi được đơn. Kiểm tra API MongoDB và thử lại.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-svh bg-[#F9FAFB] font-sans text-ink">
      <Header
        searchQuery={search}
        onSearchQueryChange={setSearch}
        brandFilter={brandFilter}
        onBrandFilterChange={setBrandFilter}
      />

      <main className="mx-auto max-w-[1200px] px-4 py-6">
        <h1 className="text-xl font-extrabold text-ink">Giỏ hàng</h1>
        <p className="mt-1 text-sm text-gray-600">
          Chọn sản phẩm cần thanh toán. Tổng tiền chỉ tính các dòng được tick.
        </p>
        {!cartReady || cartSyncing ? (
          <p className="mt-2 text-sm text-gray-500">Đang đồng bộ giỏ hàng...</p>
        ) : null}
        {cartError ? (
          <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {cartError}
          </p>
        ) : null}
        {needsMergeRetry ? (
          <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <p>{mergeError || 'Giỏ hàng chưa đồng bộ sau đăng nhập.'}</p>
            <button
              type="button"
              onClick={() => retryMergeGuestCart()}
              className="mt-1 font-semibold underline"
            >
              Thử đồng bộ lại
            </button>
          </div>
        ) : null}

        {items.length === 0 ? (
          <p className="mt-8 text-center text-gray-600">
            Giỏ hàng trống.{' '}
            <Link to="/" className="font-bold text-brand">
              Tiếp tục mua sắm
            </Link>
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <section className="lg:col-span-2">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <label className="sticky top-0 z-10 flex cursor-pointer items-center gap-2 border-b border-gray-200 bg-white px-4 py-3 text-sm font-bold">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="size-4 rounded border-gray-300 text-brand"
                  />
                  Chọn tất cả
                </label>

                <ul className="divide-y divide-gray-100">
                  {items.map((line) => (
                    <li key={line.lineId} className="px-4 py-3">
                      {Boolean(lineLoadingMap[line.lineId]) ? (
                        <p className="mb-2 text-xs font-medium text-gray-500">Đang cập nhật...</p>
                      ) : null}
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <input
                            type="checkbox"
                            checked={line.selected}
                            onChange={() => toggleSelect(line.lineId)}
                            className="size-4 shrink-0 rounded border-gray-300 text-brand"
                          />
                          {line.image ? (
                            <img
                              src={line.image}
                              alt=""
                              className="size-16 shrink-0 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="size-16 shrink-0 rounded-lg bg-gray-100" />
                          )}
                          <div className="min-w-0">
                            <Link
                              to={`/product/${line.productId}`}
                              className="line-clamp-2 font-semibold text-ink hover:text-brand"
                            >
                              {line.name}
                            </Link>
                            {line.variantLabel ? (
                              <p className="text-xs text-gray-500">{line.variantLabel}</p>
                            ) : null}
                            {!line.mongoOk ? (
                              <p className="mt-1 text-xs font-semibold text-amber-700">
                                Offline — không đặt qua MongoDB
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 lg:w-[320px] lg:justify-end">
                          <div className="inline-flex items-stretch overflow-hidden rounded-lg border border-gray-300">
                            <button
                              type="button"
                              className="px-3 py-1.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
                              onClick={() => setLineQuantity(line.lineId, line.quantity - 1)}
                              disabled={Boolean(lineLoadingMap[line.lineId])}
                            >
                              −
                            </button>
                            <span className="flex min-w-10 items-center justify-center border-x border-gray-300 px-2 text-sm font-bold">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              className="px-3 py-1.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
                              onClick={() => setLineQuantity(line.lineId, line.quantity + 1)}
                              disabled={Boolean(lineLoadingMap[line.lineId])}
                            >
                              +
                            </button>
                          </div>

                          <p className="min-w-24 text-right text-sm font-bold text-brand">
                            {formatVnd(line.salePrice * line.quantity)}
                          </p>

                          <button
                            type="button"
                            onClick={() => removeLine(line.lineId)}
                            disabled={Boolean(lineLoadingMap[line.lineId])}
                            className="text-gray-400 hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label="Xóa"
                          >
                            <Trash2 className="size-5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <aside className="lg:col-span-1">
              <div className="space-y-4 lg:sticky lg:top-24">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <h2 className="text-base font-extrabold text-ink">Tóm tắt đơn hàng</h2>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between text-gray-600">
                      <span>Tạm tính</span>
                      <span className="font-semibold text-gray-900">{formatVnd(selectedTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600">
                      <span>Phí vận chuyển</span>
                      <span className="font-semibold text-gray-900">{formatVnd(0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600">
                      <span>Giảm giá</span>
                      <span className="font-semibold text-gray-900">{formatVnd(0)}</span>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">Tổng cộng</span>
                      <span className="text-2xl font-extrabold text-[#BC1F26]">
                        {formatVnd(selectedTotal)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setError('')
                      setCheckoutOpen(true)
                    }}
                    disabled={!selectedItems.length || user?.role === 'admin'}
                    className="mt-4 w-full rounded-lg bg-[#BC1F26] py-3 text-sm font-extrabold uppercase text-white disabled:opacity-50"
                  >
                    GỬI ĐƠN HÀNG
                  </button>
                </div>

                {checkoutOpen ? (
                  <form
                    onSubmit={handleCheckout}
                    className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <p className="text-sm font-bold text-ink">Thông tin liên hệ</p>
                    <input
                      type="text"
                      placeholder="Họ và tên"
                      value={contact.name}
                      onChange={(e) =>
                        setContact((c) => ({ ...c, name: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                    <input
                      type="tel"
                      placeholder="Số điện thoại"
                      value={contact.phone}
                      onChange={(e) =>
                        setContact((c) => ({ ...c, phone: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                    <select
                      value={address.provinceCode}
                      onChange={(e) => handleProvinceChange(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                      disabled={loadingProvince}
                    >
                      <option value="">
                        {loadingProvince ? 'Đang tải tỉnh/thành...' : 'Chọn Tỉnh/Thành'}
                      </option>
                      {provinces.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={address.districtCode}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:bg-gray-100"
                      disabled={!address.provinceCode || loadingDistrict}
                    >
                      <option value="">
                        {!address.provinceCode
                          ? 'Chọn Quận/Huyện'
                          : loadingDistrict
                            ? 'Đang tải quận/huyện...'
                            : 'Chọn Quận/Huyện'}
                      </option>
                      {districts.map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={address.wardCode}
                      onChange={(e) => handleWardChange(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:bg-gray-100"
                      disabled={!address.districtCode || loadingWard}
                    >
                      <option value="">
                        {!address.districtCode
                          ? 'Chọn Phường/Xã'
                          : loadingWard
                            ? 'Đang tải phường/xã...'
                            : 'Chọn Phường/Xã'}
                      </option>
                      {wards.map((w) => (
                        <option key={w.code} value={w.code}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Địa chỉ cụ thể (số nhà, tên đường...)"
                      value={address.detail}
                      onChange={(e) =>
                        setAddress((prev) => ({ ...prev, detail: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                    <textarea
                      placeholder="Ghi chú (không bắt buộc)"
                      value={address.note}
                      onChange={(e) =>
                        setAddress((prev) => ({ ...prev, note: e.target.value }))
                      }
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                    {error ? (
                      <p className="text-sm font-semibold text-brand">{error}</p>
                    ) : null}
                    {user?.role === 'admin' ? (
                      <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800">
                        Tài khoản Admin không có chức năng mua hàng
                      </p>
                    ) : null}
                    <button
                      type="submit"
                      disabled={submitting || !selectedItems.length || user?.role === 'admin'}
                      className="w-full rounded-lg bg-[#BC1F26] py-3 text-sm font-extrabold uppercase text-white disabled:opacity-50"
                    >
                      {submitting ? 'Đang gửi...' : 'GỬI ĐƠN HÀNG'}
                    </button>
                  </form>
                ) : null}
              </div>
            </aside>
          </div>
        )}
      </main>

      <SiteFooter />
      <CheckoutSuccessModal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
      />
    </div>
  )
}
