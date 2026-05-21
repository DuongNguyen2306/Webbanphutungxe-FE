import { ORDER_STATUS, ORDER_STATUS_LABELS } from '../../constants/orderStatus'
import {
  PROCESSED_BY_MAX_LENGTH,
  isProcessedByRequiredForStatus,
} from '../../utils/adminOrderStatusPatch'

export function AdminOrderStatusChangeModal({
  open,
  targetStatus,
  processedBy = '',
  onProcessedByChange,
  note = '',
  onNoteChange,
  showNote = false,
  encourageProcessedBy = false,
  requireProcessedBy = false,
  onCancel,
  onConfirm,
  confirmLabel = 'Cập nhật trạng thái',
  loading = false,
  error = '',
}) {
  if (!open || !targetStatus) return null

  const mustHaveProcessedBy =
    requireProcessedBy || isProcessedByRequiredForStatus(targetStatus)

  const statusLabel =
    ORDER_STATUS_LABELS[targetStatus] || String(targetStatus).trim() || '—'

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-status-change-title"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h2 id="admin-status-change-title" className="text-lg font-extrabold text-gray-900">
          Cập nhật trạng thái đơn
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Chuyển sang: <span className="font-bold text-gray-900">{statusLabel}</span>
        </p>

        <label className="mt-4 block">
          <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Nhân viên xử lý
            {mustHaveProcessedBy ? (
              <span className="ml-1 text-red-600">*</span>
            ) : encourageProcessedBy ? (
              <span className="ml-1 font-semibold normal-case text-amber-700">
                (nên điền)
              </span>
            ) : (
              <span className="ml-1 font-normal normal-case text-gray-400">(tùy chọn)</span>
            )}
          </span>
          <input
            type="text"
            value={processedBy}
            onChange={(e) => onProcessedByChange(e.target.value.slice(0, PROCESSED_BY_MAX_LENGTH))}
            placeholder="Tên nhân viên phụ trách đơn"
            disabled={loading}
            maxLength={PROCESSED_BY_MAX_LENGTH}
            className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60"
          />
          <span className="mt-1 block text-[11px] text-gray-500">
            {mustHaveProcessedBy
              ? `Bắt buộc khi đổi trạng thái (tối đa ${PROCESSED_BY_MAX_LENGTH} ký tự).`
              : `Tối đa ${PROCESSED_BY_MAX_LENGTH} ký tự.`}
          </span>
        </label>

        {showNote ? (
          <label className="mt-3 block">
            <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
              Lý do hủy <span className="text-red-600">*</span>
            </span>
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Nhập lý do hủy đơn..."
              rows={3}
              disabled={loading}
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60"
            />
          </label>
        ) : null}

        {error ? (
          <p className="mt-3 text-sm font-semibold text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${
              targetStatus === ORDER_STATUS.CANCELLED
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-brand hover:opacity-90'
            }`}
          >
            {loading ? 'Đang lưu...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
