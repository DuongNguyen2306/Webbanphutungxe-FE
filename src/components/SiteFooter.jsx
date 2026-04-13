import { MapPin, Phone, Mail, Share2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SHOP_INFO } from '../data/products'

const policyLinks = [
  { href: '#', label: 'Hỗ trợ đặt hàng' },
  { href: '#', label: 'Chính sách mua hàng' },
  { href: '#', label: 'Chính sách người dùng' },
  { href: '#', label: 'Bảo hành & đổi trả' },
  { href: '#', label: 'Quyền riêng tư' },
]

export function SiteFooter() {
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
              <p>
                <span className="font-semibold text-brand">Email:</span>{' '}
                <a
                  href={`mailto:${SHOP_INFO.email}`}
                  className="text-ink underline-offset-2 hover:underline"
                >
                  {SHOP_INFO.email}
                </a>
              </p>
              <p>
                <span className="font-semibold text-brand">Hotline / Zalo:</span>{' '}
                <a
                  href={`tel:${SHOP_INFO.hotline.replace(/\s/g, '')}`}
                  className="font-medium text-ink"
                >
                  {SHOP_INFO.hotline}
                </a>
              </p>
              <p className="text-xs text-gray-600">
                <span className="font-semibold text-brand">Tư vấn kỹ thuật:</span>{' '}
                Mr. Hoàng 090x · Mr. Tây 091x (giờ hành chính).
              </p>
              <p className="text-xs text-gray-600">
                <span className="font-semibold text-brand">Góp ý / khiếu nại:</span>{' '}
                gopy@thaivu.vn — Zalo OA Thai Vũ.
              </p>
              <p className="text-xs text-gray-600">
                <span className="font-semibold text-brand">Hợp tác / buôn sỉ:</span>{' '}
                Zalo phòng kinh doanh (8h–18h).
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-brand">
              Chương trình chiết khấu
            </h3>
            <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-gray-700">
              <li>Ưu đãi theo tổng giá trị đơn — chi tiết cập nhật trên Zalo OA.</li>
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
                <a href={`tel:${SHOP_INFO.hotline.replace(/\s/g, '')}`}>
                  {SHOP_INFO.hotline}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="size-4 shrink-0" />
                <a href={`mailto:${SHOP_INFO.email}`}>{SHOP_INFO.email}</a>
              </p>
              <p className="text-white/80">MST: {SHOP_INFO.taxCode}</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href="#"
                className="flex size-10 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white transition hover:bg-white/25"
                aria-label="Facebook"
              >
                f
              </a>
              <a
                href="#"
                className="flex size-10 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white transition hover:bg-white/25"
                aria-label="Zalo"
              >
                Z
              </a>
              <a
                href="#"
                className="flex size-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                aria-label="Mạng xã hội"
              >
                <Share2 className="size-5" />
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
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.319!2d106.629!3d10.823!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDQ5JzIyLjgiTiAxMDbCsDM3JzQ0LjQiRQ!5e0!3m2!1svi!2s!4v1"
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
              <p className="font-semibold">Thai Vũ — Phụ kiện xe máy</p>
              <p className="mt-2 text-xs text-white/75">
                Nhúng plugin Fanpage Facebook tại đây (Page ID + SDK) để hiển thị
                lượt thích và nút theo dõi như mẫu tham khảo.
              </p>
              <Link
                to="/"
                className="mt-4 inline-block rounded-md bg-white px-4 py-2 text-xs font-bold uppercase text-footer-blue"
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
