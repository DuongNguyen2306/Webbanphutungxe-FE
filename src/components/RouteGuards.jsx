import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-page text-gray-700">
      Đang tải...
    </div>
  )
}

/** Chặn admin: chỉ khách / user thường được xem cửa hàng. */
export function CustomerOnlyRoute() {
  const { user, loading, token } = useAuth()
  if (token && loading) return <AuthLoadingScreen />
  if (user?.role === 'admin') return <Navigate to="/admin" replace />
  return <Outlet />
}

/** Admin đã đăng nhập không vào lại form đăng nhập / đăng ký cửa hàng. */
export function BlockAdminFromAuthForms({ children }) {
  const { user, loading, token } = useAuth()
  if (token && loading) return <AuthLoadingScreen />
  if (user?.role === 'admin') return <Navigate to="/admin" replace />
  return children
}
