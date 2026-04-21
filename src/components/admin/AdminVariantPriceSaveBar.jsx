export function AdminVariantPriceSaveBar({
  changedCount,
  saving,
  disabledSave,
  onResetAll,
  onSaveAll,
}) {
  return (
    <div className="sticky bottom-3 z-20 mt-4 rounded-xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-700">
          Đang thay đổi: <span className="font-bold text-brand">{changedCount}</span> biến thể
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onResetAll}
            disabled={saving || changedCount === 0}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset toàn bộ
          </button>
          <button
            type="button"
            onClick={onSaveAll}
            disabled={disabledSave}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : 'Lưu tất cả'}
          </button>
        </div>
      </div>
    </div>
  )
}
