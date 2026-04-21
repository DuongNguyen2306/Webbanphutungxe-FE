import { Loader2 } from 'lucide-react'
import { QuillEditor } from '../QuillEditor'

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function NewsForm({
  mode,
  form,
  saving,
  error,
  onChange,
  onSubmit,
  onCancel,
}) {
  const submitLabel = mode === 'edit' ? 'Cập nhật tin tức' : 'Đăng tin tức'

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold text-gray-700">
          Tiêu đề *
          <input
            value={form.title}
            onChange={(e) => onChange('title', e.target.value)}
            placeholder="Nhập tiêu đề tin tức"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            required
          />
        </label>
        <label className="text-sm font-semibold text-gray-700">
          Tác giả
          <input
            value={form.author}
            onChange={(e) => onChange('author', e.target.value)}
            placeholder="Không bắt buộc"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <QuillEditor value={form.content} onChange={(html) => onChange('content', html)} />

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {!stripHtml(form.content) ? (
        <p className="text-xs text-amber-700">
          Nội dung chưa có chữ hiển thị (đang rỗng).
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
          disabled={saving}
        >
          Hủy
        </button>
      </div>
    </form>
  )
}
