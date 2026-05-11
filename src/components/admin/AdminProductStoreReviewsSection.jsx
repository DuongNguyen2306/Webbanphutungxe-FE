import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '../../api/client'
import { showUiToast } from '../../utils/uiToast'

const PAGE_LIMIT = 50
const STAR_OPTIONS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]

function formatApiMessage(err) {
  return err?.response?.data?.message || err?.message || 'Có lỗi xảy ra.'
}

function isStoreReviewItem(rev) {
  return rev?.isStoreReview === true
}

function displayName(rev) {
  const d = String(rev?.reviewerDisplayName || '').trim()
  if (d) return d
  const m = String(rev?.author?.mask || '').trim()
  if (m) return m
  return '—'
}

/**
 * Lấy mọi đánh giá isStoreReview từ API public (lọc phía FE).
 */
async function fetchAllStoreReviewsForProduct(productId) {
  const pid = String(productId || '').trim()
  if (!pid) return []

  let page = 1
  const collected = []
  while (page <= 100) {
    const { data } = await api.get(`/api/products/${encodeURIComponent(pid)}/reviews`, {
      params: { page, limit: PAGE_LIMIT },
    })
    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []
    for (const it of items) {
      if (isStoreReviewItem(it)) collected.push(it)
    }
    const totalPages = Number(data?.totalPages)
    if (Number.isFinite(totalPages) && totalPages > 0 && page >= totalPages) break
    if (items.length < PAGE_LIMIT) break
    page += 1
  }
  return collected
}

function StarText({ value }) {
  const n = Number(value)
  const label = Number.isFinite(n) ? (Number.isInteger(n) ? String(n) : n.toFixed(1)) : '—'
  return <span className="text-amber-600">{label} ★</span>
}

function snapHalfStar(n) {
  if (!Number.isFinite(n)) return 5
  const s = Math.round(n * 2) / 2
  return Math.min(5, Math.max(0, s))
}

/**
 * Quản lý đánh giá tự nhập (cửa hàng) — chỉ khi đã có productId (sửa SP).
 */
export function AdminProductStoreReviewsSection({ productId }) {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [name, setName] = useState('')
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState(5)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const pid = String(productId || '').trim()
    if (!pid) {
      setList([])
      return
    }
    setLoading(true)
    setError('')
    try {
      const rows = await fetchAllStoreReviewsForProduct(pid)
      rows.sort((a, b) => {
        const ta = new Date(a?.createdAt || 0).getTime()
        const tb = new Date(b?.createdAt || 0).getTime()
        return tb - ta
      })
      setList(rows)
    } catch (e) {
      setList([])
      setError(formatApiMessage(e))
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!modalOpen) return undefined
    const onKey = (e) => {
      if (e.key !== 'Escape' || saving) return
      setModalOpen(false)
      setEditingId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen, saving])

  function openCreate() {
    setEditingId(null)
    setName('')
    setComment('')
    setRating(5)
    setModalOpen(true)
  }

  function openEdit(rev) {
    setEditingId(String(rev._id || ''))
    setName(displayName(rev))
    setComment(String(rev?.comment || '').trim())
    setRating(snapHalfStar(Number(rev?.rating)))
    setModalOpen(true)
  }

  function closeModal() {
    if (saving) return
    setModalOpen(false)
    setEditingId(null)
  }

  async function handleSubmitModal(e) {
    e.preventDefault()
    // Portal vẫn bubble theo cây React → tránh kích hoạt <form> sửa SP (navigate ra ngoài).
    e.stopPropagation()
    const pid = String(productId || '').trim()
    const trimmedName = name.trim()
    if (!trimmedName) {
      showUiToast('Vui lòng nhập tên hiển thị.', 'error')
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        await api.patch(`/api/admin/reviews/${encodeURIComponent(editingId)}`, {
          reviewerDisplayName: trimmedName,
          comment: comment.trim() || undefined,
          rating,
        })
        showUiToast('Đã cập nhật đánh giá cửa hàng.')
      } else {
        await api.post(`/api/admin/products/${encodeURIComponent(pid)}/store-reviews`, {
          reviewerDisplayName: trimmedName,
          comment: comment.trim() || undefined,
          rating,
        })
        showUiToast('Đã thêm đánh giá cửa hàng.')
      }
      closeModal()
      await load()
    } catch (err) {
      showUiToast(formatApiMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(rev) {
    const id = String(rev?._id || '').trim()
    if (!id) return
    const ok = window.confirm(
      'Xóa đánh giá do cửa hàng nhập này? (Đánh giá khách không hiện trong danh sách này.)',
    )
    if (!ok) return
    try {
      await api.delete(`/api/admin/reviews/${encodeURIComponent(id)}`)
      showUiToast('Đã xóa.')
      await load()
    } catch (err) {
      showUiToast(formatApiMessage(err), 'error')
    }
  }

  const pid = String(productId || '').trim()
  if (!pid) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/80 p-4 text-sm text-gray-600">
        Lưu sản phẩm trước, sau đó mở lại trang sửa để thêm <strong>đánh giá do cửa hàng nhập</strong>.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-violet-900">
            Đánh giá do cửa hàng nhập
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-violet-900/90">
            Chỉnh sửa tự đánh giá <strong>không ảnh hưởng</strong> đánh giá của khách hàng. Danh sách lấy từ API
            công khai và chỉ hiển thị mục <code className="rounded bg-white/80 px-1">isStoreReview</code>.
          </p>
          <p className="mt-1 text-[11px] text-violet-800/80">
            Khi lưu sản phẩm, nếu không gửi trường <code className="rounded bg-white/80 px-1">storeReviews</code> thì
            danh sách tự đánh giá trên server giữ nguyên. Mục này dùng API riêng (thêm / sửa / xóa).
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-700 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-violet-800"
        >
          <Plus className="size-4" strokeWidth={2.5} />
          Thêm đánh giá
        </button>
      </div>

      {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}

      <div className="mt-4 overflow-x-auto rounded-lg border border-violet-100/80 bg-white">
        {loading ? (
          <p className="p-4 text-sm text-gray-500">Đang tải…</p>
        ) : list.length === 0 ? (
          <p className="p-4 text-sm text-gray-600">Chưa có đánh giá tự nhập nào.</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs font-bold uppercase text-gray-600">
                <th className="px-3 py-2">Tên hiển thị</th>
                <th className="px-3 py-2">Sao</th>
                <th className="px-3 py-2">Nội dung</th>
                <th className="w-32 px-3 py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.map((rev) => (
                <tr key={rev._id} className="border-b border-gray-100 last:border-0">
                  <td className="max-w-[10rem] px-3 py-2 font-medium text-gray-900">
                    <span className="line-clamp-2">{displayName(rev)}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <StarText value={rev.rating} />
                  </td>
                  <td className="max-w-md px-3 py-2 text-gray-700">
                    <span className="line-clamp-3">{rev.comment?.trim() || '—'}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(rev)}
                      className="mr-1 inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <Pencil className="size-3.5" />
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(rev)}
                      className="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="size-3.5" />
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
              role="presentation"
              onClick={() => {
                if (!saving) closeModal()
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="store-review-modal-title"
                className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-gray-200 bg-white p-5 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 id="store-review-modal-title" className="text-base font-extrabold text-gray-900">
                  {editingId ? 'Sửa đánh giá cửa hàng' : 'Thêm đánh giá cửa hàng'}
                </h3>
                <form onSubmit={handleSubmitModal} className="mt-4 space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">
                      Tên hiển thị <span className="text-red-600">*</span>
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      placeholder="Ví dụ: Khách A"
                      maxLength={120}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">
                      Số sao <span className="text-red-600">*</span> (0–5, bước 0.5)
                    </label>
                    <select
                      value={String(rating)}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      {STAR_OPTIONS.map((s) => (
                        <option key={s} value={String(s)}>
                          {s} sao
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">Nội dung</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      placeholder="Bình luận hiển thị trên storefront (tuỳ chọn)"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={saving}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50"
                    >
                      {saving ? 'Đang lưu…' : editingId ? 'Cập nhật' : 'Thêm'}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
