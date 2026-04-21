export function AdminOrderStatusTabs({
  tabs,
  activeTabId,
  counts = {},
  loading = false,
  onChange,
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = tab.id === activeTabId
        const count = counts[tab.id]
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
              active
                ? 'border-brand bg-brand text-white shadow-sm'
                : 'border-gray-300 bg-white text-gray-700 hover:border-brand/50 hover:text-brand'
            }`}
            aria-pressed={active}
          >
            <span>{tab.label}</span>
            {typeof count === 'number' ? (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {count}
              </span>
            ) : loading ? (
              <span className="text-xs opacity-80">...</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
