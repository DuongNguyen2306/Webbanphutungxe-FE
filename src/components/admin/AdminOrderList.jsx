import {
  ORDER_STATUS,
  normalizeOrderStatus,
} from '../../constants/orderStatus'
import { OrderListCard } from '../orders/OrderListCard'
import { AdminOrderRowActions } from './AdminOrderRowActions'
import { AdminOrdersTable } from './AdminOrdersTable'

export function AdminOrderList({
  orders,
  statusOptions,
  updatingId,
  onChangeStatus,
  onOpenComplete,
}) {
  // Một mốc thời gian cho cả lần render này (cảnh báo đơn PENDING quá 30 phút).
  // Không dùng useSyncExternalStore(() => Date.now()) — snapshot thay đổi mỗi lần gọi → re-render vô hạn.
  // eslint-disable-next-line react-hooks/purity -- cần thời gian thực khi render danh sách
  const nowMs = Date.now()
  if (!orders.length) return null

  return (
    <>
      <div className="hidden lg:block">
        <AdminOrdersTable
          orders={orders}
          statusOptions={statusOptions}
          updatingId={updatingId}
          onChangeStatus={onChangeStatus}
          onOpenComplete={onOpenComplete}
        />
      </div>
      <ul className="mt-6 space-y-4 lg:hidden">
      {orders.map((o) => {
        const currentStatus = normalizeOrderStatus(o.status)
        const ageMs = nowMs - new Date(o.createdAt).getTime()
        const urgent =
          currentStatus === ORDER_STATUS.PENDING && ageMs > 30 * 60 * 1000
        const shippingHighlight = currentStatus === ORDER_STATUS.SHIPPING
        const edgeHighlight = urgent ? 'urgent' : shippingHighlight ? 'shipping' : 'none'
        return (
          <OrderListCard
            key={o._id}
            order={o}
            variant="admin"
            edgeHighlight={edgeHighlight}
            actions={
              <AdminOrderRowActions
                orderId={o._id}
                currentStatus={currentStatus}
                statusOptions={statusOptions}
                updating={updatingId === o._id}
                onChangeStatus={onChangeStatus}
                onOpenComplete={onOpenComplete}
              />
            }
          />
        )
      })}
    </ul>
    </>
  )
}
