import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createNewsArticle,
  deleteNewsArticle,
  getNewsArticles,
  updateNewsArticle,
} from '../../api/contentApi'
import { NewsList } from '../../components/admin/news/NewsList'
import { NewsForm } from '../../components/admin/news/NewsForm'

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function ConfirmDeleteModal({ open, title, onCancel, onConfirm, loading }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-extrabold text-gray-900">Xóa tin tức?</h3>
        <p className="mt-2 text-sm text-gray-600">
          Bạn sắp xóa bài <span className="font-semibold text-gray-900">{title}</span>. Hành động này
          không thể hoàn tác.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Đang xóa...' : 'Xóa'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function NewsEditorPage({ mode = 'list' }) {
  const navigate = useNavigate()
  const { newsId } = useParams()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({ title: '', content: '', author: '' })
  const [deleteTarget, setDeleteTarget] = useState(null)

  const isList = mode === 'list'
  const isCreate = mode === 'create'
  const isEdit = mode === 'edit'

  const editingItem = useMemo(
    () => items.find((item) => item.id === newsId) || null,
    [items, newsId],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const list = await getNewsArticles()
      setItems(list)
    } catch (err) {
      setItems([])
      setError(err.response?.data?.message || 'Không tải được danh sách tin tức.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (!isEdit) return
    if (!editingItem) return
    setForm({
      title: editingItem.title || '',
      content: editingItem.content || '',
      author: editingItem.author || '',
    })
  }, [isEdit, editingItem])

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function submitForm(e) {
    e.preventDefault()
    const payload = {
      title: String(form.title || '').trim(),
      content: String(form.content || '').trim(),
      author: String(form.author || '').trim(),
    }
    if (!payload.title || !stripHtml(payload.content)) {
      setError('Vui lòng nhập tiêu đề và nội dung tin tức.')
      return
    }

    setSaving(true)
    setError('')
    try {
      if (isEdit) {
        await updateNewsArticle(newsId, payload)
        setToast('Cập nhật tin tức thành công.')
      } else {
        await createNewsArticle(payload)
        setToast('Tạo tin tức thành công.')
      }
      await load()
      navigate('/admin/content/news')
    } catch (err) {
      setError(err.response?.data?.message || 'Không lưu được tin tức.')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget?.id) return
    setDeleting(true)
    setError('')
    try {
      await deleteNewsArticle(deleteTarget.id)
      setToast('Xóa tin tức thành công.')
      setDeleteTarget(null)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Không xóa được tin tức.')
    } finally {
      setDeleting(false)
    }
  }

  const headerTitle = isCreate ? 'Tạo tin tức' : isEdit ? 'Sửa tin tức' : 'Quản lý tin tức'

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">
          {headerTitle}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          CRUD bài viết tin tức cho khu vực khách hàng.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <Link to="/admin/content" className="font-semibold text-gray-600 hover:underline">
            Nội dung chung
          </Link>
          <span className="text-gray-400">/</span>
          <Link to="/admin/content/news" className="font-semibold text-brand hover:underline">
            Tin tức
          </Link>
        </div>
      </header>

      {isList ? (
        <NewsList
          items={items}
          loading={loading}
          error={error}
          onCreate={() => navigate('/admin/content/news/new')}
          onEdit={(item) => navigate(`/admin/content/news/${item.id}/edit`)}
          onDelete={(item) => setDeleteTarget(item)}
        />
      ) : (
        <NewsForm
          mode={isEdit ? 'edit' : 'create'}
          form={form}
          saving={saving || (isEdit && loading)}
          error={error}
          onChange={updateForm}
          onSubmit={submitForm}
          onCancel={() => navigate('/admin/content/news')}
        />
      )}

      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        title={deleteTarget?.title || ''}
        loading={deleting}
        onCancel={() => {
          if (deleting) return
          setDeleteTarget(null)
        }}
        onConfirm={confirmDelete}
      />

      {toast ? (
        <div className="fixed right-4 top-4 z-[120] rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </section>
  )
}
