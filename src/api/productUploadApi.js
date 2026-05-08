import { api } from './client'
import { compressImageToWebp800 } from '../utils/compressImageToWebp800'
import { isGoogleDriveUrl } from '../utils/googleDrive'

function isTimeoutLikeError(err) {
  const status = Number(err?.response?.status || 0)
  const httpCode = Number(err?.response?.data?.http_code || 0)
  const message = String(err?.response?.data?.message || err?.message || '').toLowerCase()
  return (
    status === 499 ||
    status >= 500 ||
    httpCode === 499 ||
    message.includes('timeout')
  )
}

/**
 * Upload một ảnh lên Cloudinary qua BE.
 * POST /api/products/upload — multipart, field: image
 * @param {File | { file?: File, googleDriveUrl?: string, imageUrl?: string }} input
 * @returns {Promise<string>} secure_url
 */
export async function uploadProductImage(input) {
  let res
  if (input instanceof File) {
    const processed = await compressImageToWebp800(input)
    const fd = new FormData()
    fd.append('image', processed)
    try {
      res = await api.post('/api/products/upload', fd, { timeout: 45_000 })
    } catch (err) {
      if (!isTimeoutLikeError(err)) throw err
      // Retry 1 lần với file gốc để giảm lỗi timeout ngắt quãng từ upstream.
      const retryFd = new FormData()
      retryFd.append('image', input)
      res = await api.post('/api/products/upload', retryFd, { timeout: 60_000 })
    }
  } else if (input?.file instanceof File) {
    const sourceFile = input.file
    const processed = await compressImageToWebp800(sourceFile)
    const fd = new FormData()
    fd.append('image', processed)
    try {
      res = await api.post('/api/products/upload', fd, { timeout: 45_000 })
    } catch (err) {
      if (!isTimeoutLikeError(err)) throw err
      const retryFd = new FormData()
      retryFd.append('image', sourceFile)
      res = await api.post('/api/products/upload', retryFd, { timeout: 60_000 })
    }
  } else {
    const googleDriveUrl = String(input?.googleDriveUrl || '').trim()
    const imageUrl = String(input?.imageUrl || '').trim()
    if (!googleDriveUrl && !imageUrl) {
      throw new Error('Thiếu file hoặc URL ảnh để upload.')
    }
    if (googleDriveUrl && !isGoogleDriveUrl(googleDriveUrl)) {
      throw new Error('Link Google Drive chưa hợp lệ.')
    }
    const body = {}
    if (googleDriveUrl) body.googleDriveUrl = googleDriveUrl
    if (imageUrl) body.imageUrl = imageUrl
    res = await api.post('/api/products/upload', body, { timeout: 60_000 })
  }
  const { data, status } = res
  if (status !== 201 && status !== 200) {
    throw new Error(data?.message || 'Upload ảnh thất bại.')
  }
  const url = data?.secure_url || data?.url
  if (!url) throw new Error('Server không trả secure_url.')
  return String(url).trim()
}

export async function uploadProductImageFromDrive(googleDriveUrl) {
  return uploadProductImage({ googleDriveUrl })
}

/**
 * Giữ thứ tự trong `items`: URL đã có giữ nguyên; mỗi slot có file được upload lần lượt.
 * @param {Array<{ remoteUrl?: string, file?: File | null }>} items
 * @param {{ onFileUploaded?: () => void }} [opts] — gọi sau mỗi file upload thành công
 * @returns {Promise<string[]>}
 */
export async function resolveImageItemsToUrls(items, opts = {}) {
  const { onFileUploaded } = opts

  const out = []
  for (const it of items) {
    const url = String(it?.remoteUrl || '').trim()
    if (url) {
      out.push(url)
      continue
    }
    if (it?.file instanceof File) {
      const secureUrl = await uploadProductImage(it.file)
      out.push(secureUrl)
      onFileUploaded?.()
    }
  }
  return out
}
