import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import {
  FALLBACK_STATUS_OPTIONS,
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  isOrderStatusCode,
  normalizeOrderStatus,
} from '../../constants/orderStatus'
import { ReasonInputModal } from '../../components/ReasonInputModal'
import { CompleteOrderConfirmModal, COMPLETE_CONFIRM_TEXT } from '../../components/CompleteOrderConfirmModal'
import { formatVnd } from '../../utils/format'
import { parseOrderListResponse } from '../../utils/orderListResponse'

const PAGE_LIMIT = 10

const COMPLETE_FROM_SHIPPING_ONLY_MESSAGE =
  'Chỉ được chuyển Hoàn thành khi đơn đang ở trạng thái Đang giao.'

function getStatusUpdateErrorMessage(err) {
  const status = err?.response?.status
  if (status === 400) return err?.response?.data?.message || 'Cập nhật trạng thái thất bại.'
  if (status === 401) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.'
  }
  if (status === 403) {
    return err?.response?.data?.message || 'Bạn không có quyền quản trị để thực hiện thao tác này.'
  }
  return 'Có lỗi hệ thống. Vui lòng thử lại.'
}

export function AdminOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [statusOptions, setStatusOptions] = useState(FALLBACK_STATUS_OPTIONS)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [ordersTotal, setOrdersTotal] = useState(null)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [updatingId, setUpdatingId] = useState('')
  const [cancelModal, setCancelModal] = useState({
    open: false,
    orderId: '',
    reason: '',
  })
  const [cancelModalError, setCancelModalError] = useState('')
  const [completeModal, setCompleteModal] = useState({
    step: 0,
    orderId: '',
    token: '',
  })
  const [completeModalError, setCompleteModalError] = useState('')

  const adminTotalPages = useMemo(() => {
    if (ordersTotal == null || !Number.isFinite(ordersTotal)) return null
    return Math.max(1, Math.ceil(ordersTotal / PAGE_LIMIT))
  }, [ordersTotal])

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const safePage = Math.max(1, page)
    const skip = (safePage - 1) * PAGE_LIMIT
    const params = { limit: PAGE_LIMIT, skip }
    const q = search.trim()
    if (q) params.search = q
    try {
      const { data } = await api.get('/api/admin/orders', { params })
      const { items, total } = parseOrderListResponse(data)
      setOrders(items)
      setOrdersTotal(total)
      const hasNext =
        total != null && Number.isFinite(total)
          ? skip + items.length < total
          : items.length === PAGE_LIMIT
      setHasNextPage(hasNext)
    } catch (err) {
      setOrders([])
      setOrdersTotal(null)
      setHasNextPage(false)
      setError(
        err.response?.data?.message ||
          'Không tải được đơn hàng từ API /api/admin/orders.',
      )
    } finally {
      setLoading(false)
    }
  }, [page, search])

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
    loadStatusOptions()
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function commitStatusChange(id, normalizedStatus, note = '') {
    const previous = orders.find((order) => order._id === id)
    if (!previous) return false
    const previousStatus = normalizeOrderStatus(previous.status)
    if (previousStatus === normalizedStatus) return false

    const payload = { status: normalizedStatus }
    if (normalizedStatus === ORDER_STATUS.CANCELLED) {
      payload.note = note
    }

    setUpdatingId(id)
    setError('')
    try {
      const { data } = await api.patch(`/api/admin/orders/${id}/status`, payload)
      setOrders((prev) =>
        prev.map((order) =>
          order._id === id
            ? {
                ...order,
                status: normalizeOrderStatus(data.status || normalizedStatus),
                cancelNote: data.cancelNote || '',
                ...(data?.delivery && typeof data.delivery === 'object'
                  ? { delivery: { ...order.delivery, ...data.delivery } }
                  : {}),
              }
            : order,
        ),
      )
      setToast('Cập nhật trạng thái thành công')
      return true
    } catch (err) {
      const status = err?.response?.status
      if (status === 401) {
        navigate('/login', { replace: true })
      }
      setError(getStatusUpdateErrorMessage(err))
      if (!status || status >= 500) {
        setToast('Không thể cập nhật trạng thái. Vui lòng thử lại.')
      }
      return false
    } finally {
      setUpdatingId('')
    }
  }

  function openCompleteFlow(id, currentStatus) {
    if (currentStatus !== ORDER_STATUS.SHIPPING) {
      setError(COMPLETE_FROM_SHIPPING_ONLY_MESSAGE)
      return
    }
    setCompleteModal({
      step: 1,
      orderId: id,
      token: '',
    })
    setCompleteModalError('')
  }

  function closeCompleteFlow() {
    if (updatingId) return
    setCompleteModal({
      step: 0,
      orderId: '',
      token: '',
    })
    setCompleteModalError('')
  }

  function updateStatus(id, status, currentStatus) {
    const normalizedStatus = normalizeOrderStatus(status)
    if (normalizedStatus === ORDER_STATUS.COMPLETED) {
      openCompleteFlow(id, currentStatus)
      return
    }
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

  async function submitCompleteOrder() {
    const token = completeModal.token.trim().toUpperCase()
    if (token !== COMPLETE_CONFIRM_TEXT) {
      setCompleteModalError(`Vui lòng nhập chính xác ${COMPLETE_CONFIRM_TEXT}.`)
      return
    }
    const target = orders.find((o) => o._id === completeModal.orderId)
    if (!target) {
      closeCompleteFlow()
      return
    }
    const currentStatus = normalizeOrderStatus(target.status)
    if (currentStatus !== ORDER_STATUS.SHIPPING) {
      setCompleteModalError(COMPLETE_FROM_SHIPPING_ONLY_MESSAGE)
      return
    }
    const ok = await commitStatusChange(completeModal.orderId, ORDER_STATUS.COMPLETED)
    if (ok) {
      setCompleteModal({
        step: 0,
        orderId: '',
        token: '',
      })
      setCompleteModalError('')
    }
  }

  if (loading && orders.length === 0) {
    return (
      <p className="text-sm text-gray-500">Đang tải đơn hàng...</p>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Đơn hàng
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Thông tin khách và đúng các dòng đã chọn khi thanh toán.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          {loading ? <span className="font-semibold text-brand">Đang tải…</span> : null}
          {ordersTotal != null ? (
            <span className="rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-700">
              {ordersTotal} đơn
            </span>
          ) : orders.length > 0 ? (
            <span className="rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-700">
              {orders.length} đơn / trang
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              setPage(1)
              setSearch(searchInput.trim())
            }
          }}
          placeholder="Tìm mã đơn, SĐT, email, tên khách…"
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          aria-label="Tìm đơn hàng"
        />
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => {
              setPage(1)
              setSearch(searchInput.trim())
            }}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white hover:bg-gray-800"
          >
            Tìm
          </button>
          {search ? (
            <button
              type="button"
              onClick={() => {
                setSearchInput('')
                setSearch('')
                setPage(1)
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Xóa lọc
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
          <button
            type="button"
            onClick={() => load()}
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
                {currentStatus === ORDER_STATUS.SHIPPING ||
                currentStatus === ORDER_STATUS.CONFIRMED ||
                currentStatus === ORDER_STATUS.COMPLETED ? (
                  o.delivery?.carrierName || o.delivery?.trackingNumber ? (
                    <p className="mt-2 rounded-lg border border-emerald-200 bg-white/90 px-2.5 py-1.5 text-xs text-emerald-900">
                      <span className="font-bold">Vận chuyển:</span>{' '}
                      {[o.delivery?.carrierName, o.delivery?.trackingNumber].filter(Boolean).join(' · ')}
                    </p>
                  ) : currentStatus === ORDER_STATUS.SHIPPING ? (
                    <p className="mt-2 text-xs font-medium text-amber-800">
                      Chưa có mã vận đơn — mở chi tiết đơn để nhập đơn vị và mã.
                    </p>
                  ) : null
                ) : null}
              </div>
              <div className="shrink-0">
                <label className="sr-only" htmlFor={`status-${o._id}`}>
                  Trạng thái đơn
                </label>
                <select
                  id={`status-${o._id}`}
                  value={currentStatus}
                  onChange={(e) => updateStatus(o._id, e.target.value, currentStatus)}
                  disabled={updatingId === o._id}
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
                {updatingId === o._id ? (
                  <p className="mt-1 text-xs text-gray-500">Đang cập nhật...</p>
                ) : null}
                {currentStatus === ORDER_STATUS.SHIPPING ? (
                  <button
                    type="button"
                    onClick={() => openCompleteFlow(o._id, currentStatus)}
                    disabled={updatingId === o._id}
                    className="mt-2 block w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Hoàn thành
                  </button>
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
      {orders.length > 0 ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-500">
            {adminTotalPages != null ? `Trang ${page} / ${adminTotalPages}` : `Trang ${page}`}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={
                loading ||
                (adminTotalPages != null ? page >= adminTotalPages : !hasNextPage)
              }
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      ) : null}
      {orders.length === 0 && !loading ? (
        <p className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
          {search ? 'Không có đơn khớp tìm kiếm.' : 'Chưa có đơn nào.'}
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
      <CompleteOrderConfirmModal
        step={completeModal.step}
        inputValue={completeModal.token}
        onInputChange={(value) => {
          setCompleteModal((prev) => ({ ...prev, token: value }))
          if (completeModalError) setCompleteModalError('')
        }}
        onClose={closeCompleteFlow}
        onContinue={() => setCompleteModal((prev) => ({ ...prev, step: 2 }))}
        onConfirm={submitCompleteOrder}
        loading={Boolean(updatingId)}
        error={completeModalError}
      />
      {toast ? (
        <div className="fixed right-4 top-4 z-[120] rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  )
}
