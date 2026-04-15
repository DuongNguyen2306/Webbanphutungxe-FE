import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAdminOrderDetail } from '../../api/orderDetailApi'
import { formatVnd } from '../../utils/format'
import { ORDER_STATUS, ORDER_STATUS_LABELS, normalizeOrderStatus } from '../../constants/orderStatus'
import { api } from '../../api/client'
import { mapOrderDetail } from '../../utils/orderDetailMapper'
import { ReasonInputModal } from '../../components/ReasonInputModal'

const STATUS_OPTIONS = [
  ORDER_STATUS.CONTACTING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.CANCELLED,
]

function SkeletonBlock() {
  return (
    <div className="animate-pulse space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="h-4 w-40 rounded bg-gray-200" />
      <div className="h-4 w-full rounded bg-gray-100" />
      <div className="h-4 w-2/3 rounded bg-gray-100" />
    </div>
  )
}

function ItemThumb({ src, alt }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return <div className="size-16 shrink-0 rounded bg-gray-100" />
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="size-16 shrink-0 rounded object-cover"
    />
  )
}

export function AdminOrderDetailPage() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)
  const [cancelModal, setCancelModal] = useState({ open: false, reason: '' })
  const [cancelError, setCancelError] = useState('')

  async function load() {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const data = await getAdminOrderDetail(id)
      setOrder(mapOrderDetail(data))
    } catch (err) {
      const status = err?.response?.status
      if (status === 400) {
        setError('Đơn hàng không hợp lệ')
      } else if (status === 404) {
        setError('Không tìm thấy đơn hàng')
      } else {
        setError('Không tải được chi tiết đơn hàng. Vui lòng thử lại.')
      }
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  async function commitStatus(status, note = '') {
    if (!order) return
    setUpdating(true)
    setError('')
    try {
      const payload = { status }
      if (status === ORDER_STATUS.CANCELLED) payload.note = note
      const { data } = await api.patch(`/api/admin/orders/${order._id}/status`, payload)
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              status: normalizeOrderStatus(data.status || status),
              cancelNote: data.cancelNote || '',
            }
          : prev,
      )
    } catch (err) {
      setError(err.response?.data?.message || 'Cập nhật trạng thái thất bại.')
    } finally {
      setUpdating(false)
    }
  }

  async function onStatusChange(nextStatus) {
    if (!order) return
    const normalized = normalizeOrderStatus(nextStatus)
    if (normalized === normalizeOrderStatus(order.status)) return
    if (normalized === ORDER_STATUS.CANCELLED) {
      setCancelModal({ open: true, reason: '' })
      setCancelError('')
      return
    }
    await commitStatus(normalized)
  }

  async function submitCancel() {
    const reason = cancelModal.reason.trim()
    if (!reason) {
      setCancelError('Vui lòng nhập lý do hủy đơn.')
      return
    }
    await commitStatus(ORDER_STATUS.CANCELLED, reason)
    setCancelModal({ open: false, reason: '' })
    setCancelError('')
  }

  return (
    <div>
      <Link to="/admin/orders" className="text-sm font-semibold text-brand hover:underline">
        ← Quay lại Đơn hàng
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900">Chi tiết đơn hàng</h1>

      {loading ? (
        <div className="mt-4 space-y-3">
          <SkeletonBlock />
          <SkeletonBlock />
        </div>
      ) : error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>{error}</p>
          <button type="button" onClick={load} className="mt-2 font-bold underline">
            Thử lại
          </button>
        </div>
      ) : order ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-xs text-gray-500">Mã đơn: #{String(order._id).slice(-8)}</p>
              <div className="flex items-center gap-2">
                <select
                  value={normalizeOrderStatus(order.status)}
                  onChange={(e) => onStatusChange(e.target.value)}
                  disabled={updating}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {ORDER_STATUS_LABELS[s] || s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}
            </p>
            <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="font-semibold text-gray-800">Thông tin tài khoản mua</p>
                <p className="mt-1 text-gray-700">Email: {order.user?.email || '—'}</p>
                <p className="text-gray-700">SĐT: {order.user?.phone || '—'}</p>
                <p className="text-gray-700">Tên: {order.user?.displayName || order.user?.name || '—'}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="font-semibold text-gray-800">Thông tin liên hệ đơn</p>
                <p className="mt-1 text-gray-700">{order.contact?.name || '—'}</p>
                <p className="text-gray-700">{order.contact?.phone || '—'}</p>
                <p className="text-gray-700">{order.contact?.email || '—'}</p>
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
              <p className="font-semibold text-gray-800">Địa chỉ giao hàng</p>
              <p className="mt-1 text-gray-700">{order.shippingAddressText || 'Chưa có địa chỉ'}</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-bold text-gray-800">Sản phẩm</p>
            <ul className="mt-3 space-y-3">
              {order.items.map((it, i) => (
                <li key={i} className="flex gap-3 rounded-lg border border-gray-100 p-3">
                  <ItemThumb src={it.image} alt={it.displayName} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-800">{it.displayName}</p>
                    {it.variantLabel ? (
                      <p className="text-xs text-gray-500">{it.variantLabel}</p>
                    ) : null}
                    <p className="mt-1 text-sm text-gray-700">
                      {formatVnd(it.price)} × {it.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-brand">{formatVnd(it.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-gray-100 pt-3 text-right">
              <p className="text-xs text-gray-500">Tổng thanh toán</p>
              <p className="text-xl font-extrabold text-[#BC1F26]">{formatVnd(order.totalAmount)}</p>
            </div>
          </div>
        </div>
      ) : null}

      <ReasonInputModal
        open={cancelModal.open}
        title="Nhập lý do hủy đơn"
        description="Lý do là bắt buộc khi chuyển trạng thái sang Đã hủy."
        value={cancelModal.reason}
        onChange={(value) => {
          setCancelModal((prev) => ({ ...prev, reason: value }))
          if (cancelError) setCancelError('')
        }}
        onCancel={() => {
          if (updating) return
          setCancelModal({ open: false, reason: '' })
          setCancelError('')
        }}
        onConfirm={submitCancel}
        confirmLabel="Xác nhận hủy"
        loading={updating}
        error={cancelError}
      />
    </div>
  )
}
