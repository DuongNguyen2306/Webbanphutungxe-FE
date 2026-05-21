import { api } from './client'

/**
 * Đọc message lỗi khi axios trả blob (400/401/500).
 * @param {import('axios').AxiosError} err
 */
export async function readBlobErrorMessage(err) {
  const data = err?.response?.data
  if (data instanceof Blob) {
    try {
      const text = await data.text()
      if (!text) return null
      try {
        const json = JSON.parse(text)
        return json?.message || text
      } catch {
        return text
      }
    } catch {
      return null
    }
  }
  if (data && typeof data === 'object' && data.message) {
    return String(data.message)
  }
  return null
}

/**
 * @param {{ startDate: string, endDate: string }} params
 */
export async function downloadAdminOrdersExcel({ startDate, endDate }) {
  let res
  try {
    res = await api.get('/api/admin/orders/export-excel', {
      params: { startDate, endDate },
      responseType: 'blob',
    })
  } catch (err) {
    const status = err?.response?.status
    const blobMsg = await readBlobErrorMessage(err)
    if (status === 401) {
      const authErr = new Error(
        blobMsg || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      )
      authErr.status = 401
      throw authErr
    }
    if (status === 400) {
      throw new Error(blobMsg || 'Dữ liệu ngày không hợp lệ.')
    }
    throw new Error(blobMsg || 'Không xuất được báo cáo Excel. Vui lòng thử lại.')
  }

  const contentType = String(res.headers['content-type'] || '')
  if (contentType.includes('application/json')) {
    const text = await res.data.text()
    let message = 'Xuất Excel thất bại.'
    try {
      const json = JSON.parse(text)
      if (json?.message) message = json.message
    } catch {
      if (text) message = text
    }
    throw new Error(message)
  }

  const disposition = String(res.headers['content-disposition'] || '')
  const match = disposition.match(/filename="?([^";\n]+)"?/i)
  const filename =
    match?.[1]?.trim() || `baocao-donhang-${startDate}_${endDate}.xlsx`

  const blob =
    res.data instanceof Blob
      ? res.data
      : new Blob([res.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
