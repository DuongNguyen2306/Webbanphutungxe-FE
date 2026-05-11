import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileCategorySel, setMobileCategorySel] = useState('')
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

  function goCategory(categoryId) {
    const id = String(categoryId || '').trim()
    if (!id) {
      navigate('/shop')
      return
    }
    navigate(`/shop?categoryId=${encodeURIComponent(id)}`)
  }

  /**
   * Dropdown kết quả tìm kiếm — dùng chung cho cả Mobile và Desktop.
   * Không truyền `src=""` cho <img> để tránh cảnh báo "empty string" và
   * tránh trình duyệt request lại toàn bộ trang.
   */
  const searchDropdown =
    searchOpen && q ? (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        className="rounded-xl border border-gray-200 bg-white p-2 text-ink shadow-xl"
        role="listbox"
        aria-label="Kết quả tìm kiếm"
      >
        {searchLoading ? (
          <p className="px-2 py-3 text-sm text-gray-500">Đang tìm...</p>
        ) : searchError ? (
          <p className="px-2 py-3 text-sm text-red-600">{searchError}</p>
        ) : searchResults.length ? (
          <ul className="space-y-1">
            {searchResults.map((p) => {
              const thumb = p.images?.[0] || p.image || ''
              return (
                <li key={p._id}>
                  <Link
                    to={`/product/${p._id}`}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-50"
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt=""
                        className="size-10 rounded object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span
                        className="flex size-10 shrink-0 items-center justify-center rounded bg-gray-100 text-[10px] font-semibold text-gray-400"
                        aria-hidden
                      >
                        IMG
                      </span>
                    )}
                    <span className="line-clamp-2 text-sm font-medium text-gray-800">
                      {p.name}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="px-2 py-3 text-sm text-gray-500">Không có kết quả.</p>
        )}
      </motion.div>
    ) : null

  return (
    <header className="sticky top-0 z-50 shadow-md">
      <div className="bg-brand px-3 py-0.5 text-[10px] font-medium text-white/90 sm:px-4 sm:py-1 sm:text-[11px] xl:px-10">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-center gap-2 text-center sm:justify-between sm:text-left">
          <span className="hidden sm:inline">
            Giao hàng toàn quốc · Hàng chính hãng · Tư vấn Zalo nhanh
          </span>
          <span className="sm:hidden">Giao toàn quốc · Tư vấn Zalo nhanh</span>
        </div>
      </div>

      {/* MOBILE — 2 tầng (Brand Bar + Search/Chips). Sang lg dùng layout desktop bên dưới. */}
      <div className="bg-brand/95 text-white shadow-sm backdrop-blur supports-[backdrop-filter]:bg-brand/85 lg:hidden">
        <div className="relative flex h-12 items-center justify-between px-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="inline-flex size-9 items-center justify-center rounded-md text-white transition hover:bg-white/10"
            aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="size-5" strokeWidth={2.5} />
            ) : (
              <Menu className="size-5" strokeWidth={2.5} />
            )}
          </button>
          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2 no-underline"
            aria-label="Thai Vũ — Trang chủ"
          >
            <img
              src="/logo.jpg"
              alt="Thai Vũ"
              className="h-6 w-auto max-w-[44px] object-contain"
            />
          </Link>
          <div className="flex items-center gap-1">
            {isAdmin ? (
              <Link
                to="/admin"
                className="inline-flex items-center rounded-md border border-white/40 px-1.5 py-1 text-[9px] font-extrabold uppercase leading-none text-white"
              >
                Admin
              </Link>
            ) : null}
            {!isAdmin ? (
              <Link
                to="/cart"
                className={`relative inline-flex size-9 items-center justify-center rounded-full text-white transition hover:bg-white/10 ${cartBump ? 'scale-110 bg-white/15' : ''}`}
                aria-label={`Giỏ hàng${cartCount ? `, ${cartCount} sản phẩm` : ''}`}
              >
                <ShoppingCart className="size-5" strokeWidth={2} />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-brand">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="px-2 pb-2">
          <div className="flex h-10 w-full items-stretch overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-black/5">
            <label className="sr-only" htmlFor="mobile-category-select">
              Danh mục
            </label>
            <select
              id="mobile-category-select"
              value={mobileCategorySel}
              onChange={(e) => {
                const v = e.target.value
                setMobileCategorySel(v)
                goCategory(v)
              }}
              className="h-full w-28 shrink-0 truncate border-0 bg-transparent pl-3 pr-1 text-[12px] font-semibold text-gray-700 focus:outline-none sm:w-32"
            >
              <option value="">Tất cả</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {String(c.name)}
                </option>
              ))}
            </select>
            <span className="my-2 w-px shrink-0 bg-gray-200" aria-hidden />
            <span className="flex items-center pl-2 text-gray-400" aria-hidden>
              <Search className="size-4" strokeWidth={2.25} />
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Tìm phụ tùng…"
              className="h-full min-w-0 flex-1 border-0 bg-transparent pl-2 pr-3 text-sm text-ink placeholder:text-gray-400 focus:outline-none focus:ring-0"
              aria-label="Tìm kiếm sản phẩm"
            />
          </div>

          <AnimatePresence>
            {searchDropdown ? (
              <div className="relative z-40 mt-2">{searchDropdown}</div>
            ) : null}
          </AnimatePresence>

          {categories.length ? (
            <div className="scrollbar-hide -mx-2 mt-2 hidden gap-1.5 overflow-x-auto px-2 pb-0.5 md:flex">
              <button
                type="button"
                onClick={() => goCategory('')}
                className="shrink-0 rounded-full border border-white/40 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white"
              >
                Tất cả
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => goCategory(c.id)}
                  className="shrink-0 whitespace-nowrap rounded-full border border-white/40 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white"
                >
                  {c.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {mobileMenuOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16 }}
            className="border-t border-white/15 bg-brand-dark/90 px-2 py-2 text-white"
          >
            <div className="grid gap-1">
              <Link to="/gioi-thieu" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10">
                Giới thiệu
              </Link>
              <Link to="/huong-dan" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10">
                Hướng dẫn
              </Link>
              <Link to="/tin-tuc" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10">
                Tin tức
              </Link>
              <Link to={user ? '/profile#orders' : '/login'} onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10">
                Tra cứu đơn hàng
              </Link>
              <Link to={user ? '/profile' : '/login'} onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10">
                Thông tin tài khoản
              </Link>
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    logout()
                  }}
                  className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-white/90 hover:bg-white/10"
                >
                  Đăng xuất
                </button>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </div>

      {/* DESKTOP bar */}
      <div className="hidden bg-brand px-2 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-brand/95 sm:px-4 sm:py-2 lg:block lg:py-3 xl:px-10">
        <div className="mx-auto flex w-full max-w-[1600px] flex-row flex-nowrap items-center gap-1.5 sm:gap-2 lg:gap-4">
          <Link to="/" className="flex shrink-0 items-center gap-2 no-underline lg:gap-3">
            <img
              src="/logo.jpg"
              alt="Thai Vũ"
              className="h-9 w-auto max-w-[80px] object-contain lg:h-12 lg:max-w-[120px]"
            />
            <span className="hidden max-w-[200px] text-left leading-tight text-white lg:block">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/90">
                Thai Vũ
              </span>
              <span className="block text-xs font-bold uppercase leading-snug">
                Phụ kiện Thái Vũ
              </span>
            </span>
          </Link>

          <div className="relative hidden shrink-0 lg:block" ref={desktopMenuRef}>
            <button
              type="button"
              onClick={() => setDesktopMenuOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/30 px-3 py-2.5 text-xs font-bold uppercase text-white"
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

          <div className="relative z-10 hidden min-w-0 flex-1 lg:block">
            <div className="flex w-full items-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-black/5">
              <span className="flex shrink-0 items-center pl-3.5 text-gray-400" aria-hidden>
                <Search className="size-5" strokeWidth={2.25} />
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="Tìm tên phụ tùng, xe tương thích…"
                className="h-12 min-w-0 flex-1 border-0 bg-transparent py-2 pl-2.5 pr-4 text-[15px] text-ink placeholder:text-gray-400 focus:outline-none focus:ring-0"
                aria-label="Tìm kiếm sản phẩm"
              />
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center justify-end gap-2 lg:gap-3">
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
            <Link
              to="/tin-tuc"
              className="hidden rounded-full border border-white/30 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-white transition hover:bg-white/10 xl:inline-flex"
            >
              Tin tức
            </Link>
            {!isAdmin ? (
              <Link
                to={user ? '/profile#orders' : '/login'}
                className="hidden items-center gap-2 rounded-full bg-brand-dark px-3 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-black/20 lg:inline-flex lg:px-4"
              >
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
                  className="inline-flex size-9 items-center justify-center rounded-full text-white transition hover:bg-white/10 sm:size-10"
                  aria-label="Tài khoản"
                  aria-expanded={profileMenuOpen}
                >
                  <User className="size-5 sm:size-6" strokeWidth={2} />
                </button>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex size-9 items-center justify-center rounded-full text-white transition hover:bg-white/10 sm:size-10"
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
                className={`relative inline-flex size-10 items-center justify-center rounded-full text-white transition hover:bg-white/10 ${cartBump ? 'scale-110 bg-white/15' : ''}`}
                aria-label={`Giỏ hàng${cartCount ? `, ${cartCount} sản phẩm` : ''}`}
              >
                <ShoppingCart className="size-6" strokeWidth={2} />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-brand">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            ) : null}
          </div>
        </div>

        <AnimatePresence>
          {searchDropdown ? (
            <div className="relative z-40 mt-2">{searchDropdown}</div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  )
}
