import { doiTraContent } from './doiTra'
import { dieuKhoanContent } from './dieuKhoan'
import { baoMatContent } from './baoMat'
import { baoHanhContent } from './baoHanh'
import { vanChuyenContent } from './vanChuyen'

/** @type {Record<string, string>} */
const POLICY_HTML_BY_SLUG = {
  'doi-tra': doiTraContent,
  'dieu-khoan': dieuKhoanContent,
  'bao-mat': baoMatContent,
  'bao-hanh': baoHanhContent,
  'van-chuyen': vanChuyenContent,
}

export function getPolicyHtmlContent(slug) {
  return POLICY_HTML_BY_SLUG[slug] ?? null
}
