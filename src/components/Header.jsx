import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Menu,
  Search,
  X,
  ClipboardList,
  User,
  ShoppingBag,
  LogOut,
  ShoppingCart,
} from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import { normalizeSearch } from '../utils/string'

export function Header({ searchQuery, onSearchQueryChange }) {
  const { totalQuantity } = useCart()
  const { user, isAdmin, logout } = useAuth()
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [categories, setCategories] = useState([])
  const [cartBump, setCartBump] = useState(false)
  const desktopMenuRef = useRef(null)
  const profileRef = useRef(null)
  const searchTimerRef = useRef(null)
  const prevCartCountRef = useRef(totalQuantity)

  useEffect(() => {
    function handleClickOutside(e) {
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(e.target)) {
        setDesktopMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleProfileOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleProfileOutside)
    return () => document.removeEventListener('mousedown', handleProfileOutside)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await api.get('/api/categories')
        if (cancelled) return
        const rawList = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.categories)
              ? data.categories
              : []
        const normalized = rawList
          .map((item) => ({
            id: String(item?._id || item?.id || ''),
            name: String(item?.name || '').trim(),
          }))
          .filter((item) => item.id && item.name)
        setCategories(normalized)
      } catch {
        if (!cancelled) setCategories([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const cartCount = totalQuantity
  const q = searchQuery?.trim() || ''

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    if (!q) {
      setSearchResults([])
      setSearchOpen(false)
      setSearchLoading(false)
      setSearchError('')
      return
    }
    searchOpen || setSearchOpen(true)
    setSearchLoading(true)
    setSearchError('')
    searchTimerRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get('/api/products')
        const rawList = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
            ? data.products
            : Array.isArray(data?.items)
              ? data.items
              : []
        const nq = normalizeSearch(q)
        const matched = rawList
          .filter((p) => {
            const fields = [
              p.name,
              p.description,
              p.category?.name,
              ...(Array.isArray(p.tags) ? p.tags : []),
              ...(Array.isArray(p.compatibleVehicles) ? p.compatibleVehicles : []),
            ]
            const blob = normalizeSearch(fields.map((x) => String(x || '')).join(' '))
            return blob.includes(nq)
          })
          .slice(0, 8)
        setSearchResults(matched)
      } catch (err) {
        setSearchResults([])
        setSearchError(err.response?.data?.message || 'Lỗi tìm kiếm.')
      } finally {
        setSearchLoading(false)
      }
    }, 300)
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [q])

  useEffect(() => {
    const prevCount = Number(prevCartCountRef.current || 0)
    const nextCount = Number(totalQuantity || 0)
    if (nextCount > prevCount) {
      setCartBump(true)
      const timer = setTimeout(() => setCartBump(false), 260)
      prevCartCountRef.current = nextCount
      return () => clearTimeout(timer)
    }
    prevCartCountRef.current = nextCount
    return undefined
  }, [totalQuantity])

  return (
    <header className="sticky top-0 z-50 shadow-md">
      <div className="bg-brand px-3 py-0.5 text-[10px] font-medium text-white/90 sm:px-4 sm:py-1 sm:text-[11px] xl:px-10">
        <div className="mx-auto w-full max-w-[1600px] text-center sm:text-left">
          <span className="hidden sm:inline">
            Giao hàng toàn quốc · Hàng chính hãng · Tư vấn Zalo nhanh
          </span>
          <span className="sm:hidden">Giao toàn quốc · Tư vấn Zalo nhanh</span>
        </div>
      </div>

      <div className="bg-brand px-3 py-2 sm:px-4 lg:px-4 lg:py-3 xl:px-10">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 lg:flex-row lg:items-center lg:gap-4">
          <div className="flex min-w-0 w-full items-center gap-2">
            <Link to="/" className="flex shrink-0 items-center gap-2 no-underline lg:gap-3">
              <img
                src="/logo.jpg"
                alt="Thai Vũ"
                className="h-9 w-auto max-w-[88px] object-contain sm:h-10 sm:max-w-[100px] lg:h-12 lg:max-w-[120px]"
              />
              <span className="hidden max-w-[200px] text-left leading-tight text-white lg:block">
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/90">
                  Thai Vũ
                </span>
                <span className="block text-xs font-bold uppercase leading-snug">
                  Phụ kiện Vespa chuyên nghiệp
                </span>
              </span>
            </Link>

            <div className="hidden min-w-0 flex-1 items-center gap-2 lg:flex">
            <div className="relative hidden lg:block" ref={desktopMenuRef}>
              <button
                type="button"
                onClick={() => setDesktopMenuOpen((v) => !v)}
                className="hidden shrink-0 items-center gap-1.5 rounded-md border border-white/30 px-3 py-2.5 text-xs font-bold uppercase text-white lg:flex"
                aria-label="Danh mục"
                aria-expanded={desktopMenuOpen}
              >
                <Menu className="size-5" strokeWidth={2.5} />
                Menu
              </button>
              {desktopMenuOpen ? (
                <div className="absolute left-0 top-full z-30 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
                  <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                    Danh mục sản phẩm
                  </p>
                  <Link
                    to="/shop"
                    onClick={() => setDesktopMenuOpen(false)}
                    className="block w-full rounded-lg px-2 py-2 text-left text-sm font-semibold text-gray-800 transition hover:bg-gray-50 hover:text-brand"
                  >
                    Tất cả
                  </Link>
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      to={`/shop?categoryId=${encodeURIComponent(category.id)}`}
                      onClick={() => setDesktopMenuOpen(false)}
                      className="block w-full rounded-lg px-2 py-2 text-left text-sm font-medium text-gray-800 transition hover:bg-gray-50 hover:text-brand"
                    >
                      {category.name}
                    </Link>
                  ))}
                  <div className="my-1 border-t border-gray-100" />
                  <Link
                    to={user ? '/profile#orders' : '/login'}
                    onClick={() => setDesktopMenuOpen(false)}
                    className="block rounded-lg px-2 py-2 text-sm font-semibold text-brand hover:bg-red-50"
                  >
                    Tra cứu đơn hàng
                  </Link>
                </div>
              ) : null}
            </div>

            <div className="relative z-10 min-w-0 flex-1">
              <div className="flex w-full items-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-black/5">
                <span className="flex shrink-0 items-center pl-3 text-gray-400 sm:pl-3.5" aria-hidden>
                  <Search className="size-5" strokeWidth={2.25} />
                </span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  placeholder="Tìm tên phụ tùng, xe tương thích…"
                  className="h-11 min-w-0 flex-1 border-0 bg-transparent py-2 pl-2 pr-3 text-sm text-ink placeholder:text-gray-400 focus:outline-none focus:ring-0 sm:h-12 sm:pl-2.5 sm:pr-4 sm:text-[15px]"
                  aria-label="Tìm kiếm sản phẩm"
                />
              </div>
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center justify-end gap-0.5 sm:gap-2 lg:ml-0 lg:gap-3">
            {!isAdmin ? (
              <Link
                to={user ? '/profile#orders' : '/login'}
                className="inline-flex rounded-md border border-white/35 p-2 text-white lg:hidden"
                aria-label="Tra cứu đơn hàng"
              >
                <ClipboardList className="size-[18px] sm:size-5" strokeWidth={2.25} />
              </Link>
            ) : null}
            {isAdmin ? (
              <Link
                to="/admin"
                className="inline-flex rounded-md border border-white/40 px-2 py-1.5 text-[9px] font-extrabold uppercase leading-none text-white lg:hidden"
              >
                Admin
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="inline-flex rounded-md border border-white/35 p-2 text-white lg:hidden"
              aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
            >
              {mobileMenuOpen ? (
                <X className="size-5" strokeWidth={2.5} />
              ) : (
                <Menu className="size-5" strokeWidth={2.5} />
              )}
            </button>
            <button
              type="button"
              onClick={() => setMobileSearchOpen((v) => !v)}
              className="inline-flex rounded-md border border-white/35 p-2 text-white lg:hidden"
              aria-label="Mở tìm kiếm"
            >
              <Search className="size-5" strokeWidth={2.25} />
            </button>
            <Link
              to="/gioi-thieu"
              className="hidden rounded-full border border-white/30 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-white transition hover:bg-white/10 xl:inline-flex"
            >
              Giới thiệu
            </Link>
            <Link
              to="/huong-dan"
              className="hidden rounded-full border border-white/30 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-white transition hover:bg-white/10 xl:inline-flex"
            >
              Hướng dẫn
            </Link>
            {!isAdmin ? (
              <Link
                to={user ? '/profile#orders' : '/login'}
                className="hidden items-center gap-2 rounded-full bg-brand-dark px-3 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-black/20 lg:inline-flex lg:px-4"
              >
                <span aria-hidden>📝</span>
                <ClipboardList className="size-4 opacity-90" />
                <span className="whitespace-nowrap">Tra cứu đơn hàng</span>
              </Link>
            ) : null}
            <div
              className="relative"
              ref={profileRef}
              onMouseEnter={() => user && setProfileMenuOpen(true)}
              onMouseLeave={() => user && setProfileMenuOpen(false)}
            >
              {user ? (
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((v) => !v)}
                  className="inline-flex items-center justify-center rounded-full p-1.5 text-white transition hover:bg-white/10 sm:p-2"
                  aria-label="Tài khoản"
                  aria-expanded={profileMenuOpen}
                >
                  <User className="size-5 sm:size-6" strokeWidth={2} />
                </button>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-full p-1.5 text-white transition hover:bg-white/10 sm:p-2"
                  aria-label="Đăng nhập"
                >
                  <User className="size-5 sm:size-6" strokeWidth={2} />
                </Link>
              )}
              <AnimatePresence>
              {user && profileMenuOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  className="absolute right-0 z-30 mt-2 w-56 rounded-xl border border-gray-200 bg-white py-1 shadow-xl"
                >
                  <Link
                    to="/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <User className="size-4" />
                    Thông tin tài khoản
                  </Link>
                  {!isAdmin ? (
                    <Link
                      to="/profile#orders"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <ShoppingBag className="size-4" />
                      Đơn mua của tôi
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false)
                      logout()
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-brand hover:bg-red-50"
                  >
                    <LogOut className="size-4" />
                    Đăng xuất
                  </button>
                </motion.div>
              ) : null}
              </AnimatePresence>
            </div>
            {isAdmin ? (
              <Link
                to="/admin"
                className="hidden rounded-md border border-white/40 px-2 py-1 text-[10px] font-extrabold uppercase text-white lg:inline"
              >
                Admin
              </Link>
            ) : null}
            {!isAdmin ? (
              <Link
                to="/cart"
                className={`relative rounded-full p-1.5 text-white transition hover:bg-white/10 sm:p-2 ${cartBump ? 'scale-110 bg-white/15' : ''}`}
                aria-label={`Giỏ hàng${cartCount ? `, ${cartCount} sản phẩm` : ''}`}
              >
                <ShoppingCart className="size-5 sm:size-6" strokeWidth={2} />
                {cartCount > 0 && (
                  <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-brand">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            ) : null}
          </div>
          </div>
        </div>

        {mobileSearchOpen ? (
          <div className="mt-2 lg:hidden">
            <div className="flex w-full items-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-black/5">
              <span className="flex shrink-0 items-center pl-3 text-gray-400" aria-hidden>
                <Search className="size-5" strokeWidth={2.25} />
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="Tìm tên phụ tùng, xe tương thích…"
                className="min-w-0 flex-1 border-0 bg-transparent py-2.5 pl-2 pr-3 text-sm text-ink placeholder:text-gray-400 focus:outline-none"
                aria-label="Tìm kiếm sản phẩm"
              />
            </div>
          </div>
        ) : null}

        {mobileMenuOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16 }}
            className="mt-2 rounded-xl border border-white/20 bg-brand-dark/90 p-2 text-white lg:hidden"
          >
            <div className="grid gap-1">
              <Link to="/gioi-thieu" className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10">
                Giới thiệu
              </Link>
              <Link to="/huong-dan" className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10">
                Hướng dẫn
              </Link>
              <Link to={user ? '/profile' : '/login'} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10">
                Thông tin tài khoản
              </Link>
              <Link to={user ? '/profile#orders' : '/login'} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10">
                Đơn mua của tôi
              </Link>
              {isAdmin ? (
                <Link to="/admin" className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10">
                  Quản trị
                </Link>
              ) : null}
            </div>
          </motion.div>
        ) : null}

        <AnimatePresence>
          {searchOpen && q ? (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="relative z-40 mt-2 rounded-xl border border-gray-200 bg-white p-2 shadow-xl"
            >
              {searchLoading ? (
                <p className="px-2 py-3 text-sm text-gray-500">Đang tìm...</p>
              ) : searchError ? (
                <p className="px-2 py-3 text-sm text-red-600">{searchError}</p>
              ) : searchResults.length ? (
                <ul className="space-y-1">
                  {searchResults.map((p) => (
                    <li key={p._id}>
                      <Link
                        to={`/product/${p._id}`}
                        onClick={() => {
                          setSearchOpen(false)
                        }}
                        className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-50"
                      >
                        <img
                          src={p.images?.[0] || ''}
                          alt=""
                          className="size-10 rounded object-cover"
                        />
                        <span className="line-clamp-1 text-sm font-medium text-gray-800">
                          {p.name}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-2 py-3 text-sm text-gray-500">Không có kết quả.</p>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  )
}
