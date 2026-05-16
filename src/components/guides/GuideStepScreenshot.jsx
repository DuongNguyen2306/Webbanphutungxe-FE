import { useEffect, useState } from 'react'
import { X, ZoomIn } from 'lucide-react'

/**
 * Ảnh minh họa bước hướng dẫn — full width cột, bấm để xem phóng to (tránh nhỏ/mờ).
 */
export function GuideStepScreenshot({ src, alt, priority = false }) {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    if (!lightboxOpen) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e) {
      if (e.key === 'Escape') setLightboxOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [lightboxOpen])

  return (
    <>
      <figure className="mt-5">
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="group relative block w-full overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-1 shadow-md ring-1 ring-black/5 transition hover:border-brand/40 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          aria-label={`Phóng to: ${alt}`}
        >
          <img
            src={src}
            alt={alt}
            width={1920}
            height={1080}
            className="mx-auto block h-auto w-full max-w-none rounded-lg [image-rendering:-webkit-optimize-contrast]"
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding={priority ? 'sync' : 'async'}
          />
          <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
            <ZoomIn className="size-3.5" aria-hidden />
            Phóng to ảnh
          </span>
        </button>
        <figcaption className="mt-2 text-center text-xs text-gray-500">
          Bấm vào ảnh để xem kích thước đầy đủ
        </figcaption>
      </figure>

      {lightboxOpen ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Đóng"
          >
            <X className="size-6" />
          </button>
          <img
            src={src}
            alt={alt}
            className="max-h-[92vh] max-w-[min(96vw,1400px)] w-auto object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  )
}
