import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
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
      <main className="mx-auto max-w-[900px] px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold">Tài khoản</h1>
          <button
            type="button"
            onClick={() => logout()}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold"
          >
            Đăng xuất
          </button>
        </div>
        {user ? (
          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 text-sm">
            <p>
              <span className="text-gray-500">Email:</span>{' '}
              {user.email || '—'}
            </p>
            <p className="mt-1">
              <span className="text-gray-500">SĐT:</span> {user.phone || '—'}
            </p>
          </div>
        ) : null}

        <h2 className="mt-8 text-lg font-extrabold">Lịch sử đơn hàng</h2>
        {ordLoading ? (
          <p className="mt-2 text-sm text-gray-500">Đang tải...</p>
        ) : orders.length === 0 ? (
          <p className="mt-2 text-sm text-gray-600">
            Chưa có đơn.{' '}
            <Link to="/" className="font-bold text-brand">
              Mua sắm
            </Link>
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {orders.map((o) => (
              <li
                key={o._id}
                className="rounded-lg border border-gray-200 bg-white p-4 text-sm"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-mono text-xs text-gray-500">
                    #{String(o._id).slice(-8)}
                  </span>
                  <span
                    className={`font-bold uppercase ${
                      o.status === 'pending'
                        ? 'text-amber-600'
                        : o.status === 'confirmed'
                          ? 'text-green-600'
                          : 'text-gray-500'
                    }`}
                  >
                    {o.status}
                  </span>
                </div>
                <p className="mt-2 font-bold text-brand">
                  {formatVnd(o.totalAmount)}
                </p>
                <ul className="mt-2 space-y-1 text-gray-700">
                  {o.items?.map((it, i) => (
                    <li key={i}>
                      {it.name}{' '}
                      {it.variantLabel ? `(${it.variantLabel})` : ''} ×{' '}
                      {it.quantity}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-gray-500">
                  {new Date(o.createdAt).toLocaleString('vi-VN')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
