import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { formatVnd } from '../../utils/format'

const statusLabel = {
  pending: 'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã huỷ',
}

export function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const { data } = await api.get('/api/admin/orders')
      setOrders(data)
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function updateStatus(id, status) {
    await api.patch(`/api/admin/orders/${id}/status`, { status })
    load()
  }

  if (loading) {
    return (
      <p className="text-sm text-gray-500">Đang tải đơn hàng...</p>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
        Đơn hàng
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Thông tin khách và đúng các dòng đã chọn khi thanh toán.
      </p>
      <ul className="mt-6 space-y-4">
        {orders.map((o) => (
          <li
            key={o._id}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
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
                  {o.contact?.name || '—'} · {o.contact?.email || '—'} ·{' '}
                  {o.contact?.phone || '—'}
                </p>
                {o.user ? (
                  <p className="mt-1 text-xs text-gray-500">
                    User: {o.user.email || o.user.phone || o.user._id}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">Khách vãng lai</p>
                )}
              </div>
              <div className="shrink-0">
                <label className="sr-only" htmlFor={`status-${o._id}`}>
                  Trạng thái đơn
                </label>
                <select
                  id={`status-${o._id}`}
                  value={o.status}
                  onChange={(e) => updateStatus(o._id, e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                >
                  <option value="pending">{statusLabel.pending}</option>
                  <option value="confirmed">{statusLabel.confirmed}</option>
                  <option value="cancelled">{statusLabel.cancelled}</option>
                </select>
              </div>
            </div>
            <ul className="mt-4 space-y-1.5 border-t border-gray-100 pt-4 text-sm text-gray-700">
              {o.items?.map((it, i) => (
                <li key={i}>
                  <span className="font-medium">{it.name}</span>{' '}
                  {it.variantLabel ? (
                    <span className="text-gray-500">({it.variantLabel})</span>
                  ) : null}{' '}
                  × {it.quantity} —{' '}
                  <span className="text-gray-900">{formatVnd(it.price)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-gray-400">
              {new Date(o.createdAt).toLocaleString('vi-VN')}
            </p>
          </li>
        ))}
      </ul>
      {orders.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
          Chưa có đơn nào.
        </p>
      ) : null}
    </div>
  )
}
