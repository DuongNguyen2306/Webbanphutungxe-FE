import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { HomePage } from './pages/HomePage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { CartPage } from './pages/CartPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { ProfilePage } from './pages/ProfilePage'
import { OrderDetailPage } from './pages/OrderDetailPage'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminOrders } from './pages/admin/AdminOrders'
import { AdminOrderDetailPage } from './pages/admin/AdminOrderDetailPage'
import { AdminUsers } from './pages/admin/AdminUsers'
import { AdminProducts } from './pages/admin/AdminProducts'
import { AdminProductForm } from './pages/admin/AdminProductForm'
import { AdminVariantPricesPage } from './pages/admin/AdminVariantPricesPage'
import { AdminInventory } from './pages/admin/AdminInventory'
import { AdminBanners } from './pages/admin/AdminBanners'
import { AdminContent } from './pages/admin/AdminContent'
import { IntroPage } from './pages/IntroPage'
import { GuidesPage } from './pages/GuidesPage'
import { NewsPage } from './pages/NewsPage'
import { FloatingContactRails } from './components/FloatingContactRails'
import { BlockAdminFromAuthForms, CustomerOnlyRoute } from './components/RouteGuards'
import { NewsEditorPage } from './pages/admin/NewsEditorPage'
import { GlobalUiToast } from './components/GlobalUiToast'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ScrollToTop />
        <Routes>
          <Route element={<CustomerOnlyRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<HomePage />} />
            <Route path="/gioi-thieu" element={<IntroPage />} />
            <Route path="/huong-dan" element={<GuidesPage />} />
            <Route path="/tin-tuc" element={<NewsPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/don-mua/:id" element={<OrderDetailPage />} />
          </Route>

          <Route
            path="/login"
            element={
              <BlockAdminFromAuthForms>
                <LoginPage />
              </BlockAdminFromAuthForms>
            }
          />
          <Route
            path="/signup"
            element={
              <BlockAdminFromAuthForms>
                <SignupPage />
              </BlockAdminFromAuthForms>
            }
          />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="orders" replace />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetailPage />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<AdminProductForm />} />
            <Route path="products/:id/edit" element={<AdminProductForm />} />
            <Route path="products/:id/prices" element={<AdminVariantPricesPage />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="content/news" element={<NewsEditorPage mode="list" />} />
            <Route path="content/news/new" element={<NewsEditorPage mode="create" />} />
            <Route path="content/news/:newsId/edit" element={<NewsEditorPage mode="edit" />} />
          </Route>
        </Routes>
        <GlobalUiToast />
        <FloatingContactRails />
      </CartProvider>
    </AuthProvider>
  )
}
