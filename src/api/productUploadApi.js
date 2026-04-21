import { api } from './client'
import { compressImageToWebp800 } from '../utils/compressImageToWebp800'
import { isGoogleDriveUrl } from '../utils/googleDrive'

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
    res = await api.post('/api/products/upload', fd)
  } else if (input?.file instanceof File) {
    const processed = await compressImageToWebp800(input.file)
    const fd = new FormData()
    fd.append('image', processed)
    res = await api.post('/api/products/upload', fd)
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
    res = await api.post('/api/products/upload', body)
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
