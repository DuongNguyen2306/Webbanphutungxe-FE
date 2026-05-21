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
import { CompleteOrderConfirmModal, COMPLETE_CONFIRM_TEXT } from '../../components/CompleteOrderConfirmModal'
import { AdminOrderStatusTabs } from '../../components/admin/AdminOrderStatusTabs'
import { AdminOrderList } from '../../components/admin/AdminOrderList'
import { AdminOrderStatusChangeModal } from '../../components/admin/AdminOrderStatusChangeModal'
import { parseOrderListResponse } from '../../utils/orderListResponse'
import { normalizeSearch } from '../../utils/string'
import {
  buildAdminStatusPatchPayload,
  PROCESSED_BY_ENCOURAGED_TARGETS,
  validateProcessedByForStatusChange,
} from '../../utils/adminOrderStatusPatch'
import { mergeAdminOrderPatch } from '../../utils/mergeAdminOrderPatch'
import { formatOrderDisplayCode } from '../../utils/orderDisplayCode'
import { validateIsoDateRange } from '../../utils/isoDate'
import { downloadAdminOrdersExcel } from '../../api/adminOrdersExport'

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
  const displayCode = formatOrderDisplayCode(order, { withHash: false })
  const fields = [
    orderId,
    displayCode,
    order?.orderCode,
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

/** Parse YYYY-MM-DD (input[type=date]) → mốc đầu/cuối ngày địa phương để so sánh với createdAt. */
function parseDateBound(value, kind /* 'from' | 'to' */) {
  const raw = String(value || '').trim()
  if (!raw) return null
  const [y, m, d] = raw.split('-').map((v) => Number(v))
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null
  const dt = new Date(y, m - 1, d, kind === 'to' ? 23 : 0, kind === 'to' ? 59 : 0, kind === 'to' ? 59 : 0, kind === 'to' ? 999 : 0)
  const ts = dt.getTime()
  return Number.isFinite(ts) ? ts : null
}

function orderMatchesDateRange(order, fromTs, toTs) {
  if (fromTs == null && toTs == null) return true
  const raw = order?.createdAt || order?.orderDate || order?.created_at
  const ts = raw ? new Date(raw).getTime() : NaN
  if (!Number.isFinite(ts)) return false
  if (fromTs != null && ts < fromTs) return false
  if (toTs != null && ts > toTs) return false
  return true
}

export function AdminOrders() {
  const navigate = useNavigate()
  const [exportingExcel, setExportingExcel] = useState(false)
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
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [dateFromInput, setDateFromInput] = useState('')
  const [dateToInput, setDateToInput] = useState('')
  const [activeTabId, setActiveTabId] = useState('ALL')
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ message: '', tone: 'success' })
  const [updatingId, setUpdatingId] = useState('')
  const [statusModal, setStatusModal] = useState({
    open: false,
    orderId: '',
    targetStatus: '',
    fromStatus: '',
    processedBy: '',
    note: '',
  })
  const [statusModalError, setStatusModalError] = useState('')
  const [completeModal, setCompleteModal] = useState({
    step: 0,
    orderId: '',
    token: '',
    processedBy: '',
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

  const fromTs = useMemo(() => parseDateBound(dateFrom, 'from'), [dateFrom])
  const toTs = useMemo(() => parseDateBound(dateTo, 'to'), [dateTo])
  const dateFilterActive = fromTs != null || toTs != null

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const q = search.trim()
    const searching = Boolean(q) || dateFilterActive
    const safePage = Math.max(1, page)
    const skip = searching ? 0 : (safePage - 1) * PAGE_LIMIT
    const params = {
      limit: searching ? 500 : PAGE_LIMIT,
      skip,
    }
    if (q) {
      params.search = q
      params.q = q
      params.keyword = q
    }
    if (dateFrom) {
      params.dateFrom = dateFrom
      params.from = dateFrom
      params.startDate = dateFrom
    }
    if (dateTo) {
      params.dateTo = dateTo
      params.to = dateTo
      params.endDate = dateTo
    }
    if (activeStatusQuery) params.status = activeStatusQuery
    try {
      const { data } = await api.get('/api/admin/orders', { params })
      const { items, total } = parseOrderListResponse(data)
      const filteredItems = searching
        ? items
            .filter((order) => orderMatchesSearch(order, q))
            .filter((order) => orderMatchesDateRange(order, fromTs, toTs))
        : items
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
  }, [activeStatusQuery, page, search, dateFrom, dateTo, dateFilterActive, fromTs, toTs])

  const loadTabCounts = useCallback(async () => {
    setCountsLoading(true)
    const q = search.trim()
    /** Khi có bộ lọc theo ngày, đếm chính xác bằng cách kéo về rồi lọc client-side (BE có thể chưa hỗ trợ). */
    try {
      const entries = await Promise.all(
        ORDER_FILTER_TABS.map(async (tab) => {
          const params = dateFilterActive
            ? { limit: 500, skip: 0 }
            : { limit: 1, skip: 0 }
          if (q) params.search = q
          if (dateFrom) {
            params.dateFrom = dateFrom
            params.from = dateFrom
            params.startDate = dateFrom
          }
          if (dateTo) {
            params.dateTo = dateTo
            params.to = dateTo
            params.endDate = dateTo
          }
          if (tab.statusQuery) params.status = tab.statusQuery
          try {
            const { data } = await api.get('/api/admin/orders', { params })
            const { items, total } = parseOrderListResponse(data)
            if (dateFilterActive) {
              const matched = items.filter((order) =>
                orderMatchesDateRange(order, fromTs, toTs),
              )
              return [tab.id, matched.length]
            }
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
  }, [search, dateFrom, dateTo, dateFilterActive, fromTs, toTs])

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

  async function commitStatusChange(
    id,
    normalizedStatus,
    { note = '', processedBy = '' } = {},
  ) {
    const previous = orders.find((order) => order._id === id)
    if (!previous) return false
    const previousStatus = normalizeOrderStatus(previous.status)
    if (previousStatus === normalizedStatus) return false

    const payload = buildAdminStatusPatchPayload(normalizedStatus, {
      note,
      processedBy,
    })

    setUpdatingId(id)
    setError('')
    try {
      const { data } = await api.patch(`/api/admin/orders/${id}/status`, payload)
      setOrders((prev) =>
        prev.map((order) =>
          order._id === id ? mergeAdminOrderPatch(order, data) : order,
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
      processedBy: '',
    })
    setCompleteModalError('')
  }

  function closeCompleteFlow() {
    if (updatingId) return
    setCompleteModal({
      step: 0,
      orderId: '',
      token: '',
      processedBy: '',
    })
    setCompleteModalError('')
  }

  function openStatusModal(id, targetStatus, fromStatus) {
    setStatusModal({
      open: true,
      orderId: id,
      targetStatus,
      fromStatus,
      processedBy: '',
      note: '',
    })
    setStatusModalError('')
  }

  function closeStatusModal() {
    if (updatingId) return
    setStatusModal({
      open: false,
      orderId: '',
      targetStatus: '',
      fromStatus: '',
      processedBy: '',
      note: '',
    })
    setStatusModalError('')
  }

  function updateStatus(id, status, currentStatus) {
    const normalizedStatus = normalizeOrderStatus(status)
    if (normalizedStatus === ORDER_STATUS.COMPLETED) {
      openCompleteFlow(id, currentStatus)
      return
    }
    if (normalizedStatus === currentStatus) return
    openStatusModal(id, normalizedStatus, currentStatus)
  }

  async function handleExportExcel() {
    const validationError = validateIsoDateRange(dateFromInput, dateToInput)
    if (validationError) {
      setToast({ message: validationError, tone: 'error' })
      return
    }
    setExportingExcel(true)
    try {
      await downloadAdminOrdersExcel({
        startDate: dateFromInput,
        endDate: dateToInput,
      })
      setToast({ message: 'Đã tải báo cáo Excel', tone: 'success' })
    } catch (err) {
      if (err?.status === 401) {
        navigate('/login', { replace: true })
        return
      }
      setToast({
        message: err?.message || 'Không xuất được báo cáo Excel. Vui lòng thử lại.',
        tone: 'error',
      })
    } finally {
      setExportingExcel(false)
    }
  }

  async function submitStatusModal() {
    const { orderId, targetStatus, processedBy, note } = statusModal
    if (!orderId || !targetStatus) return
    if (targetStatus === ORDER_STATUS.CANCELLED && !note.trim()) {
      setStatusModalError('Vui lòng nhập lý do hủy đơn.')
      return
    }
    const processedByError = validateProcessedByForStatusChange(
      processedBy,
      targetStatus,
    )
    if (processedByError) {
      setStatusModalError(processedByError)
      return
    }
    const ok = await commitStatusChange(orderId, targetStatus, {
      note: note.trim(),
      processedBy,
    })
    if (!ok) return
    closeStatusModal()
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
    const processedByError = validateProcessedByForStatusChange(
      completeModal.processedBy,
      ORDER_STATUS.COMPLETED,
    )
    if (processedByError) {
      setCompleteModalError(processedByError)
      return
    }
    const ok = await commitStatusChange(completeModal.orderId, ORDER_STATUS.COMPLETED, {
      processedBy: completeModal.processedBy,
    })
    if (ok) {
      setCompleteModal({
        step: 0,
        orderId: '',
        token: '',
        processedBy: '',
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

      <div className="mt-4 flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                setPage(1)
                setSearch(searchInput.trim())
                setDateFrom(dateFromInput)
                setDateTo(dateToInput)
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
                setDateFrom(dateFromInput)
                setDateTo(dateToInput)
              }}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white hover:bg-gray-800"
            >
              Tìm
            </button>
            {search || dateFilterActive ? (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('')
                  setSearch('')
                  setDateFromInput('')
                  setDateToInput('')
                  setDateFrom('')
                  setDateTo('')
                  setPage(1)
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Xóa lọc
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
          <span className="shrink-0 text-xs font-medium text-gray-500">Ngày đặt</span>
          <label className="flex items-center gap-1.5 text-xs text-gray-700">
            <span className="text-gray-500">Từ</span>
            <input
              type="date"
              value={dateFromInput}
              onChange={(e) => setDateFromInput(e.target.value)}
              max={dateToInput || undefined}
              disabled={exportingExcel}
              className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 disabled:opacity-60"
              aria-label="Từ ngày"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-gray-700">
            <span className="text-gray-500">Đến</span>
            <input
              type="date"
              value={dateToInput}
              onChange={(e) => setDateToInput(e.target.value)}
              min={dateFromInput || undefined}
              disabled={exportingExcel}
              className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 disabled:opacity-60"
              aria-label="Đến ngày"
            />
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'today', label: 'Hôm nay', days: 0 },
              { id: '7d', label: '7 ngày', days: 6 },
              { id: '30d', label: '30 ngày', days: 29 },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                disabled={exportingExcel}
                onClick={() => {
                  const today = new Date()
                  const start = new Date(today)
                  start.setDate(today.getDate() - preset.days)
                  const toIso = (dt) => {
                    const y = dt.getFullYear()
                    const m = String(dt.getMonth() + 1).padStart(2, '0')
                    const d = String(dt.getDate()).padStart(2, '0')
                    return `${y}-${m}-${d}`
                  }
                  const fromStr = toIso(start)
                  const toStr = toIso(today)
                  setDateFromInput(fromStr)
                  setDateToInput(toStr)
                  setDateFrom(fromStr)
                  setDateTo(toStr)
                  setPage(1)
                }}
                className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {preset.label}
              </button>
            ))}
            {dateFilterActive ? (
              <button
                type="button"
                disabled={exportingExcel}
                onClick={() => {
                  setDateFromInput('')
                  setDateToInput('')
                  setDateFrom('')
                  setDateTo('')
                  setPage(1)
                }}
                className="rounded-md px-2.5 py-1 text-[11px] font-semibold text-gray-500 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Bỏ lọc ngày
              </button>
            ) : null}
          </div>
          <div className="ml-1 flex shrink-0 items-center border-l border-gray-200 pl-3">
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exportingExcel}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exportingExcel ? 'Đang xuất...' : 'Xuất Excel'}
            </button>
          </div>
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
      {orders.length > 0 && !search && !dateFilterActive ? (
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
          {search || dateFilterActive
            ? 'Không có đơn khớp tìm kiếm / khoảng ngày.'
            : activeStatusQuery
              ? 'Không có đơn ở trạng thái đã chọn.'
              : 'Chưa có đơn nào.'}
        </p>
      ) : null}
      <AdminOrderStatusChangeModal
        open={statusModal.open}
        targetStatus={statusModal.targetStatus}
        processedBy={statusModal.processedBy}
        onProcessedByChange={(value) => {
          setStatusModal((prev) => ({ ...prev, processedBy: value }))
          if (statusModalError) setStatusModalError('')
        }}
        note={statusModal.note}
        onNoteChange={(value) => {
          setStatusModal((prev) => ({ ...prev, note: value }))
          if (statusModalError) setStatusModalError('')
        }}
        showNote={statusModal.targetStatus === ORDER_STATUS.CANCELLED}
        encourageProcessedBy={
          statusModal.fromStatus === ORDER_STATUS.PENDING &&
          PROCESSED_BY_ENCOURAGED_TARGETS.has(statusModal.targetStatus)
        }
        onCancel={closeStatusModal}
        onConfirm={submitStatusModal}
        confirmLabel={
          statusModal.targetStatus === ORDER_STATUS.CANCELLED
            ? 'Xác nhận hủy'
            : 'Cập nhật trạng thái'
        }
        loading={Boolean(updatingId)}
        error={statusModalError}
      />
      <CompleteOrderConfirmModal
        step={completeModal.step}
        inputValue={completeModal.token}
        onInputChange={(value) => {
          setCompleteModal((prev) => ({ ...prev, token: value }))
          if (completeModalError) setCompleteModalError('')
        }}
        processedBy={completeModal.processedBy}
        onProcessedByChange={(value) => {
          setCompleteModal((prev) => ({ ...prev, processedBy: value }))
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
