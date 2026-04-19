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

/** Logo Facebook (Simple Icons, CC0) */
function FacebookGlyph({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        fill="currentColor"
        d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"
      />
    </svg>
  )
}

/** Logo Zalo (Simple Icons, CC0) */
function ZaloGlyph({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        fill="currentColor"
        d="M12.49 10.2722v-.4496h1.3467v6.3218h-.7704a.576.576 0 01-.5763-.5729l-.0006.0005a3.273 3.273 0 01-1.9372.6321c-1.8138 0-3.2844-1.4697-3.2844-3.2823 0-1.8125 1.4706-3.2822 3.2844-3.2822a3.273 3.273 0 011.9372.6321l.0006.0005zM6.9188 7.7896v.205c0 .3823-.051.6944-.2995 1.0605l-.03.0343c-.0542.0615-.1815.206-.2421.2843L2.024 14.8h4.8948v.7682a.5764.5764 0 01-.5767.5761H0v-.3622c0-.4436.1102-.6414.2495-.8476L4.8582 9.23H.1922V7.7896h6.7266zm8.5513 8.3548a.4805.4805 0 01-.4803-.4798v-7.875h1.4416v8.3548H15.47zM20.6934 9.6C22.52 9.6 24 11.0807 24 12.9044c0 1.8252-1.4801 3.306-3.3066 3.306-1.8264 0-3.3066-1.4808-3.3066-3.306 0-1.8237 1.4802-3.3044 3.3066-3.3044zm-10.1412 5.253c1.0675 0 1.9324-.8645 1.9324-1.9312 0-1.065-.865-1.9295-1.9324-1.9295s-1.9324.8644-1.9324 1.9295c0 1.0667.865 1.9312 1.9324 1.9312zm10.1412-.0033c1.0737 0 1.945-.8707 1.945-1.9453 0-1.073-.8713-1.9436-1.945-1.9436-1.0753 0-1.945.8706-1.945 1.9436 0 1.0746.8697 1.9453 1.945 1.9453z"
      />
    </svg>
  )
}

export function SiteFooter() {
  const [email, setEmail] = useState('')
  const telHref = `tel:${SHOP_INFO.hotline.replace(/\s/g, '')}`
  /** Cùng nội dung với bản đồ / liên kết Google Maps */
  const addressDisplay = SHOP_INFO.address
  const direct = SHOP_INFO.mapsDirectUrl?.trim()
  const { lat, lng } = SHOP_INFO.mapsLatLng || {}
  const hasPin = Number.isFinite(lat) && Number.isFinite(lng)
  const encodedAddress = encodeURIComponent(SHOP_INFO.address)
  /** Một ghim đỏ: dùng tọa độ hoặc link chia sẻ — tránh /maps/search/ (hay ra list nhiều địa điểm). */
  const mapsHref = direct
    ? direct
    : hasPin
      ? `https://www.google.com/maps?q=${lat},${lng}&hl=vi&z=18`
      : `https://www.google.com/maps?q=${encodedAddress}&hl=vi&z=17`
  const mapEmbedSrc = hasPin
    ? `https://www.google.com/maps?q=${lat},${lng}&output=embed&z=18&hl=vi`
    : `https://www.google.com/maps?q=${encodedAddress}&output=embed&z=17&hl=vi`
  const zaloHref = `${SHOP_ZALO_URL}${SHOP_ZALO_URL.includes('?') ? '&' : '?'}text=${encodeURIComponent('[Thai Vũ] Tư vấn giúp mình với nhé.')}`

  return (
    <footer className="mt-auto border-t border-zinc-800 bg-zinc-950 text-zinc-200">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:gap-10 lg:px-8">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#D4AF37]">
            Về Thai Vũ
          </h3>
          <div className="mt-4">
            <a href="/" className="inline-flex items-center gap-3">
              <img
                src="/logo.jpg"
                alt="Thai Vũ"
                className="h-12 w-auto max-w-[120px] object-contain"
              />
              <span className="text-2xl font-black tracking-tight text-white">Thai Vũ</span>
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
              className="flex size-11 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-[#1877F2] transition hover:border-[#1877F2] hover:bg-zinc-800"
              aria-label="Facebook"
            >
              <FacebookGlyph className="size-[22px]" />
            </a>
            <a
              href={zaloHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-11 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-[#0068FF] transition hover:border-[#0068FF] hover:bg-zinc-800"
              aria-label="Zalo"
            >
              <ZaloGlyph className="size-[22px]" />
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
              {addressDisplay}
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
          <div className="group relative mt-4 h-32 w-full overflow-hidden rounded-xl border border-zinc-800">
            <iframe
              title="Vị trí cửa hàng Thai Vũ trên Google Maps"
              src={mapEmbedSrc}
              className="pointer-events-none h-full w-full min-h-32 border-0 transition duration-300 group-hover:brightness-110"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]"
              aria-label={`Mở Google Maps: ${SHOP_INFO.address}`}
            />
          </div>
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
