import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

/**
 * Bottom sheet — Headless UI Dialog + framer-motion (spring).
 */
export function CatalogFilterBottomSheet({ open, onClose, title = 'Lọc & sắp xếp', children }) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-[70]">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/45 backdrop-blur-[1px] transition duration-300 data-[closed]:opacity-0"
      />

      <div className="fixed inset-0 flex items-end justify-center p-0">
        <DialogPanel
          transition
          className="w-full max-w-[1600px] bg-transparent p-0 shadow-none focus:outline-none"
        >
          <motion.div
            initial={{ y: '22%' }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            className="max-h-[min(92vh,920px)] overflow-hidden rounded-t-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <DialogTitle className="text-base font-extrabold text-ink">
                {title}
              </DialogTitle>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100"
                aria-label="Đóng"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="max-h-[min(82vh,820px)] overflow-y-auto overscroll-contain px-4 pb-8 pt-2">
              {children}
            </div>
          </motion.div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
