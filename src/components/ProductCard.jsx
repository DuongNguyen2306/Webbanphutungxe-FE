import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { formatVnd } from '../utils/format'
import { SHOP_ZALO_URL } from '../data/products'

export function ProductCard({
  productId,
  name,
  originalPrice,
  salePrice,
  discountTag,
  image,
  isAvailable,
  priceFrom = false,
  zaloUrl = SHOP_ZALO_URL,
  imageAspect = 'square',
  /** 'default' | 'shelf' — shelf: chỉ ẩn nút Zalo (carousel gọn) */
  variant = 'default',
}) {
  const id = productId
  const displaySale = salePrice ?? 0
  const zaloHref = `${zaloUrl}${zaloUrl.includes('?') ? '&' : '?'}text=${encodeURIComponent(`[Thai Vũ] Tư vấn: ${name}`)}`

  const aspectClass =
    imageAspect === 'tire' ? 'aspect-[4/5]' : 'aspect-square'

  const isShelf = variant === 'shelf'

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
          <a
            href={zaloHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#0068ff]/30 bg-[#0068ff]/5 py-2 text-[11px] font-bold text-[#0068ff] transition hover:bg-[#0068ff] hover:text-white"
          >
            <MessageCircle className="size-3.5 shrink-0" strokeWidth={2.5} />
            Tư vấn Zalo
          </a>
        </div>
      ) : null}
    </article>
  )
}
