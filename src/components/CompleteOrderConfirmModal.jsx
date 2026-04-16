const COMPLETE_CONFIRM_TEXT = 'HOAN_THANH'

export function CompleteOrderConfirmModal({
  step,
  inputValue,
  onInputChange,
  onClose,
  onContinue,
  onConfirm,
  loading = false,
  error = '',
}) {
  if (!step) return null

  if (step === 1) {
    return (
      <div
        className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="complete-order-step1-title"
      >
        <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
          <h2 id="complete-order-step1-title" className="text-lg font-extrabold text-gray-900">
            Xác nhận hoàn thành đơn?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Hành động này xác nhận đơn đã giao thành công cho khách.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={onContinue}
              disabled={loading}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Tiếp tục
            </button>
          </div>
        </div>
      </div>
    )
  }

  const canConfirm = inputValue.trim() === COMPLETE_CONFIRM_TEXT

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="complete-order-step2-title"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h2 id="complete-order-step2-title" className="text-lg font-extrabold text-gray-900">
          Xác nhận hoàn thành đơn?
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Nhập <span className="font-bold text-gray-900">{COMPLETE_CONFIRM_TEXT}</span> để xác nhận
          hoàn thành.
        </p>

        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={COMPLETE_CONFIRM_TEXT}
          disabled={loading}
          autoFocus
          className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-60"
        />

        {error ? <p className="mt-2 text-sm font-medium text-red-600">{error}</p> : null}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || !canConfirm}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Đang cập nhật...' : 'Xác nhận hoàn thành'}
          </button>
        </div>
      </div>
    </div>
  )
}

export { COMPLETE_CONFIRM_TEXT }
