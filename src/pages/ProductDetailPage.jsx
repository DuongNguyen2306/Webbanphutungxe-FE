import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ShoppingCart,
  Truck,
  ShieldCheck,
  Check,
  MessageCircle,
} from 'lucide-react'
import { SHOP_ZALO_URL } from '../data/products'
import { Header } from '../components/Header'
import { SiteFooter } from '../components/SiteFooter'
import { formatVnd } from '../utils/format'
import { api } from '../api/client'
import { useCart } from '../context/CartContext'
import { useProductDetail } from '../hooks/useProductDetail'
import { ProductReviewsSection } from '../components/ProductReviewsSection'
import { ProductRelatedShelf } from '../components/ProductRelatedShelf'
import { useAuth } from '../context/AuthContext'

function ProductDescriptionBody({ text }) {
  const looksLikeHtml = /<\/?[a-z][\s\S]*?>/i.test(text)
  if (looksLikeHtml) {
    return (
      <div
        className="mt-4 space-y-3 text-sm leading-relaxed text-gray-800 [&_a]:text-brand [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
        // eslint-disable-next-line react/no-danger -- mô tả từ CMS/admin; chỉ render khi có thẻ HTML
        dangerouslySetInnerHTML={{ __html: text }}
      />
    )
  }
  return (
    <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
      {text}
    </div>
  )
}

function StarRow({ value = 0 }) {
  const full = Math.floor(value)
  return (
    <span className="inline-flex items-center gap-0.5 text-discount" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i}>{i < full ? '★' : '☆'}</span>
      ))}
    </span>
  )
}

function ProductDetailBody({
  product,
  addItem,
  navigate,
  mongoOk,
  isAdmin,
  user,
}) {
  const [selectedAttrs, setSelectedAttrs] = useState(() => {
    const out = {}
    ;(product.attributes || []).forEach((attr) => {
      if (attr.values?.length) out[attr.key] = attr.values[0]
    })
    return out
  })
  const [variantId, setVariantId] = useState(() => {
    const first = product.variants.find((v) => v.available)
    return (first ?? product.variants[0])?.id
  })
  const [imgIdx, setImgIdx] = useState(0)
  const [qty, setQty] = useState(1)
  const [wishlistCount, setWishlistCount] = useState(() =>
    Math.max(0, Number(product.wishlistCount) || 0),
  )
  const [isLiked, setIsLiked] = useState(false)
  const [wishlistBusy, setWishlistBusy] = useState(false)
  const [heartPulseKey, setHeartPulseKey] = useState(0)
  const [wishlistError, setWishlistError] = useState('')

  const variantById = useMemo(() => {
    if (!product.variants?.length) return null
    return (
      product.variants.find((x) => x.id === variantId) ?? product.variants[0]
    )
  }, [product, variantId])

  const variant = useMemo(() => {
    if (!product.variants?.length) return null
    if (!product.attributes?.length) return variantById
    const matched = product.variants.find((candidate) =>
      (product.attributes || []).every(
        (attr) => (candidate.attributeValues || {})[attr.key] === selectedAttrs[attr.key],
      ),
    )
    return matched || variantById
  }, [product, selectedAttrs, variantById])

  /** Gallery: variant.images nếu có; không thì product.images (fallback) */
  const galleryImages = useMemo(() => {
    const vImgs = (variant?.images ?? []).filter(Boolean)
    if (vImgs.length > 0) return vImgs
    const pImgs = (product.images ?? []).filter(Boolean)
    if (pImgs.length > 0) return pImgs
    return product.image ? [product.image] : []
  }, [variant, product])

  useEffect(() => {
    setImgIdx(0)
  }, [variantId])

  useEffect(() => {
    if (!product.attributes?.length || !variant) return
    const nextSelected = { ...selectedAttrs }
    let changed = false
    ;(product.attributes || []).forEach((attr) => {
      const value = (variant.attributeValues || {})[attr.key]
      if (value && nextSelected[attr.key] !== value) {
        nextSelected[attr.key] = value
        changed = true
      }
    })
    if (changed) setSelectedAttrs(nextSelected)
  }, [product, variant, selectedAttrs])

  useEffect(() => {
    if (!variant) return
    if (variant.id !== variantId) setVariantId(variant.id)
  }, [variant, variantId])

  useEffect(() => {
    setWishlistCount(Math.max(0, Number(product.wishlistCount) || 0))
    setWishlistError('')
  }, [product.id, product.wishlistCount])

  useEffect(() => {
    if (!product.id || !user || isAdmin) {
      setIsLiked(false)
      return
    }

    let cancel = false
    ;(async () => {
      try {
        const { data } = await api.get(`/api/wishlist/status/${product.id}`)
        if (cancel) return
        const likedFromApi =
          data?.isLiked ??
          data?.liked ??
          data?.isInWishlist ??
          data?.inWishlist ??
          data?.data?.isLiked
        const countFromApi =
          data?.wishlistCount ??
          data?.count ??
          data?.likes ??
          data?.data?.wishlistCount
        if (typeof likedFromApi === 'boolean') setIsLiked(likedFromApi)
        if (Number.isFinite(Number(countFromApi))) {
          setWishlistCount(Math.max(0, Number(countFromApi)))
        }
      } catch {
        if (cancel) return
      }
    })().catch(() => {})

    return () => {
      cancel = true
    }
  }, [product.id, user, isAdmin])

  const mainSrc =
    galleryImages.length > 0
      ? galleryImages[Math.min(imgIdx, galleryImages.length - 1)]
      : ''

  const original = variant?.originalPrice ?? product.originalPrice
  const sale = variant?.salePrice ?? product.salePrice
  const available = Boolean(variant?.available ?? product.isAvailable)

  const pctOff =
    original && original > sale
      ? Math.round(((original - sale) / original) * 100)
      : null
  const hasReviewCount =
    Number.isFinite(Number(product.reviewCount)) && Number(product.reviewCount) > 0
  const hasRating = Number.isFinite(Number(product.rating)) && Number(product.rating) > 0
  /** Chỉ hiện sao/điểm khi có ít nhất một đánh giá (đồng bộ với mapper, tránh 4.5 ảo). */
  const showRatingStars = hasRating && hasReviewCount
  const zaloHref = `${SHOP_ZALO_URL}${SHOP_ZALO_URL.includes('?') ? '&' : '?'}text=${encodeURIComponent(`[Thai Vũ] Tư vấn SP #${product.id}: ${product.name}`)}`

  function thumbScroll(dir) {
    const el = document.getElementById('pdp-thumbs')
    if (el) el.scrollBy({ left: dir * 200, behavior: 'smooth' })
  }

  function handleAddCart() {
    if (!variant || !available) return
    addItem({
      productId: product.id,
      selectedVariant: variant.id,
      variantId: variant.id,
      quantity: qty,
      name: product.name,
      variantLabel: variant.label,
      salePrice: variant.salePrice,
      image:
        variant.images?.[0] ??
        product.images?.[0] ??
        product.image ??
        '',
      mongoOk,
    })
  }

  function handleBuyNow() {
    if (!variant || !available) return
    handleAddCart()
    navigate('/cart')
  }

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/')
  }

  async function handleToggleWishlist() {
    if (!user) {
      window.alert('Bạn cần đăng nhập để lưu sản phẩm yêu thích')
      navigate('/login')
      return
    }
    if (isAdmin || wishlistBusy) return

    setWishlistError('')
    const optimisticLiked = !isLiked
    const optimisticCount = Math.max(
      0,
      wishlistCount + (optimisticLiked ? 1 : -1),
    )
    setIsLiked(optimisticLiked)
    setWishlistCount(optimisticCount)
    setHeartPulseKey((k) => k + 1)
    setWishlistBusy(true)

    try {
      const { data } = await api.post(`/api/wishlist/toggle`, {
        productId: product.id,
      })
      const likedFromApi =
        data?.isLiked ??
        data?.liked ??
        data?.isInWishlist ??
        data?.inWishlist ??
        data?.data?.isLiked
      const countFromApi =
        data?.wishlistCount ?? data?.count ?? data?.likes ?? data?.data?.wishlistCount
      if (typeof likedFromApi === 'boolean') setIsLiked(likedFromApi)
      if (Number.isFinite(Number(countFromApi))) {
        setWishlistCount(Math.max(0, Number(countFromApi)))
      }
    } catch (err) {
      setIsLiked(!optimisticLiked)
      setWishlistCount(wishlistCount)
      const message =
        err?.response?.data?.message ||
        'Không thể cập nhật yêu thích. Vui lòng thử lại.'
      setWishlistError(message)
    } finally {
      setWishlistBusy(false)
    }
  }

  return (
    <>
    <main className="mx-auto max-w-[1200px] px-4 py-4 lg:py-8">
      <button
        type="button"
        onClick={handleBack}
        className="mb-3 inline-flex size-9 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:border-brand/40 hover:text-brand"
        aria-label="Quay lại trang trước"
      >
        <ChevronLeft className="size-4.5" />
      </button>
      <nav className="mb-4 flex flex-wrap gap-1 text-[11px] text-gray-400 sm:text-xs">
        <Link to="/" className="hover:text-brand">
          Trang chủ
        </Link>
        <span>/</span>
        <span className="text-gray-500">Phụ tùng &amp; phụ kiện</span>
        <span>/</span>
        <span className="line-clamp-1 text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-md border border-gray-200 bg-gray-50">
            {mainSrc ? (
              <img
                src={mainSrc}
                alt=""
                className={`h-full w-full object-cover ${!available ? 'opacity-50 grayscale' : ''}`}
              />
            ) : (
              <div className="flex h-full min-h-[200px] items-center justify-center px-4 text-center text-sm text-gray-400">
                Chưa có ảnh
              </div>
            )}
          </div>
          <div className="relative mt-3">
            <button
              type="button"
              onClick={() => thumbScroll(-1)}
              className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-gray-200 bg-white p-1 shadow sm:block"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => thumbScroll(1)}
              className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-gray-200 bg-white p-1 shadow sm:block"
              aria-label="Ảnh sau"
            >
              <ChevronRight className="size-4" />
            </button>
            <div
              id="pdp-thumbs"
              className="flex gap-2 overflow-x-auto scroll-smooth px-0 sm:px-8 [scrollbar-width:thin]"
            >
              {galleryImages.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  onClick={() => setImgIdx(i)}
                  className={`relative size-16 shrink-0 overflow-hidden rounded border-2 sm:size-20 ${imgIdx === i ? 'border-brand' : 'border-gray-200'}`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-4 text-sm text-gray-500">
            <span className="font-medium text-ink">Chia sẻ:</span>
            <span className="text-xs">Facebook · Zalo · Copy link</span>
            <button
              type="button"
              onClick={handleToggleWishlist}
              disabled={wishlistBusy || isAdmin}
              className="ml-auto inline-flex items-center gap-1 text-brand disabled:cursor-not-allowed disabled:opacity-60"
            >
              <motion.span
                key={heartPulseKey}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.28, 1] }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                className="inline-flex"
              >
                <Heart
                  className={`size-4 ${isLiked ? 'fill-brand text-brand' : ''}`}
                />
              </motion.span>
              Đã thích ({wishlistCount})
            </button>
            {wishlistError ? (
              <span className="basis-full text-xs font-semibold text-red-600">
                {wishlistError}
              </span>
            ) : null}
          </div>
        </div>

        <div>
          <span className="inline-block rounded bg-discount px-2 py-0.5 text-xs font-bold text-white">
            Yêu thích
          </span>
          <h1 className="mt-2 text-xl font-bold leading-snug sm:text-2xl">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            {showRatingStars ? (
              <>
                <span className="font-bold text-discount">{Number(product.rating).toFixed(1)}</span>
                <StarRow value={Number(product.rating)} />
              </>
            ) : null}
            {hasReviewCount ? (
              <button type="button" className="text-ink underline">
                {Number(product.reviewCount).toLocaleString('vi-VN')} đánh giá
              </button>
            ) : (
              <span className="text-gray-500">Chưa có đánh giá</span>
            )}
            <button
              type="button"
              className="ml-auto text-xs text-gray-400 hover:text-brand"
            >
              Tố cáo
            </button>
          </div>

          <div className="mt-6 rounded-md bg-page px-4 py-4">
            <div className="flex flex-wrap items-end gap-3">
              <span className="text-2xl font-extrabold text-brand sm:text-3xl">
                {formatVnd(sale)}
              </span>
              {original != null && original > sale && (
                <span className="text-base text-gray-400 line-through">
                  {formatVnd(original)}
                </span>
              )}
              {pctOff != null && (
                <span className="text-sm font-bold text-brand">-{pctOff}%</span>
              )}
            </div>
            {!available ? (
              <p className="mt-2 text-xs font-semibold text-red-600">Tạm hết hàng</p>
            ) : null}
          </div>

          <div className="mt-6 space-y-4 text-sm">
            <div className="flex gap-3 border-b border-gray-100 pb-4">
              <span className="w-28 shrink-0 text-gray-500">Vận chuyển</span>
              <div className="flex min-w-0 flex-1 items-start gap-2">
                <Truck className="mt-0.5 size-4 shrink-0 text-teal-600" />
                <div>
                  <p className="font-medium text-ink">
                    Giao hàng 1–3 ngày (nội thành / liên tỉnh)
                  </p>
                  <p className="text-gray-500">Phí ship 0₫ cho đơn đủ điều kiện</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pb-2">
              <span className="w-28 shrink-0 text-gray-500">An tâm mua</span>
              <div className="flex min-w-0 flex-1 items-start gap-2">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" />
                <p className="text-gray-600">
                  Đổi trả trong 7 ngày với lỗi sản xuất (theo chính sách cửa hàng).
                </p>
              </div>
            </div>
          </div>

          {product.attributes?.length ? (
            <div className="mt-6 space-y-4">
              {product.attributes.map((attr) => (
                <div key={attr.key}>
                  <p className="text-sm font-semibold text-gray-600">{attr.name}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {attr.values.map((value) => {
                      const active = selectedAttrs[attr.key] === value
                      const canPick = product.variants.some((candidate) => {
                        const trial = { ...selectedAttrs, [attr.key]: value }
                        return (product.attributes || []).every(
                          (a) =>
                            (candidate.attributeValues || {})[a.key] === trial[a.key],
                        )
                      })
                      return (
                        <button
                          key={`${attr.key}-${value}`}
                          type="button"
                          disabled={!canPick}
                          onClick={() =>
                            setSelectedAttrs((prev) => ({ ...prev, [attr.key]: value }))
                          }
                          className={`relative min-w-[90px] rounded border-2 px-3 py-2 text-left text-sm font-semibold transition ${
                            !canPick
                              ? 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300'
                              : active
                                ? 'border-brand text-ink'
                                : 'border-gray-200 text-gray-700 hover:border-brand/40'
                          }`}
                        >
                          {value}
                          {active && canPick ? (
                            <Check
                              className="absolute bottom-1 right-1 size-4 text-brand"
                              strokeWidth={3}
                            />
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-600">Kiểu</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const sel = variant?.id === v.id
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={!v.available}
                      onClick={() => setVariantId(v.id)}
                      className={`relative min-w-[100px] rounded border-2 px-3 py-2 text-left text-sm font-semibold transition ${
                        !v.available
                          ? 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300'
                          : sel
                            ? 'border-brand text-ink'
                            : 'border-gray-200 text-gray-700 hover:border-brand/40'
                      }`}
                    >
                      {v.label}
                      {sel && v.available ? (
                        <Check
                          className="absolute bottom-1 right-1 size-4 text-brand"
                          strokeWidth={3}
                        />
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {product.compatibleVehicles?.length ? (
            <div className="mt-5 rounded-lg border border-gray-200 bg-white p-3">
              <p className="text-sm font-semibold text-gray-700">
                Dòng xe tương thích
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.compatibleVehicles.map((v) => (
                  <span
                    key={v}
                    className="rounded-full border border-gray-300 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <span className="text-sm font-semibold text-gray-600">Số lượng</span>
            <div className="inline-flex items-stretch overflow-hidden rounded border border-gray-300">
              <button
                type="button"
                className="px-3 py-2 font-bold hover:bg-page"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Giảm"
              >
                −
              </button>
              <input
                readOnly
                value={qty}
                className="w-12 border-x border-gray-300 bg-white text-center text-sm font-bold"
              />
              <button
                type="button"
                className="px-3 py-2 font-bold hover:bg-page"
                onClick={() => setQty((q) => q + 1)}
                aria-label="Tăng"
              >
                +
              </button>
            </div>
          </div>

          {isAdmin ? (
            <div className="mt-8 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm font-bold text-amber-800">
              Tài khoản Admin không có chức năng mua hàng
            </div>
          ) : (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleAddCart}
                disabled={!available}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded border-2 border-brand bg-white py-3 text-sm font-extrabold uppercase text-brand transition hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart className="size-5" />
                Thêm vào giỏ hàng
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!available}
                className="inline-flex flex-1 items-center justify-center rounded bg-cta-buy py-3 text-sm font-extrabold uppercase text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {available ? 'Mua ngay' : 'Hết hàng'}
              </button>
            </div>
          )}

          <a
            href={zaloHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#0068ff] bg-[#0068ff]/10 py-3 text-sm font-extrabold text-[#0068ff] transition hover:bg-[#0068ff] hover:text-white"
          >
            <MessageCircle className="size-5" />
            Tư vấn qua Zalo
          </a>
        </div>
      </div>

      {product.description?.trim() ? (
        <section
          className="mt-10 border-t border-gray-100 pt-8"
          aria-labelledby="pdp-desc-heading"
        >
          <h2 id="pdp-desc-heading" className="text-lg font-extrabold text-ink sm:text-xl">
            Mô tả sản phẩm
          </h2>
          <ProductDescriptionBody text={product.description.trim()} />
        </section>
      ) : null}
    </main>
    <ProductRelatedShelf
      excludeProductId={product.id}
      categoryId={product.categoryId}
    />
    <ProductReviewsSection
      productId={product.id}
      variantId={variant?.id}
      variantLabel={variant?.label ?? ''}
    />
    </>
  )
}

export function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { user } = useAuth()
  const { product, loading, fromApi, error: productError } = useProductDetail(id)

  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('all')

  if (loading) {
    return (
      <div className="min-h-svh bg-page font-sans text-ink">
        <Header
          searchQuery={search}
          onSearchQueryChange={setSearch}
          brandFilter={brandFilter}
          onBrandFilterChange={setBrandFilter}
        />
        <p className="py-20 text-center text-gray-600">Đang tải sản phẩm...</p>
        <SiteFooter />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-svh bg-page font-sans text-ink">
        <Header
          searchQuery={search}
          onSearchQueryChange={setSearch}
          brandFilter={brandFilter}
          onBrandFilterChange={setBrandFilter}
        />
        <div className="mx-auto max-w-[1400px] px-4 py-20 text-center">
          <p className="text-lg font-semibold">
            {productError || 'Không tìm thấy sản phẩm.'}
          </p>
          <Link to="/" className="mt-4 inline-block font-bold text-brand">
            Về trang chủ
          </Link>
        </div>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-white font-sans text-ink">
      <Header
        searchQuery={search}
        onSearchQueryChange={setSearch}
        brandFilter={brandFilter}
        onBrandFilterChange={setBrandFilter}
      />

      <ProductDetailBody
        key={product.id}
        product={product}
        addItem={addItem}
        navigate={navigate}
        mongoOk={fromApi === true}
        isAdmin={user?.role === 'admin'}
        user={user}
      />

      <SiteFooter />
    </div>
  )
}
