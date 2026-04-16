import { api } from './client'
import { compressImageToWebp800 } from '../utils/compressImageToWebp800'

/**
 * Upload một ảnh lên Cloudinary qua BE.
 * POST /api/products/upload — multipart, field: image
 * @param {File} file
 * @returns {Promise<string>} secure_url
 */
export async function uploadProductImage(file) {
  const processed = await compressImageToWebp800(file)
  const fd = new FormData()
  fd.append('image', processed)
  const res = await api.post('/api/products/upload', fd)
  const { data, status } = res
  if (status !== 201 && status !== 200) {
    throw new Error(data?.message || 'Upload ảnh thất bại.')
  }
  const url = data?.secure_url || data?.url
  if (!url) throw new Error('Server không trả secure_url.')
  return String(url).trim()
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
