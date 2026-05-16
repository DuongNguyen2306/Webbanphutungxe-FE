import { SHOP_INFO, SHOP_ZALO_URL } from '../../data/products'
import { GuideStepScreenshot } from './GuideStepScreenshot'

const STEPS = [
  {
    key: 'search',
    title: 'Bước 1: Tìm sản phẩm cần mua',
    image: '/1.png',
    alt: 'Tìm kiếm sản phẩm trên thanh tìm kiếm trang chủ',
    body: (
      <>
        <p>
          Truy cập trang chủ cửa hàng, dùng <strong>ô tìm kiếm</strong> phía trên (cạnh menu danh
          mục) để gõ tên phụ tùng, phụ kiện hoặc dòng xe (Vespa, Honda, Piaggio…).
        </p>
        <p>
          Bạn cũng có thể chọn <strong>danh mục</strong> bên trái hoặc lướt các khối sản phẩm để
          tìm món cần mua.
        </p>
      </>
    ),
  },
  {
    key: 'detail',
    title: 'Bước 2: Xem chi tiết & đặt mua sản phẩm',
    image: '/2.png',
    alt: 'Trang chi tiết sản phẩm và nút mua hàng',
    body: (
      <>
        <p>
          Bấm vào sản phẩm để mở trang chi tiết: xem ảnh, giá, phiên bản (màu, size…). Chọn biến
          thể phù hợp nếu sản phẩm có nhiều loại.
        </p>
        <p>
          Bấm <strong className="text-brand">Mua ngay</strong> để đặt hàng nhanh, hoặc{' '}
          <strong>Thêm vào giỏ</strong> nếu muốn tiếp tục chọn thêm sản phẩm khác.
        </p>
      </>
    ),
  },
  {
    key: 'quantity',
    title: 'Bước 3: Chọn số lượng',
    image: '/3.png',
    alt: 'Chọn số lượng sản phẩm',
    body: (
      <>
        <p>
          Tại giỏ hàng hoặc bước đặt hàng, dùng nút <strong>+ / −</strong> hoặc nhập số lượng mong
          muốn. Kiểm tra lại tên sản phẩm, giá và số lượng trước khi sang bước tiếp theo.
        </p>
      </>
    ),
  },
  {
    key: 'checkout',
    title: 'Bước 4: Nhập thông tin & xác nhận đặt hàng',
    image: '/4.png',
    alt: 'Nhập thông tin khách hàng và đặt hàng',
    body: (
      <>
        <p>
          Điền <strong>họ tên</strong> và <strong>số điện thoại</strong> (bắt buộc). Các trường
          địa chỉ, ghi chú là tùy chọn — bạn có thể bổ sung để giao hàng thuận tiện hơn.
        </p>
        <p>
          Kiểm tra tổng tiền, sau đó bấm <strong className="text-brand">Đặt hàng</strong>. Hệ
          thống hiển thị mã đơn khi đặt thành công; shop sẽ liên hệ xác nhận qua điện thoại.
        </p>
      </>
    ),
  },
]

export function PurchaseGuide() {
  const telHref = `tel:${SHOP_INFO.hotline.replace(/\s/g, '')}`
  const zaloHref = `${SHOP_ZALO_URL}${SHOP_ZALO_URL.includes('?') ? '&' : '?'}text=${encodeURIComponent('[Thai Vũ] Tư vấn đặt hàng giúp mình.')}`

  return (
    <div className="purchase-guide text-[15px] leading-relaxed text-gray-800">
      <h2 className="text-center text-2xl font-black uppercase tracking-tight text-brand md:text-3xl">
        Hướng dẫn cách thức mua hàng
      </h2>

      <section className="mt-8">
        <h3 className="text-lg font-extrabold text-sky-800 md:text-xl">
          1. Mua hàng trực tiếp tại cửa hàng
        </h3>
        <p className="mt-2">
          Địa chỉ:{' '}
          <strong className="text-brand">{SHOP_INFO.address}</strong>
        </p>
        <p className="mt-1">
          Hotline / Zalo:{' '}
          <a href={telHref} className="font-bold text-brand hover:underline">
            {SHOP_INFO.hotlineDisplay}
          </a>
          {' · '}
          <a
            href={zaloHref}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-brand hover:underline"
          >
            Chat Zalo
          </a>
        </p>
      </section>

      <section className="mt-8">
        <h3 className="text-lg font-extrabold text-sky-800 md:text-xl">
          2. Đặt hàng trên website
        </h3>
        <p className="mt-2">
          Cách 1: Gọi / nhắn Zalo hotline{' '}
          <a href={telHref} className="font-bold text-brand hover:underline">
            {SHOP_INFO.hotlineDisplay}
          </a>{' '}
          để được tư vấn và đặt hàng.
        </p>
        <p className="mt-2">
          Cách 2: Tự đặt trên website theo <strong>4 bước</strong> minh họa bên dưới.
        </p>
      </section>

      <div className="mt-10 space-y-14">
        {STEPS.map((step, index) => (
          <section key={step.key} id={`buoc-${step.key}`} className="scroll-mt-28">
            <h3 className="text-lg font-extrabold text-sky-800 md:text-xl">{step.title}</h3>
            <div className="mt-3 space-y-3 [&_p]:mt-2">{step.body}</div>
            <GuideStepScreenshot
              src={step.image}
              alt={step.alt}
              priority={index < 2}
            />
          </section>
        ))}
      </div>

      <section className="mt-12 rounded-xl border border-sky-100 bg-sky-50/80 p-5 md:p-6">
        <h3 className="text-lg font-extrabold text-sky-800">+ Lưu ý:</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 marker:font-bold">
          <li>
            Đơn hàng chỉ được tiếp nhận khi thông tin{' '}
            <strong className="text-brand">họ tên và số điện thoại</strong> chính xác. Sau khi
            đặt thành công, nhân viên sẽ gọi xác nhận.
          </li>
          <li>
            Giao hàng nội thành TP.HCM theo khu vực; phí ship báo khi xác nhận đơn.
          </li>
          <li>
            Đơn tỉnh gửi qua đối tác vận chuyển. Cần hỗ trợ nhanh, liên hệ{' '}
            <a href={telHref} className="font-bold text-brand hover:underline">
              {SHOP_INFO.hotlineDisplay}
            </a>
            .
          </li>
        </ol>
        <p className="mt-4 text-sm text-gray-600">
          Mọi thắc mắc trong quá trình đặt hàng, vui lòng liên hệ shop để được hỗ trợ.
        </p>
      </section>
    </div>
  )
}