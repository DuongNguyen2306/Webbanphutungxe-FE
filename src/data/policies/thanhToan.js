import { policyContactBlock } from './shared'

export const thanhToanContent = `
<h2>1. Thanh toán khi nhận hàng (COD)</h2>
<ul>
  <li>Khách hàng thanh toán trực tiếp cho đơn vị vận chuyển khi nhận hàng.</li>
  <li>Khách hàng vui lòng kiểm tra thông tin đơn hàng trước khi thực hiện thanh toán.</li>
</ul>

<h2>2. Thanh toán chuyển khoản</h2>
<ul>
  <li>Khách hàng có thể thanh toán bằng hình thức chuyển khoản ngân hàng theo thông tin được cung cấp khi xác nhận đơn hàng.</li>
  <li>Nội dung chuyển khoản nên ghi rõ họ tên hoặc mã đơn hàng để chúng tôi dễ dàng kiểm tra và xác nhận thanh toán.</li>
</ul>

<h2>3. Xác nhận thanh toán</h2>
<p>Đơn hàng được xử lý sau khi:</p>
<ul>
  <li>Khách hàng xác nhận đặt hàng đối với hình thức COD; hoặc</li>
  <li>Chúng tôi xác nhận đã nhận được khoản thanh toán đối với hình thức chuyển khoản.</li>
</ul>
<p>Trong trường hợp có sai sót hoặc vấn đề liên quan đến thanh toán, khách hàng vui lòng liên hệ để được hỗ trợ.</p>
${policyContactBlock()}
`
