import { Link, useNavigate } from 'react-router-dom'
import { Plus, ShoppingCart } from 'lucide-react'
import { formatVnd } from '../utils/format'
import { useCart } from '../context/CartContext'
import { showUiToast } from '../utils/uiToast'

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
  imageAspect = 'square',
  /** 'default' | 'shelf' — shelf: ẩn cụm nút thao tác (carousel gọn) */
  variant = 'default',
}) {
  const { addItem } = useCart()
  const navigate = useNavigate()
  const id = productId
  const displaySale = salePrice ?? 0

  const aspectClass =
    imageAspect === 'tire' ? 'aspect-[4/5]' : 'aspect-square'

  const isShelf = variant === 'shelf'
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
      <div className={`relative shrink-0 overflow-hidden bg-gray-100 ${aspectClass}`}>
        <img
          src={image}
          alt=""
          className={`h-full w-full object-cover transition ${!isAvailable ? 'opacity-40 grayscale' : 'group-hover:scale-[1.02]'}`}
          loading="lazy"
        />
        {!isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center p-2">
            <span className="rounded-full bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-ink shadow-md">
              Tạm hết hàng
            </span>
          </div>
        )}
        {discountTag && isAvailable && (
          <span className="absolute right-2 top-2 rounded-md bg-discount px-2 py-0.5 text-xs font-bold text-white shadow-sm">
            {discountTag}
          </span>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 p-2.5 sm:p-3">
        <h3
          className={`shrink-0 text-left text-xs font-medium leading-snug text-ink ${
            isShelf
              ? 'line-clamp-3 h-[4.35rem] sm:h-[4.65rem]'
              : 'line-clamp-2 h-11 sm:h-12'
          }`}
        >
          {name}
        </h3>

        <div className="mt-auto shrink-0 space-y-0.5 text-left">
          {priceFrom && isAvailable && (
            <p className="text-[10px] font-semibold text-gray-500">Giá từ:</p>
          )}
          <div className="flex flex-wrap items-baseline gap-1.5">
            {originalPrice != null && originalPrice > displaySale && (
              <span className="text-xs text-gray-400 line-through">
                {formatVnd(originalPrice)}
              </span>
            )}
            <span className="text-sm font-bold text-brand">
              {formatVnd(displaySale)}
            </span>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <article className="group flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      {id ? (
        <Link
          to={`/product/${id}`}
          className="flex min-h-0 flex-1 flex-col no-underline outline-none"
        >
          {inner}
        </Link>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">{inner}</div>
      )}

      {!isShelf ? (
        <div className="px-2.5 pb-2.5 sm:px-3 sm:pb-3">
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
