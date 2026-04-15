import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import {
  FALLBACK_STATUS_OPTIONS,
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  isOrderStatusCode,
  normalizeOrderStatus,
} from '../../constants/orderStatus'
import { ReasonInputModal } from '../../components/ReasonInputModal'
import { formatVnd } from '../../utils/format'

export function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [statusOptions, setStatusOptions] = useState(FALLBACK_STATUS_OPTIONS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState('')
  const [cancelModal, setCancelModal] = useState({
    open: false,
    orderId: '',
    reason: '',
  })
  const [cancelModalError, setCancelModalError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/api/admin/orders')
      setOrders(data)
    } catch (err) {
      setOrders([])
      setError(
        err.response?.data?.message ||
          'Không tải được đơn hàng từ API /api/admin/orders.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function loadStatusOptions() {
    try {
      const { data } = await api.get('/api/admin/orders/status-options')
      const statuses = Array.isArray(data?.statuses) ? data.statuses : []
      const normalized = statuses
        .map((item) => ({
          code: String(item?.code || '').toUpperCase(),
          label: String(item?.label || '').trim(),
        }))
        .filter((item) => isOrderStatusCode(item.code))
      if (!normalized.length) {
        setStatusOptions(FALLBACK_STATUS_OPTIONS)
        return
      }
      setStatusOptions(
        normalized.map((item) => ({
          code: item.code,
          label: item.label || ORDER_STATUS_LABELS[item.code] || item.code,
        })),
      )
    } catch {
      setStatusOptions(FALLBACK_STATUS_OPTIONS)
    }
  }

  useEffect(() => {
    load()
    loadStatusOptions()
  }, [])

  async function commitStatusChange(id, normalizedStatus, note = '') {
    const previous = orders.find((order) => order._id === id)
    if (!previous) return
    const previousStatus = normalizeOrderStatus(previous.status)
    const previousCancelNote = previous.cancelNote || ''
    if (previousStatus === normalizedStatus) return

    const payload = { status: normalizedStatus }
    if (normalizedStatus === ORDER_STATUS.CANCELLED) {
      payload.note = note
    }

    setUpdatingId(id)
    setError('')
    setOrders((prev) =>
      prev.map((order) =>
        order._id === id
          ? {
              ...order,
              status: normalizedStatus,
              cancelNote:
                normalizedStatus === ORDER_STATUS.CANCELLED
                  ? payload.note
                  : order.cancelNote,
            }
          : order,
      ),
    )
    try {
      const { data } = await api.patch(`/api/admin/orders/${id}/status`, payload)
      setOrders((prev) =>
        prev.map((order) =>
          order._id === id
            ? {
                ...order,
                status: normalizeOrderStatus(data.status || normalizedStatus),
                cancelNote: data.cancelNote || '',
              }
            : order,
        ),
      )
    } catch (err) {
      setOrders((prev) =>
        prev.map((order) =>
          order._id === id
            ? { ...order, status: previousStatus, cancelNote: previousCancelNote }
            : order,
        ),
      )
      setError(
        err.response?.status === 400 || err.response?.status === 404
          ? err.response?.data?.message || 'Cập nhật trạng thái thất bại.'
          : 'Cập nhật trạng thái thất bại.',
      )
    } finally {
      setUpdatingId('')
    }
  }

  function updateStatus(id, status) {
    const normalizedStatus = normalizeOrderStatus(status)
    if (normalizedStatus === ORDER_STATUS.CANCELLED) {
      setCancelModal({ open: true, orderId: id, reason: '' })
      setCancelModalError('')
      return
    }
    commitStatusChange(id, normalizedStatus)
  }

  async function submitCancelReason() {
    const reason = cancelModal.reason.trim()
    if (!reason) {
      setCancelModalError('Vui lòng nhập lý do hủy đơn.')
      return
    }
    await commitStatusChange(cancelModal.orderId, ORDER_STATUS.CANCELLED, reason)
    setCancelModal({ open: false, orderId: '', reason: '' })
    setCancelModalError('')
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
      {error ? (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
          <button
            type="button"
            onClick={load}
            className="ml-2 font-bold underline"
          >
            Thử lại
          </button>
        </div>
      ) : null}
      <ul className="mt-6 space-y-4">
        {orders.map((o) => (
          (() => {
            const currentStatus = normalizeOrderStatus(o.status)
            const ageMs = Date.now() - new Date(o.createdAt).getTime()
            const urgent = currentStatus === ORDER_STATUS.PENDING && ageMs > 30 * 60 * 1000
            return (
          <li
            key={o._id}
            className={`rounded-xl border p-5 shadow-sm ${
              urgent
                ? 'animate-pulse border-red-200 bg-red-50/70'
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
                {urgent ? (
                  <p className="mt-2 text-xs font-bold text-red-700">
                    ⚠️ Cần xử lý gấp
                  </p>
                ) : null}
              </div>
              <div className="shrink-0">
                <label className="sr-only" htmlFor={`status-${o._id}`}>
                  Trạng thái đơn
                </label>
                <select
                  id={`status-${o._id}`}
                  value={currentStatus}
                  onChange={(e) => updateStatus(o._id, e.target.value)}
                  disabled={updatingId === o._id}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.label || ORDER_STATUS_LABELS[opt.code] || opt.code}
                    </option>
                  ))}
                </select>
                {updatingId === o._id ? (
                  <p className="mt-1 text-xs text-gray-500">Đang cập nhật...</p>
                ) : null}
                <Link
                  to={`/admin/orders/${o._id}`}
                  className="mt-2 inline-block text-xs font-bold text-brand hover:underline"
                >
                  Xem chi tiết
                </Link>
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
            )
          })()
        ))}
      </ul>
      {orders.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
          Chưa có đơn nào.
        </p>
      ) : null}
      <ReasonInputModal
        open={cancelModal.open}
        title="Nhập lý do hủy đơn"
        description="Lý do là bắt buộc khi chuyển trạng thái sang Đã hủy."
        value={cancelModal.reason}
        onChange={(value) => {
          setCancelModal((prev) => ({ ...prev, reason: value }))
          if (cancelModalError) setCancelModalError('')
        }}
        onCancel={() => {
          if (updatingId) return
          setCancelModal({ open: false, orderId: '', reason: '' })
          setCancelModalError('')
        }}
        onConfirm={submitCancelReason}
        confirmLabel="Xác nhận hủy"
        loading={Boolean(updatingId)}
        error={cancelModalError}
      />
    </div>
  )
}
