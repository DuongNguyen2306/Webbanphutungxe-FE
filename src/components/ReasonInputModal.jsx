export function ReasonInputModal({
  open,
  title,
  description,
  value,
  onChange,
  onCancel,
  onConfirm,
  confirmLabel = 'Xác nhận',
  loading = false,
  error = '',
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reason-input-title"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h2 id="reason-input-title" className="text-lg font-extrabold text-gray-900">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm text-gray-600">{description}</p>
        ) : null}

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Nhập lý do..."
          rows={4}
          className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          disabled={loading}
          autoFocus
        />

        {error ? (
          <p className="mt-2 text-sm font-medium text-red-600">{error}</p>
        ) : null}

        <div className="mt-4 flex justify-end gap-2">
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
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Đang gửi...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
