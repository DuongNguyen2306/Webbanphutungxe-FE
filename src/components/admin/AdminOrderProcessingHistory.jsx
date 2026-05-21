import {
  formatProcessedByLabel,
  formatStatusHistoryAt,
  normalizeOrderStatusHistory,
} from '../../utils/orderStatusHistory'

export function AdminOrderProcessingHistory({ order }) {
  const items = normalizeOrderStatusHistory(order)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-bold text-gray-900">Lịch sử xử lý đơn hàng</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">Chưa có lịch sử xử lý.</p>
      ) : (
        <ol className="relative mt-4 space-y-0 border-l border-gray-200 pl-5">
          {items.map((item, index) => {
            const transition = `${item.fromStatusLabel} → ${item.toStatusLabel}`
            const isLast = index === items.length - 1
            return (
              <li key={`${item.at}-${index}`} className={`relative pb-5 ${isLast ? 'pb-0' : ''}`}>
                <span
                  className={`absolute -left-[1.35rem] top-1 flex h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                    isLast ? 'bg-brand' : 'bg-gray-300'
                  }`}
                  aria-hidden
                />
                <div className="flex flex-wrap items-center gap-2">
                  <time className="font-mono text-xs text-gray-500">
                    {formatStatusHistoryAt(item.at)}
                  </time>
                  {item.isLegacy ? (
                    <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 ring-1 ring-amber-200">
                      Dữ liệu cũ
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm font-semibold text-gray-900">{transition}</p>
                <p className="mt-0.5 text-sm text-gray-600">
                  {formatProcessedByLabel(item.processedBy)}
                </p>
                {item.note ? (
                  <p className="mt-1 text-sm text-gray-600">
                    <span className="font-medium text-gray-700">Ghi chú:</span> {item.note}
                  </p>
                ) : null}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
