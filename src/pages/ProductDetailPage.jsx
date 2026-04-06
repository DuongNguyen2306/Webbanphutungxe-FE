import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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
import { useCart } from '../context/CartContext'
import { useProductDetail } from '../hooks/useProductDetail'
import { ProductReviewsSection } from '../components/ProductReviewsSection'

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

function ProductDetailBody({ product, addItem, navigate, mongoOk }) {
  const [variantId, setVariantId] = useState(() => {
    const first = product.variants.find((v) => v.available)
    return (first ?? product.variants[0]).id
  })
  const [imgIdx, setImgIdx] = useState(0)
  const [qty, setQty] = useState(1)

  const variant = useMemo(() => {
    if (!product.variants?.length) return null
    return (
      product.variants.find((x) => x.id === variantId) ?? product.variants[0]
    )
  }, [product, variantId])

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

  const mainSrc =
    galleryImages.length > 0
      ? galleryImages[Math.min(imgIdx, galleryImages.length - 1)]
      : ''

  const original = variant?.originalPrice ?? product.originalPrice
  const sale = variant?.salePrice ?? product.salePrice
  const available = variant?.available ?? product.isAvailable

  const pctOff =
    original && original > sale
      ? Math.round(((original - sale) / original) * 100)
      : null

  const zaloHref = `${SHOP_ZALO_URL}${SHOP_ZALO_URL.includes('?') ? '&' : '?'}text=${encodeURIComponent(`[Thai Vũ] Tư vấn SP #${product.id}: ${product.name}`)}`

  function thumbScroll(dir) {
    const el = document.getElementById('pdp-thumbs')
    if (el) el.scrollBy({ left: dir * 200, behavior: 'smooth' })
  }

  function handleAddCart() {
    if (!variant || !available) return
    addItem({
      productId: product.id,
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
    handleAddCart()
    navigate('/')
  }

  return (
    <>
    <main className="mx-auto max-w-[1200px] px-3 py-4 sm:px-4 lg:py-8">
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
              className="ml-auto inline-flex items-center gap-1 text-brand"
            >
              <Heart className="size-4" />
              Đã thích (105)
            </button>
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
            <span className="font-bold text-discount">{product.rating}</span>
            <StarRow value={product.rating} />
            <button type="button" className="text-ink underline">
              {product.reviewCount.toLocaleString('vi-VN')} đánh giá
            </button>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600">
              Đã bán{' '}
              {product.soldCount >= 1000
                ? `${Math.floor(product.soldCount / 1000)}k+`
                : product.soldCount}
            </span>
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
                    {sel && v.available && (
                      <Check
                        className="absolute bottom-1 right-1 size-4 text-brand"
                        strokeWidth={3}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

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
              Mua ngay
            </button>
          </div>

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
    </main>
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
      />

      <SiteFooter />
    </div>
  )
}
