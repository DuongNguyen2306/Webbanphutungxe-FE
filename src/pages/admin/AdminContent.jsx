import { useEffect, useMemo, useState } from 'react'
import { FilePenLine, Loader2, Plus, Trash2 } from 'lucide-react'
import {
  createArticle,
  getAdminArticles,
  removeArticle,
  updateArticle,
} from '../../api/contentApi'
import { QuillEditor } from '../../components/admin/QuillEditor'

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const PAGE_SIZE = 10

export function AdminContent() {
  const [type, setType] = useState('intro')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [articles, setArticles] = useState([])
  const [editingId, setEditingId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  const heading = useMemo(
    () => (type === 'intro' ? 'Bài giới thiệu' : 'Bài hướng dẫn'),
    [type],
  )

  async function load() {
    setLoading(true)
    setError('')
    try {
      const list = await getAdminArticles(type)
      setArticles(
        list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)),
      )
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được bài viết.')
      setArticles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
    load()
  }, [type])

  function resetForm() {
    setEditingId('')
    setTitle('')
    setContent('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      title: title.trim(),
      type,
      content,
    }
    if (!payload.title || !stripHtml(payload.content)) {
      setError('Vui lòng nhập tiêu đề và nội dung bài viết.')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (editingId) {
        await updateArticle(editingId, payload)
      } else {
        await createArticle(payload)
      }
      resetForm()
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Không lưu được bài viết.')
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(item) {
    setEditingId(item.id)
    setType(item.type || 'guide')
    setTitle(item.title)
    setContent(item.content)
  }

  async function handleDelete(item) {
    if (!window.confirm(`Xóa bài "${item.title}"?`)) return
    try {
      await removeArticle(item.id)
      setArticles((prev) => prev.filter((x) => x.id !== item.id))
      if (editingId === item.id) resetForm()
    } catch (err) {
      setError(err.response?.data?.message || 'Không xóa được bài viết.')
    }
  }

  const totalPages = Math.max(1, Math.ceil(articles.length / PAGE_SIZE))
  const pagedArticles = articles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    if (page > totalPages) setPage(1)
  }, [page, totalPages])

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">
          Soạn thảo nội dung
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Quản lý trang Giới thiệu và Hướng dẫn bằng trình soạn thảo trực quan.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-gray-700">
            Loại bài viết
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="intro">Giới thiệu</option>
              <option value="guide">Hướng dẫn</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-gray-700">
            Tiêu đề
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Nhập tiêu đề ${heading.toLowerCase()}`}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <QuillEditor value={content} onChange={setContent} />

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {editingId ? 'Cập nhật bài viết' : 'Đăng bài viết'}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
            >
              Hủy chỉnh sửa
            </button>
          ) : null}
        </div>
      </form>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-base font-extrabold uppercase text-gray-900">
          Danh sách {heading.toLowerCase()}
        </h2>
        {loading ? (
          <p className="mt-3 text-sm text-gray-500">Đang tải bài viết...</p>
        ) : articles.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Chưa có bài viết.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {pagedArticles.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-gray-200 bg-gray-50/50 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                      {stripHtml(item.content) || 'Không có mô tả.'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                    >
                      <FilePenLine className="size-3.5" />
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
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
        {articles.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-500">
              Trang {page} / {totalPages} · {articles.length} bài viết
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </section>
  )
}
