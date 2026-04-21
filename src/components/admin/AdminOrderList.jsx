import { formatVnd } from '../../utils/format'
import {
  ORDER_STATUS,
  normalizeOrderStatus,
} from '../../constants/orderStatus'
import { AdminOrderRowActions } from './AdminOrderRowActions'

export function AdminOrderList({
  orders,
  statusOptions,
  updatingId,
  onChangeStatus,
  onOpenComplete,
}) {
  return (
    <ul className="mt-6 space-y-4">
      {orders.map((o) => {
        const currentStatus = normalizeOrderStatus(o.status)
        const ageMs = Date.now() - new Date(o.createdAt).getTime()
        const urgent =
          currentStatus === ORDER_STATUS.PENDING && ageMs > 30 * 60 * 1000
        const shippingHighlight = currentStatus === ORDER_STATUS.SHIPPING
        return (
          <li
            key={o._id}
            className={`rounded-xl border p-5 shadow-sm ${
              urgent
                ? 'animate-pulse border-red-200 bg-red-50/70'
                : shippingHighlight
                  ? 'border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-100'
                  : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-gray-400">
                  #{String(o._id).slice(-8)}
                </p>
                <p className="mt-2 text-xl font-bold text-brand">
                  {formatVnd(o.totalAmount)}
                </p>
                <p className="mt-2 text-sm text-gray-700">
                  <span className="font-medium text-gray-500">Liên hệ:</span>{' '}
                  {o.contact?.name || '-'} · {o.contact?.email || '-'} ·{' '}
                  {o.contact?.phone || '-'}
                </p>
                {o.user ? (
                  <p className="mt-1 text-xs text-gray-500">
                    User: {o.user.email || o.user.phone || o.user._id}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">Khách vãng lai</p>
                )}
                {urgent ? (
                  <p className="mt-2 text-xs font-bold text-red-700">
                    Can xu ly gap
                  </p>
                ) : null}
                {currentStatus === ORDER_STATUS.SHIPPING ||
                currentStatus === ORDER_STATUS.CONFIRMED ||
                currentStatus === ORDER_STATUS.COMPLETED ? (
                  o.delivery?.carrierName || o.delivery?.trackingNumber ? (
                    <p className="mt-2 rounded-lg border border-emerald-200 bg-white/90 px-2.5 py-1.5 text-xs text-emerald-900">
                      <span className="font-bold">Vận chuyển:</span>{' '}
                      {[o.delivery?.carrierName, o.delivery?.trackingNumber]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  ) : currentStatus === ORDER_STATUS.SHIPPING ? (
                    <p className="mt-2 text-xs font-medium text-amber-800">
                      Chưa có mã vận đơn - mở chi tiết đơn để nhập đơn vị và mã.
                    </p>
                  ) : null
                ) : null}
              </div>

              <AdminOrderRowActions
                orderId={o._id}
                currentStatus={currentStatus}
                statusOptions={statusOptions}
                updating={updatingId === o._id}
                onChangeStatus={onChangeStatus}
                onOpenComplete={onOpenComplete}
              />
            </div>

            <ul className="mt-4 space-y-1.5 border-t border-gray-100 pt-4 text-sm text-gray-700">
              {o.items?.map((it, i) => (
                <li key={i}>
                  <span className="font-medium">{it.name}</span>{' '}
                  {it.variantLabel ? (
                    <span className="text-gray-500">({it.variantLabel})</span>
                  ) : null}{' '}
                  x {it.quantity} -{' '}
                  <span className="text-gray-900">{formatVnd(it.price)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-gray-400">
              {new Date(o.createdAt).toLocaleString('vi-VN')}
            </p>
          </li>
        )
      })}
    </ul>
  )
}
