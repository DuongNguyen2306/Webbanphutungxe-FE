import { SHOP_INFO } from '../products'

export function policyContactBlock() {
  const tel = `tel:${SHOP_INFO.hotline}`
  return `
<p class="mt-8 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
  <strong>Phụ Kiện Thai Vũ</strong> — ${SHOP_INFO.address}<br />
  Hotline / Zalo: <a href="${tel}">${SHOP_INFO.hotlineDisplay}</a> · Website: phukienthaivu.com
</p>`
}
