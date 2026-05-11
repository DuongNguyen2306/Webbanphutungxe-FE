const MAX_SIZE = 1280

/**
 * Nén ảnh về WebP, giữ nguyên tỷ lệ gốc (không pad viền trong suốt). Cạnh dài tối đa MAX_SIZE.
 *
 * Lý do bỏ "pad 800×800": canvas vuông + clearRect tạo viền trong suốt → khi `<img>` dùng object-cover,
 * nội dung trông như "nhỏ giữa khung" sau khi lưu, dù ô đã đầy 100%.
 *
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

    const ratio = Math.min(1, MAX_SIZE / img.width, MAX_SIZE / img.height)
    const width = Math.max(1, Math.round(img.width * ratio))
    const height = Math.max(1, Math.round(img.height * ratio))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(img, 0, 0, width, height)

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
