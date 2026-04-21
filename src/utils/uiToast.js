const UI_TOAST_EVENT = 'thaivu:ui-toast'

export function showUiToast(message, tone = 'success') {
  if (!message) return
  window.dispatchEvent(
    new CustomEvent(UI_TOAST_EVENT, {
      detail: {
        message: String(message),
        tone: String(tone || 'success'),
      },
    }),
  )
}

export { UI_TOAST_EVENT }
