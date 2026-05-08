import { Navigate, useParams } from 'react-router-dom'

/** URL cũ /admin/products/:productId/variants → /admin/variants/:productId */
export function RedirectLegacyProductVariants() {
  const { productId } = useParams()
  if (!productId) return <Navigate to="/admin/variants" replace />
  return <Navigate to={`/admin/variants/${productId}`} replace />
}
