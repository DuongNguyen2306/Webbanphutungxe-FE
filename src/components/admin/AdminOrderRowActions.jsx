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
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
      <div className="min-w-0 sm:max-w-[14rem]">
        <label className="sr-only" htmlFor={`status-${orderId}`}>
          Trạng thái đơn
        </label>
        <select
          id={`status-${orderId}`}
          value={currentStatus}
          onChange={(e) => onChangeStatus(orderId, e.target.value, currentStatus)}
          disabled={updating}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
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
          <p className="mt-1 text-xs text-gray-500 sm:text-right">Đang cập nhật...</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
        {currentStatus === ORDER_STATUS.SHIPPING ? (
          <button
            type="button"
            onClick={() => onOpenComplete(orderId, currentStatus)}
            disabled={updating}
            className="inline-flex w-full items-center justify-center rounded-lg border-2 border-emerald-600 bg-white px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            Hoàn thành
          </button>
        ) : null}
        <Link
          to={`/admin/orders/${orderId}`}
          className="inline-flex w-full items-center justify-center rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-800 hover:bg-gray-50 sm:w-auto"
        >
          Xem chi tiết
        </Link>
      </div>
    </div>
  )
}
