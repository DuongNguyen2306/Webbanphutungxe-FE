import { useRef, useState } from 'react'
import { HardDriveDownload, Loader2 } from 'lucide-react'
import {
  getGoogleDrivePreviewUrl,
  isGoogleDriveUrl,
} from '../utils/googleDrive'
import { useGoogleDrivePicker } from '../hooks/useGoogleDrivePicker'
import { showUiToast } from '../utils/uiToast'

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
      previewUrl: isGoogleDriveUrl(url) ? getGoogleDrivePreviewUrl(url) : url,
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

/**
 * @param {ImageSlot[]} existingItems
 * @param {string[]} urls
 * @returns {ImageSlot[]}
 */
export function appendImageUrls(existingItems, urls = []) {
  const nextUrls = urls
    .map((url) => String(url || '').trim())
    .filter(Boolean)
  if (!nextUrls.length) return existingItems
  const existing = new Set(
    existingItems
      .map((it) => String(it?.remoteUrl || '').trim().toLowerCase())
      .filter(Boolean),
  )
  const added = nextUrls
    .filter((url) => !existing.has(url.toLowerCase()))
    .map((url) => ({
      id: nextId(),
      previewUrl: isGoogleDriveUrl(url) ? getGoogleDrivePreviewUrl(url) : url,
      remoteUrl: url,
      file: null,
      objectUrl: '',
    }))
  return [...existingItems, ...added]
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
  enableUrlUpload = false,
  onUploadFromUrl,
  enableDrivePicker = false,
  drivePickerMultiple = true,
  onImportFromDriveFiles,
  urlPlaceholder = 'https://drive.google.com/file/d/.../view',
  urlButtonLabel = 'Tải ảnh từ link',
  urlTabLabel = 'Dán link Google Drive',
}) {
  const inputRef = useRef(null)
  const [uploadMode, setUploadMode] = useState('file')
  const [urlInput, setUrlInput] = useState('')
  const [urlLoading, setUrlLoading] = useState(false)
  const [urlError, setUrlError] = useState('')
  const [driveImporting, setDriveImporting] = useState(false)
  const [driveError, setDriveError] = useState('')
  const { stage, isBusy: driveBusy, pickImages, isCancelledError } = useGoogleDrivePicker()

  const addFiles = (fileList) => {
    if (!fileList?.length) return
    onChange(appendImageFiles(items, fileList))
  }

  const removeItem = (id) => {
    const target = items.find((it) => it.id === id)
    if (target?.objectUrl) URL.revokeObjectURL(target.objectUrl)
    onChange(items.filter((it) => it.id !== id))
  }

  const handleUrlUpload = async () => {
    const url = String(urlInput || '').trim()
    if (!url) {
      setUrlError('Vui lòng nhập link Google Drive.')
      return
    }
    if (!isGoogleDriveUrl(url)) {
      setUrlError('Link chưa đúng định dạng Google Drive.')
      return
    }
    if (typeof onUploadFromUrl !== 'function') {
      setUrlError('Chưa cấu hình upload từ URL.')
      return
    }
    setUrlLoading(true)
    setUrlError('')
    try {
      const uploadedUrl = await onUploadFromUrl(url)
      if (!uploadedUrl) {
        throw new Error('Không nhận được URL ảnh sau khi upload.')
      }
      onChange(appendImageUrls(items, [uploadedUrl]))
      setUrlInput('')
    } catch (err) {
      setUrlError(err?.response?.data?.message || err?.message || 'Tải ảnh từ link thất bại.')
    } finally {
      setUrlLoading(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    addFiles(e.dataTransfer.files)
  }

  const handlePickFromDrive = async () => {
    setDriveError('')
    try {
      const picked = await pickImages({ multiple: drivePickerMultiple })
      if (!picked?.length) return
      setDriveImporting(true)
      const uploadedUrls =
        typeof onImportFromDriveFiles === 'function'
          ? await onImportFromDriveFiles(picked)
          : picked.map((item) => item.googleDriveUrl)
      if (!Array.isArray(uploadedUrls) || !uploadedUrls.length) return
      onChange(appendImageUrls(items, uploadedUrls))
      showUiToast(`Đã thêm ${uploadedUrls.length} ảnh từ Drive`)
    } catch (err) {
      if (isCancelledError(err)) {
        setDriveError('Bạn đã đóng cửa sổ chọn ảnh Google Drive.')
        return
      }
      const msg = err?.response?.data?.message || err?.message || 'Không lấy được ảnh từ Google Drive.'
      setDriveError(msg)
      showUiToast(msg, 'error')
    } finally {
      setDriveImporting(false)
    }
  }

  const driveButtonLabel =
    stage === 'auth'
      ? 'Đang xác thực Google...'
      : stage === 'picker'
        ? 'Đang mở Drive...'
        : driveImporting
          ? 'Đang import ảnh...'
          : 'Chọn từ Drive'

  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</label>
      <div
        className="mt-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/70 p-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        {enableUrlUpload ? (
          <div className="mb-3 inline-flex rounded-lg border border-gray-300 bg-white p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setUploadMode('file')
                setUrlError('')
              }}
              className={`rounded-md px-2.5 py-1.5 ${
                uploadMode === 'file' ? 'bg-brand text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Tải từ máy
            </button>
            <button
              type="button"
              onClick={() => {
                setUploadMode('url')
                setUrlError('')
              }}
              className={`rounded-md px-2.5 py-1.5 ${
                uploadMode === 'url' ? 'bg-brand text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {urlTabLabel}
            </button>
          </div>
        ) : null}
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
        {(!enableUrlUpload || uploadMode === 'file') ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg border border-brand px-3 py-1.5 text-xs font-bold text-brand hover:bg-brand/5"
            >
              Chọn ảnh từ máy
            </button>
            {enableDrivePicker ? (
              <button
                type="button"
                onClick={handlePickFromDrive}
                disabled={driveBusy || driveImporting}
                className="inline-flex items-center gap-1 rounded-lg border border-sky-400 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {driveBusy || driveImporting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <HardDriveDownload className="size-3.5" />
                )}
                {driveButtonLabel}
              </button>
            ) : null}
            {emptyText ? <span className="text-xs text-gray-500">{emptyText}</span> : null}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder={urlPlaceholder}
                className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800"
              />
              <button
                type="button"
                onClick={handleUrlUpload}
                disabled={urlLoading}
                className="rounded-lg border border-brand px-3 py-2 text-xs font-bold text-brand hover:bg-brand/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {urlLoading ? 'Đang xử lý...' : urlButtonLabel}
              </button>
            </div>
            {urlError ? (
              <p className="text-xs font-semibold text-red-600">{urlError}</p>
            ) : null}
          </div>
        )}
        {driveError ? <p className="mt-1 text-[11px] text-amber-700">{driveError}</p> : null}

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
