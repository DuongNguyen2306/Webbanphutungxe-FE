import { useEffect, useState } from 'react'
import { api } from '../api/client'

/**
 * Danh sách loại phụ tùng cố định lấy từ BE: GET /api/part-categories
 * Trả [{ value, label }] với value là tiếng Việt chữ thường (vd: "gương").
 *
 * Cache module-level vì payload tĩnh: lần đầu mount fetch một lần, các component khác dùng
 * lại ngay (đỡ flicker dropdown / bộ lọc).
 */

const DEFAULT_VALUE = 'phụ kiện'

/** Giá trị `partCategory` khi chọn «Khác» trong GET /api/part-categories (tiếng Việt, chữ thường). */
export const PART_CATEGORY_OTHER_VALUE = 'khác'

/** @type {{ value: string, label: string }[] | null} */
let cachedList = null
/** @type {Promise<{ value: string, label: string }[]> | null} */
let inflight = null
const subscribers = new Set()

function notify(list) {
  subscribers.forEach((cb) => {
    try {
      cb(list)
    } catch {
      /* noop */
    }
  })
}

function normalizeList(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => ({
      value: String(item?.value ?? '').trim().toLowerCase(),
      label: String(item?.label ?? item?.value ?? '').trim(),
    }))
    .filter((item) => item.value && item.label)
}

async function fetchPartCategories() {
  if (cachedList) return cachedList
  if (inflight) return inflight
  inflight = api
    .get('/api/part-categories')
    .then(({ data }) => {
      const list = normalizeList(data)
      cachedList = list
      notify(list)
      return list
    })
    .catch((err) => {
      inflight = null
      throw err
    })
  return inflight
}

export function usePartCategories() {
  const [list, setList] = useState(() => cachedList || [])
  const [loading, setLoading] = useState(() => !cachedList)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (cachedList) return undefined

    let cancelled = false
    const onUpdate = (next) => {
      if (cancelled) return
      setList(next)
    }
    subscribers.add(onUpdate)

    fetchPartCategories()
      .then((next) => {
        if (cancelled) return
        setList(next)
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      subscribers.delete(onUpdate)
    }
  }, [])

  return { partCategories: list, loading, error }
}

/** Map value -> label để render badge/tag. Trả lại chính value khi chưa biết. */
export function getPartCategoryLabel(list, value) {
  const v = String(value ?? '').trim().toLowerCase()
  if (!v) return ''
  const found = (list || []).find((c) => c.value === v)
  return found ? found.label : value
}

export const DEFAULT_PART_CATEGORY = DEFAULT_VALUE
