/** @typedef {{ slug: string, path: string, title: string, badge: string, summary: string }} PolicyMeta */

/** @type {PolicyMeta[]} */
export const POLICY_PAGES = [
  {
    slug: 'doi-tra',
    path: '/chinh-sach-doi-tra',
    title: 'Chính sách đổi trả hàng và hoàn tiền',
    badge: 'Đổi trả',
    summary:
      'Quy định đổi trả, hoàn tiền cho phụ kiện Vespa, Piaggio — minh bạch, nhanh gọn.',
  },
  {
    slug: 'dieu-khoan',
    path: '/dieu-khoan-dich-vu',
    title: 'Điều khoản dịch vụ',
    badge: 'Pháp lý',
    summary: 'Điều khoản sử dụng website phukienthaivu.com và mua hàng tại Phụ Kiện Thai Vũ.',
  },
  {
    slug: 'bao-mat',
    path: '/chinh-sach-bao-mat',
    title: 'Chính sách bảo mật thông tin',
    badge: 'Bảo mật',
    summary: 'Cam kết bảo vệ thông tin đặt hàng (tên, số điện thoại) của khách hàng.',
  },
  {
    slug: 'bao-hanh',
    path: '/chinh-sach-bao-hanh',
    title: 'Chính sách bảo hành, bảo trì',
    badge: 'Bảo hành',
    summary: 'Thời hạn và điều kiện bảo hành đồ chơi, phụ kiện xe máy.',
  },
  {
    slug: 'van-chuyen',
    path: '/chinh-sach-van-chuyen',
    title: 'Chính sách vận chuyển, giao nhận',
    badge: 'Giao hàng',
    summary: 'Phạm vi giao toàn quốc, thời gian và quy trình đồng kiểm COD.',
  },
]

export function getPolicyMetaBySlug(slug) {
  return POLICY_PAGES.find((p) => p.slug === slug) ?? null
}

export function getPolicyMetaByPath(pathname) {
  return POLICY_PAGES.find((p) => p.path === pathname) ?? null
}
