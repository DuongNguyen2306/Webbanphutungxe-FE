import { useState } from 'react'
import {
  BadgePercent,
  Mail,
  MapPin,
  Phone,
  Send,
  Truck,
} from 'lucide-react'
import { SHOP_INFO, SHOP_ZALO_URL } from '../data/products'

const supportLinks = [
  { href: '#', label: 'Hướng dẫn đặt hàng' },
  { href: '#', label: 'Chính sách đổi trả' },
  { href: '#', label: 'Bảo hành' },
]

const STORE_PREVIEW_IMAGE =
  'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=900&q=80'

export function SiteFooter() {
  const [email, setEmail] = useState('')
  const telHref = `tel:${SHOP_INFO.hotline.replace(/\s/g, '')}`
  const addressShort = '15F đường 4F, Tân Thuận, Quận 7'
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SHOP_INFO.address)}`
  const zaloHref = `${SHOP_ZALO_URL}${SHOP_ZALO_URL.includes('?') ? '&' : '?'}text=${encodeURIComponent('[Thai Vũ] Tư vấn giúp mình với nhé.')}`

  return (
    <footer className="mt-auto border-t border-zinc-800 bg-zinc-950 text-zinc-200">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:gap-10 lg:px-8">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#D4AF37]">
            Về Thai Vũ
          </h3>
          <div className="mt-4">
            <a href="/" className="inline-block text-2xl font-black tracking-tight text-white">
              Thai Vũ
            </a>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              Chuyên phụ tùng và phụ kiện Vespa Piaggio chính hãng.
              <br />
              Tư vấn nhanh, giá rõ ràng, giao hàng toàn quốc.
            </p>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <a
              href={SHOP_INFO.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-11 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100 transition hover:border-brand hover:text-brand"
              aria-label="Facebook"
            >
              Fb
            </a>
            <a
              href={zaloHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-11 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-sm font-extrabold text-zinc-100 transition hover:border-brand hover:text-brand"
              aria-label="Zalo"
            >
              Z
            </a>
            <a
              href={SHOP_INFO.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-11 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100 transition hover:border-brand hover:text-brand"
              aria-label="Instagram"
            >
              Ig
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#D4AF37]">
            Hỗ Trợ Khách Hàng
          </h3>
          <ul className="mt-4 space-y-3 text-sm">
            {supportLinks.map((item) => (
              <li key={item.label}>
                <a href={item.href} className="text-zinc-300 transition hover:text-brand">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-5 space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-200">
              <Truck className="size-4 text-brand" />
              Giao hàng toàn quốc
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-200">
              <BadgePercent className="size-4 text-brand" />
              Ưu đãi theo chương trình
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#D4AF37]">
            Liên Hệ
          </h3>
          <div className="mt-4 space-y-3 text-sm">
            <a
              href={telHref}
              className="inline-flex items-center gap-2 rounded-md bg-brand px-3 py-2 font-extrabold text-white transition hover:brightness-110"
            >
              <Phone className="size-4" />
              GỌI NGAY {SHOP_INFO.hotlineDisplay}
            </a>
            <p className="flex items-start gap-2 text-zinc-300">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
              {addressShort}
            </p>
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex text-xs font-bold uppercase tracking-wide text-[#D4AF37] hover:underline"
            >
              Mở Google Maps
            </a>
          </div>
          <a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-4 block overflow-hidden rounded-xl border border-zinc-800"
          >
            <img
              src={STORE_PREVIEW_IMAGE}
              alt="Xem vị trí cửa hàng trên Google Maps"
              className="h-32 w-full object-cover transition duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </a>
        </div>

        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#D4AF37]">
            Đăng Ký Nhận Tin
          </h3>
          <p className="mt-4 text-sm text-zinc-300">
            Nhận khuyến mãi mới và ưu đãi độc quyền từ Thai Vũ.
          </p>
          <form
            className="mt-4 flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
            }}
          >
            <div className="relative min-w-0 flex-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email của bạn"
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-brand focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="inline-flex shrink-0 items-center justify-center rounded-md bg-brand px-3 py-2 text-white transition hover:brightness-110"
              aria-label="Đăng ký nhận tin"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-zinc-800 py-4 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} Thai Vũ. All rights reserved.
      </div>
    </footer>
  )
}
