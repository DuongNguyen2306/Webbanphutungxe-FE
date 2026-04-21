import { Link } from 'react-router-dom'
import { ORDER_STATUS, ORDER_STATUS_LABELS } from '../../constants/orderStatus'

export function AdminOrderRowActions({
  orderId,
  currentStatus,
  statusOptions,
  updating,
  onChangeStatus,
  onOpenComplete,
}) {
  return (
    <div className="shrink-0">
      <label className="sr-only" htmlFor={`status-${orderId}`}>
        Trạng thái đơn
      </label>
      <select
        id={`status-${orderId}`}
        value={currentStatus}
        onChange={(e) => onChangeStatus(orderId, e.target.value, currentStatus)}
        disabled={updating}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      >
        {statusOptions
          .filter(
            (opt) =>
              opt.code !== ORDER_STATUS.COMPLETED ||
              currentStatus === ORDER_STATUS.COMPLETED,
          )
          .map((opt) => (
            <option key={opt.code} value={opt.code}>
              {opt.label || ORDER_STATUS_LABELS[opt.code] || opt.code}
            </option>
          ))}
      </select>

      {updating ? (
        <p className="mt-1 text-xs text-gray-500">Đang cập nhật...</p>
      ) : null}

      {currentStatus === ORDER_STATUS.SHIPPING ? (
        <button
          type="button"
          onClick={() => onOpenComplete(orderId, currentStatus)}
          disabled={updating}
          className="mt-2 block w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Hoàn thành
        </button>
      ) : null}

      <Link
        to={`/admin/orders/${orderId}`}
        className="mt-2 inline-block text-xs font-bold text-brand hover:underline"
      >
        Xem chi tiết
      </Link>
    </div>
  )
}
