import { MapPin, Phone, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SHOP_INFO, SHOP_ZALO_URL } from '../data/products'

const policyLinks = [
  { href: '#', label: 'Hỗ trợ đặt hàng' },
  { href: '#', label: 'Chính sách mua hàng' },
  { href: '#', label: 'Chính sách người dùng' },
  { href: '#', label: 'Bảo hành & đổi trả' },
  { href: '#', label: 'Quyền riêng tư' },
]

const MAP_EMBED_SRC =
  'https://maps.google.com/maps?q=15F+%C4%91%C6%B0%E1%BB%9Dng+4F+ph%C6%B0%E1%BB%9Dng+T%C3%A2n+Thu%E1%BA%ADn+Qu%E1%BA%ADn+7&t=&z=15&ie=UTF8&iwloc=&output=embed'

export function SiteFooter() {
  const telHref = `tel:${SHOP_INFO.hotline.replace(/\s/g, '')}`
  const zaloHref = `${SHOP_ZALO_URL}${SHOP_ZALO_URL.includes('?') ? '&' : '?'}text=${encodeURIComponent(`[Thai Vũ] Xin chào ${SHOP_INFO.contactPerson}`)}`

  return (
    <footer className="mt-auto border-t border-gray-200">
      <div className="bg-page px-4 py-10 text-ink sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1400px] gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-brand">
              Hỗ trợ khách hàng
            </h3>
            <div className="mt-3 space-y-3 text-sm leading-relaxed">
              <p>
                <span className="font-semibold text-brand">Website:</span>{' '}
                <a href="/" className="text-ink underline-offset-2 hover:underline">
                  thaivu.vn
                </a>
              </p>
              {SHOP_INFO.email ? (
                <p>
                  <span className="font-semibold text-brand">Email:</span>{' '}
                  <a
                    href={`mailto:${SHOP_INFO.email}`}
                    className="text-ink underline-offset-2 hover:underline"
                  >
                    {SHOP_INFO.email}
                  </a>
                </p>
              ) : null}
              <p>
                <span className="font-semibold text-brand">Zalo / Hotline:</span>{' '}
                <a href={zaloHref} className="font-medium text-ink underline-offset-2 hover:underline">
                  {SHOP_INFO.hotlineDisplay}
                </a>
                {' — '}
                <a href={telHref} className="font-medium text-ink underline-offset-2 hover:underline">
                  Gọi
                </a>
                {SHOP_INFO.contactPerson ? (
                  <>
                    {' '}
                    <span className="text-gray-600">({SHOP_INFO.contactPerson})</span>
                  </>
                ) : null}
              </p>
              <p>
                <span className="font-semibold text-brand">Facebook:</span>{' '}
                <a
                  href={SHOP_INFO.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink underline-offset-2 hover:underline"
                >
                  Phụ kiện xe Vespa Piaggio
                </a>
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-brand">
              Chương trình chiết khấu
            </h3>
            <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-gray-700">
              <li>Ưu đãi theo tổng giá trị đơn — chi tiết cập nhật trên Zalo.</li>
              <li className="text-brand">
                Một số nhóm hàng (loa, thẻ nhớ, cồng kềnh) có thể không áp dụng
                khuyến mãi %.
              </li>
              <li>Không áp dụng đồng thời nhiều mã nếu có điều khoản trùng lặp.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-brand">
              Quy định giao hàng
            </h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-gray-700">
              <li>Giao nội thành TP.HCM: 1–2 ngày trong bán kính ~5–10km.</li>
              <li>Miễn phí ship một phần đơn từ ngưỡng shop công bố (ví dụ đơn từ 1,5tr nội thành).</li>
              <li>Đơn nhỏ tính phí ship theo đơn vị vận chuyển; giá trị tối thiểu để giao (ví dụ 200k).</li>
              <li>Hàng cồng kềnh / cồng kềnh + pin có thể phụ thu phí riêng.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-brand">
              Chính sách
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {policyLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-ink underline-offset-2 hover:text-brand hover:underline"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-footer-blue text-white">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:gap-6 lg:px-8">
          <div className="w-full lg:w-1/3">
            <h3 className="text-sm font-extrabold uppercase tracking-wide">
              Thông tin liên hệ
            </h3>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-white/95">
              <p className="font-bold">{SHOP_INFO.name}</p>
              <p className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                {SHOP_INFO.address}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="size-4 shrink-0" />
                <a href={telHref}>{SHOP_INFO.hotlineDisplay}</a>
                {SHOP_INFO.contactPerson ? (
                  <span className="text-white/80">— {SHOP_INFO.contactPerson}</span>
                ) : null}
              </p>
              {SHOP_INFO.email ? (
                <p className="flex items-center gap-2">
                  <Mail className="size-4 shrink-0" />
                  <a href={`mailto:${SHOP_INFO.email}`}>{SHOP_INFO.email}</a>
                </p>
              ) : null}
              {SHOP_INFO.taxCode ? (
                <p className="text-white/80">MST: {SHOP_INFO.taxCode}</p>
              ) : null}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={SHOP_INFO.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                aria-label="Facebook"
              >
                <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href={zaloHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-10 items-center justify-center rounded-full bg-white/15 text-xs font-extrabold text-white transition hover:bg-white/25"
                aria-label="Zalo"
              >
                Z
              </a>
            </div>
          </div>

          <div className="w-full lg:w-1/3">
            <h3 className="text-sm font-extrabold uppercase tracking-wide">
              Bản đồ
            </h3>
            <div className="mt-4 overflow-hidden rounded-lg border border-white/20 bg-black/20">
              <iframe
                title="Bản đồ cửa hàng Thai Vũ"
                src={MAP_EMBED_SRC}
                className="h-56 w-full border-0 sm:h-64"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <div className="w-full lg:w-1/3">
            <h3 className="text-sm font-extrabold uppercase tracking-wide">
              Fanpage Facebook
            </h3>
            <div className="mt-4 rounded-lg border border-white/20 bg-black/10 p-4 text-sm text-white/90">
              <p className="font-semibold">Phụ kiện xe Vespa Piaggio</p>
              <p className="mt-2 text-xs text-white/75">
                Theo dõi fanpage để cập nhật hàng mới, khuyến mãi và hướng dẫn lắp đặt.
              </p>
              <a
                href={SHOP_INFO.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block rounded-md bg-white px-4 py-2 text-xs font-bold uppercase text-footer-blue"
              >
                Mở Facebook
              </a>
              <Link
                to="/"
                className="mt-2 ml-2 inline-block rounded-md border border-white/40 px-4 py-2 text-xs font-bold uppercase text-white hover:bg-white/10"
              >
                Về trang chủ
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/15 py-4 text-center text-xs text-white/70">
          © {new Date().getFullYear()} Thai Vũ. Bản quyền nội dung thuộc cửa hàng.
        </div>
      </div>
    </footer>
  )
}
