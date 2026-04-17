import { useLocation } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { SHOP_INFO, SHOP_ZALO_URL } from '../data/products'

/**
 * Nút liên hệ nổi bên phải (Zalo + Facebook). Tránh vùng nút giỏ mobile (góc phải dưới).
 */
export function FloatingContactRails() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/admin')) return null

  const zaloHref = `${SHOP_ZALO_URL}${SHOP_ZALO_URL.includes('?') ? '&' : '?'}text=${encodeURIComponent(`[Thai Vũ] Xin chào ${SHOP_INFO.contactPerson}`)}`
  const fb = SHOP_INFO.facebookUrl

  return (
    <div
      className="pointer-events-none fixed bottom-28 right-2 z-[45] flex flex-col gap-3 sm:bottom-32 sm:right-4"
      aria-label="Liên hệ nhanh"
    >
      <a
        href={zaloHref}
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto flex size-12 items-center justify-center rounded-full bg-[#0068ff] text-white shadow-lg ring-2 ring-white/90 transition hover:brightness-110"
        title={`Zalo ${SHOP_INFO.hotlineDisplay} — ${SHOP_INFO.contactPerson}`}
        aria-label="Chat Zalo"
      >
        <MessageCircle className="size-6" strokeWidth={2.2} />
      </a>
      <div>
        <a
          href={fb}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto flex size-12 items-center justify-center rounded-full bg-[#1877f2] text-white shadow-lg ring-2 ring-white/90 transition hover:brightness-110"
          title="Facebook Phụ kiện Vespa Piaggio"
          aria-label="Facebook cửa hàng"
        >
          <svg className="size-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </a>
      </div>
    </div>
  )
}
