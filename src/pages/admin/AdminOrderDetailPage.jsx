import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getAdminOrderDetail, patchAdminOrderDelivery } from '../../api/orderDetailApi'
import { formatVnd } from '../../utils/format'
import {
  FALLBACK_STATUS_OPTIONS,
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  isOrderStatusCode,
  normalizeOrderStatus,
} from '../../constants/orderStatus'
import { api } from '../../api/client'
import { mapOrderDetail } from '../../utils/orderDetailMapper'
import { canAdminEditOrderDelivery, normalizeOrderDelivery } from '../../utils/orderDelivery'
import { ReasonInputModal } from '../../components/ReasonInputModal'
import { CompleteOrderConfirmModal, COMPLETE_CONFIRM_TEXT } from '../../components/CompleteOrderConfirmModal'

const COMPLETE_FROM_SHIPPING_ONLY_MESSAGE =
  'Chỉ được chuyển Hoàn thành khi đơn đang ở trạng thái Đang giao.'

function getDeliveryPatchErrorMessage(err) {
  const status = err?.response?.status
  if (status === 400) return err?.response?.data?.message || 'Không thể lưu thông tin vận chuyển.'
  if (status === 401) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.'
  }
  if (status === 403) {
    return err?.response?.data?.message || 'Bạn không có quyền thực hiện thao tác này.'
  }
  return 'Có lỗi hệ thống. Vui lòng thử lại.'
}

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
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState(null)
  const [statusOptions, setStatusOptions] = useState(FALLBACK_STATUS_OPTIONS)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [updating, setUpdating] = useState(false)
  const [copying, setCopying] = useState(false)
  const [cancelModal, setCancelModal] = useState({ open: false, reason: '' })
  const [cancelError, setCancelError] = useState('')
  const [completeModal, setCompleteModal] = useState({ step: 0, token: '' })
  const [completeError, setCompleteError] = useState('')
  const [deliveryCarrier, setDeliveryCarrier] = useState('')
  const [deliveryTracking, setDeliveryTracking] = useState('')
  const [deliverySaving, setDeliverySaving] = useState(false)
  const [deliveryError, setDeliveryError] = useState('')

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(t)
  }, [toast])

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
    loadStatusOptions()
  }, [id])

  useEffect(() => {
    if (!order) return
    setDeliveryCarrier(order.delivery?.carrierName || '')
    setDeliveryTracking(order.delivery?.trackingNumber || '')
    setDeliveryError('')
  }, [order?._id, order?.delivery?.carrierName, order?.delivery?.trackingNumber])

  async function commitStatus(status, note = '') {
    if (!order) return false
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
              cancelReason: data.note || data.cancelNote || note || prev.cancelReason || '',
            }
          : prev,
      )
      setToast('Cập nhật trạng thái thành công')
      return true
    } catch (err) {
      const statusCode = err?.response?.status
      if (statusCode === 401) {
        navigate('/login', { replace: true })
      }
      setError(getStatusUpdateErrorMessage(err))
      if (!statusCode || statusCode >= 500) {
        setToast('Không thể cập nhật trạng thái. Vui lòng thử lại.')
      }
      return false
    } finally {
      setUpdating(false)
    }
  }

  function openCompleteFlow() {
    if (!order) return
    const currentStatus = normalizeOrderStatus(order.status)
    if (currentStatus !== ORDER_STATUS.SHIPPING) {
      setError(COMPLETE_FROM_SHIPPING_ONLY_MESSAGE)
      return
    }
    setCompleteModal({ step: 1, token: '' })
    setCompleteError('')
  }

  function closeCompleteFlow() {
    if (updating) return
    setCompleteModal({ step: 0, token: '' })
    setCompleteError('')
  }

  async function submitCompleteOrder() {
    const token = completeModal.token.trim().toUpperCase()
    if (token !== COMPLETE_CONFIRM_TEXT) {
      setCompleteError(`Vui lòng nhập chính xác ${COMPLETE_CONFIRM_TEXT}.`)
      return
    }
    if (!order) return
    const currentStatus = normalizeOrderStatus(order.status)
    if (currentStatus !== ORDER_STATUS.SHIPPING) {
      setCompleteError(COMPLETE_FROM_SHIPPING_ONLY_MESSAGE)
      return
    }
    const ok = await commitStatus(ORDER_STATUS.COMPLETED)
    if (ok) {
      setCompleteModal({ step: 0, token: '' })
      setCompleteError('')
    }
  }

  async function onStatusChange(nextStatus) {
    if (!order) return
    const currentStatus = normalizeOrderStatus(order.status)
    const normalized = normalizeOrderStatus(nextStatus)
    if (normalized === currentStatus) return
    if (normalized === ORDER_STATUS.COMPLETED) {
      openCompleteFlow()
      return
    }
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

  function buildOrderShareText(targetOrder) {
    const orderCode = `#${String(targetOrder._id).slice(-8)}`
    const statusLabel =
      ORDER_STATUS_LABELS[normalizeOrderStatus(targetOrder.status)] ||
      normalizeOrderStatus(targetOrder.status)
    const createdAt = new Date(targetOrder.createdAt).toLocaleString('vi-VN')
    const itemLines = (targetOrder.items || []).map(
      (it, index) =>
        `${index + 1}. ${it.displayName}${it.variantLabel ? ` (${it.variantLabel})` : ''} - ${formatVnd(it.price)} x ${it.quantity} = ${formatVnd(it.lineTotal)}`,
    )

    return [
      'THÔNG TIN ĐƠN HÀNG',
      `Mã đơn: ${orderCode}`,
      `Ngày đặt: ${createdAt}`,
      `Trạng thái: ${statusLabel}`,
      '',
      'Thông tin liên hệ:',
      `- Tên: ${targetOrder.contact?.name || '—'}`,
      `- SDT: ${targetOrder.contact?.phone || '—'}`,
      `- Email: ${targetOrder.contact?.email || '—'}`,
      '',
      `Địa chỉ giao hàng: ${targetOrder.shippingAddressText || 'Chưa có địa chỉ'}`,
      '',
      'Sản phẩm:',
      ...(itemLines.length ? itemLines : ['- Không có sản phẩm']),
      '',
      `Tổng thanh toán: ${formatVnd(targetOrder.totalAmount)}`,
    ].join('\n')
  }

  async function saveDelivery() {
    if (!order?._id) return
    setDeliverySaving(true)
    setDeliveryError('')
    setError('')
    try {
      const body = {}
      const carrier = deliveryCarrier.trim()
      const tracking = deliveryTracking.trim()
      if (carrier) body.carrierName = carrier
      if (tracking) body.trackingNumber = tracking
      if (!body.carrierName && !body.trackingNumber) {
        setDeliveryError('Nhập ít nhất đơn vị vận chuyển hoặc mã vận đơn.')
        setDeliverySaving(false)
        return
      }
      const { data } = await patchAdminOrderDelivery(order._id, body)
      if (data?.items && Array.isArray(data.items)) {
        setOrder(mapOrderDetail(data))
      } else {
        setOrder((prev) => {
          if (!prev) return prev
          const patch =
            data && typeof data.delivery === 'object' && data.delivery !== null ? data.delivery : {}
          return {
            ...prev,
            delivery: normalizeOrderDelivery({
              delivery: { ...prev.delivery, ...patch },
            }),
          }
        })
      }
      setToast('Đã lưu thông tin vận chuyển')
    } catch (err) {
      const statusCode = err?.response?.status
      if (statusCode === 401) {
        navigate('/login', { replace: true })
      }
      setDeliveryError(getDeliveryPatchErrorMessage(err))
    } finally {
      setDeliverySaving(false)
    }
  }

  async function copyOrderInfo() {
    if (!order || copying) return
    setCopying(true)
    try {
      const text = buildOrderShareText(order)
      await navigator.clipboard.writeText(text)
      setToast('Đã copy thông tin đơn hàng')
    } catch {
      setError('Không thể copy thông tin đơn hàng. Vui lòng thử lại.')
    } finally {
      setCopying(false)
    }
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
                <button
                  type="button"
                  onClick={copyOrderInfo}
                  disabled={copying}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {copying ? 'Đang copy...' : 'Copy thông tin đơn'}
                </button>
                <select
                  value={normalizeOrderStatus(order.status)}
                  onChange={(e) => onStatusChange(e.target.value)}
                  disabled={updating}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
                >
                  {statusOptions
                    .filter(
                      (opt) =>
                        opt.code !== ORDER_STATUS.COMPLETED ||
                        normalizeOrderStatus(order.status) === ORDER_STATUS.COMPLETED,
                    )
                    .map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.label || ORDER_STATUS_LABELS[opt.code] || opt.code}
                    </option>
                    ))}
                </select>
                {normalizeOrderStatus(order.status) === ORDER_STATUS.SHIPPING ? (
                  <button
                    type="button"
                    onClick={openCompleteFlow}
                    disabled={updating}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Hoàn thành
                  </button>
                ) : null}
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}
            </p>
            {normalizeOrderStatus(order.status) === ORDER_STATUS.CANCELLED ? (
              <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm">
                <p className="font-semibold text-rose-800">Lý do hủy</p>
                <p className="mt-1 text-rose-700">{order.cancelReason || '—'}</p>
              </div>
            ) : null}
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
              <p className="mt-2 text-gray-500">Ghi chú giao hàng</p>
              <p className="text-gray-700">{order.shippingNote || '—'}</p>
            </div>
          </div>

          <div
            className={`rounded-xl border bg-white p-4 shadow-sm ${
              normalizeOrderStatus(order.status) === ORDER_STATUS.SHIPPING
                ? 'border-emerald-300 ring-2 ring-emerald-100'
                : 'border-gray-200'
            }`}
          >
            <p className="text-sm font-bold text-gray-900">Vận chuyển</p>
            <p className="mt-1 text-xs text-gray-500">
              Đơn vị giao hàng và mã vận đơn — khách xem ở trang đơn (chỉ đọc). Chỉnh được khi đơn ở trạng thái
              Đã xác nhận, Đang giao hoặc Hoàn thành (sửa nhầm mã).
            </p>
            {canAdminEditOrderDelivery(order.status) ? (
              <>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">
                      Đơn vị vận chuyển
                    </label>
                    <input
                      value={deliveryCarrier}
                      onChange={(e) => {
                        setDeliveryCarrier(e.target.value)
                        if (deliveryError) setDeliveryError('')
                      }}
                      placeholder="VD: GHN, GHTK, Viettel Post"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">
                      Mã vận đơn / mã giao hàng
                    </label>
                    <input
                      value={deliveryTracking}
                      onChange={(e) => {
                        setDeliveryTracking(e.target.value)
                        if (deliveryError) setDeliveryError('')
                      }}
                      placeholder="VD: GHN123456789"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                {deliveryError ? (
                  <p className="mt-2 text-sm font-semibold text-red-600">{deliveryError}</p>
                ) : null}
                <button
                  type="button"
                  onClick={saveDelivery}
                  disabled={deliverySaving}
                  className="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deliverySaving ? 'Đang lưu...' : 'Lưu vận chuyển'}
                </button>
              </>
            ) : (
              <div className="mt-3 rounded-lg border border-dashed border-gray-200 bg-gray-50/80 p-3 text-sm text-gray-600">
                {order.delivery?.carrierName || order.delivery?.trackingNumber ? (
                  <>
                    <p>
                      <span className="font-semibold text-gray-800">Đơn vị:</span>{' '}
                      {order.delivery?.carrierName || '—'}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold text-gray-800">Mã:</span>{' '}
                      {order.delivery?.trackingNumber || '—'}
                    </p>
                  </>
                ) : (
                  <p>
                    Chưa thể cập nhật vận chuyển ở trạng thái này. Khi đơn chuyển sang Đã xác nhận / Đang giao /
                    Hoàn thành, bạn có thể nhập đơn vị và mã vận đơn tại đây.
                  </p>
                )}
              </div>
            )}
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
      <CompleteOrderConfirmModal
        step={completeModal.step}
        inputValue={completeModal.token}
        onInputChange={(value) => {
          setCompleteModal((prev) => ({ ...prev, token: value }))
          if (completeError) setCompleteError('')
        }}
        onClose={closeCompleteFlow}
        onContinue={() => setCompleteModal((prev) => ({ ...prev, step: 2 }))}
        onConfirm={submitCompleteOrder}
        loading={updating}
        error={completeError}
      />
      {toast ? (
        <div className="fixed right-4 top-4 z-[120] rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  )
}
