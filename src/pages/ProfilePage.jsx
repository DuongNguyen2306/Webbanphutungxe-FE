import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { User, ShoppingBag, KeyRound, PencilLine } from 'lucide-react'
import { Header } from '../components/Header'
import { ReasonInputModal } from '../components/ReasonInputModal'
import { SiteFooter } from '../components/SiteFooter'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import {
  ORDER_STATUS,
  ORDER_STATUS_TAB,
  ORDER_STATUS_LABELS,
  mapOrderTabToStatusCode,
  normalizeOrderStatus,
} from '../constants/orderStatus'
import { formatVnd } from '../utils/format'
import { parseOrderListResponse } from '../utils/orderListResponse'

const PAGE_LIMIT = 10

export function ProfilePage() {
  const location = useLocation()
  const { user, loading, logout, updateUser } = useAuth()
  const [search, setSearch] = useState('')
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileEditing, setProfileEditing] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' })
  const [toast, setToast] = useState('')
  const [orders, setOrders] = useState([])
  const [ordLoading, setOrdLoading] = useState(true)
  const [ordError, setOrdError] = useState('')
  const [hasMoreOrders, setHasMoreOrders] = useState(false)
  const [orderPage, setOrderPage] = useState(1)
  const [ordersTotal, setOrdersTotal] = useState(null)
  const [orderSearch, setOrderSearch] = useState('')
  const [orderSearchInput, setOrderSearchInput] = useState('')
  const [cancellingId, setCancellingId] = useState('')
  const [cancelModal, setCancelModal] = useState({
    open: false,
    orderId: '',
    reason: '',
  })
  const [cancelModalError, setCancelModalError] = useState('')
  const [section, setSection] = useState('profile')
  const [statusTab, setStatusTab] = useState(ORDER_STATUS_TAB.ALL)

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(t)
  }, [toast])

  function toAbsoluteImageUrl(url) {
    if (!url) return ''
    const src = String(url).trim()
    if (!src) return ''
    if (/^(https?:)?\/\//i.test(src) || src.startsWith('data:') || src.startsWith('blob:')) {
      return src
    }

    const normalizedPath = src.startsWith('/') ? src : `/${src}`
    const apiBase = String(import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '')
    if (apiBase) return `${apiBase}${normalizedPath}`
    return normalizedPath
  }

  function resolveOrderItemImage(item) {
    const candidates = [
      item?.thumbnail,
      item?.variant?.images?.[0],
      item?.product?.images?.[0],
    ]
    const firstValid = candidates.find((v) => typeof v === 'string' && v.trim())
    return toAbsoluteImageUrl(firstValid || '')
  }

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setProfileForm({ name: '', phone: '' })
      setProfileLoading(false)
      setOrders([])
      setOrdLoading(false)
      return
    }

    let cancel = false
    setProfileLoading(true)
    ;(async () => {
      try {
        const { data } = await api.get('/api/users/profile')
        if (!cancel) {
          const nextProfile = data || {}
          const nextName = nextProfile.name || nextProfile.displayName || ''
          const nextPhone = nextProfile.phone || ''
          setProfile(nextProfile)
          setProfileForm({ name: nextName, phone: nextPhone })
        }
      } catch {
        if (!cancel) {
          const fallbackName = user?.name || user?.displayName || ''
          const fallbackPhone = user?.phone || ''
          setProfile({
            name: fallbackName,
            displayName: fallbackName,
            phone: fallbackPhone,
            email: user?.email || '',
          })
          setProfileForm({ name: fallbackName, phone: fallbackPhone })
        }
      } finally {
        if (!cancel) setProfileLoading(false)
      }
    })()

    return () => {
      cancel = true
    }
  }, [user])

  const loadOrdersPage = useCallback(
    async (page) => {
      if (!user) return
      setOrdLoading(true)
      setOrdError('')
      const statusCode = mapOrderTabToStatusCode(statusTab)
      const safePage = Math.max(1, Number(page) || 1)
      const skip = (safePage - 1) * PAGE_LIMIT
      const params = {
        limit: PAGE_LIMIT,
        skip,
      }
      if (statusCode) params.status = statusCode
      const q = orderSearch.trim()
      if (q) params.search = q

      try {
        const { data } = await api.get('/api/orders/my-orders', { params })
        const { items, total } = parseOrderListResponse(data)
        setOrders(items)
        setOrderPage(safePage)
        setOrdersTotal(total)
        const hasNext =
          total != null && Number.isFinite(total)
            ? skip + items.length < total
            : items.length === PAGE_LIMIT
        setHasMoreOrders(hasNext)
      } catch (err) {
        setOrdError(err.response?.data?.message || 'Không tải được đơn hàng.')
        setOrders([])
        setOrdersTotal(null)
        setHasMoreOrders(false)
      } finally {
        setOrdLoading(false)
      }
    },
    [user, statusTab, orderSearch],
  )

  useEffect(() => {
    if (location.hash === '#orders') {
      setSection('orders')
    }
  }, [location.hash])

  useEffect(() => {
    if (!user) return
    loadOrdersPage(1)
  }, [user, statusTab, orderSearch, loadOrdersPage])

  const statusTabs = [
    { id: ORDER_STATUS_TAB.ALL, label: 'Tất cả' },
    { id: ORDER_STATUS_TAB.PENDING, label: ORDER_STATUS_LABELS[ORDER_STATUS.PENDING] },
    { id: ORDER_STATUS_TAB.CONTACTING, label: ORDER_STATUS_LABELS[ORDER_STATUS.CONTACTING] },
    { id: ORDER_STATUS_TAB.CONFIRMED, label: ORDER_STATUS_LABELS[ORDER_STATUS.CONFIRMED] },
    { id: ORDER_STATUS_TAB.SHIPPING, label: ORDER_STATUS_LABELS[ORDER_STATUS.SHIPPING] },
    { id: ORDER_STATUS_TAB.COMPLETED, label: ORDER_STATUS_LABELS[ORDER_STATUS.COMPLETED] },
    { id: ORDER_STATUS_TAB.CANCELLED, label: ORDER_STATUS_LABELS[ORDER_STATUS.CANCELLED] },
  ]

  const orderListTotalPages = useMemo(() => {
    if (ordersTotal == null || !Number.isFinite(ordersTotal)) return null
    return Math.max(1, Math.ceil(ordersTotal / PAGE_LIMIT))
  }, [ordersTotal])

  const statusBadgeClass = {
    [ORDER_STATUS.PENDING]: 'bg-amber-50 text-amber-700',
    [ORDER_STATUS.CONTACTING]: 'bg-amber-50 text-amber-700',
    [ORDER_STATUS.CONFIRMED]: 'bg-blue-50 text-blue-700',
    [ORDER_STATUS.SHIPPING]: 'bg-sky-50 text-sky-700',
    [ORDER_STATUS.COMPLETED]: 'bg-green-50 text-green-700',
    [ORDER_STATUS.CANCELLED]: 'bg-rose-50 text-rose-700',
  }

  async function saveProfile(e) {
    e.preventDefault()
    const name = profileForm.name.trim()
    setProfileError('')
    setProfileSaving(true)
    try {
      const { data } = await api.put('/api/users/profile', { name })
      const nextProfile = data || {}
      setProfile((prev) => ({
        ...(prev || {}),
        ...nextProfile,
        name: nextProfile.name || nextProfile.displayName || '',
      }))
      setProfileForm({
        name: nextProfile.name || nextProfile.displayName || name,
        phone: nextProfile.phone || profileForm.phone || '',
      })
      updateUser({
        name: nextProfile.name || nextProfile.displayName || name,
        displayName: nextProfile.displayName || nextProfile.name || name,
      })
      setProfileEditing(false)
      setToast('Cập nhật thông tin thành công.')
    } catch (err) {
      const message =
        err.response?.status === 409
          ? err.response?.data?.message || 'Số điện thoại đã được sử dụng.'
          : err.response?.data?.message || 'Không thể cập nhật thông tin.'
      setProfileError(message)
    } finally {
      setProfileSaving(false)
    }
  }

  async function confirmCancelOrder() {
    const reason = cancelModal.reason.trim()
    if (!reason) {
      setCancelModalError('Vui lòng nhập lý do hủy đơn.')
      return
    }

    setOrdError('')
    setCancellingId(cancelModal.orderId)
    try {
      const { data } = await api.patch(`/api/orders/${cancelModal.orderId}/cancel`, {
        reason,
      })
      setOrders((prev) =>
        prev.map((order) =>
          order._id === cancelModal.orderId
            ? {
                ...order,
                ...(data || {}),
                status: normalizeOrderStatus(data?.status || ORDER_STATUS.CANCELLED),
              }
            : order,
        ),
      )
      setCancelModal({ open: false, orderId: '', reason: '' })
      setCancelModalError('')
      setToast('Đã gửi yêu cầu hủy đơn.')
      loadOrdersPage(orderPage)
    } catch (err) {
      setOrdError(err.response?.data?.message || 'Hủy đơn thất bại.')
    } finally {
      setCancellingId('')
    }
  }

  const shownName = profile?.name || profile?.displayName || ''
  const displayPhone = profile?.phone || ''
  const initials = `${(shownName || user?.email || user?.phone || 'U')[0] || 'U'}${
    (shownName || user?.email || '')[1] || ''
  }`.toUpperCase()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-page text-ink">
        Đang tải...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-svh bg-page font-sans text-ink">
      <Header searchQuery={search} onSearchQueryChange={setSearch} />
      <main className="mx-auto max-w-[1050px] px-4 py-6 md:py-8">
        <div className="rounded-2xl border border-gray-200 bg-[#F3F4F6] p-3 md:p-5">
          <div className="grid gap-4 md:grid-cols-[200px_1fr]">
          <aside className="rounded-xl border border-gray-200 bg-white p-2">
            <div className="flex gap-2 overflow-x-auto md:block">
              <button
                type="button"
                onClick={() => setSection('profile')}
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg border-l-2 px-3 py-2 text-sm font-semibold ${section === 'profile' ? 'border-brand bg-red-50 text-brand' : 'border-transparent text-gray-700 hover:bg-gray-100'}`}
              >
                <User className="size-4" />
                Hồ sơ
              </button>
              <button
                id="orders"
                type="button"
                onClick={() => setSection('orders')}
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg border-l-2 px-3 py-2 text-sm font-semibold ${section === 'orders' ? 'border-brand bg-red-50 text-brand' : 'border-transparent text-gray-700 hover:bg-gray-100'}`}
              >
                <ShoppingBag className="size-4" />
                Đơn mua
              </button>
              <button
                type="button"
                onClick={() => setSection('password')}
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg border-l-2 px-3 py-2 text-sm font-semibold ${section === 'password' ? 'border-brand bg-red-50 text-brand' : 'border-transparent text-gray-700 hover:bg-gray-100'}`}
              >
                <KeyRound className="size-4" />
                Đổi mật khẩu
              </button>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-bold"
            >
              Đăng xuất
            </button>
          </aside>

          <section className="min-w-0 rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.05)] md:p-8">
            {section === 'profile' ? (
              <>
                <h1 className="text-xl font-extrabold">Thông tin tài khoản</h1>
                <div className="mt-4 rounded-xl border border-gray-100 bg-page/60 p-5">
                  <div className="mb-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileEditing((v) => !v)
                        setProfileError('')
                        setProfileForm({
                          name: profile?.name || profile?.displayName || '',
                          phone: profile?.phone || '',
                        })
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                    >
                      <PencilLine className="size-4" />
                      {profileEditing ? 'Đóng' : 'Chỉnh sửa'}
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-extrabold text-white">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      {profileLoading ? (
                        <p className="text-sm text-gray-500">Đang tải thông tin...</p>
                      ) : null}
                      {profileError ? (
                        <p className="mb-2 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
                          {profileError}
                        </p>
                      ) : null}
                      {profileEditing ? (
                        <form className="space-y-2" onSubmit={saveProfile}>
                          <label className="block text-sm">
                            <span className="text-gray-500">Họ tên</span>
                            <input
                              value={profileForm.name}
                              onChange={(e) =>
                                setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                              }
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                              placeholder="Nhập họ tên"
                            />
                          </label>
                          <label className="block text-sm">
                            <span className="text-gray-500">SĐT</span>
                            <input
                              value={profileForm.phone}
                              onChange={(e) =>
                                setProfileForm((prev) => ({ ...prev, phone: e.target.value }))
                              }
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                              placeholder="Nhập số điện thoại"
                            />
                          </label>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setProfileEditing(false)
                                setProfileError('')
                              }}
                              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold"
                            >
                              Hủy
                            </button>
                            <button
                              type="submit"
                              disabled={profileSaving}
                              className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            >
                              {profileSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="truncate font-semibold">{user.email || '—'}</p>
                          <p className="mt-1 text-sm text-gray-500">Họ tên</p>
                          <p className="font-semibold">{shownName || '—'}</p>
                      <p className="mt-1 text-sm text-gray-500">SĐT</p>
                          <p className="font-semibold">{displayPhone || '—'}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            {section === 'orders' ? (
              <>
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-xl font-extrabold">Đơn mua của tôi</h2>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                      {ordersTotal != null
                        ? `${ordersTotal} đơn`
                        : orders.length > 0
                          ? `${orders.length} đơn / trang`
                          : '0 đơn'}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="search"
                      value={orderSearchInput}
                      onChange={(e) => setOrderSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          setOrderSearch(orderSearchInput.trim())
                        }
                      }}
                      placeholder="Tìm theo mã đơn, tên SP, SĐT…"
                      className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      aria-label="Tìm đơn hàng"
                    />
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => setOrderSearch(orderSearchInput.trim())}
                        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white hover:bg-gray-800"
                      >
                        Tìm
                      </button>
                      {orderSearch ? (
                        <button
                          type="button"
                          onClick={() => {
                            setOrderSearchInput('')
                            setOrderSearch('')
                          }}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Xóa lọc
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 border-b border-gray-200">
                    <div className="flex gap-5 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {statusTabs.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setStatusTab(t.id)}
                      className={`shrink-0 border-b-2 px-0 pb-2.5 pt-1 text-sm transition ${
                        statusTab === t.id
                          ? 'border-[#BC1F26] font-bold text-[#BC1F26]'
                          : 'border-transparent font-medium text-gray-600 hover:text-[#BC1F26]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                    </div>
                </div>
                {ordError ? (
                  <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {ordError}
                  </p>
                ) : null}
                {ordLoading ? (
                  <p className="mt-4 text-sm text-gray-500">Đang tải...</p>
                ) : orders.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center">
                    <p className="text-sm text-gray-600">
                      Chưa có đơn ở trạng thái này.{' '}
                      <Link to="/" className="font-bold text-brand">
                        Mua sắm
                      </Link>
                    </p>
                  </div>
                ) : (
                  <>
                  <ul className="mt-4 space-y-3">
                    {orders.map((o) => (
                      <li
                        key={o._id}
                        className="rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-[0_4px_14px_rgba(15,23,42,0.06)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="hidden font-mono text-xs text-gray-500 sm:inline">
                            Mã đơn: #{String(o._id).slice(-8)}
                          </span>
                          <div className="ml-auto flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              Ngày đặt: {new Date(o.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                statusBadgeClass[normalizeOrderStatus(o.status)] ||
                                'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {ORDER_STATUS_LABELS[normalizeOrderStatus(o.status)] ||
                                normalizeOrderStatus(o.status)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 space-y-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                          {o.items?.slice(0, 3).map((it, i) => {
                            const itemImage = resolveOrderItemImage(it)
                            return (
                              <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <div className="h-20 w-20 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                                  {itemImage ? (
                                    <img
                                      src={itemImage}
                                      alt={it.name || 'Sản phẩm'}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : null}
                                </div>
                                <div className="min-w-0">
                                  <p className="line-clamp-2 font-semibold text-gray-800">
                                    {it.name}
                                  </p>
                                  <p className="mt-1 text-xs text-gray-500">
                                    {it.variantLabel || 'Mặc định'} × {it.quantity}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        {normalizeOrderStatus(o.status) === ORDER_STATUS.SHIPPING ||
                        normalizeOrderStatus(o.status) === ORDER_STATUS.COMPLETED ? (
                          o.delivery?.carrierName || o.delivery?.trackingNumber ? (
                            <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-900">
                              <span className="font-bold">Giao hàng:</span>{' '}
                              {[o.delivery?.carrierName, o.delivery?.trackingNumber]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          ) : normalizeOrderStatus(o.status) === ORDER_STATUS.SHIPPING ? (
                            <p className="mt-2 text-xs text-gray-600">
                              Shop sẽ cập nhật mã vận đơn sớm.
                            </p>
                          ) : null
                        ) : null}
                        <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="text-right sm:ml-auto">
                            <p className="text-xs text-gray-500">Tổng thanh toán</p>
                            <p className="text-xl font-extrabold text-[#BC1F26]">
                              {formatVnd(o.totalAmount)}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {[ORDER_STATUS.PENDING, ORDER_STATUS.CONTACTING].includes(
                              normalizeOrderStatus(o.status),
                            ) ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setCancelModal({ open: true, orderId: o._id, reason: '' })
                                  setCancelModalError('')
                                }}
                                disabled={cancellingId === o._id}
                                className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {cancellingId === o._id ? 'Đang hủy...' : 'Hủy đơn'}
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="rounded-lg border border-[#BC1F26] bg-white px-3 py-1.5 text-xs font-bold text-[#BC1F26] transition hover:bg-red-50"
                            >
                              Mua lại
                            </button>
                            <Link
                              to={`/don-mua/${o._id}`}
                              className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-gray-800"
                            >
                              Xem chi tiết
                            </Link>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    <p className="text-xs text-gray-500">
                      {orderListTotalPages != null
                        ? `Trang ${orderPage} / ${orderListTotalPages}`
                        : `Trang ${orderPage}`}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={ordLoading || orderPage <= 1}
                        onClick={() => loadOrdersPage(orderPage - 1)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Trước
                      </button>
                      <button
                        type="button"
                        disabled={
                          ordLoading ||
                          (orderListTotalPages != null
                            ? orderPage >= orderListTotalPages
                            : !hasMoreOrders)
                        }
                        onClick={() => loadOrdersPage(orderPage + 1)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                  </>
                )}
                </div>
              </>
            ) : null}

            {section === 'password' ? (
              <>
                <h2 className="text-xl font-extrabold">Đổi mật khẩu</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Tính năng đang được cập nhật.
                </p>
              </>
            ) : null}
          </section>
        </div>
        </div>
      </main>
      <ReasonInputModal
        open={cancelModal.open}
        title="Nhập lý do hủy đơn"
        description="Vui lòng cho biết lý do để hệ thống xử lý nhanh hơn."
        value={cancelModal.reason}
        onChange={(value) => {
          setCancelModal((prev) => ({ ...prev, reason: value }))
          if (cancelModalError) setCancelModalError('')
        }}
        onCancel={() => {
          if (cancellingId) return
          setCancelModal({ open: false, orderId: '', reason: '' })
          setCancelModalError('')
        }}
        onConfirm={confirmCancelOrder}
        confirmLabel="Gửi yêu cầu hủy"
        loading={Boolean(cancellingId)}
        error={cancelModalError}
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
