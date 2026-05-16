/** Nút «Xem thêm» đồng bộ với ProductSection (khối hãng / danh mục). */
export function CatalogSectionViewMore({ onClick }) {
  if (typeof onClick !== 'function') return null
  return (
    <div className="pt-6">
      <button
        type="button"
        onClick={onClick}
        className="rounded-lg border-2 border-brand bg-transparent px-5 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand transition hover:bg-brand hover:text-white"
      >
        Xem thêm... &gt;
      </button>
    </div>
  )
}
