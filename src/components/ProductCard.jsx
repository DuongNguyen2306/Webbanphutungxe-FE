import { Link, useNavigate } from 'react-router-dom'
import { Plus, ShoppingCart } from 'lucide-react'
import { formatCompactCount, formatVnd } from '../utils/format'
import { useCart } from '../context/CartContext'
import { showUiToast } from '../utils/uiToast'

function normalizeBadgeTags(tags) {
  if (!Array.isArray(tags)) return []
  return tags.map((t) => String(t || '').trim().toLowerCase()).filter(Boolean)
}

export function ProductCard({
  productId,
  name,
  originalPrice,
  salePrice,
  discountTag,
  image,
  isAvailable,
  variants = [],
  priceFrom = false,
  soldCount = null,
  imageAspect = 'square',
  /** 'default' | 'shelf' — shelf: ẩn cụm nút thao tác (carousel gọn) */
  variant = 'default',
  /** Thu gọn trên mobile: ẩn nút nhanh / đã bán, ưu tiên ảnh + giá */
  compactOnMobile = false,
  /** Thẻ mobile dày hơn: ảnh + chữ nhỏ để ~6 SP/lượt nhìn */
  denseMobile = false,
  bestseller = false,
  /** @type {string[]} từ BE: new, best-seller, featured */
  badgeTags = [],
}) {
  const { addItem } = useCart()
  const navigate = useNavigate()
  const id = productId
  const displaySale = salePrice ?? 0

  const tagsNorm = normalizeBadgeTags(badgeTags)
  const showNew = tagsNorm.includes('new')
  const showHot = tagsNorm.includes('best-seller') || bestseller

  const aspectClass =
    imageAspect === 'tire'
      ? 'aspect-[4/5]'
      : imageAspect === 'portrait'
        ? 'aspect-[5/6]'
        : denseMobile
          ? 'aspect-square max-md:aspect-[5/4]'
          : 'aspect-square'

  const isShelf = variant === 'shelf'
  const hasSoldCount = Number.isFinite(Number(soldCount)) && Number(soldCount) > 0
  const primaryVariant = variants.find((v) => v?.available) || variants[0] || null
  const canQuickAction = Boolean(
    id &&
      isAvailable &&
      primaryVariant?.id &&
      Number.isFinite(Number(primaryVariant.salePrice)),
  )

  function buildCartPayload() {
    if (!canQuickAction) return null
    return {
      productId: id,
      selectedVariant: primaryVariant.id,
      variantId: primaryVariant.id,
      quantity: 1,
      name,
      variantLabel: primaryVariant.label || 'Mặc định',
      salePrice: Number(primaryVariant.salePrice),
      image:
        primaryVariant.images?.[0] ||
        primaryVariant.image ||
        image ||
        '',
      mongoOk: true,
    }
  }

  async function handleAddToCart(e) {
    e.stopPropagation()
    const payload = buildCartPayload()
    if (!payload) return
    await Promise.resolve(addItem(payload))
    showUiToast('Đã thêm sản phẩm vào giỏ hàng')
  }

  async function handleBuyNow(e) {
    e.stopPropagation()
    const payload = buildCartPayload()
    if (!payload) return
    await Promise.resolve(addItem(payload))
    navigate('/cart')
  }

  const inner = (
    <>
      <div
        className={`product-card-media shrink-0 overflow-hidden bg-gray-100 ${aspectClass}`}
      >
        <img
          src={image}
          alt=""
          className={`img-cover-fill transition-transform duration-300 will-change-transform ${!isAvailable ? 'opacity-40 grayscale' : 'group-hover:scale-[1.02]'}`}
          loading="lazy"
        />
        {!isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center p-2">
            <span className="rounded-full bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-ink shadow-md">
              Tạm hết hàng
            </span>
          </div>
        )}
        {(showNew || showHot) && isAvailable && (
          <div className="absolute left-1 top-1 z-[1] flex max-w-[calc(100%-3.5rem)] flex-col gap-0.5 sm:left-2 sm:top-2 sm:gap-1">
            {showNew ? (
              <span className="inline-flex max-w-full rounded bg-emerald-700 px-1 py-0.5 text-[8px] font-extrabold uppercase leading-tight tracking-wide text-white shadow-sm sm:px-1.5 sm:text-[10px]">
                MỚI
              </span>
            ) : null}
            {showHot ? (
              <span className="inline-flex max-w-full rounded bg-amber-700 px-1 py-0.5 text-[8px] font-extrabold uppercase leading-tight tracking-wide text-white shadow-sm sm:px-1.5 sm:text-[10px]">
                BÁN CHẠY
              </span>
            ) : null}
          </div>
        )}
        {discountTag && isAvailable && (
          <span className="absolute right-1 top-1 z-[1] max-w-[45%] truncate rounded-md bg-discount px-1 py-0.5 text-[10px] font-bold text-white shadow-sm sm:right-2 sm:top-2 sm:px-2 sm:text-xs">
            {discountTag}
          </span>
        )}
      </div>

      <div
        className={`flex min-h-0 flex-1 flex-col gap-2 p-2.5 sm:p-3 ${
          compactOnMobile ? 'max-md:gap-1 max-md:p-1.5' : ''
        } ${denseMobile ? 'max-md:gap-0.5 max-md:p-1' : ''}`}
      >
        <h3
          className={`shrink-0 text-left font-medium leading-snug text-ink ${
            isShelf && !denseMobile
              ? 'line-clamp-3 h-[4.35rem] text-xs sm:h-[4.65rem]'
              : denseMobile
                ? 'max-md:line-clamp-2 max-md:h-[2rem] max-md:text-[10px] md:line-clamp-2 md:h-11 md:text-xs sm:h-12'
                : compactOnMobile
                  ? 'max-md:line-clamp-2 max-md:h-[2.35rem] max-md:text-[11px] md:line-clamp-2 md:h-11 md:text-xs sm:h-12'
                  : 'line-clamp-2 h-11 text-xs sm:h-12'
          }`}
        >
          {name}
        </h3>

        <div className="mt-auto shrink-0 space-y-0.5 text-left">
          {priceFrom && isAvailable && (
            <p
              className={`text-[10px] font-semibold text-gray-500 ${compactOnMobile || denseMobile ? 'max-md:hidden' : ''}`}
            >
              Giá từ:
            </p>
          )}
          <div className="flex flex-wrap items-baseline gap-1.5">
            {originalPrice != null && originalPrice > displaySale && (
              <span
                className={`text-xs text-gray-400 line-through ${compactOnMobile || denseMobile ? 'max-md:hidden' : ''}`}
              >
                {formatVnd(originalPrice)}
              </span>
            )}
            <span
              className={`font-bold text-brand ${denseMobile ? 'max-md:text-xs md:text-sm' : compactOnMobile ? 'max-md:text-sm md:text-sm' : 'text-sm'}`}
            >
              {formatVnd(displaySale)}
            </span>
          </div>
          {hasSoldCount ? (
            <p
              className={`text-[11px] font-medium text-gray-500 ${compactOnMobile || denseMobile ? 'max-md:hidden' : ''}`}
            >
              Đã bán: {formatCompactCount(soldCount)}
            </p>
          ) : null}
        </div>
      </div>
    </>
  )

  return (
    <article className="group flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      {id ? (
        <Link
          to={`/product/${id}`}
          className="flex min-h-0 w-full min-w-0 flex-1 flex-col no-underline outline-none"
        >
          {inner}
        </Link>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">{inner}</div>
      )}

      {!isShelf ? (
        <div
          className={`px-2.5 pb-2.5 sm:px-3 sm:pb-3 ${compactOnMobile || denseMobile ? 'max-md:hidden' : ''}`}
        >
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!canQuickAction}
              className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-brand/30 bg-brand/5 py-2 text-[11px] font-bold text-brand transition hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Plus className="size-3.5 shrink-0" strokeWidth={2.75} />
              Thêm giỏ
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!canQuickAction}
              className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-brand py-2 text-[11px] font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ShoppingCart className="size-3.5 shrink-0" strokeWidth={2.4} />
              Mua ngay
            </button>
          </div>
        </div>
      ) : null}
    </article>
  )
}
