import { ProductCard } from '../ProductCard'

/**
 * Thẻ SP trên kệ Hàng mới về / Bán chạy — cùng kích thước & kiểu với lưới catalog.
 */
export function ProductShelfCard({
  productId,
  name,
  originalPrice,
  salePrice,
  soldCount,
  discountTag,
  image,
  isAvailable,
  variants,
  priceFrom,
  badgeTags,
}) {
  return (
    <ProductCard
      productId={productId}
      name={name}
      originalPrice={originalPrice}
      salePrice={salePrice}
      soldCount={soldCount}
      discountTag={discountTag}
      image={image}
      isAvailable={isAvailable}
      variants={variants}
      priceFrom={priceFrom}
      variant="shelf"
      compactOnMobile
      denseMobile
      badgeTags={badgeTags}
    />
  )
}
