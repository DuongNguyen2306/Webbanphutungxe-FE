import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { AdminOrderStatusTabs } from '../../components/admin/AdminOrderStatusTabs'
import { AdminOrderList } from '../../components/admin/AdminOrderList'
import { parseOrderListResponse } from '../../utils/orderListResponse'
import { normalizeSearch } from '../../utils/string'

const PAGE_LIMIT = 10

const ORDER_FILTER_TABS = [
  { id: 'ALL', label: 'Tất cả', statusQuery: '' },
  { id: 'WAITING_CONFIRM', label: 'Chờ xác nhận', statusQuery: 'Chờ xác nhận' },
  { id: 'WAITING_PICKUP', label: 'Chờ lấy hàng', statusQuery: 'Chờ lấy hàng' },
  { id: 'SHIPPING', label: 'Đang giao', statusQuery: 'Đang giao' },
  { id: 'COMPLETED', label: 'Đã giao', statusQuery: 'Đã giao' },
  { id: 'CANCELLED', label: 'Hủy', statusQuery: 'Hủy' },
]

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

function orderMatchesSearch(order, rawQuery) {
  const q = normalizeSearch(String(rawQuery || '').trim())
  if (!q) return true
  const orderId = String(order?._id || '')
  const shortId = orderId ? `#${orderId.slice(-8)}` : ''
  const fields = [
    orderId,
    shortId,
    order?.contact?.name,
    order?.contact?.phone,
    order?.contact?.email,
    order?.user?.phone,
    order?.user?.email,
    ...(Array.isArray(order?.items) ? order.items.map((it) => it?.name) : []),
  ]
    .map((x) => String(x || ''))
    .join(' ')
  return normalizeSearch(fields).includes(q)
}

export function AdminOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [statusOptions, setStatusOptions] = useState(FALLBACK_STATUS_OPTIONS)
  const [loading, setLoading] = useState(true)
  const [countsLoading, setCountsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [ordersTotal, setOrdersTotal] = useState(null)
  const [tabCounts, setTabCounts] = useState({})
  const [hasNextPage, setHasNextPage] = useState(false)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [activeTabId, setActiveTabId] = useState('ALL')
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ message: '', tone: 'success' })
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
    if (!toast.message) return undefined
    const t = setTimeout(
      () => setToast({ message: '', tone: 'success' }),
      2800,
    )
    return () => clearTimeout(t)
  }, [toast.message])

  const activeStatusQuery = useMemo(
    () =>
      ORDER_FILTER_TABS.find((tab) => tab.id === activeTabId)?.statusQuery || '',
    [activeTabId],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const q = search.trim()
    const searching = Boolean(q)
    const safePage = Math.max(1, page)
    const skip = searching ? 0 : (safePage - 1) * PAGE_LIMIT
    const params = {
      limit: searching ? 500 : PAGE_LIMIT,
      skip,
    }
    if (q) {
      // Hỗ trợ nhiều backend naming conventions
      params.search = q
      params.q = q
      params.keyword = q
    }
    if (activeStatusQuery) params.status = activeStatusQuery
    try {
      const { data } = await api.get('/api/admin/orders', { params })
      const { items, total } = parseOrderListResponse(data)
      const filteredItems = searching ? items.filter((order) => orderMatchesSearch(order, q)) : items
      setOrders(filteredItems)
      if (searching) {
        setOrdersTotal(filteredItems.length)
        setHasNextPage(false)
      } else {
        setOrdersTotal(total)
        const hasNext =
          total != null && Number.isFinite(total)
            ? skip + items.length < total
            : items.length === PAGE_LIMIT
        setHasNextPage(hasNext)
      }
    } catch (err) {
      setOrders([])
      setOrdersTotal(null)
      setHasNextPage(false)
      const message =
        err.response?.data?.message ||
        'Không tải được đơn hàng từ API /api/admin/orders.'
      setError(message)
      setToast({ message, tone: 'error' })
    } finally {
      setLoading(false)
    }
  }, [activeStatusQuery, page, search])

  const loadTabCounts = useCallback(async () => {
    setCountsLoading(true)
    const q = search.trim()
    try {
      const entries = await Promise.all(
        ORDER_FILTER_TABS.map(async (tab) => {
          const params = { limit: 1, skip: 0 }
          if (q) params.search = q
          if (tab.statusQuery) params.status = tab.statusQuery
          try {
            const { data } = await api.get('/api/admin/orders', { params })
            const { items, total } = parseOrderListResponse(data)
            return [tab.id, total != null ? total : items.length]
          } catch {
            return [tab.id, null]
          }
        }),
      )
      setTabCounts(Object.fromEntries(entries))
    } finally {
      setCountsLoading(false)
    }
  }, [search])

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

  useEffect(() => {
    loadTabCounts()
  }, [loadTabCounts])

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
      setToast({ message: 'Cập nhật trạng thái thành công', tone: 'success' })
      await load()
      loadTabCounts()
      return true
    } catch (err) {
      const status = err?.response?.status
      if (status === 401) {
        navigate('/login', { replace: true })
      }
      setError(getStatusUpdateErrorMessage(err))
      if (!status || status >= 500) {
        setToast({
          message: 'Không thể cập nhật trạng thái. Vui lòng thử lại.',
          tone: 'error',
        })
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
    const ok = await commitStatusChange(
      cancelModal.orderId,
      ORDER_STATUS.CANCELLED,
      reason,
    )
    if (!ok) return
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

      <AdminOrderStatusTabs
        tabs={ORDER_FILTER_TABS}
        activeTabId={activeTabId}
        counts={tabCounts}
        loading={countsLoading}
        onChange={(nextTabId) => {
          if (nextTabId === activeTabId) return
          setActiveTabId(nextTabId)
          setPage(1)
        }}
      />

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
          placeholder="Tìm mã đơn, SĐT, tên sản phẩm..."
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
      <AdminOrderList
        orders={orders}
        statusOptions={statusOptions}
        updatingId={updatingId}
        onChangeStatus={updateStatus}
        onOpenComplete={openCompleteFlow}
      />
      {orders.length > 0 && !search ? (
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
          {search
            ? 'Không có đơn khớp tìm kiếm.'
            : activeStatusQuery
              ? 'Không có đơn ở trạng thái đã chọn.'
              : 'Chưa có đơn nào.'}
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
      {toast.message ? (
        <div
          className={`fixed right-4 top-4 z-[120] rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-lg ${
            toast.tone === 'error' ? 'bg-red-600' : 'bg-gray-900'
          }`}
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  )
}
