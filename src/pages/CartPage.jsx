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
  } = useCart()

  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('all')
  const [contact, setContact] = useState({
    name: '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
  })
  const [submitting, setSubmitting] = useState(false)
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
    if (!contact.email?.trim() && !contact.phone?.trim()) {
      setError('Nhập email hoặc số điện thoại liên hệ.')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/api/orders', {
        contact,
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
      removeSelectedLines()
      setSuccessOpen(true)
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
    <div className="min-h-svh bg-page font-sans text-ink">
      <Header
        searchQuery={search}
        onSearchQueryChange={setSearch}
        brandFilter={brandFilter}
        onBrandFilterChange={setBrandFilter}
      />

      <main className="mx-auto max-w-[900px] px-3 py-6 sm:px-4">
        <h1 className="text-xl font-extrabold text-ink">Giỏ hàng</h1>
        <p className="mt-1 text-sm text-gray-600">
          Chọn sản phẩm cần thanh toán. Tổng tiền chỉ tính các dòng được tick.
        </p>

        {items.length === 0 ? (
          <p className="mt-8 text-center text-gray-600">
            Giỏ hàng trống.{' '}
            <Link to="/" className="font-bold text-brand">
              Tiếp tục mua sắm
            </Link>
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            <label className="flex cursor-pointer items-center gap-2 border-b border-gray-200 pb-3 text-sm font-bold">
              <input
                ref={selectAllRef}
                type="checkbox"
                checked={allSelected}
                onChange={(e) => toggleSelectAll(e.target.checked)}
                className="size-4 rounded border-gray-300 text-brand"
              />
              Chọn tất cả
            </label>

            <ul className="space-y-3">
              {items.map((line) => (
                <li
                  key={line.lineId}
                  className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <input
                      type="checkbox"
                      checked={line.selected}
                      onChange={() => toggleSelect(line.lineId)}
                      className="mt-1 size-4 shrink-0 rounded border-gray-300 text-brand"
                    />
                    {line.image ? (
                      <img
                        src={line.image}
                        alt=""
                        className="size-16 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="size-16 shrink-0 rounded bg-gray-100" />
                    )}
                    <div className="min-w-0">
                      <Link
                        to={`/product/${line.productId}`}
                        className="font-semibold text-ink hover:text-brand"
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
                      <p className="mt-1 text-sm font-bold text-brand">
                        {formatVnd(line.salePrice)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    <div className="inline-flex items-stretch overflow-hidden rounded border border-gray-300">
                      <button
                        type="button"
                        className="px-2 py-1 text-sm font-bold"
                        onClick={() =>
                          setLineQuantity(line.lineId, line.quantity - 1)
                        }
                      >
                        −
                      </button>
                      <span className="flex min-w-8 items-center justify-center border-x border-gray-300 px-2 text-sm font-bold">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        className="px-2 py-1 text-sm font-bold"
                        onClick={() =>
                          setLineQuantity(line.lineId, line.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(line.lineId)}
                      className="text-gray-400 hover:text-brand"
                      aria-label="Xóa"
                    >
                      <Trash2 className="size-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Tổng (đã chọn)</span>
                <span className="text-xl font-extrabold text-brand">
                  {formatVnd(selectedTotal)}
                </span>
              </div>

              <form onSubmit={handleCheckout} className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                <p className="text-sm font-bold text-ink">Thông tin liên hệ</p>
                <input
                  type="text"
                  placeholder="Họ tên"
                  value={contact.name}
                  onChange={(e) =>
                    setContact((c) => ({ ...c, name: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={contact.email}
                  onChange={(e) =>
                    setContact((c) => ({ ...c, email: e.target.value }))
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
                {error ? (
                  <p className="text-sm font-semibold text-brand">{error}</p>
                ) : null}
                <button
                  type="submit"
                  disabled={submitting || !selectedItems.length}
                  className="w-full rounded-lg bg-brand py-3 text-sm font-extrabold uppercase text-white disabled:opacity-50"
                >
                  {submitting ? 'Đang gửi...' : 'Thanh toán'}
                </button>
              </form>
            </div>
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
