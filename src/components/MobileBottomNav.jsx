import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MessageCircle, Phone, MessagesSquare, X } from 'lucide-react'
import { SHOP_INFO, SHOP_ZALO_URL } from '../data/products'

/**
 * Thanh điều hướng dưới cùng cho mobile — màu brand, icon trắng.
 * 4 vị trí: Gọi · Chat (mở khung liên hệ nội bộ) · Zalo (nổi bật giữa) · Facebook/Messenger.
 *
 * Ẩn ở route admin và trên ≥ lg (đã có FloatingContactRails / desktop nav).
 */
export function MobileBottomNav() {
  const { pathname } = useLocation()
  const [chatOpen, setChatOpen] = useState(false)

  useEffect(() => {
    if (!chatOpen) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setChatOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [chatOpen])

  if (pathname.startsWith('/admin')) return null

  const phoneHref = `tel:${String(SHOP_INFO.hotline || '').replace(/\s/g, '')}`
  const zaloHref = `${SHOP_ZALO_URL}${SHOP_ZALO_URL.includes('?') ? '&' : '?'}text=${encodeURIComponent(
    `[Thai Vũ] Xin chào ${SHOP_INFO.contactPerson}`,
  )}`
  const fbHref = SHOP_INFO.facebookUrl

  return (
    <>
      <nav
        aria-label="Liên hệ nhanh"
        className="fixed inset-x-0 bottom-0 z-[60] flex h-[72px] items-end justify-between bg-brand pb-[max(env(safe-area-inset-bottom),0.5rem)] pl-2 pr-2 text-white shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.35)] lg:hidden"
      >
        <a
          href={phoneHref}
          className="flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-bold uppercase tracking-wide text-white/95"
          aria-label={`Gọi ${SHOP_INFO.hotlineDisplay}`}
        >
          <Phone className="size-6" strokeWidth={2.1} />
          <span className="leading-none">Gọi</span>
        </a>
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-bold uppercase tracking-wide text-white/95"
          aria-label="Mở khung chat"
        >
          <MessagesSquare className="size-6" strokeWidth={2.1} />
          <span className="leading-none">Chat</span>
        </button>

        <a
          href={zaloHref}
          target="_blank"
          rel="noopener noreferrer"
          className="-mt-7 flex size-16 flex-col items-center justify-center rounded-full bg-[#0068ff] text-white shadow-lg ring-4 ring-brand transition active:scale-95"
          aria-label={`Chat Zalo ${SHOP_INFO.hotlineDisplay}`}
          title={`Zalo ${SHOP_INFO.hotlineDisplay} — ${SHOP_INFO.contactPerson}`}
        >
          <MessageCircle className="size-7" strokeWidth={2.2} />
          <span className="text-[9px] font-extrabold leading-none">ZALO</span>
        </a>

        <a
          href={fbHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-bold uppercase tracking-wide text-white/95"
          aria-label="Mở Facebook cửa hàng"
        >
          <svg className="size-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span className="leading-none">Facebook</span>
        </a>
        <a
          href={fbHref}
          target="_blank"
          rel="noopener noreferrer"
          className="sr-only"
          aria-hidden
        >
          Facebook
        </a>
      </nav>

      {chatOpen ? (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 sm:items-center" role="dialog" aria-modal="true" aria-label="Khung liên hệ nhanh">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setChatOpen(false)}
            aria-label="Đóng"
          />
          <div className="relative z-10 w-full max-w-md rounded-t-2xl border border-gray-200 bg-white p-5 shadow-xl sm:rounded-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-extrabold text-ink">Liên hệ Thai Vũ</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Chúng tôi phản hồi nhanh nhất qua Zalo / Messenger.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="flex size-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100"
                aria-label="Đóng"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-4 grid gap-2">
              <a
                href={zaloHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setChatOpen(false)}
                className="flex items-center gap-3 rounded-xl border border-[#0068ff]/30 bg-[#0068ff]/5 p-3 text-sm font-bold text-[#0068ff] hover:bg-[#0068ff]/10"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-[#0068ff] text-white">
                  <MessageCircle className="size-5" />
                </span>
                Chat Zalo · {SHOP_INFO.hotlineDisplay}
              </a>
              <a
                href={fbHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setChatOpen(false)}
                className="flex items-center gap-3 rounded-xl border border-[#1877f2]/30 bg-[#1877f2]/5 p-3 text-sm font-bold text-[#1877f2] hover:bg-[#1877f2]/10"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-[#1877f2] text-white">
                  <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </span>
                Messenger · Facebook
              </a>
              <a
                href={phoneHref}
                onClick={() => setChatOpen(false)}
                className="flex items-center gap-3 rounded-xl border border-brand/30 bg-brand/5 p-3 text-sm font-bold text-brand hover:bg-brand/10"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-brand text-white">
                  <Phone className="size-5" />
                </span>
                Gọi {SHOP_INFO.hotlineDisplay}
              </a>
              <Link
                to="/profile#orders"
                onClick={() => setChatOpen(false)}
                className="block rounded-xl border border-gray-200 bg-gray-50 p-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                Tra cứu đơn hàng của tôi
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
