import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Menu,
  Search,
  ChevronDown,
  ClipboardList,
  User,
  ShoppingCart,
} from 'lucide-react'
import { BRANDS } from '../data/products'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

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
  const { user, isAdmin } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedLabel =
    BRAND_OPTIONS.find((b) => b.id === brandFilter)?.label ?? 'Tất cả'

  const cartCount = totalQuantity

  return (
    <header className="sticky top-0 z-50 shadow-md">
      <div className="bg-brand px-3 py-1 text-center text-[11px] font-medium text-white/90 sm:text-left">
        <span className="hidden sm:inline">
          Miễn phí vận chuyển đơn từ 500k · Hàng chính hãng · Hỗ trợ Zalo 24/7
        </span>
        <span className="sm:hidden">Hỗ trợ Zalo 24/7 · Giao nhanh toàn quốc</span>
      </div>

      <div className="bg-brand px-3 py-3 sm:px-4 lg:px-6">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
          <div className="flex shrink-0 items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 no-underline">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-2xl font-extrabold tracking-tight text-brand">
                TV
              </span>
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
              className="ml-auto flex items-center gap-1.5 rounded-md border border-white/30 px-2.5 py-2 text-xs font-bold uppercase text-white lg:ml-0 lg:hidden"
              aria-label="Mở menu"
            >
              <Menu className="size-5" strokeWidth={2.5} />
              Menu
            </button>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              className="hidden shrink-0 items-center gap-1.5 rounded-md border border-white/30 px-3 py-2.5 text-xs font-bold uppercase text-white lg:flex"
              aria-label="Danh mục"
            >
              <Menu className="size-5" strokeWidth={2.5} />
              Menu
            </button>

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
              to="/#tra-cuu-don"
              className="hidden items-center gap-2 rounded-full bg-brand-dark px-3 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-black/20 sm:flex sm:px-4"
            >
              <span aria-hidden>📝</span>
              <ClipboardList className="size-4 opacity-90" />
              <span className="whitespace-nowrap">Tra cứu đơn hàng</span>
            </Link>
            <Link
              to={user ? '/profile' : '/login'}
              className="rounded-full p-2 text-white transition hover:bg-white/10"
              aria-label={user ? 'Tài khoản' : 'Đăng nhập'}
            >
              <User className="size-6" strokeWidth={2} />
            </Link>
            {isAdmin ? (
              <Link
                to="/admin"
                className="hidden rounded-md border border-white/40 px-2 py-1 text-[10px] font-extrabold uppercase text-white sm:inline"
              >
                Admin
              </Link>
            ) : null}
            <Link
              to="/cart"
              className="relative rounded-full p-2 text-white transition hover:bg-white/10"
              aria-label={`Giỏ hàng${cartCount ? `, ${cartCount} sản phẩm` : ''}`}
            >
              <ShoppingCart className="size-6" strokeWidth={2} />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-brand">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        <Link
          to="/#tra-cuu-don"
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-brand-dark py-2.5 text-xs font-bold text-white sm:hidden"
        >
          <span aria-hidden>📝</span>
          Tra cứu đơn hàng
        </Link>
      </div>
    </header>
  )
}
