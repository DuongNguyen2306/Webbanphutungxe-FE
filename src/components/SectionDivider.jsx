export function SectionDivider({ brandName, title, variant = 'brand' }) {
  const resolvedTitle =
    title ??
    (variant === 'subtle'
      ? `Phụ kiện dành cho xe ${brandName}`
      : variant === 'brand'
        ? `🎁 Phụ kiện dành cho xe ${brandName}`
        : brandName)

  if (variant === 'subtle') {
    return (
      <div className="flex items-center gap-3 py-5 sm:py-6">
        <div className="h-px flex-1 bg-stone-200/90" />
        <h2 className="shrink-0 max-w-[min(100%,28rem)] text-center text-[11px] font-semibold uppercase leading-snug tracking-[0.16em] text-stone-600 sm:text-xs">
          {resolvedTitle}
        </h2>
        <div className="h-px flex-1 bg-stone-200/90" />
      </div>
    )
  }
  if (variant === 'plain') {
    return (
      <div className="flex items-center gap-3 py-4 sm:py-5">
        <div className="h-px flex-1 bg-gray-300" />
        <h2 className="shrink-0 max-w-[min(100%,28rem)] text-center text-sm font-extrabold uppercase tracking-wide text-brand sm:text-base">
          {resolvedTitle}
        </h2>
        <div className="h-px flex-1 bg-gray-300" />
      </div>
    )
  }
  return (
    <div className="flex items-center gap-3 py-6">
      <div className="h-px flex-1 bg-gray-300" />
      <h2 className="shrink-0 max-w-[min(100%,28rem)] text-center text-sm font-extrabold uppercase tracking-wide text-brand sm:text-base">
        {resolvedTitle}
      </h2>
      <div className="h-px flex-1 bg-gray-300" />
    </div>
  )
}
