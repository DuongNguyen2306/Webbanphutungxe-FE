import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import { AdminVariantPriceToolbar } from '../../components/admin/AdminVariantPriceToolbar'
import { AdminVariantPriceTable } from '../../components/admin/AdminVariantPriceTable'
import { AdminVariantPriceSaveBar } from '../../components/admin/AdminVariantPriceSaveBar'

function toNumberOrNull(value) {
  if (value === '' || value == null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function pickPrimaryAttributeName(product) {
  const attrs = Array.isArray(product?.attributes) ? product.attributes : []
  if (attrs[0]?.name) return String(attrs[0].name)
  const firstVariant = Array.isArray(product?.variants) ? product.variants[0] : null
  const firstKey = firstVariant?.attributeValues
    ? Object.keys(firstVariant.attributeValues)[0]
    : ''
  return firstKey || 'phân loại 1'
}

function mapVariantRow(variant, primaryAttributeName) {
  const attributeValues =
    variant?.attributeValues && typeof variant.attributeValues === 'object'
      ? variant.attributeValues
      : {}
  const primaryValue =
    String(attributeValues[primaryAttributeName] || '').trim() ||
    String(Object.values(attributeValues)[0] || '').trim() ||
    'Khác'
  const displayKey =
    String(variant?.displayKey || variant?.key || '').trim() ||
    Object.values(attributeValues).filter(Boolean).join(' / ') ||
    variant?._id
  return {
    variantId: String(variant?._id || variant?.id || ''),
    displayKey: displayKey || 'Biến thể',
    sku: String(variant?.sku || '').trim(),
    price: Number(variant?.price ?? 0),
    originalPrice:
      variant?.originalPrice != null && Number.isFinite(Number(variant.originalPrice))
        ? Number(variant.originalPrice)
        : null,
    primaryValue,
  }
}

function buildRowErrors(draft) {
  const errors = {}
  const priceVal = toNumberOrNull(draft.price)
  if (draft.price === '' || priceVal == null || priceVal < 0) {
    errors.price = 'Giá mới bắt buộc và phải >= 0.'
  }
  const originalPriceVal = toNumberOrNull(draft.originalPrice)
  if (draft.originalPrice !== '' && (originalPriceVal == null || originalPriceVal < 0)) {
    errors.originalPrice = 'Giá gốc mới phải >= 0 nếu có nhập.'
  }
  return errors
}

export function AdminVariantPricesPage() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [productName, setProductName] = useState('')
  const [primaryAttributeName, setPrimaryAttributeName] = useState('phân loại 1')
  const [rows, setRows] = useState([])
  const [filterPrimary, setFilterPrimary] = useState('ALL')
  const [draftById, setDraftById] = useState({})
  const [debouncedDraftById, setDebouncedDraftById] = useState({})
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ message: '', tone: 'success' })

  useEffect(() => {
    const t = setTimeout(() => setDebouncedDraftById(draftById), 220)
    return () => clearTimeout(t)
  }, [draftById])

  useEffect(() => {
    if (!toast.message) return undefined
    const t = setTimeout(
      () => setToast({ message: '', tone: 'success' }),
      2500,
    )
    return () => clearTimeout(t)
  }, [toast.message])

  const loadProduct = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get(`/api/admin/products/${id}`)
      const primaryName = pickPrimaryAttributeName(data)
      const variantRows = (Array.isArray(data?.variants) ? data.variants : [])
        .map((variant) => mapVariantRow(variant, primaryName))
        .filter((row) => row.variantId)
      setProductName(String(data?.name || ''))
      setPrimaryAttributeName(primaryName)
      setRows(variantRows)
      setDraftById({})
      setDebouncedDraftById({})
    } catch (err) {
      setRows([])
      setError(err.response?.data?.message || 'Không tải được danh sách biến thể.')
      setToast({
        message: err.response?.data?.message || 'Không tải được danh sách biến thể.',
        tone: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadProduct()
  }, [loadProduct])

  const originalById = useMemo(
    () => Object.fromEntries(rows.map((row) => [row.variantId, row])),
    [rows],
  )

  const primaryOptions = useMemo(() => {
    const counts = new Map()
    rows.forEach((row) => {
      counts.set(row.primaryValue, (counts.get(row.primaryValue) || 0) + 1)
    })
    return Array.from(counts.entries()).map(([value, count]) => ({ value, count }))
  }, [rows])

  const filteredRows = useMemo(() => {
    if (filterPrimary === 'ALL') return rows
    return rows.filter((row) => row.primaryValue === filterPrimary)
  }, [rows, filterPrimary])

  function resolveInput(variantId, field) {
    const draft = draftById[variantId]
    if (draft && Object.prototype.hasOwnProperty.call(draft, field)) {
      return draft[field]
    }
    const origin = originalById[variantId]
    if (!origin) return ''
    if (field === 'originalPrice') return origin.originalPrice == null ? '' : String(origin.originalPrice)
    return String(origin.price)
  }

  function onInputChange(variantId, field, value) {
    setDraftById((prev) => ({
      ...prev,
      [variantId]: {
        price:
          prev[variantId]?.price ??
          String(originalById[variantId]?.price ?? ''),
        originalPrice:
          prev[variantId]?.originalPrice ??
          (originalById[variantId]?.originalPrice == null
            ? ''
            : String(originalById[variantId].originalPrice)),
        [field]: value,
      },
    }))
  }

  const dirtySet = useMemo(() => {
    const next = new Set()
    Object.entries(draftById).forEach(([variantId, draft]) => {
      const original = originalById[variantId]
      if (!original) return
      const priceNow = toNumberOrNull(draft.price)
      const originalNow = toNumberOrNull(draft.originalPrice)
      if (priceNow !== original.price || originalNow !== original.originalPrice) {
        next.add(variantId)
      }
    })
    return next
  }, [draftById, originalById])

  const rowErrors = useMemo(() => {
    const byId = {}
    Object.entries(debouncedDraftById).forEach(([variantId, draft]) => {
      const original = originalById[variantId]
      if (!original) return
      if (!dirtySet.has(variantId)) return
      const errors = buildRowErrors(draft)
      if (Object.keys(errors).length) byId[variantId] = errors
    })
    return byId
  }, [debouncedDraftById, originalById, dirtySet])

  const hasValidationErrors = Object.keys(rowErrors).length > 0

  function resetRow(variantId) {
    setDraftById((prev) => {
      const next = { ...prev }
      delete next[variantId]
      return next
    })
  }

  function resetAll() {
    setDraftById({})
    setDebouncedDraftById({})
  }

  async function saveAll() {
    if (!id || dirtySet.size === 0 || hasValidationErrors) return
    const variantPrices = Array.from(dirtySet).map((variantId) => {
      const draft = draftById[variantId]
      const price = toNumberOrNull(draft?.price)
      const originalPrice = toNumberOrNull(draft?.originalPrice)
      const payloadRow = {
        variantId,
        price: Number(price),
      }
      if (originalPrice != null) payloadRow.originalPrice = Number(originalPrice)
      return payloadRow
    })
    setSaving(true)
    setError('')
    try {
      await api.patch(`/api/admin/products/${id}/variant-prices`, { variantPrices })
      setToast({ message: 'Lưu giá thành công.', tone: 'success' })
      await loadProduct()
    } catch (err) {
      const message = err.response?.data?.message || 'Không lưu được thay đổi giá.'
      setError(message)
      setToast({ message, tone: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/admin/products" className="text-sm font-semibold text-brand hover:underline">
          ← Danh sách sản phẩm
        </Link>
      </div>

      <AdminVariantPriceToolbar
        productName={productName}
        primaryLabel={primaryAttributeName}
        filterValue={filterPrimary}
        primaryOptions={primaryOptions}
        loading={loading}
        onFilterChange={setFilterPrimary}
      />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-gray-500">Đang tải biến thể...</p>
      ) : (
        <AdminVariantPriceTable
          rows={filteredRows}
          resolveInput={resolveInput}
          dirtySet={dirtySet}
          rowErrors={rowErrors}
          onInputChange={onInputChange}
          onResetRow={resetRow}
        />
      )}

      <AdminVariantPriceSaveBar
        changedCount={dirtySet.size}
        saving={saving}
        disabledSave={saving || dirtySet.size === 0 || hasValidationErrors}
        onResetAll={resetAll}
        onSaveAll={saveAll}
      />

      {toast.message ? (
        <div
          className={`fixed right-4 top-4 z-[120] rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-lg ${
            toast.tone === 'error' ? 'bg-red-600' : 'bg-emerald-600'
          }`}
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  )
}
