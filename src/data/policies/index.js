import { doiTraContent } from './doiTra'
import { dieuKhoanContent } from './dieuKhoan'
import { baoMatContent } from './baoMat'
import { baoHanhContent } from './baoHanh'
import { vanChuyenContent } from './vanChuyen'
import { giaContent } from './gia'
import { thanhToanContent } from './thanhToan'
import { dieuKienCungCapContent } from './dieuKienCungCap'
import { khieuNaiContent } from './khieuNai'
import { thongTinChuQuanContent } from './thongTinChuQuan'

/** @type {Record<string, string>} */
const POLICY_HTML_BY_SLUG = {
  'doi-tra': doiTraContent,
  'dieu-khoan': dieuKhoanContent,
  'bao-mat': baoMatContent,
  'bao-hanh': baoHanhContent,
  'van-chuyen': vanChuyenContent,
  'chinh-sach-gia': giaContent,
  'chinh-sach-thanh-toan': thanhToanContent,
  'dieu-kien-cung-cap': dieuKienCungCapContent,
  'khieu-nai': khieuNaiContent,
  'thong-tin-chu-quan': thongTinChuQuanContent,
}

export function getPolicyHtmlContent(slug) {
  return POLICY_HTML_BY_SLUG[slug] ?? null
}
