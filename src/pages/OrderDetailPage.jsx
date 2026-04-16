import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Copy } from 'lucide-react'
import { Header } from '../components/Header'
import { SiteFooter } from '../components/SiteFooter'
import { useAuth } from '../context/AuthContext'
import { formatVnd } from '../utils/format'
import { ORDER_STATUS, ORDER_STATUS_LABELS } from '../constants/orderStatus'
import { getMyOrderDetail, updateMyOrderCustomerInfo } from '../api/orderDetailApi'
import { mapOrderDetail } from '../utils/orderDetailMapper'

function SkeletonBlock() {
  return (
    <div className="animate-pulse space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="h-4 w-40 rounded bg-gray-200" />
      <div className="h-4 w-full rounded bg-gray-100" />
      <div className="h-4 w-2/3 rounded bg-gray-100" />
    </div>
  )
}

function CustomerDeliveryCard({ order, onCopied }) {
  const carrier = order?.delivery?.carrierName?.trim()
  const tracking = order?.delivery?.trackingNumber?.trim()
  const isShipping = order?.status === ORDER_STATUS.SHIPPING
  const isCompleted = order?.status === ORDER_STATUS.COMPLETED
  const [copying, setCopying] = useState(false)

  const visible =
    isShipping || (isCompleted && (Boolean(carrier) || Boolean(tracking)))
  if (!visible) return null

  async function copyTracking() {
    if (!tracking || copying) return
    setCopying(true)
    try {
      await navigator.clipboard.writeText(tracking)
      onCopied?.()
    } catch {
      onCopied?.('Không sao chép được — bạn có thể chọn và copy tay.')
    } finally {
      setCopying(false)
    }
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
      <p className="text-sm font-extrabold text-emerald-900">Theo dõi giao hàng</p>
      {carrier || tracking ? (
        <dl className="mt-3 space-y-2 text-sm text-gray-800">
          <div>
            <dt className="text-xs font-semibold text-gray-500">Đơn vị</dt>
            <dd className="mt-0.5 font-medium">{carrier || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-gray-500">Mã vận đơn</dt>
            <dd className="mt-0.5 flex flex-wrap items-center gap-2">
              <span className="font-mono font-semibold">{tracking || '—'}</span>
              {tracking ? (
                <button
                  type="button"
                  onClick={copyTracking}
                  disabled={copying}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-2 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-50 disabled:opacity-60"
                >
                  <Copy className="size-3.5" aria-hidden />
                  {copying ? '...' : 'Sao chép mã'}
                </button>
              ) : null}
            </dd>
          </div>
        </dl>
      ) : isShipping ? (
        <p className="mt-2 text-sm text-gray-700">
          Shop sẽ cập nhật mã vận đơn sớm — bạn quay lại sau hoặc liên hệ shop nếu cần gấp.
        </p>
      ) : null}
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

function EditOrderInfoModal({
  open,
  form,
  onChange,
  onClose,
  onSubmit,
  saving,
  error,
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow-xl">
        <h2 className="text-lg font-extrabold text-gray-900">Sửa thông tin đơn hàng</h2>
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <input
            placeholder="Người nhận"
            value={form.contact.name}
            onChange={(e) => onChange('contact', 'name', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              placeholder="SĐT"
              value={form.contact.phone}
              onChange={(e) => onChange('contact', 'phone', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Email"
              value={form.contact.email}
              onChange={(e) => onChange('contact', 'email', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Tỉnh/Thành"
              value={form.shippingAddress.province}
              onChange={(e) => onChange('shippingAddress', 'province', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Quận/Huyện"
              value={form.shippingAddress.district}
              onChange={(e) => onChange('shippingAddress', 'district', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <input
            placeholder="Phường/Xã"
            value={form.shippingAddress.ward}
            onChange={(e) => onChange('shippingAddress', 'ward', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Địa chỉ chi tiết"
            value={form.shippingAddress.detail}
            onChange={(e) => onChange('shippingAddress', 'detail', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Ghi chú"
            rows={3}
            value={form.shippingAddress.note}
            onChange={(e) => onChange('shippingAddress', 'note', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [toast, setToast] = useState('')
  const [editForm, setEditForm] = useState({
    contact: { name: '', phone: '', email: '' },
    shippingAddress: {
      province: '',
      district: '',
      ward: '',
      detail: '',
      note: '',
    },
  })

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(t)
  }, [toast])

  async function load() {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const data = await getMyOrderDetail(id)
      setOrder(mapOrderDetail(data))
    } catch (err) {
      const status = err?.response?.status
      if (status === 401) {
        navigate('/login', { replace: true })
        return
      }
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

  const canEditOrder = Boolean(
    order &&
      [ORDER_STATUS.PENDING, ORDER_STATUS.CONTACTING, ORDER_STATUS.CONFIRMED].includes(
        order.status,
      ),
  )

  function openEditModal() {
    if (!order) return
    setEditForm({
      contact: {
        name: order.contact?.name || '',
        phone: order.contact?.phone || '',
        email: order.contact?.email || '',
      },
      shippingAddress: {
        province: order.shippingAddress?.province || '',
        district: order.shippingAddress?.district || '',
        ward: order.shippingAddress?.ward || '',
        detail: order.shippingAddress?.detail || '',
        note: order.shippingAddress?.note || '',
      },
    })
    setEditError('')
    setEditOpen(true)
  }

  function changeEditField(group, key, value) {
    setEditForm((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: value,
      },
    }))
    if (editError) setEditError('')
  }

  async function submitEdit(e) {
    e.preventDefault()
    const c = editForm.contact
    const s = editForm.shippingAddress
    if (!String(c.email || '').trim() && !String(c.phone || '').trim()) {
      setEditError('Cần email hoặc SĐT liên hệ.')
      return
    }
    if (!s.province.trim() || !s.district.trim() || !s.ward.trim() || !s.detail.trim()) {
      setEditError('Vui lòng nhập đầy đủ tỉnh, huyện, xã và địa chỉ chi tiết.')
      return
    }

    setEditSaving(true)
    setEditError('')
    try {
      const data = await updateMyOrderCustomerInfo(id, {
        contact: {
          name: c.name,
          email: c.email,
          phone: c.phone,
        },
        shippingAddress: {
          province: s.province,
          district: s.district,
          ward: s.ward,
          detail: s.detail,
          note: s.note,
        },
      })
      setOrder(mapOrderDetail(data))
      setEditOpen(false)
      setToast('Cập nhật thông tin đơn hàng thành công')
    } catch (err) {
      const status = err?.response?.status
      if (status === 401) {
        navigate('/login', { replace: true })
        return
      }
      if (status === 404) {
        setError('Không tìm thấy đơn hàng')
        setEditOpen(false)
      } else if (status === 400) {
        setEditError(err.response?.data?.message || 'Đơn hàng không hợp lệ')
      } else {
        setEditError('Có lỗi xảy ra. Vui lòng thử lại.')
      }
    } finally {
      setEditSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-page text-ink">
        Đang tải...
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="min-h-svh bg-page font-sans text-ink">
      <Header
        searchQuery={search}
        onSearchQueryChange={setSearch}
        brandFilter={brandFilter}
        onBrandFilterChange={setBrandFilter}
      />
      <main className="mx-auto max-w-[1050px] px-4 py-6 md:py-8">
        <Link to="/profile#orders" className="text-sm font-semibold text-brand hover:underline">
          ← Quay lại Đơn mua
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold">Chi tiết đơn hàng</h1>

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
                  {canEditOrder ? (
                    <button
                      type="button"
                      onClick={openEditModal}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                    >
                      Sửa thông tin đơn hàng
                    </button>
                  ) : null}
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                    {ORDER_STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}
              </p>
              {order.status === ORDER_STATUS.CANCELLED ? (
                <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm">
                  <p className="font-semibold text-rose-800">Lý do hủy</p>
                  <p className="mt-1 text-rose-700">{order.cancelReason || '—'}</p>
                </div>
              ) : null}
              <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <p className="font-semibold text-gray-800">Thông tin liên hệ</p>
                  <p className="mt-1 text-gray-700">{order.contact?.name || '—'}</p>
                  <p className="text-gray-700">{order.contact?.phone || '—'}</p>
                  <p className="text-gray-700">{order.contact?.email || '—'}</p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <p className="font-semibold text-gray-800">Địa chỉ giao hàng</p>
                  <p className="mt-1 text-gray-700">{order.shippingAddressText || 'Chưa có địa chỉ'}</p>
                  <p className="mt-2 text-gray-500">Ghi chú giao hàng</p>
                  <p className="text-gray-700">{order.shippingNote || '—'}</p>
                </div>
              </div>
            </div>

            <CustomerDeliveryCard
              order={order}
              onCopied={(errMsg) => {
                if (errMsg) setToast(errMsg)
                else setToast('Đã sao chép mã vận đơn')
              }}
            />

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
      </main>
      <EditOrderInfoModal
        open={editOpen}
        form={editForm}
        onChange={changeEditField}
        onClose={() => {
          if (editSaving) return
          setEditOpen(false)
          setEditError('')
        }}
        onSubmit={submitEdit}
        saving={editSaving}
        error={editError}
      />
      {toast ? (
        <div className="fixed right-4 top-4 z-[120] rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      ) : null}
      <SiteFooter />
    </div>
  )
}
