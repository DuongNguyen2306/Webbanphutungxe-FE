export function CheckoutSuccessModal({ open, onClose }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-success-title"
    >
      <div className="max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2
          id="checkout-success-title"
          className="text-lg font-extrabold text-brand"
        >
          Đặt hàng thành công
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink">
          Chúng tôi đã nhận thông tin mua hàng của bạn. Nhân viên Thai Vũ sẽ liên
          hệ lại qua SĐT/Email trong vòng{' '}
          <span className="font-semibold">30–60 phút</span> để xác nhận đơn. Xin
          cảm ơn!
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-brand py-3 text-sm font-extrabold uppercase text-white"
        >
          Đóng
        </button>
      </div>
    </div>
  )
}
