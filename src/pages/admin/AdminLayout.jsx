import { useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Boxes,
  ClipboardList,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  Sparkles,
  Menu,
  Package,
  Users,
  X,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const ADMIN_MENU = [
  { to: '/admin/orders', label: 'Đơn hàng', icon: ClipboardList },
  { to: '/admin/inventory', label: 'Tồn kho', icon: Boxes },
  { to: '/admin/products', label: 'Sản phẩm', icon: Package },
  {
    to: '/admin/variants',
    label: 'Biến thể',
    icon: Layers,
    /** Sáng khi đang ở hub hoặc trang chi tiết /admin/variants/:id */
    activeMatch: (pathname) =>
      pathname === '/admin/variants' || pathname.startsWith('/admin/variants/'),
  },
  { to: '/admin/best-sellers', label: 'Nổi bật', icon: Sparkles },
  { to: '/admin/users', label: 'Khách hàng', icon: Users },
  { to: '/admin/banners', label: 'Banner', icon: ImageIcon },
  { to: '/admin/content', label: 'Nội dung', icon: LayoutDashboard },
]

const linkClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
    isActive
      ? 'bg-red-50 text-brand'
      : 'text-gray-300 hover:bg-white/10 hover:text-white'
  }`

export function AdminLayout() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

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
    <div className="min-h-svh bg-gray-50 text-gray-900">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 bg-slate-900 text-white lg:flex lg:flex-col">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-2xl font-black tracking-tight">Thai Vũ</p>
          <p className="text-sm font-bold text-brand">Admin</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {ADMIN_MENU.map((item) => {
            const Icon = item.icon
            const pathActive = item.activeMatch?.(location.pathname)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  linkClass({ isActive: isActive || Boolean(pathActive) })
                }
              >
                <Icon className="size-4" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/login', { replace: true })
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="size-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
        <div>
          <p className="text-lg font-extrabold text-gray-900">Thai Vũ</p>
          <p className="text-xs font-bold uppercase tracking-wide text-brand">Admin</p>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg border border-gray-300 p-2 text-gray-700"
          aria-label="Mở menu quản trị"
        >
          <Menu className="size-5" />
        </button>
      </header>

      <div
        className={`fixed inset-0 z-50 lg:hidden ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-64 bg-slate-900 text-white shadow-xl transition-transform duration-200 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <div>
              <p className="text-xl font-black tracking-tight">Thai Vũ</p>
              <p className="text-xs font-bold uppercase tracking-wide text-brand">Admin</p>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-md p-1.5 text-gray-300 hover:bg-white/10 hover:text-white"
              aria-label="Đóng menu quản trị"
            >
              <X className="size-5" />
            </button>
          </div>
          <nav className="space-y-1 px-3 py-4">
            {ADMIN_MENU.map((item) => {
              const Icon = item.icon
              const pathActive = item.activeMatch?.(location.pathname)
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    linkClass({ isActive: isActive || Boolean(pathActive) })
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className="size-4" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
          <div className="border-t border-white/10 p-3">
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false)
                logout()
                navigate('/login', { replace: true })
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-4" />
              Đăng xuất
            </button>
          </div>
        </aside>
      </div>

      <div className="px-4 py-6 lg:ml-64 lg:px-8 lg:py-8">
        <Outlet />
      </div>
    </div>
  )
}
