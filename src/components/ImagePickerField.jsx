import { useRef } from 'react'

function nextId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/** @typedef {{ id: string, previewUrl: string, remoteUrl: string, file: File | null, objectUrl: string }} ImageSlot */

/**
 * @param {string[]} urls
 * @returns {ImageSlot[]}
 */
export function createImageItemsFromUrls(urls = []) {
  return urls
    .map((url) => String(url || '').trim())
    .filter(Boolean)
    .map((url) => ({
      id: nextId(),
      previewUrl: url,
      remoteUrl: url,
      file: null,
      objectUrl: '',
    }))
}

/**
 * @param {ImageSlot[]} existingItems
 * @param {FileList | File[]} fileList
 * @returns {ImageSlot[]}
 */
export function appendImageFiles(existingItems, fileList) {
  const files = Array.from(fileList || []).filter((f) => f?.type?.startsWith('image/'))
  if (!files.length) return existingItems
  const localItems = files.map((file) => {
    const objectUrl = URL.createObjectURL(file)
    return {
      id: nextId(),
      previewUrl: objectUrl,
      remoteUrl: '',
      file,
      objectUrl,
    }
  })
  return [...existingItems, ...localItems]
}

/** @param {ImageSlot[]} items */
export function revokePreviewUrls(items = []) {
  items.forEach((item) => {
    if (item?.objectUrl) URL.revokeObjectURL(item.objectUrl)
  })
}

/** @param {ImageSlot[]} items @returns {File[]} */
export function getFilesSelectedFromItems(items) {
  return items.filter((it) => it.file instanceof File).map((it) => it.file)
}

/** @param {ImageSlot[]} items @returns {string[]} */
export function getUploadedUrlsFromItems(items) {
  return items
    .map((it) => String(it.remoteUrl || '').trim())
    .filter(Boolean)
}

export function ImagePickerField({
  label,
  hint = '',
  items,
  onChange,
  emptyText = '',
}) {
  const inputRef = useRef(null)

  const addFiles = (fileList) => {
    if (!fileList?.length) return
    onChange(appendImageFiles(items, fileList))
  }

  const removeItem = (id) => {
    const target = items.find((it) => it.id === id)
    if (target?.objectUrl) URL.revokeObjectURL(target.objectUrl)
    onChange(items.filter((it) => it.id !== id))
  }

  const onDrop = (e) => {
    e.preventDefault()
    addFiles(e.dataTransfer.files)
  }

  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</label>
      <div
        className="mt-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/70 p-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-brand px-3 py-1.5 text-xs font-bold text-brand hover:bg-brand/5"
          >
            Chọn ảnh từ máy
          </button>
          {emptyText ? <span className="text-xs text-gray-500">{emptyText}</span> : null}
        </div>

        {hint ? <p className="mt-1 text-[11px] text-gray-500">{hint}</p> : null}

        {items.length ? (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {items.map((img) => (
              <div key={img.id} className="relative overflow-hidden rounded-md border border-gray-200 bg-white">
                <img src={img.previewUrl} alt="" className="h-20 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeItem(img.id)}
                  className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-white"
                  aria-label="Xóa ảnh"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
