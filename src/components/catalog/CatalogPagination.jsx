import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Phân trang danh sách catalog (client-side).
 * @param {{ page: number, totalPages: number, totalItems: number, onPageChange: (p: number) => void, className?: string }} props
 */
export function CatalogPagination({ page, totalPages, totalItems, onPageChange, className = '' }) {
  if (totalItems <= 0) return null

  if (totalPages <= 1) {
    return (
      <div
        className={`border-t border-gray-100 pt-6 text-center text-xs font-medium text-gray-600 ${className}`}
        aria-live="polite"
      >
        {totalItems} sản phẩm · trang 1 / 1
      </div>
    )
  }

  return (
    <nav
      className={`flex flex-wrap items-center justify-center gap-3 border-t border-gray-100 pt-6 ${className}`}
      aria-label="Phân trang danh sách"
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-ink shadow-sm transition hover:border-brand hover:text-brand disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft className="size-4" strokeWidth={2.5} aria-hidden />
        Trước
      </button>
      <span className="min-w-[8rem] text-center text-xs font-semibold text-gray-600">
        Trang <span className="text-ink">{page}</span> / {totalPages}
        <span className="mt-0.5 block text-[11px] font-normal text-gray-500">
          {totalItems} sản phẩm
        </span>
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-ink shadow-sm transition hover:border-brand hover:text-brand disabled:pointer-events-none disabled:opacity-40"
      >
        Sau
        <ChevronRight className="size-4" strokeWidth={2.5} aria-hidden />
      </button>
    </nav>
  )
}
