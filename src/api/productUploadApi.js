import { api } from './client'
import { compressImageToWebp800 } from '../utils/compressImageToWebp800'
import { isGoogleDriveUrl } from '../utils/googleDrive'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Lỗi có thể hết sau khi chờ / gửi lại (không retry 400/401/403/413). */
function isRetryableUploadError(err) {
  const status = Number(err?.response?.status || 0)
  const httpCode = Number(err?.response?.data?.http_code || 0)
  const msg = String(err?.response?.data?.message || err?.message || '').toLowerCase()

  if (status === 413 || status === 400 || status === 401 || status === 403) return false

  if (status === 408 || status === 429) return true
  if (status >= 500 && status <= 599) return true
  if (httpCode === 499 || msg.includes('timeout')) return true

  // Mất mạng / server không phản hồi
  if (!err?.response) {
    const code = String(err?.code || '')
    if (
      code === 'ECONNABORTED' ||
      code === 'ERR_NETWORK' ||
      code === 'ETIMEDOUT' ||
      msg.includes('network')
    ) {
      return true
    }
  }
  return false
}

function parseUploadResponse(res) {
  const { data, status } = res
  if (status !== 201 && status !== 200) {
    throw new Error(data?.message || 'Upload ảnh thất bại.')
  }
  const url = data?.secure_url || data?.url
  if (!url) throw new Error('Server không trả secure_url.')
  return String(url).trim()
}

/**
 * Gửi POST upload với vài lần thử + backoff (giảm 500/timeout khi BE/Cloudinary ngắt quãng).
 * @param {(timeoutMs: number) => Promise<import('axios').AxiosResponse>} postOnce
 * @param {{ attempts?: number, timeouts?: number[], delaysMs?: number[] }} [cfg]
 */
async function uploadWithBackoff(postOnce, cfg = {}) {
  const attempts = cfg.attempts ?? 4
  /** Khớp timeout mặc định Axios (client.js) — ảnh nặng / Render không cắt sớm */
  const timeouts = cfg.timeouts ?? [120_000, 180_000, 240_000, 300_000]
  const delaysMs = cfg.delaysMs ?? [1500, 3200, 6500]

  let lastErr
  for (let i = 0; i < attempts; i++) {
    const timeout = timeouts[Math.min(i, timeouts.length - 1)]
    try {
      const res = await postOnce(timeout)
      return parseUploadResponse(res)
    } catch (err) {
      lastErr = err
      if (!isRetryableUploadError(err)) throw err
      if (i === attempts - 1) break
      await sleep(delaysMs[i] ?? delaysMs[delaysMs.length - 1])
    }
  }
  throw lastErr
}

/**
 * Upload một ảnh lên Cloudinary qua BE.
 * POST /api/products/upload — multipart, field: image
 * @param {File | { file?: File, googleDriveUrl?: string, imageUrl?: string }} input
 * @returns {Promise<string>} secure_url
 */
export async function uploadProductImage(input) {
  if (input instanceof File) {
    const processed = await compressImageToWebp800(input)
    try {
      return await uploadWithBackoff((timeout) => {
        const fd = new FormData()
        fd.append('image', processed)
        return api.post('/api/products/upload', fd, { timeout })
      })
    } catch (err) {
      if (!isRetryableUploadError(err)) throw err
      // Fallback file gốc (đôi khi WebP qua BE lỗi, JPEG/PNG gốc vẫn qua được)
      return await uploadWithBackoff(
        (timeout) => {
          const fd = new FormData()
          fd.append('image', input)
          return api.post('/api/products/upload', fd, { timeout })
        },
        { attempts: 4, timeouts: [120_000, 180_000, 240_000, 300_000] },
      )
    }
  }

  if (input?.file instanceof File) {
    const sourceFile = input.file
    const processed = await compressImageToWebp800(sourceFile)
    try {
      return await uploadWithBackoff((timeout) => {
        const fd = new FormData()
        fd.append('image', processed)
        return api.post('/api/products/upload', fd, { timeout })
      })
    } catch (err) {
      if (!isRetryableUploadError(err)) throw err
      return await uploadWithBackoff(
        (timeout) => {
          const fd = new FormData()
          fd.append('image', sourceFile)
          return api.post('/api/products/upload', fd, { timeout })
        },
        { attempts: 4, timeouts: [120_000, 180_000, 240_000, 300_000] },
      )
    }
  }

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

  return uploadWithBackoff(
    (timeout) => api.post('/api/products/upload', body, { timeout }),
    { attempts: 4, timeouts: [120_000, 180_000, 240_000, 300_000] },
  )
}

export async function uploadProductImageFromDrive(googleDriveUrl) {
  return uploadProductImage({ googleDriveUrl })
}

/**
 * Giữ thứ tự trong `items`: URL đã có giữ nguyên; mỗi slot có file được upload lần lượt.
 * @param {Array<{ remoteUrl?: string, file?: File | null }>} items
 * @param {{ onFileUploaded?: () => void, delayBetweenFilesMs?: number }} [opts]
 * @returns {Promise<string[]>}
 */
export async function resolveImageItemsToUrls(items, opts = {}) {
  const { onFileUploaded, delayBetweenFilesMs = 700 } = opts

  const out = []
  let fileUploadCount = 0
  for (const it of items) {
    const url = String(it?.remoteUrl || '').trim()
    if (url) {
      out.push(url)
      continue
    }
    if (it?.file instanceof File) {
      if (fileUploadCount > 0 && delayBetweenFilesMs > 0) await sleep(delayBetweenFilesMs)
      fileUploadCount += 1
      const secureUrl = await uploadProductImage(it.file)
      out.push(secureUrl)
      onFileUploaded?.()
    }
  }
  return out
}
