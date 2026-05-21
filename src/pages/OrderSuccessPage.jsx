import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, Home, ShoppingBag } from 'lucide-react'
import { Header } from '../components/Header'
import { SiteFooter } from '../components/SiteFooter'
import { formatVnd } from '../utils/format'
import {
  clearOrderConfirmation,
  loadOrderConfirmation,
  saveOrderConfirmation,
} from '../utils/orderConfirmationStorage'

function formatPhoneDisplay(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  }
  return digits || '—'
}

function resolveAddressText(order) {
  const text = String(order?.shippingAddressText || '').trim()
  if (text) return text
  const addr = order?.shippingAddress
  if (!addr) return ''
  return [addr.detail, addr.ward, addr.district, addr.province]
    .map((x) => String(x || '').trim())
    .filter(Boolean)
    .join(', ')
}

export function OrderSuccessPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const confirmation = useMemo(() => {
    const fromState = location.state?.confirmation
    if (fromState?.order) return fromState
    return loadOrderConfirmation()
  }, [location.state])

  useEffect(() => {
    if (location.state?.confirmation?.order) {
      saveOrderConfirmation(location.state.confirmation)
    }
  }, [location.state])

  const order = confirmation?.order
  const addressText = order ? resolveAddressText(order) : ''

  if (!order) {
    return (
      <div className="min-h-svh bg-page font-sans text-ink">
        <Header searchQuery={search} onSearchQueryChange={setSearch} />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="text-xl font-extrabold text-gray-900">
            Không tìm thấy thông tin đơn
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Phiên xác nhận có thể đã hết hạn. Bạn có thể tiếp tục mua sắm hoặc liên hệ shop nếu vừa
            đặt hàng.
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-bold text-white"
          >
            <Home className="size-4" />
            Về trang chủ
          </Link>
        </main>
        <SiteFooter />
      </div>
    )
  }

  const displayCode = order.orderCode || '—'
  const grandTotal = Number(order.totalAmount) + Number(order.shippingFee || 0)

  return (
    <div className="min-h-svh bg-page font-sans text-ink">
      <Header searchQuery={search} onSearchQueryChange={setSearch} />
      <main className="mx-auto w-full max-w-[720px] px-4 py-8">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-center shadow-sm">
          <CheckCircle2 className="mx-auto size-12 text-emerald-600" strokeWidth={2} />
          <h1 className="mt-3 text-xl font-black text-emerald-900 md:text-2xl">
            Đặt hàng thành công
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-emerald-900/90">
            {confirmation.message}
          </p>
        </div>

        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                Mã đơn hàng
              </p>
              <p className="mt-1 font-mono text-3xl font-black tracking-wider text-brand">
                {displayCode}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                Trạng thái
              </p>
              <p className="mt-1 text-sm font-bold text-amber-800">{order.statusLabel}</p>
            </div>
          </div>

          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold text-gray-500">Khách hàng</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{order.contact?.name || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-gray-500">Điện thoại</dt>
              <dd className="mt-0.5 font-medium text-gray-900">
                {formatPhoneDisplay(order.contact?.phone)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold text-gray-500">Địa chỉ giao hàng</dt>
              <dd className="mt-0.5 font-medium text-gray-900">
                {addressText || 'Nhân viên sẽ liên hệ qua SĐT'}
              </dd>
            </div>
          </dl>

          <ul className="mt-5 divide-y divide-gray-100 border-t border-gray-100">
            {(order.items || []).map((item, idx) => (
              <li key={`${item.productId}-${item.variantId}-${idx}`} className="flex gap-3 py-3">
                <div className="size-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt=""
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-[10px] text-gray-400">
                      SP
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug text-gray-900">{item.name}</p>
                  {item.variantLabel ? (
                    <p className="mt-0.5 text-xs text-gray-500">{item.variantLabel}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-gray-600">
                    SL: {item.quantity} × {formatVnd(item.price)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-brand">
                  {formatVnd(item.lineTotal ?? item.price * item.quantity)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-1 border-t border-gray-100 pt-4 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Tạm tính</span>
              <span>{formatVnd(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Phí vận chuyển</span>
              <span>{formatVnd(order.shippingFee ?? 0)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-gray-900">
              <span>Tổng cộng</span>
              <span className="text-brand">{formatVnd(grandTotal)}</span>
            </div>
          </div>
        </section>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            to="/shop"
            onClick={() => clearOrderConfirmation()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-bold text-white"
          >
            <ShoppingBag className="size-4" />
            Tiếp tục mua sắm
          </Link>
          {confirmation.orderId ? (
            <Link
              to={`/don-mua/${confirmation.orderId}`}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800"
            >
              Xem chi tiết đơn (nếu đã đăng nhập)
            </Link>
          ) : null}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
