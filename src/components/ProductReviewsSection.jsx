import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, StarHalf, Trash2 } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

/**
 * @typedef {Object} ReviewSummary
 * @property {number} average
 * @property {number} total
 * @property {Record<string, number>} byRating
 * @property {number} withComment
 * @property {number} withMedia
 */

/**
 * @typedef {Object} ReviewItem
 * @property {string} _id
 * @property {number} rating
 * @property {string} [variantLabel]
 * @property {string} [comment]
 * @property {string} [qualityNote]
 * @property {string} [matchDescriptionNote]
 * @property {string[]} [images]
 * @property {{url: string, durationSec?: number}[]} [videos]
 * @property {number} [likes]
 * @property {string} createdAt
 * @property {{ mask: string }} author
 */

function StarDisplay({ value }) {
  const v = Math.round(Number(value) || 0)
  return (
    <span className="text-amber-500" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i}>{i < v ? '★' : '☆'}</span>
      ))}
    </span>
  )
}

/**
 * @param {{
 *   productId: string
 *   variantId?: string
 *   variantLabel?: string
 * }} props
 */
export function ProductReviewsSection({
  productId,
  variantId = '',
  variantLabel = '',
}) {
  const { user, token, isAdmin } = useAuth()

  /** @type {[ReviewSummary | null, Function]} */
  const [summary, setSummary] = useState(null)
  const [summaryErr, setSummaryErr] = useState(null)

  /** 'all' | '1'..'5' | 'comment' | 'media' */
  const [filterKey, setFilterKey] = useState('all')
  const [page, setPage] = useState(1)
  const limit = 10

  const [listData, setListData] = useState(null)
  const [listLoading, setListLoading] = useState(true)
  const [listErr, setListErr] = useState(null)

  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [qualityNote, setQualityNote] = useState('')
  const [matchNote, setMatchNote] = useState('')
  const [formImages, setFormImages] = useState('')
  const [formVideos, setFormVideos] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formErr, setFormErr] = useState(null)
  const [formOk, setFormOk] = useState(null)

  const queryParams = useMemo(() => {
    const q = { page, limit }
    if (filterKey === 'comment') q.hasComment = 'true'
    else if (filterKey === 'media') q.hasMedia = 'true'
    else if (/^[1-5]$/.test(filterKey)) q.rating = filterKey
    return q
  }, [filterKey, page, limit])

  const loadSummary = useCallback(async () => {
    setSummaryErr(null)
    try {
      const { data } = await api.get(
        `/api/products/${productId}/reviews/summary`,
      )
      setSummary(data)
    } catch (e) {
      setSummary(null)
      setSummaryErr(
        e.response?.data?.message || 'Không tải được thống kê đánh giá.',
      )
    }
  }, [productId])

  const loadList = useCallback(async () => {
    setListLoading(true)
    setListErr(null)
    try {
      const { data } = await api.get(`/api/products/${productId}/reviews`, {
        params: queryParams,
      })
      setListData(data)
    } catch (e) {
      setListData(null)
      setListErr(e.response?.data?.message || 'Không tải được đánh giá.')
    } finally {
      setListLoading(false)
    }
  }, [productId, queryParams])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  useEffect(() => {
    loadList()
  }, [loadList])

  async function handleSubmitReview(e) {
    e.preventDefault()
    setFormErr(null)
    setFormOk(null)
    if (!token) return
    setSubmitting(true)
    try {
      const images = formImages
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
      const videoLines = formVideos
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
      const videos = videoLines.map((url) => ({ url, durationSec: 0 }))
      await api.post(`/api/products/${productId}/reviews`, {
        rating,
        variantId: variantId || undefined,
        variantLabel: variantLabel || undefined,
        comment: comment.trim(),
        qualityNote: qualityNote.trim(),
        matchDescriptionNote: matchNote.trim(),
        images,
        videos,
      })
      setFormOk('Đã gửi đánh giá. Cảm ơn bạn!')
      setComment('')
      setQualityNote('')
      setMatchNote('')
      setFormImages('')
      setFormVideos('')
      loadSummary()
      loadList()
    } catch (err) {
      setFormErr(
        err.response?.data?.message ||
          (err.response?.status === 409
            ? 'Bạn đã đánh giá sản phẩm này rồi.'
            : 'Không gửi được đánh giá.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteReview(reviewId) {
    if (!isAdmin) return
    if (!window.confirm('Xóa đánh giá này?')) return
    try {
      await api.delete(`/api/admin/reviews/${reviewId}`)
      loadSummary()
      loadList()
    } catch {
      window.alert('Không xóa được.')
    }
  }

  function selectFilter(key) {
    setFilterKey(key)
    setPage(1)
  }

  const byRating = summary?.byRating || {}

  const totalPages = useMemo(() => {
    const rawTp = Number(listData?.totalPages ?? NaN)
    if (Number.isFinite(rawTp) && rawTp > 0) return Math.floor(rawTp)
    const rawTotal = Number(listData?.total ?? listData?.count ?? NaN)
    if (Number.isFinite(rawTotal) && rawTotal >= 0 && limit > 0) {
      return Math.max(1, Math.ceil(rawTotal / limit))
    }
    return 0
  }, [listData, limit])

  const totalReviews = Number(listData?.total ?? listData?.count ?? NaN)

  const itemsLen = listData?.items?.length ?? 0
  const canGoPrev = page > 1
  const canGoNext =
    totalPages > 0 ? page < totalPages : itemsLen >= limit

  return (
    <section
      id="danh-gia"
      className="mx-auto max-w-[1200px] border-t border-gray-200 px-3 py-10 sm:px-4"
    >
      <h2 className="text-lg font-extrabold text-ink sm:text-xl">
        Đánh giá sản phẩm
      </h2>

      {summaryErr ? (
        <p className="mt-2 text-sm text-red-600">{summaryErr}</p>
      ) : summary ? (
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-lg bg-page px-4 py-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-brand">
              {summary.average?.toFixed(1) ?? '0.0'}
            </span>
            <span className="text-sm text-gray-600">/5</span>
          </div>
          <StarDisplay value={Math.round(summary.average || 0)} />
          <span className="text-sm text-gray-600">
            ({summary.total ?? 0} đánh giá)
          </span>
        </div>
      ) : (
        <p className="mt-2 text-sm text-gray-500">Đang tải thống kê...</p>
      )}

      {summary ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <FilterChip
            active={filterKey === 'all'}
            onClick={() => selectFilter('all')}
            label={`Tất cả (${summary.total})`}
          />
          {[5, 4, 3, 2, 1].map((n) => (
            <FilterChip
              key={n}
              active={filterKey === String(n)}
              onClick={() => selectFilter(String(n))}
              label={`${n} sao (${byRating[n] ?? 0})`}
            />
          ))}
          <FilterChip
            active={filterKey === 'comment'}
            onClick={() => selectFilter('comment')}
            label={`Có bình luận (${summary.withComment ?? 0})`}
          />
          <FilterChip
            active={filterKey === 'media'}
            onClick={() => selectFilter('media')}
            label={`Có hình ảnh & video (${summary.withMedia ?? 0})`}
          />
        </div>
      ) : null}

      {token && user && !isAdmin ? (
        <form
          onSubmit={handleSubmitReview}
          className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <p className="text-base font-extrabold text-ink">Viết đánh giá</p>
          {variantLabel ? (
            <p className="mt-1 text-xs text-gray-500">
              Phân loại: {variantLabel}
            </p>
          ) : null}
          <div className="mt-4">
            <label className="text-sm font-semibold text-gray-700">Đánh giá sao</label>
            <HalfStarInput
              value={rating}
              hoverValue={hoverRating}
              onHover={setHoverRating}
              onChange={setRating}
            />
            <p className="mt-1 text-xs text-gray-500">Đã chọn: {rating.toFixed(1)} sao</p>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Comment"
            rows={4}
            className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <input
              value={qualityNote}
              onChange={(e) => setQualityNote(e.target.value)}
              placeholder="Product Quality"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              value={matchNote}
              onChange={(e) => setMatchNote(e.target.value)}
              placeholder="Description Accuracy"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <textarea
            value={formImages}
            onChange={(e) => setFormImages(e.target.value)}
            placeholder="Image URLs (mỗi dòng một URL)"
            rows={2}
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs"
          />
          <input
            value={formVideos}
            onChange={(e) => setFormVideos(e.target.value)}
            placeholder="Video URL"
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          {formErr ? (
            <p className="mt-2 text-sm font-semibold text-red-600">{formErr}</p>
          ) : null}
          {formOk ? (
            <p className="mt-2 text-sm font-semibold text-emerald-700">
              {formOk}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="mt-4 rounded-lg px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            style={{ backgroundColor: '#BC1F26' }}
          >
            {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
          </button>
        </form>
      ) : isAdmin ? (
        <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Chế độ Quản trị viên - Không thể đánh giá sản phẩm.
        </div>
      ) : (
        <p className="mt-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          <Link to="/login" className="font-bold text-brand underline">
            Đăng nhập
          </Link>{' '}
          để viết đánh giá cho sản phẩm này.
        </p>
      )}

      <div className="mt-8 space-y-4">
        {listLoading ? (
          <p className="text-sm text-gray-500">Đang tải đánh giá...</p>
        ) : listErr ? (
          <p className="text-sm text-red-600">{listErr}</p>
        ) : listData?.items?.length ? (
          listData.items.map((rev) => (
            <article
              key={rev._id}
              className="rounded-xl border border-gray-100 bg-page/50 px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink">
                    {rev.author?.mask ?? '***'}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-sm">
                    <StarDisplay value={rev.rating} />
                    <span className="text-xs text-gray-500">
                      {rev.createdAt
                        ? new Date(rev.createdAt).toLocaleString('vi-VN')
                        : ''}
                    </span>
                  </div>
                  {rev.variantLabel ? (
                    <p className="mt-1 text-xs text-gray-600">
                      Phân loại: {rev.variantLabel}
                    </p>
                  ) : null}
                </div>
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteReview(rev._id)}
                    className="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                    title="Xóa (admin)"
                  >
                    <Trash2 className="size-3.5" />
                    Xóa
                  </button>
                ) : null}
              </div>
              {(rev.qualityNote || rev.matchDescriptionNote) && (
                <p className="mt-2 text-xs text-gray-600">
                  {rev.qualityNote ? (
                    <span>Chất lượng: {rev.qualityNote} · </span>
                  ) : null}
                  {rev.matchDescriptionNote ? (
                    <span>Đúng mô tả: {rev.matchDescriptionNote}</span>
                  ) : null}
                </p>
              )}
              {rev.comment ? (
                <p className="mt-2 text-sm text-gray-800">{rev.comment}</p>
              ) : null}
              {rev.images?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {rev.images.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block size-20 overflow-hidden rounded border border-gray-200 bg-white"
                    >
                      <img
                        src={url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              ) : null}
              {rev.videos?.length ? (
                <div className="mt-2 space-y-1 text-xs">
                  {rev.videos.map((v, i) => (
                    <a
                      key={i}
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-brand underline"
                    >
                      Video {i + 1}
                      {v.durationSec ? ` (${v.durationSec}s)` : ''}
                    </a>
                  ))}
                </div>
              ) : null}
              {rev.likes != null && rev.likes > 0 ? (
                <p className="mt-2 text-xs text-gray-400">
                  Hữu ích ({rev.likes})
                </p>
              ) : null}
            </article>
          ))
        ) : (
          <p className="text-sm text-gray-500">Chưa có đánh giá nào.</p>
        )}
      </div>

      {!listLoading && !listErr && itemsLen > 0 ? (
        <div className="mt-8 border-t border-gray-100 pt-6">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              disabled={!canGoPrev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Trang trước"
            >
              ‹
            </button>
            {totalPages > 1 ? (
              <div className="flex flex-wrap items-center justify-center gap-1">
                {buildPaginationWindow(page, totalPages).map((entry, idx) =>
                  entry === '…' ? (
                    <span
                      key={`e-${idx}`}
                      className="px-2 text-sm font-medium text-gray-400"
                      aria-hidden
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={entry}
                      type="button"
                      onClick={() => setPage(entry)}
                      className={`min-h-9 min-w-9 rounded-lg border text-sm font-bold transition ${
                        page === entry
                          ? 'border-brand bg-brand text-white shadow-sm'
                          : 'border-gray-200 bg-white text-gray-800 hover:border-brand/40'
                      }`}
                    >
                      {entry}
                    </button>
                  ),
                )}
              </div>
            ) : (
              <span className="px-2 text-sm font-medium text-gray-600">Trang {page}</span>
            )}
            <button
              type="button"
              disabled={!canGoNext}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Trang sau"
            >
              ›
            </button>
          </div>
          {totalPages > 1 ? (
            <p className="mt-2 text-center text-xs text-gray-500">
              Trang {page} / {totalPages}
              {Number.isFinite(totalReviews) && totalReviews > 0
                ? ` · ${totalReviews} đánh giá`
                : null}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

function HalfStarInput({ value, hoverValue, onHover, onChange }) {
  const active = hoverValue || value
  return (
    <div
      className="mt-2 flex items-center gap-1"
      onMouseLeave={() => onHover(0)}
      role="radiogroup"
      aria-label="Đánh giá sao"
    >
      {Array.from({ length: 5 }, (_, idx) => {
        const star = idx + 1
        const half = star - 0.5
        let Icon = Star
        if (active >= star) Icon = Star
        else if (active >= half) Icon = StarHalf

        const activeColor = active >= half
        return (
          <div key={star} className="relative inline-flex size-8 items-center justify-center">
            <button
              type="button"
              className="absolute left-0 top-0 h-full w-1/2"
              onMouseEnter={() => onHover(half)}
              onClick={() => onChange(half)}
              aria-label={`${half} sao`}
            />
            <button
              type="button"
              className="absolute right-0 top-0 h-full w-1/2"
              onMouseEnter={() => onHover(star)}
              onClick={() => onChange(star)}
              aria-label={`${star} sao`}
            />
            <Icon
              className={`size-6 ${activeColor ? 'text-amber-500' : 'text-gray-300'}`}
              fill={activeColor ? 'currentColor' : 'none'}
              strokeWidth={1.8}
              aria-hidden
            />
          </div>
        )
      })}
    </div>
  )
}

/** Cửa sổ số trang kiểu 1 … 4 5 6 … 12 */
function buildPaginationWindow(current, total, maxButtons = 5) {
  if (total <= maxButtons + 2) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const half = Math.floor(maxButtons / 2)
  let start = Math.max(2, current - half)
  let end = Math.min(total - 1, start + maxButtons - 1)
  if (end - start < maxButtons - 1) {
    start = Math.max(2, end - maxButtons + 1)
  }
  const out = [1]
  if (start > 2) out.push('…')
  for (let i = start; i <= end; i += 1) out.push(i)
  if (end < total - 1) out.push('…')
  out.push(total)
  return out
}

function FilterChip({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? 'border-brand bg-brand text-white'
          : 'border-gray-200 bg-white text-gray-700 hover:border-brand/40'
      }`}
    >
      {label}
    </button>
  )
}
