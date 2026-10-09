import { SHOP_INFO } from '../products'

export function policyContactBlock() {
  const tel = `tel:${SHOP_INFO.hotline}`
  const email = `mailto:${SHOP_INFO.email}`
  return `
<p class="mt-8 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
  <strong>${SHOP_INFO.legalName}</strong><br />
  Địa chỉ: ${SHOP_INFO.address}<br />
  Hotline: <a href="${tel}" class="text-brand hover:underline">${SHOP_INFO.hotlineDisplay}</a><br />
  Email: <a href="${email}" class="text-brand hover:underline">${SHOP_INFO.email}</a><br />
  Website: ${SHOP_INFO.website}
</p>`
}
