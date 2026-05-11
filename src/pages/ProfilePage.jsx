import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { User, ShoppingBag, KeyRound, PencilLine } from 'lucide-react'
import { Header } from '../components/Header'
import { ReasonInputModal } from '../components/ReasonInputModal'
import { SiteFooter } from '../components/SiteFooter'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { api } from '../api/client'
import {
  ORDER_STATUS,
  ORDER_STATUS_TAB,
  ORDER_STATUS_LABELS,
  mapOrderTabToStatusCode,
  normalizeOrderStatus,
} from '../constants/orderStatus'
import { OrderListCard } from '../components/orders/OrderListCard'
import { parseOrderListResponse } from '../utils/orderListResponse'
import { showUiToast } from '../utils/uiToast'

const PAGE_LIMIT = 10

export function ProfilePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, loading, logout, updateUser } = useAuth()
  const { addItem } = useCart()
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
  const [reorderingId, setReorderingId] = useState('')
  const [cancelModal, setCancelModal] = useState({
    open: false,
    orderId: '',
    reason: '',
  })
  const [cancelModalError, setCancelModalError] = useState('')
  const [section, setSection] = useState('profile')
  const [statusTab, setStatusTab] = useState(ORDER_STATUS_TAB.ALL)
  /**
   * Số đơn theo từng tab trạng thái, để hiện badge cạnh tên tab
   * (ví dụ "Chờ xử lý 3", "Đang liên hệ 1"…). Null = chưa tải / không đếm được.
   */
  const [tabCounts, setTabCounts] = useState({
    [ORDER_STATUS_TAB.ALL]: null,
    [ORDER_STATUS.PENDING]: null,
    [ORDER_STATUS.CONTACTING]: null,
    [ORDER_STATUS.CONFIRMED]: null,
    [ORDER_STATUS.SHIPPING]: null,
    [ORDER_STATUS.COMPLETED]: null,
    [ORDER_STATUS.CANCELLED]: null,
  })

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(t)
  }, [toast])

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

  /**
   * Tải số lượng đơn cho từng tab (Tất cả + 6 trạng thái) song song.
   * Dùng limit=1 để chỉ lấy total từ server, không kéo nguyên page.
   * Re-fetch khi: đổi user, từ khoá search đổi, hoặc khi page hiện tại reload (orders thay đổi).
   */
  useEffect(() => {
    if (!user) return undefined
    let cancelled = false

    const STATUS_KEYS = [
      ORDER_STATUS.PENDING,
      ORDER_STATUS.CONTACTING,
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.SHIPPING,
      ORDER_STATUS.COMPLETED,
      ORDER_STATUS.CANCELLED,
    ]

    const q = orderSearch.trim()
    const baseParams = { limit: 1, skip: 0 }
    if (q) baseParams.search = q

    const fetchOne = (statusCode) => {
      const params = { ...baseParams }
      if (statusCode) params.status = statusCode
      return api
        .get('/api/orders/my-orders', { params })
        .then(({ data }) => {
          const parsed = parseOrderListResponse(data)
          if (parsed.total != null && Number.isFinite(parsed.total)) {
            return parsed.total
          }
          return parsed.items.length
        })
        .catch(() => null)
    }

    Promise.all([fetchOne(''), ...STATUS_KEYS.map(fetchOne)]).then((results) => {
      if (cancelled) return
      const [allCount, ...statusCounts] = results
      setTabCounts({
        [ORDER_STATUS_TAB.ALL]: allCount,
        [ORDER_STATUS.PENDING]: statusCounts[0],
        [ORDER_STATUS.CONTACTING]: statusCounts[1],
        [ORDER_STATUS.CONFIRMED]: statusCounts[2],
        [ORDER_STATUS.SHIPPING]: statusCounts[3],
        [ORDER_STATUS.COMPLETED]: statusCounts[4],
        [ORDER_STATUS.CANCELLED]: statusCounts[5],
      })
    })

    return () => {
      cancelled = true
    }
  }, [user, orderSearch, orders])

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

  function isVariantInStock(variant) {
    if (!variant || variant.isAvailable === false) return false
    const stock = Number(variant.stockQuantity ?? variant.stock ?? variant.quantity)
    if (Number.isFinite(stock)) return stock > 0
    return true
  }

  async function handleReorder(order) {
    const orderItems = Array.isArray(order?.items) ? order.items : []
    if (!orderItems.length) {
      showUiToast('Đơn hàng này chưa có sản phẩm để mua lại.', 'error')
      return
    }

    setOrdError('')
    setReorderingId(order._id)
    const unavailableNames = []
    let addedCount = 0

    try {
      for (const item of orderItems) {
        const productId = String(
          item?.productId?._id ??
            item?.product?._id ??
            item?.product?._id ??
            item?.productId ??
            item?.product ??
            '',
        )
        if (!productId) {
          unavailableNames.push(item?.name || 'Sản phẩm')
          continue
        }

        const selectedVariantId = String(
          item?.selectedVariant?._id ??
            item?.selectedVariant ??
            item?.variantId ??
            item?.variant?._id ??
            item?.variant ??
            '',
        )

        const { data } = await api.get(`/api/products/${productId}`)
        const product = data?.product && typeof data.product === 'object' ? data.product : data
        const variants = Array.isArray(product?.variants) ? product.variants : []

        const matchedVariant = variants.find(
          (v) => String(v?._id ?? v?.id ?? '') === selectedVariantId,
        )
        const availableVariant = variants.find((v) => isVariantInStock(v))
        const chosenVariant = matchedVariant && isVariantInStock(matchedVariant)
          ? matchedVariant
          : availableVariant || null

        if (!chosenVariant) {
          unavailableNames.push(product?.name || item?.name || 'Sản phẩm')
          continue
        }

        const variantLabelParts = [chosenVariant?.typeName, chosenVariant?.color, chosenVariant?.size]
          .map((x) => String(x || '').trim())
          .filter(Boolean)
        const variantLabel = item?.variantLabel || variantLabelParts.join(' · ') || 'Mặc định'

        await Promise.resolve(
          addItem({
            productId,
            selectedVariant: String(chosenVariant?._id ?? chosenVariant?.id ?? ''),
            variantId: String(chosenVariant?._id ?? chosenVariant?.id ?? ''),
            quantity: Math.max(1, Number(item?.quantity) || 1),
            name: String(product?.name || item?.name || 'Sản phẩm'),
            variantLabel,
            salePrice: Number(chosenVariant?.price ?? item?.price ?? 0),
            image:
              chosenVariant?.images?.[0] ||
              product?.images?.[0] ||
              item?.thumbnail ||
              item?.image ||
              '',
            mongoOk: true,
          }),
        )
        addedCount += 1
      }

      if (addedCount > 0) {
        showUiToast(`Đã thêm ${addedCount} sản phẩm vào giỏ hàng.`)
        if (unavailableNames.length) {
          showUiToast(
            `Một số sản phẩm đã hết hàng: ${unavailableNames.slice(0, 2).join(', ')}${unavailableNames.length > 2 ? '...' : ''}.`,
            'error',
          )
        }
        navigate('/cart')
        return
      }

      showUiToast('Các sản phẩm trong đơn này hiện đã hết hàng.', 'error')
    } catch (err) {
      showUiToast(err?.response?.data?.message || 'Không thể mua lại lúc này. Vui lòng thử lại.', 'error')
    } finally {
      setReorderingId('')
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

  /**
   * Mobile section tabs (mỏng, không có bóng card chồng chéo).
   * Dùng dải gạch chân màu brand cho tab đang chọn.
   */
  const mobileSectionTabs = [
    { id: 'profile', label: 'Hồ sơ', Icon: User },
    { id: 'orders', label: 'Đơn mua', Icon: ShoppingBag, anchor: 'orders-mobile' },
    { id: 'password', label: 'Mật khẩu', Icon: KeyRound },
  ]

  return (
    <div className="min-h-svh bg-page font-sans text-ink">
      <Header searchQuery={search} onSearchQueryChange={setSearch} />
      <main className="mx-auto w-full max-w-7xl px-2 pb-6 pt-3 sm:px-6 md:px-4 md:py-8 lg:px-8 xl:px-10 2xl:max-w-[90rem]">
        <nav
          className="sticky top-[calc(var(--header-mobile-offset,116px))] z-30 -mx-2 mb-3 border-b border-gray-200 bg-page/95 px-2 backdrop-blur supports-[backdrop-filter]:bg-page/80 md:hidden"
          aria-label="Menu tài khoản"
        >
          <div className="flex items-stretch gap-1 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {mobileSectionTabs.map(({ id, label, Icon, anchor }) => {
              const active = section === id
              return (
                <button
                  key={id}
                  id={anchor}
                  type="button"
                  onClick={() => setSection(id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm transition ${
                    active
                      ? 'border-brand font-bold text-brand'
                      : 'border-transparent font-medium text-gray-600'
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </button>
              )
            })}
          </div>
        </nav>

        <div className="rounded-none border-0 bg-transparent p-0 md:rounded-2xl md:border md:border-gray-200 md:bg-[#F3F4F6] md:p-5 lg:p-6">
          <div className="grid gap-4 md:grid-cols-[minmax(0,200px)_minmax(0,1fr)] md:gap-5 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
          <aside className="hidden rounded-xl border border-gray-200 bg-white p-2 md:block">
            <nav className="flex flex-col gap-1.5" aria-label="Menu tài khoản">
              <button
                type="button"
                onClick={() => setSection('profile')}
                className={`inline-flex w-full items-center gap-2 rounded-lg border-l-2 px-3 py-2.5 text-left text-sm font-semibold ${section === 'profile' ? 'border-brand bg-red-50 text-brand' : 'border-transparent text-gray-700 hover:bg-gray-100'}`}
              >
                <User className="size-4 shrink-0" />
                Hồ sơ
              </button>
              <button
                id="orders"
                type="button"
                onClick={() => setSection('orders')}
                className={`inline-flex w-full items-center gap-2 rounded-lg border-l-2 px-3 py-2.5 text-left text-sm font-semibold ${section === 'orders' ? 'border-brand bg-red-50 text-brand' : 'border-transparent text-gray-700 hover:bg-gray-100'}`}
              >
                <ShoppingBag className="size-4 shrink-0" />
                Đơn mua
              </button>
              <button
                type="button"
                onClick={() => setSection('password')}
                className={`inline-flex w-full items-center gap-2 rounded-lg border-l-2 px-3 py-2.5 text-left text-sm font-semibold ${section === 'password' ? 'border-brand bg-red-50 text-brand' : 'border-transparent text-gray-700 hover:bg-gray-100'}`}
              >
                <KeyRound className="size-4 shrink-0" />
                Đổi mật khẩu
              </button>
            </nav>
            <button
              type="button"
              onClick={() => logout()}
              className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-bold"
            >
              Đăng xuất
            </button>
          </aside>

          <section className="min-w-0 rounded-none border-0 bg-transparent p-0 shadow-none sm:p-0 md:rounded-2xl md:border md:border-gray-100 md:bg-white md:p-8 md:shadow-[0_8px_24px_rgba(15,23,42,0.05)] lg:p-10">
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
                <div className="rounded-none border-0 bg-transparent p-0 shadow-none md:rounded-2xl md:border md:border-gray-200 md:bg-white md:p-5 md:shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-1 md:px-0">
                    <h2 className="text-lg font-extrabold md:text-xl">Đơn mua của tôi</h2>
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600 md:px-3 md:py-1 md:text-xs">
                      {ordersTotal != null
                        ? `${ordersTotal} đơn`
                        : orders.length > 0
                          ? `${orders.length} đơn / trang`
                          : '0 đơn'}
                    </span>
                  </div>

                  {/* Search + Status tabs: sticky trên mobile để khi cuộn danh sách dài vẫn đổi tab nhanh */}
                  <div className="sticky top-[calc(var(--header-mobile-offset,116px)+44px)] z-20 -mx-2 mt-3 border-b border-gray-200 bg-page/95 px-2 pt-2 backdrop-blur supports-[backdrop-filter]:bg-page/80 md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:pt-0">
                    <div className="flex items-center gap-2">
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
                        placeholder="Tìm mã đơn, tên SP, SĐT…"
                        className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                        aria-label="Tìm đơn hàng"
                      />
                      <button
                        type="button"
                        onClick={() => setOrderSearch(orderSearchInput.trim())}
                        className="shrink-0 rounded-lg bg-gray-900 px-3 py-2 text-sm font-bold text-white hover:bg-gray-800 md:px-4"
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
                          className="shrink-0 rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 md:px-3 md:text-sm"
                        >
                          Xóa lọc
                        </button>
                      ) : null}
                    </div>

                    <div className="mt-2 md:mt-4 md:border-b md:border-gray-200">
                      <div className="flex gap-4 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] md:gap-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {statusTabs.map((t) => {
                          const isActive = statusTab === t.id
                          const count = tabCounts[t.id]
                          const hasCount = typeof count === 'number' && Number.isFinite(count)
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setStatusTab(t.id)}
                              className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-0 pb-2 pt-1 text-sm transition md:pb-2.5 ${
                                isActive
                                  ? 'border-[#BC1F26] font-bold text-[#BC1F26]'
                                  : 'border-transparent font-medium text-gray-600 hover:text-[#BC1F26]'
                              }`}
                            >
                              <span>{t.label}</span>
                              {hasCount && count > 0 ? (
                                <span
                                  className={`inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-0 text-[10px] font-bold leading-[18px] ${
                                    isActive
                                      ? 'bg-[#BC1F26] text-white'
                                      : 'bg-gray-200 text-gray-700'
                                  }`}
                                  aria-label={`${count} đơn`}
                                >
                                  {count > 99 ? '99+' : count}
                                </span>
                              ) : null}
                            </button>
                          )
                        })}
                      </div>
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
                  <ul className="mt-4 space-y-4">
                    {orders.map((o) => {
                      const st = normalizeOrderStatus(o.status)
                      return (
                        <OrderListCard
                          key={o._id}
                          order={o}
                          variant="customer"
                          edgeHighlight={st === ORDER_STATUS.SHIPPING ? 'shipping' : 'none'}
                          actions={
                            <>
                              {[ORDER_STATUS.PENDING, ORDER_STATUS.CONTACTING].includes(st) ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCancelModal({ open: true, orderId: o._id, reason: '' })
                                    setCancelModalError('')
                                  }}
                                  disabled={cancellingId === o._id}
                                  className="rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 md:shrink-0 md:whitespace-nowrap"
                                >
                                  {cancellingId === o._id ? 'Đang hủy...' : 'Hủy đơn'}
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => handleReorder(o)}
                                disabled={reorderingId === o._id}
                                className="rounded-lg border-2 border-brand bg-white px-3 py-2 text-xs font-bold text-brand transition hover:bg-brand/5 md:shrink-0 md:whitespace-nowrap"
                              >
                                {reorderingId === o._id ? 'Đang xử lý...' : 'Mua lại'}
                              </button>
                              <Link
                                to={`/don-mua/${o._id}`}
                                className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-gray-800 md:shrink-0 md:whitespace-nowrap"
                              >
                                Xem chi tiết
                              </Link>
                            </>
                          }
                        />
                      )
                    })}
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

        {/* Mobile-only: nút Đăng xuất nhỏ ở cuối trang, nhường chỗ phía trên cho danh sách đơn.
            Body đã có padding-bottom = 72px (bottom-nav) qua index.css; thêm 8px nữa cho thoáng. */}
        <div className="mt-6 pb-2 md:hidden">
          <button
            type="button"
            onClick={() => logout()}
            className="mx-auto block rounded-full border border-gray-300 bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Đăng xuất
          </button>
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
