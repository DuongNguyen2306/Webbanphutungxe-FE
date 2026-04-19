import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
    isActive
      ? 'bg-brand text-white shadow-sm'
      : 'text-gray-600 hover:bg-white hover:text-gray-900'
  }`

const quickLinkClass = ({ isActive }) =>
  `text-sm font-semibold transition-colors ${
    isActive ? 'text-brand' : 'text-gray-600 hover:text-gray-900'
  }`

export function AdminLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-page text-gray-700">
        Đang tải...
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-svh bg-page text-gray-900">
      <header className="sticky top-0 z-10 border-b border-gray-200/80 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3 sm:gap-3">
          <span className="inline-flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Thai Vũ"
              className="h-9 w-auto max-w-[96px] object-contain"
            />
            <span className="text-lg font-extrabold tracking-tight text-brand">Thai Vũ · Admin</span>
          </span>
          <nav className="flex flex-wrap gap-1 rounded-xl bg-gray-100/80 p-1">
            <NavLink to="/admin/orders" className={linkClass}>
              Đơn hàng
            </NavLink>
            <NavLink to="/admin/inventory" className={linkClass}>
              Tồn kho
            </NavLink>
            <NavLink to="/admin/products" className={linkClass}>
              Sản phẩm
            </NavLink>
            <NavLink to="/admin/users" className={linkClass}>
              Khách hàng
            </NavLink>
            <NavLink to="/admin/banners" className={linkClass}>
              Banner
            </NavLink>
            <NavLink to="/admin/content" className={linkClass}>
              Nội dung
            </NavLink>
          </nav>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `ml-auto ${quickLinkClass({ isActive })}`}
          >
            Về cửa hàng
          </NavLink>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </div>
    </div>
  )
}
