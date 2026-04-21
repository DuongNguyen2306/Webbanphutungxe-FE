import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { UI_TOAST_EVENT } from '../utils/uiToast'

export function GlobalUiToast() {
  const [toast, setToast] = useState({ visible: false, message: '', tone: 'success', seq: 0 })

  useEffect(() => {
    function handleToast(event) {
      const message = String(event?.detail?.message || '').trim()
      if (!message) return
      setToast((prev) => ({
        visible: true,
        message,
        tone: event?.detail?.tone === 'error' ? 'error' : 'success',
        seq: prev.seq + 1,
      }))
    }
    window.addEventListener(UI_TOAST_EVENT, handleToast)
    return () => window.removeEventListener(UI_TOAST_EVENT, handleToast)
  }, [])

  useEffect(() => {
    if (!toast.visible) return undefined
    const timer = setTimeout(
      () => setToast((prev) => ({ ...prev, visible: false })),
      1700,
    )
    return () => clearTimeout(timer)
  }, [toast.visible, toast.seq])

  if (!toast.visible) return null

  const success = toast.tone !== 'error'
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[160] flex justify-center px-4">
      <div
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-xl ${
          success ? 'bg-emerald-600' : 'bg-red-600'
        }`}
        role="status"
        aria-live="polite"
      >
        {success ? <CheckCircle2 className="size-4.5" /> : <AlertCircle className="size-4.5" />}
        {toast.message}
      </div>
    </div>
  )
}
