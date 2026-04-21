import { FilePenLine, Plus, Trash2 } from 'lucide-react'

function formatDate(input) {
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('vi-VN')
}

export function NewsList({
  items,
  loading,
  error,
  onCreate,
  onEdit,
  onDelete,
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-extrabold uppercase text-gray-900">
          Danh sách tin tức
        </h2>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white"
        >
          <Plus className="size-4" />
          Tạo tin tức
        </button>
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-gray-500">Đang tải tin tức...</p>
      ) : error ? (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : items.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">Chưa có bài tin tức nào.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-gray-200 bg-gray-50/50 p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Tác giả: {item.author || '—'} · Tạo lúc: {formatDate(item.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                  >
                    <FilePenLine className="size-3.5" />
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="size-3.5" />
                    Xóa
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
