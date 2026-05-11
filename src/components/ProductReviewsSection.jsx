import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Star, StarHalf, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { parseYouTubeVideoId } from '../utils/youtubeUrl'

/**
 * @typedef {Object} ReviewSummary
 * @property {number} average
 * @property {number} total
 * @property {Record<string, number>} byRating
 * @property {number} withComment
 * @property {number} withMedia
 */

/**
 * @typedef {Object} ReviewAuthor
 * @property {string} [mask]
 * @property {boolean} [isStoreReview]
 */

/**
 * @typedef {Object} ReviewItem
 * @property {string} _id
 * @property {number} rating
 * @property {string} [variantLabel]
 * @property {string} [comment]
 * @property {string} [qualityNote]
 * @property {string} [matchDescriptionNote]
 * @property {string} [productQuality]
 * @property {string} [isCorrectDescription]
 * @property {string[]} [images]
 * @property {string} [video]
 * @property {{url: string, durationSec?: number}[]} [videos]
 * @property {number} [likes]
 * @property {string} createdAt
 * @property {boolean} [isStoreReview]
 * @property {ReviewAuthor} [author]
 */

/** Sao đầy + tối đa một nửa + sao trống (0.5 bước). Không dùng Math.round(rating). */
function RatingStars({ rating, className = '', iconClass = 'size-4 sm:size-5', ariaLabel }) {
  const r = Number(rating)
  const safe = Number.isFinite(r) ? Math.min(5, Math.max(0, r)) : 0
  const fullStars = Math.floor(safe)
  const halfStar = safe - fullStars >= 0.5 ? 1 : 0
  const empty = Math.max(0, 5 - fullStars - halfStar)
  const label =
    ariaLabel ??
    `Đánh giá ${Number.isInteger(safe) ? String(safe) : safe.toFixed(1).replace(/\.0$/, '')} trên 5 sao`

  const starCls = `${iconClass} shrink-0 text-amber-500`
  const emptyCls = `${iconClass} shrink-0 text-gray-300`

  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} role="img" aria-label={label}>
      {Array.from({ length: fullStars }, (_, i) => (
        <Star key={`f-${i}`} className={starCls} fill="currentColor" strokeWidth={1.5} aria-hidden />
      ))}
      {halfStar ? (
        <StarHalf key="h" className={starCls} fill="currentColor" strokeWidth={1.5} aria-hidden />
      ) : null}
      {Array.from({ length: empty }, (_, i) => (
        <Star key={`e-${i}`} className={emptyCls} fill="none" strokeWidth={1.5} aria-hidden />
      ))}
    </span>
  )
}

function reviewerDisplayName(rev) {
  const m = String(rev?.author?.mask ?? '').trim()
  if (m) return m
  return 'Khách'
}

function isStoreReviewRev(rev) {
  return rev?.isStoreReview === true || rev?.author?.isStoreReview === true
}

/** Giờ VN + relative ngắn nếu gần đây */
function formatReviewDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const now = Date.now()
  const diff = Math.max(0, now - d.getTime())
  const min = Math.floor(diff / 60_000)
  const hr = Math.floor(min / 60)
  const days = Math.floor(hr / 24)
  if (days > 14) {
    return d.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }
  if (days >= 1) return `${days} ngày trước`
  if (hr >= 1) return `${hr} giờ trước`
  if (min >= 1) return `${min} phút trước`
  return 'Vừa xong'
}

/** Vimeo: chỉ id số */
function parseVimeoId(raw) {
  const s = String(raw || '').trim()
  if (!s) return null
  try {
    const u = new URL(s, 'https://vimeo.com')
    const host = (u.hostname || '').replace(/^www\./i, '').toLowerCase()
    if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return null
    const parts = u.pathname.split('/').filter(Boolean)
    if (parts[0] === 'video' && parts[1] && /^\d+$/.test(parts[1])) return parts[1]
    if (parts.length === 1 && /^\d+$/.test(parts[0])) return parts[0]
  } catch {
    return null
  }
  return null
}

/** Chia comment thành đoạn text / link — chỉ mở khi người dùng bấm (target=_blank) */
function CommentBody({ text }) {
  const raw = String(text || '')
  if (!raw.trim()) return null
  const URL_REGEX = /(https?:\/\/[^\s]+)/gi
  const parts = []
  let last = 0
  let m
  while ((m = URL_REGEX.exec(raw)) !== null) {
    if (m.index > last) parts.push({ type: 'text', value: raw.slice(last, m.index) })
    parts.push({ type: 'link', value: m[1] })
    last = m.index + m[0].length
  }
  if (last < raw.length) parts.push({ type: 'text', value: raw.slice(last) })
  if (!parts.length) parts.push({ type: 'text', value: raw })

  return (
    <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-800">
      {parts.map((p, i) =>
        p.type === 'link' ? (
          <a
            key={i}
            href={p.value}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand underline decoration-brand/30 underline-offset-2 hover:decoration-brand"
          >
            {p.value}
          </a>
        ) : (
          <span key={i}>{p.value}</span>
        ),
      )}
    </div>
  )
}

function ImageLightbox({ urls, index, onClose, onPrev, onNext }) {
  if (!urls?.length || index < 0) return null
  const src = urls[Math.min(index, urls.length - 1)]
  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh đánh giá"
    >
      <button type="button" className="absolute inset-0 cursor-zoom-out" aria-label="Đóng" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] max-w-[min(100vw-2rem,56rem)] flex-col items-center gap-3">
        <div className="relative flex max-h-[80vh] w-full items-center justify-center">
          {urls.length > 1 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onPrev()
              }}
              className="absolute left-0 z-20 flex size-10 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow hover:bg-white"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="size-6" />
            </button>
          ) : null}
          <img
            src={src}
            alt=""
            className="max-h-[80vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {urls.length > 1 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onNext()
              }}
              className="absolute right-0 z-20 flex size-10 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow hover:bg-white"
              aria-label="Ảnh sau"
            >
              <ChevronRight className="size-6" />
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-10 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow hover:bg-white"
          aria-label="Đóng"
        >
          <X className="size-5" />
        </button>
      </div>
    </div>,
    document.body,
  )
}

function ReviewVideoBlock({ videoUrl, videos }) {
  const single = String(videoUrl || '').trim()
  const list = Array.isArray(videos) ? videos : []
  const ytId = single ? parseYouTubeVideoId(single) : null
  const vmId = single ? parseVimeoId(single) : null

  if (ytId) {
    return (
      <div className="mt-3 aspect-video w-full max-w-lg overflow-hidden rounded-lg border border-gray-200 bg-black">
        <iframe
          title="Video đánh giá"
          className="h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(ytId)}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    )
  }
  if (vmId) {
    return (
      <div className="mt-3 aspect-video w-full max-w-lg overflow-hidden rounded-lg border border-gray-200 bg-black">
        <iframe
          title="Video đánh giá"
          className="h-full w-full"
          src={`https://player.vimeo.com/video/${encodeURIComponent(vmId)}`}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    )
  }
  if (single) {
    return (
      <a
        href={single}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex rounded-lg border border-brand bg-brand/5 px-4 py-2 text-sm font-bold text-brand hover:bg-brand/10"
      >
        Xem video
      </a>
    )
  }
  if (!list.length) return null
  return (
    <div className="mt-3 space-y-2">
      {list.map((v, i) => {
        const url = String(v?.url || '').trim()
        if (!url) return null
        const y = parseYouTubeVideoId(url)
        const vm = parseVimeoId(url)
        if (y) {
          return (
            <div key={i} className="aspect-video w-full max-w-lg overflow-hidden rounded-lg border border-gray-200 bg-black">
              <iframe
                title={`Video ${i + 1}`}
                className="h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(y)}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          )
        }
        if (vm) {
          return (
            <div key={i} className="aspect-video w-full max-w-lg overflow-hidden rounded-lg border border-gray-200 bg-black">
              <iframe
                title={`Video ${i + 1}`}
                className="h-full w-full"
                src={`https://player.vimeo.com/video/${encodeURIComponent(vm)}`}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          )
        }
        return (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-lg border border-brand bg-brand/5 px-4 py-2 text-sm font-bold text-brand hover:bg-brand/10"
          >
            Xem video {i + 1}
          </a>
        )
      })}
    </div>
  )
}

function SummarySkeleton() {
  return (
    <div className="mt-4 animate-pulse space-y-3 rounded-lg bg-page px-4 py-4">
      <div className="h-10 w-24 rounded bg-gray-200" />
      <div className="h-4 w-48 rounded bg-gray-200" />
    </div>
  )
}

function ReviewCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-100 bg-page/50 px-4 py-4">
      <div className="h-4 w-32 rounded bg-gray-200" />
      <div className="mt-2 h-3 w-40 rounded bg-gray-200" />
      <div className="mt-3 h-16 w-full rounded bg-gray-200" />
    </div>
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
  const [summaryLoading, setSummaryLoading] = useState(true)

  /** 'all' | '1'..'5' | 'comment' | 'media' */
  const [filterKey, setFilterKey] = useState('all')
  const [page, setPage] = useState(1)
  const limit = 10

  const [listData, setListData] = useState(null)
  const [listLoading, setListLoading] = useState(true)
  const [listErr, setListErr] = useState(null)

  const [gallery, setGallery] = useState(null)

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
    const pid = String(productId || '').trim()
    if (!pid) {
      setSummary(null)
      setSummaryErr('Thiếu mã sản phẩm.')
      setSummaryLoading(false)
      return
    }
    setSummaryLoading(true)
    setSummaryErr(null)
    try {
      const { data } = await api.get(`/api/products/${encodeURIComponent(pid)}/reviews/summary`)
      setSummary(data)
    } catch (e) {
      setSummary(null)
      setSummaryErr(e.response?.data?.message || 'Không tải được thống kê đánh giá.')
    } finally {
      setSummaryLoading(false)
    }
  }, [productId])

  const loadList = useCallback(async () => {
    const pid = String(productId || '').trim()
    if (!pid) {
      setListData(null)
      setListErr('Thiếu mã sản phẩm.')
      setListLoading(false)
      return
    }
    setListLoading(true)
    setListErr(null)
    try {
      const { data } = await api.get(`/api/products/${encodeURIComponent(pid)}/reviews`, {
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

  const retryAll = useCallback(async () => {
    await Promise.all([loadSummary(), loadList()])
  }, [loadSummary, loadList])

  useEffect(() => {
    setPage(1)
    setFilterKey('all')
    setGallery(null)
  }, [productId])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  useEffect(() => {
    loadList()
  }, [loadList])

  useEffect(() => {
    if (!gallery) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setGallery(null)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [gallery])

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
      await api.post(`/api/products/${encodeURIComponent(productId)}/reviews`, {
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
      await Promise.all([loadSummary(), loadList()])
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

  async function handleDeleteReview(reviewId, opts = {}) {
    if (!isAdmin) return
    const msg =
      typeof opts.confirmMessage === 'string' && opts.confirmMessage.trim()
        ? opts.confirmMessage.trim()
        : 'Xóa đánh giá này?'
    if (!window.confirm(msg)) return
    try {
      await api.delete(`/api/admin/reviews/${encodeURIComponent(reviewId)}`)
      await Promise.all([loadSummary(), loadList()])
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
  const items = listData?.items
  const itemsLen = items?.length ?? 0
  const canGoPrev = page > 1
  const canGoNext = totalPages > 0 ? page < totalPages : itemsLen >= limit

  const summaryTotal = Number(summary?.total ?? 0)
  const listTotal = Number(listData?.total ?? listData?.count ?? 0)
  const hasActiveFilter = filterKey !== 'all'

  const emptyMessage = useMemo(() => {
    if (listLoading || listErr) return null
    if (itemsLen > 0) return null
    if (hasActiveFilter && summaryTotal > 0 && listTotal === 0) {
      return 'Không có đánh giá nào thỏa bộ lọc. Thử đổi tab hoặc xóa lọc.'
    }
    if (!hasActiveFilter && summaryTotal === 0) {
      return 'Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên chia sẻ trải nghiệm!'
    }
    return 'Không có đánh giá trên trang này.'
  }, [listLoading, listErr, itemsLen, hasActiveFilter, summaryTotal, listTotal])

  const avg = Number(summary?.average)
  const avgSafe = Number.isFinite(avg) ? avg : 0

  return (
    <section
      id="danh-gia"
      className="mx-auto max-w-[1200px] border-t border-gray-200 px-3 py-10 sm:px-4"
    >
      <h2 className="text-lg font-extrabold text-ink sm:text-xl">Đánh giá sản phẩm</h2>

      {(summaryErr || listErr) && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800">
          <p className="font-semibold">Có lỗi khi tải đánh giá</p>
          {summaryErr ? <p className="mt-1">{summaryErr}</p> : null}
          {listErr ? <p className="mt-1">{listErr}</p> : null}
          <button
            type="button"
            onClick={() => retryAll()}
            className="mt-3 rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand-dark"
          >
            Thử lại
          </button>
        </div>
      )}

      {summaryLoading ? (
        <SummarySkeleton />
      ) : summary && !summaryErr ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-page px-4 py-3 sm:gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-brand">{summary.average?.toFixed(1) ?? '0.0'}</span>
            <span className="text-sm text-gray-600">/5</span>
          </div>
          <RatingStars rating={avgSafe} iconClass="size-5 sm:size-6" />
          <span className="text-sm text-gray-600">({summary.total ?? 0} đánh giá)</span>
        </div>
      ) : !summaryErr ? (
        <p className="mt-2 text-sm text-gray-500">Không có dữ liệu thống kê.</p>
      ) : null}

      {summary && !summaryLoading && !summaryErr ? (
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
              label={`${n} sao (${byRating[n] ?? byRating[String(n)] ?? 0})`}
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
            <p className="mt-1 text-xs text-gray-500">Phân loại: {variantLabel}</p>
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
          {formErr ? <p className="mt-2 text-sm font-semibold text-red-600">{formErr}</p> : null}
          {formOk ? <p className="mt-2 text-sm font-semibold text-emerald-700">{formOk}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="mt-4 rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
          </button>
        </form>
      ) : isAdmin ? (
        <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Chế độ Quản trị viên — không thể đánh giá sản phẩm.
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
          <>
            <ReviewCardSkeleton />
            <ReviewCardSkeleton />
            <ReviewCardSkeleton />
          </>
        ) : listErr ? null : itemsLen ? (
          items.map((rev) => (
            <article
              key={rev._id}
              className="rounded-xl border border-gray-100 bg-page/50 px-4 py-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{reviewerDisplayName(rev)}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                    <RatingStars
                      rating={rev.rating}
                      iconClass="size-4"
                      ariaLabel={(() => {
                        const rr = Number(rev.rating)
                        if (!Number.isFinite(rr)) return undefined
                        const t = Number.isInteger(rr) ? String(rr) : rr.toFixed(1)
                        return `Đánh giá ${t} trên 5 sao`
                      })()}
                    />
                    <span className="text-xs text-gray-500">{formatReviewDate(rev.createdAt)}</span>
                  </div>
                  {rev.variantLabel ? (
                    <p className="mt-1 text-xs text-gray-600">Phân loại: {rev.variantLabel}</p>
                  ) : null}
                </div>
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteReview(rev._id, {
                        confirmMessage:
                          isStoreReviewRev(rev)
                            ? 'Xóa đánh giá do cửa hàng nhập?'
                            : 'Đây là đánh giá của khách. Xóa vĩnh viễn?',
                      })
                    }
                    className="inline-flex shrink-0 items-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                    title="Xóa (admin)"
                  >
                    <Trash2 className="size-3.5" />
                    Xóa
                  </button>
                ) : null}
              </div>

              {(rev.productQuality ||
                rev.isCorrectDescription ||
                rev.qualityNote ||
                rev.matchDescriptionNote) && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {rev.productQuality || rev.qualityNote ? (
                    <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 font-medium text-gray-700">
                      Chất lượng: {String(rev.productQuality || rev.qualityNote).trim()}
                    </span>
                  ) : null}
                  {rev.isCorrectDescription || rev.matchDescriptionNote ? (
                    <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 font-medium text-gray-700">
                      Đúng mô tả: {String(rev.isCorrectDescription || rev.matchDescriptionNote).trim()}
                    </span>
                  ) : null}
                </div>
              )}

              {rev.comment ? <CommentBody text={rev.comment} /> : null}

              {rev.images?.length ? (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:max-w-xl">
                  {rev.images.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setGallery({ urls: rev.images, index: i })}
                      className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                    >
                      <img src={url} alt="" className="h-full w-full object-cover object-center" loading="lazy" />
                    </button>
                  ))}
                </div>
              ) : null}

              <ReviewVideoBlock videoUrl={rev.video} videos={rev.videos} />

              {rev.likes != null && rev.likes > 0 ? (
                <p className="mt-2 text-xs text-gray-400">Hữu ích ({rev.likes})</p>
              ) : null}
            </article>
          ))
        ) : emptyMessage ? (
          <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-4 py-6 text-center text-sm text-gray-600">
            {emptyMessage}
          </p>
        ) : null}
      </div>

      {gallery ? (
        <ImageLightbox
          urls={gallery.urls}
          index={gallery.index}
          onClose={() => setGallery(null)}
          onPrev={() =>
            setGallery((g) =>
              g
                ? {
                    ...g,
                    index: (g.index - 1 + g.urls.length) % g.urls.length,
                  }
                : null,
            )
          }
          onNext={() =>
            setGallery((g) =>
              g
                ? {
                    ...g,
                    index: (g.index + 1) % g.urls.length,
                  }
                : null,
            )
          }
        />
      ) : null}

      {!listLoading && !listErr && (itemsLen > 0 || totalPages > 1) ? (
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
                    <span key={`e-${idx}`} className="px-2 text-sm font-medium text-gray-400" aria-hidden>
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
          <p className="mt-2 text-center text-xs text-gray-500">
            {totalPages > 0 ? (
              <>
                Trang {page} / {totalPages}
                {Number.isFinite(totalReviews) && totalReviews > 0 ? ` · ${totalReviews} đánh giá` : null}
              </>
            ) : (
              <>Trang {page}</>
            )}
          </p>
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
