import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

/**
 * Bottom sheet — ~75–80% chiều cao, nội dung cuộn, footer cố định.
 */
export function CatalogFilterBottomSheet({
  open,
  onClose,
  title = 'Bộ lọc',
  footer = null,
  children,
}) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-[70]">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px] transition duration-300 data-[closed]:opacity-0"
      />

      <div className="fixed inset-0 flex items-end justify-center p-0">
        <DialogPanel
          transition
          className="w-full max-w-[1600px] bg-transparent p-0 shadow-none focus:outline-none"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="flex max-h-[80vh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
              <DialogTitle className="text-base font-extrabold text-ink">{title}</DialogTitle>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100"
                aria-label="Đóng"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
              {children}
            </div>

            {footer ? (
              <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
