import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Menu,
  Search,
  X,
  ChevronDown,
  ClipboardList,
  User,
  ShoppingBag,
  LogOut,
  ShoppingCart,
} from 'lucide-react'
import { BRANDS } from '../data/products'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import { normalizeSearch } from '../utils/string'

const BRAND_OPTIONS = [
  BRANDS.all,
  BRANDS.vespa,
  BRANDS.honda,
  BRANDS.yamaha,
  BRANDS.piaggio,
]

export function Header({
  searchQuery,
  onSearchQueryChange,
  brandFilter,
  onBrandFilterChange,
}) {
  const { totalQuantity } = useCart()
  const { user, isAdmin, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
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
  const dropdownRef = useRef(null)
  const desktopMenuRef = useRef(null)
  const profileRef = useRef(null)
  const searchTimerRef = useRef(null)
  const prevCartCountRef = useRef(totalQuantity)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
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

  const selectedLabel =
    BRAND_OPTIONS.find((b) => b.id === brandFilter)?.label ?? 'Tất cả'

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
      <div className="bg-brand px-4 py-1 text-[11px] font-medium text-white/90 xl:px-10">
        <div className="mx-auto w-full max-w-[1600px] text-center sm:text-left">
          <span className="hidden sm:inline">
            Miễn phí vận chuyển đơn từ 500k · Hàng chính hãng · Hỗ trợ Zalo 24/7
          </span>
          <span className="sm:hidden">Hỗ trợ Zalo 24/7 · Giao nhanh toàn quốc</span>
        </div>
      </div>

      <div className="bg-brand px-4 py-3 xl:px-10">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
          <div className="flex shrink-0 items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 no-underline">
              <img
                src="/logo.jpg"
                alt="Thai Vũ"
                className="h-12 w-auto max-w-[120px] object-contain"
              />
              <span className="hidden text-left leading-tight text-white sm:block">
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/90">
                  Thai Vũ
                </span>
                <span className="block max-w-[220px] text-xs font-bold uppercase leading-snug">
                  Phụ kiện Vespa chuyên nghiệp
                </span>
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="ml-auto flex items-center gap-1.5 rounded-md border border-white/30 px-2.5 py-2 text-xs font-bold uppercase text-white lg:hidden"
              aria-label="Mở menu"
            >
              {mobileMenuOpen ? (
                <X className="size-5" strokeWidth={2.5} />
              ) : (
                <Menu className="size-5" strokeWidth={2.5} />
              )}
              Menu
            </button>
            <button
              type="button"
              onClick={() => setMobileSearchOpen((v) => !v)}
              className="rounded-md border border-white/30 p-2 text-white lg:hidden"
              aria-label="Mở tìm kiếm"
            >
              <Search className="size-5" />
            </button>
          </div>

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

            <div className="relative flex min-w-0 flex-1">
              <div className="relative z-10 flex w-full items-stretch rounded-full bg-white shadow-sm ring-1 ring-black/5">
                <div className="relative shrink-0" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen((o) => !o)}
                    className="flex h-11 items-center gap-0.5 rounded-l-full border-r border-gray-200 bg-white pl-3 pr-2 text-sm font-semibold text-brand sm:h-12 sm:pl-4 sm:pr-3"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="listbox"
                  >
                    <span className="max-w-[4.5rem] truncate sm:max-w-none">
                      {selectedLabel}
                    </span>
                    <ChevronDown
                      className={`size-4 shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {dropdownOpen && (
                    <ul
                      className="absolute left-0 top-full z-20 mt-1 min-w-[160px] rounded-lg border border-gray-100 bg-white py-1 shadow-lg"
                      role="listbox"
                    >
                      {BRAND_OPTIONS.map((b) => (
                        <li key={b.id} role="option">
                          <button
                            type="button"
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${brandFilter === b.id ? 'font-semibold text-brand' : 'text-gray-800'}`}
                            onClick={() => {
                              onBrandFilterChange(b.id)
                              setDropdownOpen(false)
                            }}
                          >
                            {b.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm, thương hiệu..."
                  className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2 text-sm text-ink placeholder:text-gray-400 focus:outline-none focus:ring-0 sm:px-3"
                  aria-label="Tìm kiếm sản phẩm"
                />
                <button
                  type="button"
                  className="flex shrink-0 items-center justify-center rounded-r-full px-3 sm:px-4"
                  aria-label="Tìm kiếm"
                >
                  <Search className="size-5 text-ink" strokeWidth={2.25} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
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
                className="hidden items-center gap-2 rounded-full bg-brand-dark px-3 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-black/20 sm:flex sm:px-4"
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
                  className="inline-flex items-center justify-center rounded-full p-2 text-white transition hover:bg-white/10"
                  aria-label="Tài khoản"
                  aria-expanded={profileMenuOpen}
                >
                  <User className="size-6" strokeWidth={2} />
                </button>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-full p-2 text-white transition hover:bg-white/10"
                  aria-label="Đăng nhập"
                >
                  <User className="size-6" strokeWidth={2} />
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
                className="hidden rounded-md border border-white/40 px-2 py-1 text-[10px] font-extrabold uppercase text-white sm:inline"
              >
                Admin
              </Link>
            ) : null}
            {!isAdmin ? (
              <Link
                to="/cart"
                className={`relative rounded-full p-2 text-white transition hover:bg-white/10 ${cartBump ? 'scale-110 bg-white/15' : ''}`}
                aria-label={`Giỏ hàng${cartCount ? `, ${cartCount} sản phẩm` : ''}`}
              >
                <ShoppingCart className="size-6" strokeWidth={2} />
                {cartCount > 0 && (
                  <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-brand">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            ) : null}
          </div>
        </div>

        {mobileSearchOpen ? (
          <div className="mt-2 lg:hidden">
            <div className="flex w-full items-stretch rounded-full bg-white shadow-sm ring-1 ring-black/5">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="Tìm sản phẩm..."
                className="min-w-0 flex-1 rounded-l-full border-0 bg-transparent px-4 py-2.5 text-sm text-ink placeholder:text-gray-400 focus:outline-none"
                aria-label="Tìm kiếm sản phẩm"
              />
              <button
                type="button"
                className="flex shrink-0 items-center justify-center rounded-r-full px-4"
                aria-label="Tìm kiếm"
              >
                <Search className="size-5 text-ink" />
              </button>
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

        {!isAdmin ? (
          <Link
            to={user ? '/profile#orders' : '/login'}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-brand-dark py-2.5 text-xs font-bold text-white sm:hidden"
          >
            <span aria-hidden>📝</span>
            Tra cứu đơn hàng
          </Link>
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
      {!isAdmin ? (
        <Link
          to="/cart"
          className="fixed bottom-4 right-4 z-50 rounded-full bg-brand p-3 text-white shadow-lg lg:hidden"
          aria-label="Giỏ hàng nổi"
        >
          <ShoppingCart className="size-6" />
        </Link>
      ) : null}
    </header>
  )
}
