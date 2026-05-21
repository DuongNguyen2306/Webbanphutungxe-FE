import {
  ORDER_STATUS_BADGE_CLASSES,
  ORDER_STATUS_LABELS,
  normalizeOrderStatus,
} from '../../constants/orderStatus'
import { formatVnd } from '../../utils/format'
import { formatOrderDisplayCode } from '../../utils/orderDisplayCode'
import { AdminOrderRowActions } from './AdminOrderRowActions'

export function AdminOrdersTable({
  orders,
  statusOptions,
  updatingId,
  onChangeStatus,
  onOpenComplete,
}) {
  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50/90 text-xs font-bold uppercase tracking-wide text-gray-600">
          <tr>
            <th className="whitespace-nowrap px-4 py-3">Mã đơn</th>
            <th className="whitespace-nowrap px-4 py-3">Khách hàng</th>
            <th className="whitespace-nowrap px-4 py-3">SĐT</th>
            <th className="whitespace-nowrap px-4 py-3 text-right">Tổng</th>
            <th className="whitespace-nowrap px-4 py-3">Trạng thái</th>
            <th className="whitespace-nowrap px-4 py-3">Nhân viên xử lý</th>
            <th className="whitespace-nowrap px-4 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((o) => {
            const currentStatus = normalizeOrderStatus(o.status)
            const badgeClass =
              ORDER_STATUS_BADGE_CLASSES[currentStatus] ||
              'bg-gray-100 text-gray-800'
            const statusLabel =
              o.statusLabel ||
              ORDER_STATUS_LABELS[currentStatus] ||
              String(o.status || '—')
            const processedBy = String(o.processedBy || '').trim()
            return (
              <tr key={o._id} className="hover:bg-gray-50/60">
                <td className="whitespace-nowrap px-4 py-3 font-mono font-bold text-gray-900">
                  {formatOrderDisplayCode(o)}
                </td>
                <td className="max-w-[10rem] truncate px-4 py-3 font-medium text-gray-900">
                  {o.contact?.name?.trim() || '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                  {o.contact?.phone?.trim() || '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-brand">
                  {formatVnd(o.totalAmount)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${badgeClass}`}
                  >
                    {statusLabel}
                  </span>
                </td>
                <td className="max-w-[8rem] truncate px-4 py-3 text-gray-700">
                  {processedBy || '—'}
                </td>
                <td className="px-4 py-3">
                  <AdminOrderRowActions
                    orderId={o._id}
                    currentStatus={currentStatus}
                    statusOptions={statusOptions}
                    updating={updatingId === o._id}
                    onChangeStatus={onChangeStatus}
                    onOpenComplete={onOpenComplete}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
