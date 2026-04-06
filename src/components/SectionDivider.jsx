export function SectionDivider({ brandName }) {
  return (
    <div className="flex items-center gap-3 py-6">
      <div className="h-px flex-1 bg-gray-300" />
      <h2 className="shrink-0 text-center text-sm font-extrabold uppercase tracking-wide text-brand sm:text-base">
        🎁 Phụ kiện dành cho xe {brandName}
      </h2>
      <div className="h-px flex-1 bg-gray-300" />
    </div>
  )
}
