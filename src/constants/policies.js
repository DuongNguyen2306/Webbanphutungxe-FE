/** @typedef {{ slug: string, path: string, title: string, badge: string, summary: string }} PolicyMeta */

/** @type {PolicyMeta[]} */
export const POLICY_PAGES = [
  {
    slug: 'doi-tra',
    path: '/chinh-sach/doi-tra',
    title: 'Chính sách đổi trả hàng và hoàn tiền',
    badge: 'Đổi trả',
    summary:
      'Quy định đổi trả, hoàn tiền cho phụ kiện Vespa, Piaggio — minh bạch, nhanh gọn.',
  },
  {
    slug: 'dieu-khoan',
    path: '/chinh-sach/dieu-khoan',
    title: 'Điều khoản dịch vụ',
    badge: 'Pháp lý',
    summary: 'Điều khoản sử dụng website phukienthaivu.com và mua hàng tại Phụ Kiện TháiVũ.',
  },
  {
    slug: 'bao-mat',
    path: '/chinh-sach/bao-mat',
    title: 'Chính sách bảo mật thông tin',
    badge: 'Bảo mật',
    summary: 'Cam kết bảo vệ thông tin đặt hàng (tên, số điện thoại) của khách hàng.',
  },
  {
    slug: 'bao-hanh',
    path: '/chinh-sach/bao-hanh',
    title: 'Chính sách bảo hành, bảo trì',
    badge: 'Bảo hành',
    summary: 'Thời hạn và điều kiện bảo hành đồ chơi, phụ kiện xe máy.',
  },
  {
    slug: 'van-chuyen',
    path: '/chinh-sach/van-chuyen',
    title: 'Chính sách vận chuyển, giao nhận',
    badge: 'Giao hàng',
    summary: 'Phạm vi giao toàn quốc, thời gian và quy trình đồng kiểm COD.',
  },
  {
    slug: 'chinh-sach-gia',
    path: '/chinh-sach/chinh-sach-gia',
    title: 'Chính sách giá',
    badge: 'Giá cả',
    summary: 'Công khai, minh bạch giá bán sản phẩm và các chi phí phát sinh.',
  },
  {
    slug: 'chinh-sach-thanh-toan',
    path: '/chinh-sach/chinh-sach-thanh-toan',
    title: 'Chính sách thanh toán',
    badge: 'Thanh toán',
    summary: 'Các phương thức thanh toán: COD, chuyển khoản ngân hàng.',
  },
  {
    slug: 'dieu-kien-cung-cap',
    path: '/chinh-sach/dieu-kien-cung-cap',
    title: 'Điều kiện và hạn chế cung cấp hàng hóa, dịch vụ',
    badge: 'Cung cấp',
    summary: 'Phạm vi cung cấp, tình trạng hàng hóa, khả năng tương thích và khu vực giao hàng.',
  },
  {
    slug: 'khieu-nai',
    path: '/chinh-sach/khieu-nai',
    title: 'Phương thức tiếp nhận và giải quyết phản ánh, yêu cầu, khiếu nại',
    badge: 'Khiếu nại',
    summary: 'Quy trình tiếp nhận và giải quyết khiếu nại, phản ánh của khách hàng.',
  },
  {
    slug: 'thong-tin-chu-quan',
    path: '/chinh-sach/thong-tin-chu-quan',
    title: 'Thông tin chủ quản nền tảng',
    badge: 'Thông tin',
    summary: 'Thông tin về đơn vị chủ quản website phukienthaivu.com theo quy định pháp luật.',
  },
]

export function getPolicyMetaBySlug(slug) {
  return POLICY_PAGES.find((p) => p.slug === slug) ?? null
}

export function getPolicyMetaByPath(pathname) {
  return POLICY_PAGES.find((p) => p.path === pathname) ?? null
}
