const MAX_SIZE = 800

/**
 * Nén ảnh về WebP ~800x800 (giữ tỷ lệ, pad trong khung) để giảm dung lượng trước khi gửi BE.
 * @param {File} file
 * @returns {Promise<File>}
 */
export async function compressImageToWebp800(file) {
  if (!file?.type?.startsWith('image/')) return file

  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const node = new Image()
      node.onload = () => resolve(node)
      node.onerror = () => reject(new Error('Không đọc được ảnh.'))
      node.src = objectUrl
    })
    const canvas = document.createElement('canvas')
    canvas.width = MAX_SIZE
    canvas.height = MAX_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) return file

    const ratio = Math.min(1, MAX_SIZE / img.width, MAX_SIZE / img.height)
    const width = Math.max(1, Math.round(img.width * ratio))
    const height = Math.max(1, Math.round(img.height * ratio))
    const x = Math.round((MAX_SIZE - width) / 2)
    const y = Math.round((MAX_SIZE - height) / 2)
    ctx.clearRect(0, 0, MAX_SIZE, MAX_SIZE)
    ctx.drawImage(img, x, y, width, height)

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (out) => (out ? resolve(out) : reject(new Error('Không thể nén ảnh.'))),
        'image/webp',
        0.85,
      )
    })
    const base = file.name.replace(/\.[^.]+$/, '') || 'image'
    return new File([blob], `${base}.webp`, { type: 'image/webp' })
  } catch {
    return file
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
