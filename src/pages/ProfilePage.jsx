import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { User, ShoppingBag, KeyRound, PencilLine } from 'lucide-react'
import { Header } from '../components/Header'
import { SiteFooter } from '../components/SiteFooter'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import { formatVnd } from '../utils/format'

export function ProfilePage() {
  const { user, loading, logout } = useAuth()
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('all')
  const [orders, setOrders] = useState([])
  const [ordLoading, setOrdLoading] = useState(true)
  const [section, setSection] = useState('profile')
  const [statusTab, setStatusTab] = useState('all')

  useEffect(() => {
    if (!user) {
      setOrders([])
      setOrdLoading(false)
      return
    }
    let cancel = false
    setOrdLoading(true)
    ;(async () => {
      try {
        const { data } = await api.get('/api/orders/my')
        if (!cancel) setOrders(data)
      } catch {
        if (!cancel) setOrders([])
      } finally {
        if (!cancel) setOrdLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [user])

  useEffect(() => {
    if (window.location.hash === '#orders') {
      setSection('orders')
    }
  }, [])

  const statusTabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'pending', label: 'Chờ xác nhận' },
    { id: 'shipping', label: 'Đang giao' },
    { id: 'completed', label: 'Hoàn thành' },
    { id: 'cancelled', label: 'Đã hủy' },
  ]

  const filteredOrders = useMemo(() => {
    if (statusTab === 'all') return orders
    if (statusTab === 'pending') return orders.filter((o) => o.status === 'pending')
    if (statusTab === 'cancelled') return orders.filter((o) => o.status === 'cancelled')
    if (statusTab === 'shipping') return []
    if (statusTab === 'completed') return orders.filter((o) => o.status === 'confirmed')
    return orders
  }, [orders, statusTab])

  const initials = `${user?.email?.[0] || user?.phone?.[0] || 'U'}${user?.email?.[1] || ''}`.toUpperCase()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-page text-ink">
        Đang tải...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-svh bg-page font-sans text-ink">
      <Header
        searchQuery={search}
        onSearchQueryChange={setSearch}
        brandFilter={brandFilter}
        onBrandFilterChange={setBrandFilter}
      />
      <main className="mx-auto max-w-[1050px] px-4 py-6 md:py-8">
        <div className="rounded-2xl border border-gray-200 bg-[#F9FAFB] p-3 md:p-5">
          <div className="grid gap-4 md:grid-cols-[200px_1fr]">
          <aside className="rounded-xl border border-gray-200 bg-white p-2">
            <div className="flex gap-2 overflow-x-auto md:block">
              <button
                type="button"
                onClick={() => setSection('profile')}
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg border-l-2 px-3 py-2 text-sm font-semibold ${section === 'profile' ? 'border-brand bg-red-50 text-brand' : 'border-transparent text-gray-700 hover:bg-gray-100'}`}
              >
                <User className="size-4" />
                Hồ sơ
              </button>
              <button
                id="orders"
                type="button"
                onClick={() => setSection('orders')}
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg border-l-2 px-3 py-2 text-sm font-semibold ${section === 'orders' ? 'border-brand bg-red-50 text-brand' : 'border-transparent text-gray-700 hover:bg-gray-100'}`}
              >
                <ShoppingBag className="size-4" />
                Đơn mua
              </button>
              <button
                type="button"
                onClick={() => setSection('password')}
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg border-l-2 px-3 py-2 text-sm font-semibold ${section === 'password' ? 'border-brand bg-red-50 text-brand' : 'border-transparent text-gray-700 hover:bg-gray-100'}`}
              >
                <KeyRound className="size-4" />
                Đổi mật khẩu
              </button>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-bold"
            >
              Đăng xuất
            </button>
          </aside>

          <section className="min-w-0 rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.05)] md:p-8">
            {section === 'profile' ? (
              <>
                <h1 className="text-xl font-extrabold">Thông tin tài khoản</h1>
                <div className="mt-4 rounded-xl border border-gray-100 bg-page/60 p-5">
                  <div className="mb-4 flex justify-end">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                    >
                      <PencilLine className="size-4" />
                      Edit
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-extrabold text-white">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="truncate font-semibold">{user.email || '—'}</p>
                      <p className="mt-1 text-sm text-gray-500">SĐT</p>
                      <p className="font-semibold">{user.phone || '—'}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            {section === 'orders' ? (
              <>
                <h2 className="text-xl font-extrabold">Đơn mua của tôi</h2>
                <div className="mt-4 flex gap-2 overflow-x-auto">
                  {statusTabs.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setStatusTab(t.id)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${statusTab === t.id ? 'bg-brand text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                {ordLoading ? (
                  <p className="mt-4 text-sm text-gray-500">Đang tải...</p>
                ) : filteredOrders.length === 0 ? (
                  <p className="mt-4 text-sm text-gray-600">
                    Chưa có đơn ở trạng thái này.{' '}
                    <Link to="/" className="font-bold text-brand">
                      Mua sắm
                    </Link>
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {filteredOrders.map((o) => (
                      <li
                        key={o._id}
                        className="rounded-xl border border-gray-200 bg-white p-4 text-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-xs text-gray-500">
                            Mã đơn: #{String(o._id).slice(-8)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(o.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <div className="mt-3 space-y-2">
                          {o.items?.slice(0, 3).map((it, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="size-10 overflow-hidden rounded border border-gray-200 bg-gray-100">
                                {it.image ? (
                                  <img src={it.image} alt="" className="h-full w-full object-cover" />
                                ) : null}
                              </div>
                              <p className="line-clamp-1 text-gray-700">
                                {it.name} {it.variantLabel ? `(${it.variantLabel})` : ''} × {it.quantity}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                          <p className="font-bold text-brand">{formatVnd(o.totalAmount)}</p>
                          <button
                            type="button"
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-bold hover:bg-gray-50"
                          >
                            Xem chi tiết
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : null}

            {section === 'password' ? (
              <>
                <h2 className="text-xl font-extrabold">Đổi mật khẩu</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Tính năng đang được cập nhật.
                </p>
              </>
            ) : null}
          </section>
        </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
