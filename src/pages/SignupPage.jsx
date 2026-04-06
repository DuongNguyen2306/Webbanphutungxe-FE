import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { SiteFooter } from '../components/SiteFooter'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export function SignupPage() {
  const { loginWithToken } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('all')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email.trim() && !phone.trim()) {
      setError('Nhập ít nhất email hoặc SĐT.')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/register', {
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        password,
      })
      loginWithToken(data.token, data.user)
      navigate('/profile')
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh bg-page font-sans text-ink">
      <Header
        searchQuery={search}
        onSearchQueryChange={setSearch}
        brandFilter={brandFilter}
        onBrandFilterChange={setBrandFilter}
      />
      <main className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-2xl font-extrabold">Đăng ký</h1>
        <p className="mt-1 text-sm text-gray-600">
          Chỉ cần email hoặc SĐT và mật khẩu (tối thiểu 6 ký tự).
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <input
            type="email"
            placeholder="Email (tuỳ chọn)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
          />
          <input
            type="tel"
            placeholder="Số điện thoại (tuỳ chọn)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
          />
          <input
            required
            minLength={6}
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
          />
          {error ? (
            <p className="text-sm font-semibold text-brand">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand py-3 text-sm font-extrabold uppercase text-white disabled:opacity-50"
          >
            {loading ? '...' : 'Tạo tài khoản'}
          </button>
          <p className="text-center text-sm text-gray-600">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-bold text-brand">
              Đăng nhập
            </Link>
          </p>
        </form>
      </main>
      <SiteFooter />
    </div>
  )
}
