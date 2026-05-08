import { MapPin, Phone, UserRound } from 'lucide-react'
import {
  ORDER_STATUS,
  ORDER_STATUS_BADGE_CLASSES,
  ORDER_STATUS_LABELS,
  normalizeOrderStatus,
} from '../../constants/orderStatus'
import { formatVnd } from '../../utils/format'
import { normalizeOrderDelivery } from '../../utils/orderDelivery'
import { resolveOrderItemImage } from '../../utils/orderItemImage'

function orderAddressLine(order) {
  if (order?.shippingAddressText) return String(order.shippingAddressText).trim()
  const addr = order?.shippingAddress
  if (!addr) return ''
  const parts = [addr.detail, addr.ward, addr.district, addr.province]
    .map((x) => String(x || '').trim())
    .filter(Boolean)
  return parts.join(', ')
}

function initials(name) {
  const s = String(name || '').trim()
  if (!s) return '?'
  const parts = s.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return s.slice(0, 2).toUpperCase()
}

/**
 * Desktop (md+): thẻ ngang — meta trái | nội dung phải.
 * Mobile (max-md): thẻ dọc — hàng mã + trạng thái; khách/vận chuyển ẩn với khách (xem chi tiết); nút full-width hàng ngang.
 */
export function OrderListCard({ order, variant, edgeHighlight = 'none', actions }) {
  const currentStatus = normalizeOrderStatus(order?.status)
  const badgeClass =
    ORDER_STATUS_BADGE_CLASSES[currentStatus] || 'bg-gray-100 text-gray-800 ring-1 ring-gray-200'
  const statusLabel =
    ORDER_STATUS_LABELS[currentStatus] || String(order?.status || '').trim() || '—'

  const delivery = normalizeOrderDelivery(order)
  const hasDeliveryLine = Boolean(delivery.carrierName || delivery.trackingNumber)

  let deliveryBlock = null
  if (
    currentStatus === ORDER_STATUS.SHIPPING ||
    currentStatus === ORDER_STATUS.CONFIRMED ||
    currentStatus === ORDER_STATUS.COMPLETED
  ) {
    if (hasDeliveryLine) {
      deliveryBlock = (
        <p className="rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-900">
          <span className="font-bold">Vận chuyển:</span>{' '}
          {[delivery.carrierName, delivery.trackingNumber].filter(Boolean).join(' · ')}
        </p>
      )
    } else if (currentStatus === ORDER_STATUS.SHIPPING) {
      deliveryBlock = (
        <p className="text-xs font-medium text-amber-800">
          Chưa có mã vận đơn — mở chi tiết đơn để nhập đơn vị và mã.
        </p>
      )
    }
  }

  const address = orderAddressLine(order)
  const contactName = order?.contact?.name?.trim() || 'Khách hàng'
  const phone = order?.contact?.phone?.trim() || ''
  const shortId = String(order?._id || '').slice(-8)
  const dateStr = order?.createdAt
    ? `Đặt lúc: ${new Date(order.createdAt).toLocaleString('vi-VN')}`
    : null

  const shellClass =
    edgeHighlight === 'urgent'
      ? 'animate-pulse border-red-200 bg-red-50/60 shadow-[0_4px_20px_rgba(185,28,28,0.08)] ring-1 ring-red-100'
      : edgeHighlight === 'shipping'
        ? 'border-brand/30 bg-white shadow-[0_4px_20px_rgba(188,31,38,0.07)] ring-1 ring-brand/15'
        : 'border-gray-200 bg-white shadow-[0_4px_18px_rgba(15,23,42,0.06)]'

  const hideContactOnMobile = variant === 'customer'

  return (
    <li className={`overflow-hidden rounded-2xl border ${shellClass}`}>
      <div className="flex flex-col md:flex-row md:min-h-[140px]">
        {/* —— Meta đơn: mobile = hàng mã + trạng thái + giá; desktop = cột như cũ —— */}
        <aside className="flex shrink-0 flex-col border-b border-brand/10 bg-gradient-to-b from-brand/[0.07] to-brand/[0.03] md:w-[min(12.5rem,100%)] md:border-b-0 md:border-r md:border-brand/10 lg:w-[min(13.5rem,100%)] xl:w-[min(14rem,100%)]">
          <div className="p-4 md:hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Mã đơn hàng
                </p>
                <p className="mt-0.5 truncate font-mono text-sm font-bold text-gray-900">
                  #{shortId}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold leading-tight ${badgeClass}`}
              >
                {statusLabel}
              </span>
            </div>
            <p className="mt-3 text-2xl font-extrabold tracking-tight text-brand">
              {formatVnd(order?.totalAmount)}
            </p>
            {edgeHighlight === 'urgent' ? (
              <p className="mt-2 text-xs font-bold text-red-700">Cần xử lý gấp</p>
            ) : null}
            {dateStr ? <p className="mt-3 text-[11px] text-gray-500">{dateStr}</p> : null}
          </div>

          <div className="hidden min-h-0 flex-1 flex-col justify-between p-4 sm:p-5 md:flex md:min-h-[140px] lg:p-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Mã đơn hàng
              </p>
              <p className="mt-0.5 font-mono text-sm font-bold text-gray-900">#{shortId}</p>
              <p className="mt-3 text-2xl font-extrabold tracking-tight text-brand">
                {formatVnd(order?.totalAmount)}
              </p>
              <span
                className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${badgeClass}`}
              >
                {statusLabel}
              </span>
            </div>
            {edgeHighlight === 'urgent' ? (
              <p className="mt-3 text-xs font-bold text-red-700">Cần xử lý gấp</p>
            ) : null}
            <p className="mt-4 text-[11px] text-gray-500 md:mt-auto">{dateStr}</p>
          </div>
        </aside>

        <div className="min-w-0 flex-1 bg-gray-50/40 p-4 sm:p-5 md:p-6">
          {/* Cột SP chiếm phần lớn chiều ngang; cột khách tối đa ~40% để địa chỉ dài không nuốt chỗ hiển thị SP */}
          <div className="flex flex-col gap-5 xl:grid xl:grid-cols-[minmax(0,40%)_minmax(0,1fr)] xl:items-start xl:gap-x-8 xl:gap-y-4 2xl:gap-x-10">
            <div
              className={`min-w-0 max-w-full space-y-4 xl:max-w-none ${hideContactOnMobile ? 'hidden md:block' : ''}`}
            >
              <div className="flex min-w-0 gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand ring-2 ring-white"
                  aria-hidden
                >
                  {initials(contactName)}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-base font-bold text-gray-900 sm:text-lg">{contactName}</p>
                  {phone ? (
                    <p className="flex items-center gap-2 text-sm text-gray-700">
                      <Phone className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                      <a
                        href={`tel:${phone.replace(/\s/g, '')}`}
                        className="font-medium hover:underline"
                      >
                        {phone}
                      </a>
                    </p>
                  ) : null}
                  {address ? (
                    <p className="flex items-start gap-2 text-sm leading-relaxed text-gray-600">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                      <span className="min-w-0 break-words">{address}</span>
                    </p>
                  ) : (
                    <p className="flex items-start gap-2 text-sm text-gray-500">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                      Chưa có địa chỉ
                    </p>
                  )}
                  {variant === 'admin' && order?.user ? (
                    <p className="flex items-center gap-2 text-xs text-gray-500">
                      <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="truncate">
                        Tài khoản: {order.user.email || order.user.phone || order.user._id}
                      </span>
                    </p>
                  ) : variant === 'admin' ? (
                    <p className="text-xs text-gray-500">Khách vãng lai (không đăng nhập)</p>
                  ) : null}
                </div>
              </div>

              {deliveryBlock ? <div>{deliveryBlock}</div> : null}
            </div>

            <div className="min-w-0 space-y-4 border-t border-gray-200/80 pt-4 md:border-t-0 md:pt-0 xl:border-l xl:border-gray-200/80 xl:pl-8 xl:pt-0 2xl:pl-10">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                  Sản phẩm
                </p>
                {variant === 'customer' ? (
                  /* Một cột trên md/lg để mỗi SP đủ rộng; 2 cột chỉ khi viewport rất rộng */
                  <div className="mt-2 grid grid-cols-1 gap-3">
                    {(order?.items || []).slice(0, 3).map((it, i) => {
                      const itemImage = resolveOrderItemImage(it)
                      return (
                        <div
                          key={i}
                          className="flex min-w-0 gap-3 rounded-xl border border-gray-200/80 bg-white/80 p-3 shadow-sm"
                        >
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 sm:h-[4.5rem] sm:w-[4.5rem]">
                            {itemImage ? (
                              <img
                                src={itemImage}
                                alt={it.name || 'Sản phẩm'}
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1 py-0.5">
                            <p className="text-sm font-semibold leading-snug text-gray-800 [overflow-wrap:anywhere] max-md:line-clamp-2 md:text-[0.9375rem]">
                              {it.name}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {it.variantLabel || 'Mặc định'} × {it.quantity}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <ul className="mt-2 space-y-1.5 text-sm text-gray-800">
                    {(order?.items || []).slice(0, 5).map((it, i) => (
                      <li key={i} className="flex flex-wrap gap-x-2 gap-y-0.5">
                        <span className="font-semibold">{it.name}</span>
                        {it.variantLabel ? (
                          <span className="text-gray-500">({it.variantLabel})</span>
                        ) : null}
                        <span className="text-gray-600">
                          × {it.quantity} ·{' '}
                          <span className="text-gray-900">{formatVnd(it.price)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {variant === 'customer' &&
                Array.isArray(order?.items) &&
                order.items.length > 3 ? (
                  <p className="mt-2 text-xs text-gray-500">
                    +{order.items.length - 3} sản phẩm khác trong đơn…
                  </p>
                ) : null}
                {variant === 'admin' && Array.isArray(order?.items) && order.items.length > 5 ? (
                  <p className="mt-1 text-xs text-gray-500">+{order.items.length - 5} sản phẩm khác…</p>
                ) : null}
              </div>

              {hideContactOnMobile ? (
                <p className="text-xs text-gray-500 md:hidden">
                  Địa chỉ, vận chuyển và đủ dòng sản phẩm — trong{' '}
                  <span className="font-semibold text-gray-700">Xem chi tiết</span>.
                </p>
              ) : null}

              {actions ? (
                <div
                  className={[
                    'flex gap-2 border-t border-gray-200/80 pt-4',
                    'max-md:w-full max-md:flex-row max-md:flex-wrap',
                    'max-md:[&>a]:inline-flex max-md:[&>button]:inline-flex',
                    'max-md:[&>a]:min-h-11 max-md:[&>button]:min-h-11',
                    'max-md:[&>a]:flex-1 max-md:[&>button]:flex-1',
                    'max-md:[&>a]:min-w-0 max-md:[&>button]:min-w-0',
                    'max-md:[&>a]:items-center max-md:[&>button]:items-center',
                    'max-md:[&>a]:justify-center max-md:[&>button]:justify-center',
                    'max-md:[&>a]:rounded-lg max-md:[&>button]:rounded-lg',
                    'md:flex-nowrap md:justify-end md:gap-2 md:overflow-x-auto md:pb-0.5 md:[scrollbar-width:thin]',
                    'md:[&>a]:shrink-0 md:[&>button]:shrink-0',
                    'xl:border-t-0 xl:pt-0',
                  ].join(' ')}
                >
                  {actions}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}
