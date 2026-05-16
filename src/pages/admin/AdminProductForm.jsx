import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import {
  resolveImageItemsToUrls,
  uploadProductImage,
} from '../../api/productUploadApi'
import {
  ImagePickerField,
  createImageItemsFromUrls,
  revokePreviewUrls,
} from '../../components/ImagePickerField'
import { AdminProductStoreReviewsSection } from '../../components/admin/AdminProductStoreReviewsSection'
import {
  usePartCategories,
  DEFAULT_PART_CATEGORY,
  PART_CATEGORY_OTHER_VALUE,
} from '../../hooks/usePartCategories'

const PART_CATEGORY_NOTE_MAX = 200

const OTHER = '__other__'

const BRAND_PRESET = new Set(['honda', 'vespa', 'yamaha', 'piaggio'])
const VEHICLE_PRESET = new Set(['scooter', 'underbone', 'sportbike'])

function slugifyText(input) {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeNoAccent(input) {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
}

function buildSkuNameCode(productName) {
  const words = normalizeNoAccent(productName)
    .split(/[^A-Z0-9]+/)
    .filter(Boolean)
  if (!words.length) return 'SP'
  return words.map((word) => word[0]).join('')
}

function buildSkuColorCode(color) {
  const upper = normalizeNoAccent(color)
  const words = upper.split(/[^A-Z0-9]+/).filter(Boolean)
  if (!words.length) return 'NON'
  if (words.length >= 2) {
    return words.map((w) => w[0]).join('').slice(0, 6) || 'NON'
  }
  return words[0].slice(0, 5)
}

/**
 * SKU tự sinh: viết tắt tên SP + mã rút gọn từng giá trị thuộc tính (theo thứ tự cột).
 * Hỗ trợ gọi kiểu cũ generateSKU(name, color, size) hoặc generateSKU(name, parts[]).
 */
function generateSKU(productName, colorOrParts, size) {
  const base = buildSkuNameCode(productName)
  let parts = []
  if (Array.isArray(colorOrParts)) {
    parts = colorOrParts
  } else {
    parts = [colorOrParts, size]
  }
  const segs = parts
    .map((p) => String(p ?? '').trim())
    .filter(Boolean)
    .map((p) => buildSkuColorCode(p))
  if (!segs.length) return `${base}-NON-SZ`
  return `${base}-${segs.join('-')}`
}

function nextLocalId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function uniqueCaseInsensitive(values = []) {
  const out = []
  const seen = new Set()
  values.forEach((value) => {
    const clean = String(value || '').trim()
    if (!clean) return
    const key = clean.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    out.push(clean)
  })
  return out
}

function normalizeAttributeSchema(rows = []) {
  const usedNames = new Set()
  return rows.map((row, index) => {
    const nameRaw = String(row?.name ?? '')
    const nameTrimmed = nameRaw.trim()
    const values = uniqueCaseInsensitive(Array.isArray(row?.values) ? row.values : [])
    const base = nameTrimmed || `Phân loại ${index + 1}`
    let key = base
    let suffix = 2
    while (usedNames.has(key.toLowerCase())) {
      key = `${base}-${suffix}`
      suffix += 1
    }
    usedNames.add(key.toLowerCase())
    return {
      id: row?.id || nextLocalId('attr'),
      /** Giữ nguyên khoảng trắng khi gõ (trim chỉ dùng để tạo key / nhãn mặc định, không gán lại ô nhập). */
      name: nameRaw,
      key,
      values,
      draft: String(row?.draft || ''),
    }
  })
}

function defaultVariantKey(attributeValues, attrs) {
  const raw = attrs
    .map((attr) => attributeValues?.[attr.key])
    .map((v) => String(v ?? '').trim())
    .filter(Boolean)
    .join(' - ')
  return raw || `Biến thể ${Math.random().toString(16).slice(2, 6)}`
}

/**
 * Các tổ hợp tag (Descartes) có trong phân loại nhưng không có dòng biến thể từ API —
 * coi như user đã xóa trước đó, để sync không tự sinh lại khi mở form sửa.
 */
function computeDismissedAutoKeysFromApiRows(attrsForVariant, variantRows) {
  const attrs = attrsForVariant.filter((attr) => attr.name.trim())
  const comboAttrs = attrs.filter((attr) => attr.values.length > 0)
  if (!comboAttrs.length || !variantRows.length) return []

  const combos = comboAttrs.reduce(
    (acc, attr) => {
      const next = []
      acc.forEach((base) => {
        attr.values.forEach((value) => {
          next.push({ ...base, [attr.key]: value })
        })
      })
      return next
    },
    [{}],
  )
  const fullComboKeys = new Set(
    combos.map((av) => defaultVariantKey(av, attrs)),
  )
  const presentKeys = new Set(
    variantRows.map((row) => defaultVariantKey(row.attributeValues || {}, attrs)),
  )
  return [...fullComboKeys].filter((k) => !presentKeys.has(k))
}

/** Tên hiển thị preview (vd: Chanh - 100ml) */
function displayVariantLabel(attributeValues, attrs) {
  const parts = attrs
    .map((attr) => String(attributeValues?.[attr.key] ?? '').trim())
    .filter(Boolean)
  return parts.length ? parts.join(' - ') : '—'
}

function splitPreset(raw, presetSet) {
  const s = String(raw || '').toLowerCase()
  if (presetSet.has(s)) return [s, '']
  return [OTHER, String(raw ?? '')]
}

const emptyVariant = () => ({
  _id: '',
  keyPreview: '',
  attributeValues: {},
  sku: '',
  skuManuallyEdited: false,
  price: '',
  originalPrice: '',
  stock: '',
  isAvailable: true,
  variantImages: [],
})

const PRIMARY_ATTRIBUTE_IMAGES_REQUIRED = true

function getPrimaryAttribute(attrs = []) {
  return Array.isArray(attrs) && attrs.length >= 2 ? attrs[0] : null
}

function getPrimaryValueFromRow(row, attrs = []) {
  const primaryAttr = getPrimaryAttribute(attrs)
  if (!primaryAttr) return ''
  return String(row?.attributeValues?.[primaryAttr.key] || '').trim()
}

function collectPrimaryValuesFromRows(rows = [], attrs = []) {
  const seen = new Set()
  const out = []
  rows.forEach((row) => {
    const value = getPrimaryValueFromRow(row, attrs)
    if (!value) return
    const key = value.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    out.push(value)
  })
  return out
}

/**
 * Gom ảnh theo phân loại 1 khi load từ API — cùng cách đặt key như UI (canonical theo dòng đầu / không phân biệt hoa thường).
 * Luôn lấy danh sách slot «đầy» nhất trong các dòng cùng màu (tránh dòng S trống che mất ảnh ở dòng M/L).
 */
function buildPrimaryImageGroupsFromVariants(rows = [], attrs = []) {
  const primaryAttr = getPrimaryAttribute(attrs)
  if (!primaryAttr) return {}
  const canonicalList = collectPrimaryValuesFromRows(rows, attrs)
  const canonicalByLower = new Map(canonicalList.map((v) => [String(v).toLowerCase(), v]))
  const grouped = {}
  for (const canon of canonicalList) {
    grouped[canon] = []
  }
  rows.forEach((row) => {
    const raw = String(row?.attributeValues?.[primaryAttr.key] || '').trim()
    if (!raw) return
    const canon = canonicalByLower.get(raw.toLowerCase()) || raw
    if (!(canon in grouped)) grouped[canon] = []
    const imgs = Array.isArray(row?.variantImages) ? row.variantImages : []
    if (imgs.length > grouped[canon].length) grouped[canon] = imgs
  })
  return grouped
}

function mapImagesByPrimaryAttribute(rows = [], attrs = [], primaryImageGroups = {}) {
  const primaryAttr = getPrimaryAttribute(attrs)
  if (!primaryAttr) return rows
  const canonicalByLower = new Map()
  for (const v of collectPrimaryValuesFromRows(rows, attrs)) {
    canonicalByLower.set(String(v).toLowerCase(), v)
  }
  let changed = false
  const next = rows.map((row) => {
    const valueRaw = String(row?.attributeValues?.[primaryAttr.key] || '').trim()
    if (!valueRaw) {
      const mappedItems = []
      if (row.variantImages === mappedItems) return row
      changed = true
      return { ...row, variantImages: mappedItems }
    }
    const canon = canonicalByLower.get(valueRaw.toLowerCase()) || valueRaw
    const mappedItems = primaryImageGroups[canon] || primaryImageGroups[valueRaw] || []
    if (row.variantImages === mappedItems) return row
    changed = true
    return { ...row, variantImages: mappedItems }
  })
  return changed ? next : rows
}

function resolveOther(selectVal, otherVal, label) {
  if (selectVal === OTHER) {
    const t = otherVal.trim()
    if (!t) throw new Error(`Vui lòng nhập ${label} khi chọn "Khác".`)
    return t
  }
  return selectVal
}

function formatApiError(err) {
  const status = err?.response?.status
  if (status === 403) return 'Cần quyền quản trị.'
  return err?.response?.data?.message || err?.message || 'Có lỗi xảy ra.'
}

function resolveNewArrivalEnabled(data) {
  if (typeof data?.newArrivalEnabled === 'boolean') return data.newArrivalEnabled
  if (typeof data?.isNewArrival === 'boolean') return data.isNewArrival
  if (typeof data?.showInNewArrivals === 'boolean') return data.showInNewArrivals
  return false
}

function resolveNewArrivalOrder(data) {
  const raw = data?.newArrivalOrder ?? data?.newArrivalRank ?? data?.newArrivalPosition ?? 0
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? String(n) : '0'
}

function resolveBestSellerEnabled(data) {
  if (typeof data?.bestSellerEnabled === 'boolean') return data.bestSellerEnabled
  if (typeof data?.isBestSeller === 'boolean') return data.isBestSeller
  if (typeof data?.showInBestSellers === 'boolean') return data.showInBestSellers
  return false
}

function resolveBestSellerOrder(data) {
  const raw = data?.bestSellerOrder ?? data?.bestSellerRank ?? data?.bestSellerPosition ?? 0
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? String(n) : '0'
}

function resolveSoldCount(data) {
  const n = Number(data?.soldCount ?? 0)
  return Number.isFinite(n) && n >= 0 ? String(n) : '0'
}

/** Rê chuột hoặc Tab + focus vào dấu ? để xem hướng dẫn nhanh (tiếng Việt dễ hiểu). */
function QuickGuide({ text }) {
  return (
    <span
      className="group relative ml-1 inline-flex size-[18px] shrink-0 cursor-help items-center justify-center rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-800 ring-1 ring-emerald-200/90"
      tabIndex={0}
      aria-label="Hướng dẫn nhanh"
    >
      ?
      <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-[80] w-[min(17rem,85vw)] -translate-x-1/2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-[11px] font-normal leading-relaxed text-gray-700 shadow-md opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
        {text}
      </span>
    </span>
  )
}

function countPendingFiles(items = []) {
  return items.filter((it) => it?.file instanceof File).length
}

/** Ảnh theo phân loại 1: một nhóm màu = một lần đếm / upload, không nhân theo số dòng (size/SKU). */
function countPendingVariantUploadsUnified({
  hasVariants,
  usePrimaryImageGrouping,
  attributesForVariants,
  variants,
  primaryImageGroups,
  variantPayload,
}) {
  if (!hasVariants) return 0
  const primaryAttr = getPrimaryAttribute(attributesForVariants)
  if (usePrimaryImageGrouping && primaryAttr) {
    return collectPrimaryValuesFromRows(variants, attributesForVariants).reduce(
      (sum, pv) => sum + countPendingFiles(primaryImageGroups[pv] || []),
      0,
    )
  }
  return variantPayload.reduce((s, v) => s + countPendingFiles(v.__imageItems || []), 0)
}

function emptyAttributeRow() {
  return { id: nextLocalId('attr'), name: '', values: [], draft: '' }
}

function buildDefaultAttributes() {
  return [emptyAttributeRow()]
}

export function AdminProductForm() {
  const navigate = useNavigate()
  const { id: editId } = useParams()
  const isEdit = Boolean(editId)

  const [categories, setCategories] = useState([])
  const [categoryInput, setCategoryInput] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState([])
  const [videoUrl, setVideoUrl] = useState('')
  const [brand, setBrand] = useState('honda')
  const [brandOther, setBrandOther] = useState('')
  const [vehicleType, setVehicleType] = useState('scooter')
  const [vehicleTypeOther, setVehicleTypeOther] = useState('')
  const [partCategory, setPartCategory] = useState(DEFAULT_PART_CATEGORY)
  const [partCategoryNote, setPartCategoryNote] = useState('')
  const { partCategories, loading: partCategoriesLoading } = usePartCategories()
  const [showOnStorefront, setShowOnStorefront] = useState(true)
  const [newArrivalEnabled, setNewArrivalEnabled] = useState(false)
  const [newArrivalOrder, setNewArrivalOrder] = useState('0')
  const [bestSellerEnabled, setBestSellerEnabled] = useState(false)
  const [bestSellerOrder, setBestSellerOrder] = useState('0')
  const [soldCount, setSoldCount] = useState('0')
  const [hasVariants, setHasVariants] = useState(true)
  const [attributes, setAttributes] = useState(buildDefaultAttributes)
  const [variants, setVariants] = useState([emptyVariant()])
  const [dismissedAutoVariantKeys, setDismissedAutoVariantKeys] = useState([])
  const [primaryImageGroups, setPrimaryImageGroups] = useState({})
  const [singlePrice, setSinglePrice] = useState('')
  const [singleOriginalPrice, setSingleOriginalPrice] = useState('')
  const [singleStock, setSingleStock] = useState('')
  const [singleSku, setSingleSku] = useState('')
  const [singleSkuManuallyEdited, setSingleSkuManuallyEdited] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [variantErrorRow, setVariantErrorRow] = useState(-1)
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  /** @type {'idle' | 'upload' | 'save'} */
  const [submitPhase, setSubmitPhase] = useState('idle')
  const [bootstrapping, setBootstrapping] = useState(isEdit)
  const imagesRef = useRef([])
  const variantsRef = useRef([emptyVariant()])
  const primaryImageGroupsRef = useRef({})

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  useEffect(() => {
    variantsRef.current = variants
  }, [variants])

  useEffect(() => {
    primaryImageGroupsRef.current = primaryImageGroups
  }, [primaryImageGroups])

  useEffect(() => {
    return () => {
      revokePreviewUrls(imagesRef.current)
      variantsRef.current.forEach((row) => revokePreviewUrls(row.variantImages))
      Object.values(primaryImageGroupsRef.current).forEach((items) => {
        revokePreviewUrls(Array.isArray(items) ? items : [])
      })
    }
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    api
      .get('/api/categories')
      .then((r) => setCategories(r.data))
      .catch(() => setCategories([]))
  }, [])

  function applyProductData(data) {
    revokePreviewUrls(imagesRef.current)
    variantsRef.current.forEach((row) => revokePreviewUrls(row.variantImages))
    Object.values(primaryImageGroupsRef.current).forEach((items) => {
      revokePreviewUrls(Array.isArray(items) ? items : [])
    })
    setName(data.name ?? '')
    setCategoryInput(data.category?.name ?? '')
    setDescription(data.description ?? '')
    setVideoUrl(data.videoUrl != null ? String(data.videoUrl) : '')
    setImages(createImageItemsFromUrls(data.images))
    const [b, bo] = splitPreset(data.brand, BRAND_PRESET)
    setBrand(b)
    setBrandOther(bo)
    const [vt, vto] = splitPreset(data.vehicleType, VEHICLE_PRESET)
    setVehicleType(vt)
    setVehicleTypeOther(vto)
    const pcLoaded = String(data?.partCategory ?? '').trim().toLowerCase() || DEFAULT_PART_CATEGORY
    setPartCategory(pcLoaded)
    setPartCategoryNote(
      pcLoaded === PART_CATEGORY_OTHER_VALUE ? String(data?.partCategoryNote ?? '') : '',
    )
    setShowOnStorefront(data.showOnStorefront !== false)
    setNewArrivalEnabled(resolveNewArrivalEnabled(data))
    setNewArrivalOrder(resolveNewArrivalOrder(data))
    setBestSellerEnabled(resolveBestSellerEnabled(data))
    setBestSellerOrder(resolveBestSellerOrder(data))
    setSoldCount(resolveSoldCount(data))
    const apiHasVariants =
      typeof data?.hasVariants === 'boolean'
        ? data.hasVariants
        : Array.isArray(data?.variants) && data.variants.length > 0
    setHasVariants(apiHasVariants)
    setSinglePrice(String(data?.price ?? data?.salePrice ?? data?.basePrice ?? ''))
    setSingleOriginalPrice(
      data?.originalPrice != null && data.originalPrice !== '' ? String(data.originalPrice) : '',
    )
    setSingleStock(
      data?.stock != null ? String(data.stock) : data?.stockQuantity != null ? String(data.stockQuantity) : '',
    )
    setSingleSku(String(data?.sku ?? ''))
    setSingleSkuManuallyEdited(Boolean(data?.sku))

    let rawAttrs = Array.isArray(data.attributes) ? data.attributes : []
    if (!rawAttrs.length && Array.isArray(data.variants)) {
      const inferMap = [
        { name: 'Loại', key: 'typeName' },
        { name: 'Màu sắc', key: 'color' },
        { name: 'Kích thước', key: 'size' },
      ]
      rawAttrs = inferMap
        .map((item) => {
          const values = uniqueCaseInsensitive(data.variants.map((v) => v?.[item.key]).filter(Boolean))
          return values.length ? { name: item.name, values } : null
        })
        .filter(Boolean)
    }

    const normalizedAttrs = normalizeAttributeSchema(
      rawAttrs.map((attr) => ({
        id: nextLocalId('attr'),
        name: attr?.name || '',
        values: Array.isArray(attr?.values) ? attr.values : [],
        draft: '',
      })),
    )
    const attrsForUI = normalizedAttrs.length ? normalizedAttrs : [emptyAttributeRow()]
    setAttributes(attrsForUI)

    const attrsForVariant = attrsForUI
    const legacyAttrKeyMap = {
      typeName: attrsForVariant[0]?.key,
      color: attrsForVariant[1]?.key,
      size: attrsForVariant[2]?.key,
    }
    const preparedVariants =
      Array.isArray(data.variants) && data.variants.length
        ? data.variants.map((v) => {
            const fromApiValues =
              v?.attributeValues && typeof v.attributeValues === 'object'
                ? v.attributeValues
                : {}
            const legacyValues = {}
            if (legacyAttrKeyMap.typeName && v?.typeName) legacyValues[legacyAttrKeyMap.typeName] = String(v.typeName)
            if (legacyAttrKeyMap.color && v?.color) legacyValues[legacyAttrKeyMap.color] = String(v.color)
            if (legacyAttrKeyMap.size && v?.size) legacyValues[legacyAttrKeyMap.size] = String(v.size)
            const attributeValues = { ...legacyValues, ...fromApiValues }
            const variantKey = String(v?.key || defaultVariantKey(attributeValues, attrsForVariant))
            const variantImages = createImageItemsFromUrls(
              Array.isArray(v?.images) && v.images.length ? v.images : v?.image ? [v.image] : [],
            )
            return {
              _id: v?._id ? String(v._id) : '',
              keyPreview: variantKey,
              attributeValues,
              sku: v?.sku ?? '',
              skuManuallyEdited: Boolean(v?.sku),
              price: String(v?.price ?? ''),
              originalPrice:
                v?.originalPrice != null && v.originalPrice !== '' ? String(v.originalPrice) : '',
              stock:
                v?.stock != null ? String(v.stock) : v?.stockQuantity != null ? String(v.stockQuantity) : '',
              isAvailable: v?.isAvailable !== false,
              variantImages,
            }
          })
        : [emptyVariant()]
    const initialPrimaryGroups = buildPrimaryImageGroupsFromVariants(
      preparedVariants,
      attrsForVariant,
    )
    setPrimaryImageGroups(initialPrimaryGroups)
    setVariants(
      mapImagesByPrimaryAttribute(
        preparedVariants,
        attrsForVariant,
        initialPrimaryGroups,
      ),
    )
    const loadedVariantCount = Array.isArray(data.variants) ? data.variants.length : 0
    const attrsForKeys = attrsForUI.filter((attr) => attr.name.trim())
    setDismissedAutoVariantKeys(
      apiHasVariants && loadedVariantCount > 0
        ? computeDismissedAutoKeysFromApiRows(attrsForKeys, preparedVariants)
        : [],
    )
  }

  useEffect(() => {
    if (!editId) return
    let cancel = false
    setBootstrapping(true)
    setError('')
    api
      .get(`/api/admin/products/${editId}`)
      .then(({ data }) => {
        if (cancel) return
        applyProductData(data)
        setBootstrapping(false)
      })
      .catch(() => {
        if (cancel) return
        setError('Không tải được sản phẩm hoặc không có quyền.')
        setBootstrapping(false)
      })
    return () => {
      cancel = true
    }
  }, [editId])

  const normalizedAttributes = useMemo(
    () => normalizeAttributeSchema(attributes),
    [attributes],
  )

  const attributesForVariants = useMemo(
    () => normalizedAttributes.filter((attr) => attr.name.trim()),
    [normalizedAttributes],
  )

  /** Chỉ dùng cho nút Sinh tổ hợp: mỗi thuộc tính cần có ít nhất 1 tag */
  const comboAttributes = useMemo(
    () => attributesForVariants.filter((attr) => attr.values.length > 0),
    [attributesForVariants],
  )

  /** Có cột phân loại được khai báo tên nhưng chưa thêm tag — chỉ dùng cho banner nhắc nhẹ, không chặn sync. */
  const draftAttributeNames = useMemo(
    () =>
      attributesForVariants
        .filter((attr) => attr.values.length === 0)
        .map((attr) => attr.name)
        .filter(Boolean),
    [attributesForVariants],
  )

  const autoComboKeySet = useMemo(() => {
    if (!comboAttributes.length) return new Set()
    const combos = comboAttributes.reduce(
      (acc, attr) => {
        const next = []
        acc.forEach((base) => {
          attr.values.forEach((value) => {
            next.push({ ...base, [attr.key]: value })
          })
        })
        return next
      },
      [{}],
    )
    return new Set(combos.map((attributeValues) => defaultVariantKey(attributeValues, attributesForVariants)))
  }, [comboAttributes, attributesForVariants])

  const usePrimaryImageGrouping = useMemo(
    () => hasVariants && attributesForVariants.length >= 2,
    [hasVariants, attributesForVariants.length],
  )

  const primaryAttribute = useMemo(
    () => getPrimaryAttribute(attributesForVariants),
    [attributesForVariants],
  )

  const primaryValuesInRows = useMemo(
    () => collectPrimaryValuesFromRows(variants, attributesForVariants),
    [variants, attributesForVariants],
  )

  const buildSkuForRow = useCallback(
    (row) => {
      const parts = attributesForVariants.map((attr) =>
        String(row?.attributeValues?.[attr.key] || '').trim(),
      )
      return generateSKU(name, parts)
    },
    [name, attributesForVariants],
  )

  const handleUploadImageFromGoogleDrive = useCallback(async (googleDriveUrl) => {
    const secureUrl = await uploadProductImage({ googleDriveUrl })
    setToast('Đã thêm ảnh từ Google Drive.')
    return secureUrl
  }, [])

  const handleImportImagesFromDrivePicker = useCallback(async (pickedFiles) => {
    const driveItems = Array.isArray(pickedFiles) ? pickedFiles : []
    if (!driveItems.length) return []
    const uploaded = []
    for (const item of driveItems) {
      if (item?.file instanceof File || item?.blobFile instanceof File) {
        const url = await uploadProductImage(item.file || item.blobFile)
        if (url) uploaded.push(url)
        continue
      }
      throw new Error(
        'Không lấy được file ảnh từ Google Drive. Vui lòng chọn lại ảnh trong Drive hoặc thử ảnh khác.',
      )
    }
    const urls = uploaded.filter(Boolean)
    if (!urls.length) return []
    setToast(`Đã import ${urls.length} ảnh từ Google Drive.`)
    return urls
  }, [])

  useEffect(() => {
    const keys = attributesForVariants.map((attr) => attr.key)
    setVariants((prev) => {
      let changed = false
      const next = prev.map((row) => {
        const nextAttributeValues = {}
        keys.forEach((key) => {
          nextAttributeValues[key] = String(row.attributeValues?.[key] || '')
        })
        const prevValues = row.attributeValues || {}
        const same =
          Object.keys(prevValues).length === keys.length &&
          keys.every((key) => String(prevValues[key] || '') === nextAttributeValues[key])
        if (same) return row
        changed = true
        return { ...row, attributeValues: nextAttributeValues }
      })
      return changed ? next : prev
    })
  }, [attributesForVariants])

  useEffect(() => {
    if (!name.trim()) return
    setVariants((prev) =>
      prev.map((row) => {
        if (row.skuManuallyEdited) return row
        if (String(row.sku || '').trim()) return row
        return { ...row, sku: buildSkuForRow(row) }
      }),
    )
  }, [name, buildSkuForRow])

  useEffect(() => {
    if (!usePrimaryImageGrouping) return
    setVariants((prev) =>
      mapImagesByPrimaryAttribute(prev, attributesForVariants, primaryImageGroups),
    )
  }, [
    usePrimaryImageGrouping,
    attributesForVariants,
    primaryImageGroups,
  ])

  useEffect(() => {
    if (!usePrimaryImageGrouping) {
      if (Object.keys(primaryImageGroupsRef.current).length) {
        Object.values(primaryImageGroupsRef.current).forEach((items) => {
          revokePreviewUrls(Array.isArray(items) ? items : [])
        })
        setPrimaryImageGroups({})
      }
      return
    }
    const allowed = new Set(primaryValuesInRows.map((value) => value.toLowerCase()))
    setPrimaryImageGroups((prev) => {
      let changed = false
      const next = {}
      Object.entries(prev).forEach(([value, items]) => {
        if (allowed.has(value.toLowerCase())) {
          next[value] = items
        } else {
          changed = true
          revokePreviewUrls(Array.isArray(items) ? items : [])
        }
      })
      return changed ? next : prev
    })
  }, [usePrimaryImageGrouping, primaryValuesInRows])

  function updateRow(i, patch) {
    if (variantErrorRow === i) setVariantErrorRow(-1)
    setVariants((v) => v.map((row, j) => (j === i ? { ...row, ...patch } : row)))
  }

  function handleAttributeValueChange(rowIndex, attrKey, value) {
    setVariants((prev) =>
      prev.map((row, idx) => {
        if (idx !== rowIndex) return row
        const nextAttributeValues = {
          ...(row.attributeValues || {}),
          [attrKey]: value,
        }
        let nextRow = { ...row, attributeValues: nextAttributeValues }
        if (usePrimaryImageGrouping) {
          nextRow = mapImagesByPrimaryAttribute(
            [nextRow],
            attributesForVariants,
            primaryImageGroups,
          )[0]
        }
        if (row.skuManuallyEdited) return nextRow
        return { ...nextRow, sku: buildSkuForRow(nextRow) }
      }),
    )
  }

  function addManualVariantRow() {
    const baseValues = {}
    attributesForVariants.forEach((attr) => {
      baseValues[attr.key] = ''
    })
    const row = mapImagesByPrimaryAttribute(
      [{ ...emptyVariant(), attributeValues: baseValues }],
      attributesForVariants,
      primaryImageGroups,
    )[0]
    setVariants((prev) => [
      ...prev,
      {
        ...row,
        sku: buildSkuForRow(row),
      },
    ])
  }

  function removeVariantRow(index) {
    const target = variants[index]
    const targetKey = defaultVariantKey(target?.attributeValues || {}, attributesForVariants)
    if (autoComboKeySet.has(targetKey)) {
      setDismissedAutoVariantKeys((prev) =>
        prev.includes(targetKey) ? prev : [...prev, targetKey],
      )
    }
    setVariants((prev) => {
      const current = prev[index]
      if (current?.variantImages?.length) revokePreviewUrls(current.variantImages)
      return prev.filter((_, i) => i !== index)
    })
  }

  function clearAllVariantRows() {
    if (!variants.length) return
    if (
      !window.confirm(
        'Xóa hết tất cả các dòng biến thể? Ảnh tạm (chưa lưu) sẽ được gỡ. Sau đó còn một dòng trống để nhập lại.',
      )
    ) {
      return
    }
    for (const row of variants) {
      if (row?.variantImages?.length) revokePreviewUrls(row.variantImages)
    }
    if (usePrimaryImageGrouping) {
      Object.values(primaryImageGroups || {}).forEach((items) => {
        if (Array.isArray(items) && items.length) revokePreviewUrls(items)
      })
      setPrimaryImageGroups({})
    }
    setDismissedAutoVariantKeys(Array.from(autoComboKeySet))
    const baseValues = {}
    attributesForVariants.forEach((attr) => {
      baseValues[attr.key] = ''
    })
    const row = mapImagesByPrimaryAttribute(
      [{ ...emptyVariant(), attributeValues: baseValues }],
      attributesForVariants,
      {},
    )[0]
    setVariants([
      {
        ...row,
        sku: buildSkuForRow(row),
      },
    ])
    setVariantErrorRow(-1)
  }

  function toggleHasVariants() {
    setHasVariants((prev) => {
      const next = !prev
      if (next) {
        setVariants((rows) => (rows.length ? rows : [emptyVariant()]))
      } else {
        setDismissedAutoVariantKeys([])
      }
      return next
    })
  }

  function updateAttribute(id, patch) {
    setAttributes((prev) => prev.map((attr) => (attr.id === id ? { ...attr, ...patch } : attr)))
  }

  function pushAttributeValue(id, rawValue) {
    const clean = String(rawValue || '').trim()
    if (!clean) return
    setAttributes((prev) =>
      prev.map((attr) => {
        if (attr.id !== id) return attr
        const values = uniqueCaseInsensitive([...attr.values, clean])
        return { ...attr, values, draft: '' }
      }),
    )
  }

  function removeAttributeValue(id, value) {
    setAttributes((prev) =>
      prev.map((attr) =>
        attr.id === id
          ? { ...attr, values: attr.values.filter((item) => item !== value) }
          : attr,
      ),
    )
  }

  function addAttributeRow() {
    setAttributes((prev) => [...prev, emptyAttributeRow()])
  }

  function removeAttributeRow(id) {
    setAttributes((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((attr) => attr.id !== id)
    })
  }

  const syncVariantRowsFromAttributes = useCallback(
    ({ silent = false, respectDismissed = true } = {}) => {
      if (!comboAttributes.length) {
        if (!silent) {
          setToast('Mỗi cột phân loại cần có ít nhất một lựa chọn (ô màu đỏ, xanh…) rồi mới tạo danh sách nhanh được nhé.')
        }
        return
      }

      const combos = comboAttributes.reduce(
        (acc, attr) => {
          const next = []
          acc.forEach((base) => {
            attr.values.forEach((value) => {
              next.push({ ...base, [attr.key]: value })
            })
          })
          return next
        },
        [{}],
      )

      setVariants((prev) => {
        const byCombo = new Map(
          prev.map((row) => [defaultVariantKey(row.attributeValues || {}, attributesForVariants), row]),
        )
        const dismissedSet =
          respectDismissed && dismissedAutoVariantKeys.length
            ? new Set(dismissedAutoVariantKeys)
            : null

        const generatedRows = combos
          .map((attributeValues) => {
            const comboKey = defaultVariantKey(attributeValues, attributesForVariants)
            const existed = byCombo.get(comboKey)
            /** Merge để giữ giá trị user đã gõ tay vào các cột "nháp" (chưa có tag). */
            const mergedValues = existed
              ? { ...existed.attributeValues, ...attributeValues }
              : attributeValues
            const nextRow = { ...emptyVariant(), attributeValues: mergedValues, keyPreview: comboKey }
            if (existed) {
              return {
                ...existed,
                attributeValues: mergedValues,
                keyPreview: comboKey,
                sku: existed.skuManuallyEdited
                  ? existed.sku
                  : buildSkuForRow({ ...existed, attributeValues: mergedValues }),
              }
            }
            return {
              ...nextRow,
              sku: buildSkuForRow(nextRow),
            }
          })
          .filter((row) => !dismissedSet?.has(defaultVariantKey(row.attributeValues || {}, attributesForVariants)))

        const manualExtras = prev.filter((row) => {
          const key = defaultVariantKey(row.attributeValues || {}, attributesForVariants)
          if (!autoComboKeySet.has(key)) return true
          if (dismissedSet?.has(key)) return true
          return false
        })
        const mergedRows = [...generatedRows, ...manualExtras]
        return mapImagesByPrimaryAttribute(mergedRows, attributesForVariants, primaryImageGroups)
      })
    },
    [
      attributesForVariants,
      buildSkuForRow,
      comboAttributes,
      autoComboKeySet,
      dismissedAutoVariantKeys,
      primaryImageGroups,
    ],
  )

  useEffect(() => {
    if (!hasVariants) return
    syncVariantRowsFromAttributes({ silent: true, respectDismissed: true })
  }, [hasVariants, syncVariantRowsFromAttributes])

  useEffect(() => {
    if (!dismissedAutoVariantKeys.length) return
    setDismissedAutoVariantKeys((prev) =>
      prev.filter((key) => autoComboKeySet.has(key)),
    )
  }, [autoComboKeySet, dismissedAutoVariantKeys.length])

  useEffect(() => {
    if (!name.trim()) return
    if (hasVariants) return
    setSingleSku((prev) => {
      if (singleSkuManuallyEdited) return prev
      if (String(prev || '').trim()) return prev
      return generateSKU(name, [])
    })
  }, [name, hasVariants, singleSkuManuallyEdited])

  useEffect(() => {
    const cat = String(categoryInput || '').trim().toLowerCase()
    if (!cat.includes('ốc')) return
    setAttributes((prev) => {
      if (!prev.length) return prev
      const next = [...prev]
      if (next[0]) next[0] = { ...next[0], name: next[0].name || 'Màu sắc' }
      if (next[1]) next[1] = { ...next[1], name: next[1].name || 'Chân ren' }
      return next
    })
  }, [categoryInput])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setVariantErrorRow(-1)
    if (!name.trim()) {
      setError('Tên sản phẩm là bắt buộc.')
      return
    }
    const cat = categoryInput.trim()
    if (!cat) {
      setError('Chọn hoặc nhập danh mục.')
      return
    }

    const parsedSoldCount = Number(soldCount)
    if (!Number.isFinite(parsedSoldCount) || parsedSoldCount < 0) {
      setError('Số lượng đã bán hiển thị phải là số không âm.')
      return
    }

    const parsedNewArrivalOrder = Number(newArrivalOrder)
    if (!Number.isFinite(parsedNewArrivalOrder) || parsedNewArrivalOrder < 0) {
      setError('Thứ tự hàng mới về phải là số không âm.')
      return
    }

    const parsedBestSellerOrder = Number(bestSellerOrder)
    if (!Number.isFinite(parsedBestSellerOrder) || parsedBestSellerOrder < 0) {
      setError('Thứ tự bán chạy phải là số không âm.')
      return
    }

    let brandFinal
    let vehicleTypeFinal
    try {
      brandFinal = resolveOther(brand, brandOther, 'hãng xe')
      vehicleTypeFinal = resolveOther(vehicleType, vehicleTypeOther, 'loại xe')
    } catch (err) {
      setError(err.message)
      return
    }
    const partCategoryFinal = String(partCategory || '').trim().toLowerCase()
    if (!partCategoryFinal) {
      setError('Vui lòng chọn loại phụ tùng.')
      return
    }
    const partCategoryNoteTrimmed =
      partCategoryFinal === PART_CATEGORY_OTHER_VALUE
        ? String(partCategoryNote || '').trim()
        : ''
    if (partCategoryNoteTrimmed.length > PART_CATEGORY_NOTE_MAX) {
      setError(
        `Ghi chú loại «Khác» tối đa ${PART_CATEGORY_NOTE_MAX} ký tự (sau khi bỏ khoảng trắng đầu/cuối).`,
      )
      return
    }

    if (!hasVariants) {
      if (singlePrice === '' || Number.isNaN(Number(singlePrice)) || Number(singlePrice) < 0) {
        setError('Giá bán không hợp lệ.')
        return
      }
      if (
        singleOriginalPrice !== '' &&
        (Number.isNaN(Number(singleOriginalPrice)) || Number(singleOriginalPrice) < 0)
      ) {
        setError('Giá gốc không hợp lệ.')
        return
      }
      if (singleStock !== '' && singleStock != null && (Number.isNaN(Number(singleStock)) || Number(singleStock) < 0)) {
        setError('Số lượng tồn kho không hợp lệ.')
        return
      }
    }

    let variantPayload = []
    if (hasVariants) {
      if (normalizedAttributes.some((attr) => !attr.name.trim() && attr.values.length > 0)) {
        setError('Có cột phân loại đã có lựa chọn nhưng chưa đặt tên cột. Đặt tên (vd: Màu sắc) hoặc xóa hết lựa chọn trong cột đó.')
        return
      }
      if (!attributesForVariants.length) {
        setError('Hãy thêm ít nhất một nhóm phân loại và gõ tên cột (vd: Màu sắc, Size).')
        return
      }
      if (!variants.length) {
        setError('Chưa có dòng hàng nào. Hãy nhập lựa chọn ở phần phân loại phía trên hoặc bấm «+ Thêm một loại thủ công».')
        return
      }

      const comboSet = new Set()
      const missingPrimaryImageValues = new Set()
      const primaryAttr = getPrimaryAttribute(attributesForVariants)
      const canonicalPrimaryByLower = new Map(
        collectPrimaryValuesFromRows(variants, attributesForVariants).map((v) => [
          String(v).toLowerCase(),
          v,
        ]),
      )
      for (let idx = 0; idx < variants.length; idx += 1) {
        const row = variants[idx]
        const rowNo = idx + 1
        if (row.price === '' || Number.isNaN(Number(row.price)) || Number(row.price) < 0) {
          setVariantErrorRow(idx)
          setToast(`Dòng số ${rowNo}: Bạn chưa nhập giá bán (hoặc giá chưa đúng).`)
          setError(`Dòng số ${rowNo}: Bạn chưa nhập giá bán.`)
          return
        }
        if (!String(row.sku || '').trim()) {
          setVariantErrorRow(idx)
          setToast(`Dòng số ${rowNo}: Thiếu mã SKU — gõ mã hoặc bấm ↻ để tự tạo.`)
          setError(`Dòng số ${rowNo}: Bạn chưa nhập mã SKU.`)
          return
        }
        if (
          row.originalPrice !== '' &&
          (Number.isNaN(Number(row.originalPrice)) || Number(row.originalPrice) < 0)
        ) {
          setVariantErrorRow(idx)
          setToast(`Dòng số ${rowNo}: Giá gốc (gạch ngang) chưa đúng — để trống nếu không dùng.`)
          setError(`Dòng số ${rowNo}: Giá gốc chưa đúng, kiểm tra lại giúp mình nhé.`)
          return
        }
        if (row.stock !== '' && row.stock != null && (Number.isNaN(Number(row.stock)) || Number(row.stock) < 0)) {
          setVariantErrorRow(idx)
          setToast(`Dòng số ${rowNo}: Số lượng tồn chưa đúng — chỉ gõ số, hoặc để trống = không giới hạn.`)
          setError(`Dòng số ${rowNo}: Số lượng tồn chưa đúng.`)
          return
        }
        const attributeValues = {}
        for (const attr of attributesForVariants) {
          const value = String(row.attributeValues?.[attr.key] || '').trim()
          /** Cột phân loại chưa có tag = "nháp" → không bắt buộc, vẫn lưu nếu user gõ tay. */
          const isRequired = attr.values.length > 0
          if (!value) {
            if (isRequired) {
              setVariantErrorRow(idx)
              setToast(`Dòng số ${rowNo}: Chưa chọn «${attr.name || 'phân loại'}».`)
              setError(`Dòng số ${rowNo}: Bạn chưa điền đủ phân loại «${attr.name}».`)
              return
            }
            continue
          }
          attributeValues[attr.name] = value
        }
        const comboDisplayKey = attributesForVariants
          .map((attr) => attributeValues[attr.name])
          .filter(Boolean)
          .join(' / ')
        const comboNormalized = comboDisplayKey.toLowerCase()
        if (comboSet.has(comboNormalized)) {
          setVariantErrorRow(idx)
          setToast(`Dòng số ${rowNo}: Trùng với dòng khác (${comboDisplayKey}).`)
          setError(`Dòng số ${rowNo}: Trùng loại hàng với một dòng phía trên — sửa màu/size cho khác nhau.`)
          return
        }
        comboSet.add(comboNormalized)

        const variant = {
          attributeValues,
          sku: String(row.sku || '').trim(),
          price: Number(row.price),
          originalPrice: row.originalPrice === '' ? undefined : Number(row.originalPrice),
          isAvailable: Boolean(row.isAvailable),
          image: '',
          images: undefined,
        }
        const rowPrimaryRaw = primaryAttr ? String(row.attributeValues?.[primaryAttr.key] || '').trim() : ''
        const rowPrimaryValue =
          usePrimaryImageGrouping && rowPrimaryRaw
            ? canonicalPrimaryByLower.get(rowPrimaryRaw.toLowerCase()) || rowPrimaryRaw
            : rowPrimaryRaw
        const resolvedImageItems =
          usePrimaryImageGrouping && rowPrimaryValue
            ? primaryImageGroups[rowPrimaryValue] ||
                (rowPrimaryRaw ? primaryImageGroups[rowPrimaryRaw] : undefined) ||
                []
            : row.variantImages
        if (
          usePrimaryImageGrouping &&
          PRIMARY_ATTRIBUTE_IMAGES_REQUIRED &&
          rowPrimaryValue &&
          (!Array.isArray(resolvedImageItems) || resolvedImageItems.length === 0)
        ) {
          missingPrimaryImageValues.add(rowPrimaryValue)
        }
        if (row.stock !== '' && row.stock != null && !Number.isNaN(Number(row.stock))) {
          variant.stock = Number(row.stock)
        }
        if (row._id) variant._id = row._id
        variantPayload.push({ ...variant, __imageItems: resolvedImageItems || [] })
      }
      if (missingPrimaryImageValues.size > 0) {
        const missingList = Array.from(missingPrimaryImageValues).join(', ')
        setError(
          `Thiếu ảnh cho ${primaryAttr?.name || 'phân loại 1'}: ${missingList}.`,
        )
        setToast(
          `Vui lòng bổ sung ảnh theo nhóm ${primaryAttr?.name || 'phân loại 1'} trước khi lưu.`,
        )
        return
      }
    }

    setSaving(true)
    setSubmitPhase('upload')

    const totalUploads =
      countPendingFiles(images) +
      countPendingVariantUploadsUnified({
        hasVariants,
        usePrimaryImageGrouping,
        attributesForVariants,
        variants,
        primaryImageGroups,
        variantPayload,
      })

    let doneUploads = 0
    setUploadProgress(totalUploads > 0 ? { current: 0, total: totalUploads } : null)

    try {
      const bumpUpload = () => {
        doneUploads += 1
        setUploadProgress({ current: doneUploads, total: totalUploads })
      }

      const productImages = await resolveImageItemsToUrls(images, {
        onFileUploaded: bumpUpload,
      })

      let variantsWithImages = []
      if (hasVariants) {
        const primaryAttrUpload = getPrimaryAttribute(attributesForVariants)
        if (usePrimaryImageGrouping && primaryAttrUpload) {
          const primaryValuesInOrder = collectPrimaryValuesFromRows(variants, attributesForVariants)
          const canonicalPrimaryByLower = new Map(
            primaryValuesInOrder.map((v) => [String(v).toLowerCase(), v]),
          )
          const urlsByPrimary = {}
          for (const pv of primaryValuesInOrder) {
            urlsByPrimary[pv] = await resolveImageItemsToUrls(primaryImageGroups[pv] || [], {
              onFileUploaded: bumpUpload,
            })
          }
          variantsWithImages = variantPayload.map((variant, idx) => {
            const row = variants[idx]
            const pvRaw = String(row.attributeValues?.[primaryAttrUpload.key] || '').trim()
            const pv = canonicalPrimaryByLower.get(pvRaw.toLowerCase()) || pvRaw
            const uploadedImages = urlsByPrimary[pv] || []
            const { __imageItems, ...cleanVariant } = variant
            return {
              ...cleanVariant,
              images: uploadedImages,
              image: uploadedImages[0] || '',
            }
          })
        } else {
          variantsWithImages = await Promise.all(
            variantPayload.map(async (variant) => {
              const uploadedImages = await resolveImageItemsToUrls(variant.__imageItems || [], {
                onFileUploaded: bumpUpload,
              })
              const { __imageItems, ...cleanVariant } = variant
              return {
                ...cleanVariant,
                images: uploadedImages,
                image: uploadedImages[0] || '',
              }
            }),
          )
        }
      }

      setUploadProgress(null)
      setSubmitPhase('save')

      const resolvedSingleSku = !hasVariants
        ? String(singleSku || '').trim() || generateSKU(name, [])
        : ''

      const payload = {
        name: name.trim(),
        category: cat,
        description,
        images: productImages,
        brand: brandFinal,
        vehicleType: vehicleTypeFinal,
        partCategory: partCategoryFinal,
        ...(partCategoryFinal === PART_CATEGORY_OTHER_VALUE
          ? { partCategoryNote: partCategoryNoteTrimmed }
          : {}),
        showOnStorefront,
        newArrivalEnabled,
        newArrivalOrder: parsedNewArrivalOrder,
        isNewArrival: newArrivalEnabled,
        showInNewArrivals: newArrivalEnabled,
        newArrivalRank: parsedNewArrivalOrder,
        newArrivalPosition: parsedNewArrivalOrder,
        bestSellerEnabled,
        bestSellerOrder: parsedBestSellerOrder,
        soldCount: parsedSoldCount,
        videoUrl: String(videoUrl || '').trim(),
        isBestSeller: bestSellerEnabled,
        showInBestSellers: bestSellerEnabled,
        bestSellerRank: parsedBestSellerOrder,
        bestSellerPosition: parsedBestSellerOrder,
        hasVariants,
        price: !hasVariants ? Number(singlePrice) : undefined,
        originalPrice:
          !hasVariants && singleOriginalPrice !== '' ? Number(singleOriginalPrice) : undefined,
        stock:
          !hasVariants && singleStock !== '' && singleStock != null
            ? Number(singleStock)
            : undefined,
        sku: !hasVariants ? resolvedSingleSku : undefined,
        attributes: hasVariants
          ? attributesForVariants.map((attr) => {
              const fromRows = variants
                .map((row) => String(row.attributeValues?.[attr.key] || '').trim())
                .filter(Boolean)
              return {
                name: attr.name,
                values: uniqueCaseInsensitive([...(attr.values || []), ...fromRows]),
              }
            })
          : [],
        variants: hasVariants ? variantsWithImages : [],
      }

      if (isEdit) {
        await api.put(`/api/admin/products/${editId}`, payload)
        navigate('/admin/products')
      } else {
        await api.post('/api/admin/products', payload)
        navigate('/admin/products')
      }
    } catch (err) {
      const message = formatApiError(err)
      const rowMatch = String(message).match(/dòng\s*#?\s*(\d+)/i)
      if (rowMatch) {
        const idx = Number(rowMatch[1]) - 1
        if (Number.isInteger(idx) && idx >= 0) setVariantErrorRow(idx)
      }
      setError(message)
    } finally {
      setSaving(false)
      setSubmitPhase('idle')
      setUploadProgress(null)
    }
  }

  const field =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20'

  const youtubeLinkInput = (
    <div className="mt-4 space-y-1.5">
      <label className="text-xs font-semibold text-gray-700">
        Link video YouTube (tuỳ chọn)
      </label>
      <input
        type="url"
        inputMode="url"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        placeholder="https://www.youtube.com/watch?v=... hoặc https://youtu.be/..."
        className={field}
      />
      <p className="text-xs text-gray-500">
        Dán link đầy đủ; để trống nếu không có video. Không dùng ô này cho ảnh.
      </p>
    </div>
  )

  if (bootstrapping) {
    return (
      <div>
        <Link to="/admin/products" className="text-sm font-semibold text-brand hover:underline">
          ← Danh sách
        </Link>
        <p className="mt-8 text-sm text-gray-600">Đang tải sản phẩm...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link to="/admin/products" className="text-sm font-semibold text-brand hover:underline">
          ← Danh sách
        </Link>
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
        {isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-5 rounded-xl border border-gray-200 bg-white p-6 pb-8 shadow-sm sm:pb-10"
      >
        <input
          required
          placeholder="Tên sản phẩm *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={field}
        />

        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Danh mục (chọn hoặc gõ mới)
          </label>
          <input
            list="admin-cat-list"
            required
            value={categoryInput}
            onChange={(e) => setCategoryInput(e.target.value)}
            className={`mt-1 ${field}`}
            placeholder="VD: Vespa, Phụ tùng Honda..."
          />
          <datalist id="admin-cat-list">
            {categories.map((c) => (
              <option key={c._id} value={c.name} />
            ))}
          </datalist>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-3 text-sm text-gray-800">
          <input
            type="checkbox"
            className="mt-0.5 size-4 rounded border-gray-300 text-brand focus:ring-brand"
            checked={showOnStorefront}
            onChange={(e) => setShowOnStorefront(e.target.checked)}
          />
          <span>
            <span className="font-semibold">Hiện trên cửa hàng</span>
            <span className="mt-0.5 block text-xs text-gray-600">
              Tắt nếu muốn ẩn khỏi trang chủ và danh sách sản phẩm công khai.
            </span>
          </span>
        </label>

        <div className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50/70 p-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-gray-800 sm:col-span-2">
            <input
              type="checkbox"
              className="mt-0.5 size-4 rounded border-gray-300 text-brand focus:ring-brand"
              checked={newArrivalEnabled}
              onChange={(e) => setNewArrivalEnabled(e.target.checked)}
            />
            <span>
              <span className="font-semibold">Hiển thị trong Hàng mới về</span>
              <span className="mt-0.5 block text-xs text-gray-600">
                Bật để SP xuất hiện ở block/menu hàng mới về. Không thay danh mục menu (Honda, Phụ kiện…).
              </span>
            </span>
          </label>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              Thứ tự hàng mới về
            </label>
            <input
              type="number"
              min={0}
              value={newArrivalOrder}
              onChange={(e) => setNewArrivalOrder(e.target.value)}
              className={field}
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50/70 p-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-gray-800 sm:col-span-2">
            <input
              type="checkbox"
              className="mt-0.5 size-4 rounded border-gray-300 text-brand focus:ring-brand"
              checked={bestSellerEnabled}
              onChange={(e) => setBestSellerEnabled(e.target.checked)}
            />
            <span>
              <span className="font-semibold">Hiển thị trong sản phẩm bán chạy</span>
              <span className="mt-0.5 block text-xs text-gray-600">
                Tắt mục này thì sản phẩm không xuất hiện ở danh sách bán chạy dù vẫn lưu số bán và thứ tự.
              </span>
            </span>
          </label>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              Thứ tự bán chạy
            </label>
            <input
              type="number"
              min={0}
              value={bestSellerOrder}
              onChange={(e) => setBestSellerOrder(e.target.value)}
              className={field}
              placeholder="0"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              Số lượng đã bán hiển thị
            </label>
            <input
              type="number"
              min={0}
              value={soldCount}
              onChange={(e) => setSoldCount(e.target.value)}
              className={field}
              placeholder="0"
            />
          </div>
        </div>

        {isEdit && editId ? (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
              Đánh giá cửa hàng
            </p>
            <AdminProductStoreReviewsSection productId={editId} />
          </div>
        ) : null}

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="flex flex-wrap items-center text-sm font-bold text-gray-900">
                Sản phẩm này có nhiều phiên bản (màu, size...)?
                <QuickGuide text="Bật khi một mặt hàng có nhiều kiểu bán (vd: đỏ/xanh, size M/L). Tắt khi chỉ bán một kiểu duy nhất — khi đó bạn nhập giá và ảnh ngay bên dưới, không cần bảng nhiều dòng." />
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">
                Bật nếu sản phẩm có nhiều màu sắc, kích cỡ khác nhau. Tắt nếu chỉ có một loại duy nhất.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={hasVariants}
              onClick={toggleHasVariants}
              className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                hasVariants
                  ? 'bg-emerald-500 focus:ring-emerald-300'
                  : 'bg-gray-300 focus:ring-gray-300'
              }`}
            >
              <span
                className={`inline-block size-6 transform rounded-full bg-white shadow transition-transform duration-300 ${
                  hasVariants ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <textarea
          placeholder="Mô tả"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={field}
        />
        {youtubeLinkInput}
        {hasVariants ? (
          <>
            <ImagePickerField
              label="Ảnh sản phẩm (gallery chung)"
              items={images}
              onChange={setImages}
              enableUrlUpload
              onUploadFromUrl={handleUploadImageFromGoogleDrive}
              enableDrivePicker
              onImportFromDriveFiles={handleImportImagesFromDrivePicker}
            />
          </>
        ) : null}

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Hãng · Loại xe · Loại phụ tùng
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Hãng</label>
              <select value={brand} onChange={(e) => setBrand(e.target.value)} className={field}>
                <option value="honda">Honda</option>
                <option value="vespa">Vespa</option>
                <option value="yamaha">Yamaha</option>
                <option value="piaggio">Piaggio</option>
                <option value={OTHER}>Khác — nhập mới…</option>
              </select>
              {brand === OTHER ? (
                <input
                  value={brandOther}
                  onChange={(e) => setBrandOther(e.target.value)}
                  className={field}
                  placeholder="VD: SYM, Suzuki…"
                />
              ) : null}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Loại xe</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className={field}
              >
                <option value="scooter">Scooter / Tay ga</option>
                <option value="underbone">Underbone / Xe số</option>
                <option value="sportbike">Sport / PKL</option>
                <option value={OTHER}>Khác — nhập mới…</option>
              </select>
              {vehicleType === OTHER ? (
                <input
                  value={vehicleTypeOther}
                  onChange={(e) => setVehicleTypeOther(e.target.value)}
                  className={field}
                  placeholder="VD: cub, electric…"
                />
              ) : null}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Loại phụ tùng</label>
              <select
                value={partCategory}
                onChange={(e) => {
                  const next = e.target.value
                  setPartCategory(next)
                  if (String(next || '').trim().toLowerCase() !== PART_CATEGORY_OTHER_VALUE) {
                    setPartCategoryNote('')
                  }
                }}
                className={field}
                disabled={partCategoriesLoading && partCategories.length === 0}
              >
                {partCategoriesLoading && partCategories.length === 0 ? (
                  <option value={partCategory}>Đang tải loại phụ tùng…</option>
                ) : null}
                {partCategories.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
                {partCategory &&
                !partCategoriesLoading &&
                !partCategories.some((c) => c.value === partCategory) ? (
                  <option value={partCategory}>{partCategory}</option>
                ) : null}
              </select>
              {String(partCategory || '').trim().toLowerCase() === PART_CATEGORY_OTHER_VALUE ? (
                <div className="mt-2 space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Mô tả ngắn loại phụ tùng <span className="font-normal text-gray-500">(tuỳ chọn)</span>
                  </label>
                  <textarea
                    value={partCategoryNote}
                    onChange={(e) => setPartCategoryNote(e.target.value)}
                    maxLength={PART_CATEGORY_NOTE_MAX}
                    rows={2}
                    className={`${field} min-h-[2.75rem] resize-y`}
                    placeholder="Mô tả ngắn loại phụ tùng (vd: Bơm xăng điện)"
                  />
                  <p className="text-[11px] text-gray-500">
                    {partCategoryNote.length}/{PART_CATEGORY_NOTE_MAX} ký tự — tối đa{' '}
                    {PART_CATEGORY_NOTE_MAX} theo quy định lưu trữ.
                  </p>
                </div>
              ) : null}
              <p className="text-[11px] text-gray-500">
                Danh sách lấy từ BE (/api/part-categories). Mặc định:{' '}
                <span className="font-semibold">Phụ kiện chung</span>.
              </p>
            </div>
          </div>
        </div>

        <div
          className={`transition-all duration-300 ${
            hasVariants
              ? 'pointer-events-none max-h-0 overflow-hidden opacity-0'
              : 'max-h-none overflow-visible opacity-100'
          }`}
        >
          <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 transition-opacity duration-300">
            <p className="text-sm font-bold text-gray-900">Sản phẩm đơn</p>
            <p className="mt-1 text-xs text-gray-500">
              Giá gốc (tuỳ chọn), giá bán, SKU và ảnh đại diện. Để trống tồn kho ở bước này — khi cần bán
              không giới hạn, không gửi số lượng lên BE.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Giá gốc <span className="font-normal text-gray-500">(tuỳ chọn)</span>
                </label>
                <input
                  type="number"
                  placeholder="VD: 150000 — để trống nếu không giảm giá"
                  value={singleOriginalPrice}
                  onChange={(e) => setSingleOriginalPrice(e.target.value)}
                  className={field}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">Giá bán *</label>
                <input
                  type="number"
                  placeholder="VD: 120000"
                  value={singlePrice}
                  onChange={(e) => setSinglePrice(e.target.value)}
                  className={field}
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  className="mb-1 block text-xs font-semibold text-gray-700"
                  title="SKU tự sinh từ tên sản phẩm nếu để trống."
                >
                  SKU *
                </label>
                <div className="flex gap-2">
                  <input
                    placeholder="Để trống để tự sinh"
                    value={singleSku}
                    onChange={(e) => {
                      setSingleSku(e.target.value)
                      setSingleSkuManuallyEdited(true)
                    }}
                    className={field}
                  />
                  <button
                    type="button"
                    title="Tạo lại SKU tự động"
                    onClick={() => {
                      setSingleSku(generateSKU(name, []))
                      setSingleSkuManuallyEdited(false)
                    }}
                    className="rounded-lg border border-gray-300 px-3 text-xs font-bold text-gray-700 hover:bg-gray-100"
                  >
                    ↻
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <ImagePickerField
                label="Ảnh sản phẩm"
                items={images}
                onChange={setImages}
                enableUrlUpload
                onUploadFromUrl={handleUploadImageFromGoogleDrive}
                enableDrivePicker
                onImportFromDriveFiles={handleImportImagesFromDrivePicker}
              />
            </div>
          </div>
        </div>

        <div
          className={`transition-all duration-300 ${
            hasVariants
              ? 'max-h-none overflow-visible opacity-100'
              : 'pointer-events-none max-h-0 overflow-hidden opacity-0'
          }`}
        >
          <div className="border-t border-gray-200 pt-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="flex flex-wrap items-center text-sm font-bold text-gray-900">
              Phân loại hàng (thêm bao nhiêu cột cũng được)
              <QuickGuide text="Mỗi cột là một kiểu phân loại: ví dụ cột «Màu», cột «Size». Ở dưới mỗi cột bạn gõ từng lựa chọn, xong một cái thì Enter để thành ô màu — giống cách đăng hàng trên các sàn thương mại." />
            </p>
            <button
              type="button"
              onClick={addAttributeRow}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-brand hover:bg-gray-50"
            >
              + Thêm nhóm phân loại
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {normalizedAttributes.map((attr, idx) => (
              <div
                key={attr?.id || `axis-${idx}`}
                className="rounded-lg border border-gray-200 bg-gray-50/80 p-3"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <input
                    placeholder="Tên nhóm phân loại (ví dụ: Màu sắc)"
                    value={attr?.name || ''}
                    onChange={(e) => updateAttribute(attr.id, { name: e.target.value })}
                    className={field}
                    aria-label="Tên nhóm phân loại"
                  />
                  <button
                    type="button"
                    title="Xóa nhóm phân loại này"
                    disabled={normalizedAttributes.length <= 1}
                    onClick={() => removeAttributeRow(attr.id)}
                    className="shrink-0 rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ×
                  </button>
                </div>
                <p className="mb-1 text-[11px] text-gray-500">
                  Các lựa chọn (ví dụ: Đỏ, Xanh, Titan) — gõ xong mỗi lựa chọn hãy nhấn Enter.
                </p>
                <div className="mt-1 flex gap-2">
                  <input
                    placeholder="Các lựa chọn (ví dụ: Đỏ, Xanh, Titan)"
                    value={attr?.draft || ''}
                    onChange={(e) => updateAttribute(attr.id, { draft: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault()
                        pushAttributeValue(attr.id, attr.draft)
                      }
                    }}
                    className={field}
                    aria-label="Thêm lựa chọn phân loại"
                  />
                  <button
                    type="button"
                    onClick={() => pushAttributeValue(attr.id, attr.draft)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                  >
                    Thêm
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(attr?.values || []).map((value) => (
                    <button
                      key={`${attr.id}-${value}`}
                      type="button"
                      onClick={() => removeAttributeValue(attr.id, value)}
                      className="rounded-full border border-violet-200/90 bg-violet-50/95 px-2.5 py-1 text-xs font-medium text-violet-900 shadow-sm transition hover:bg-violet-100/95"
                    >
                      {value} ×
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex flex-wrap items-center text-sm font-bold text-gray-900">
                Chi tiết loại hàng (từng dòng bán)
                <QuickGuide text="Mỗi dòng là một loại bán ra: một màu + một size chẳng hạn. Khi bạn thêm lựa chọn ở phần phân loại phía trên, danh sách bên dưới sẽ tự tạo/cập nhật. Nếu không cần dòng nào, chỉ việc bấm xóa dòng đó." />
              </span>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-xs text-gray-500">{variants.length} dòng</span>
                <button
                  type="button"
                  onClick={() => {
                    setDismissedAutoVariantKeys([])
                    syncVariantRowsFromAttributes({ silent: false, respectDismissed: false })
                  }}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-900 shadow-sm hover:bg-emerald-100"
                >
                  Làm mới từ phân loại
                </button>
                <button
                  type="button"
                  onClick={clearAllVariantRows}
                  disabled={!variants.length}
                  className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-bold text-red-700 shadow-sm hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Xóa hết các dòng
                </button>
                <button
                  type="button"
                  onClick={addManualVariantRow}
                  className="rounded-lg border border-brand/30 bg-white px-2.5 py-1 text-xs font-bold text-brand shadow-sm hover:bg-red-50/60"
                >
                  + Thêm một loại thủ công
                </button>
              </div>
            </div>
            {draftAttributeNames.length ? (
              <p className="mt-2 text-xs leading-relaxed text-amber-800">
                Cột «{draftAttributeNames.join('», «')}» chưa có ô lựa chọn —
                các dòng bên dưới vẫn tạo theo phân loại có tag, ô của cột này được để trống
                (không bắt buộc). Thêm tag để tự sinh tổ hợp, hoặc gõ tay từng dòng nếu muốn.
              </p>
            ) : null}
            {attributesForVariants.map((attr) => (
              <datalist key={`dl-${attr.id}`} id={`attr-dl-${attr.id}`}>
                {attr.values.map((value) => (
                  <option key={`${attr.id}-${value}`} value={value} />
                ))}
              </datalist>
            ))}
            {usePrimaryImageGrouping ? (
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/60 p-3">
                <p className="text-sm font-bold text-blue-900">
                  Ảnh theo {primaryAttribute?.name || 'Phân loại 1'}
                </p>
                <p className="mt-1 text-xs text-blue-800">
                  Khi có từ 2 phân loại, ảnh sẽ gắn theo {primaryAttribute?.name || 'phân loại 1'}.
                  Các dòng có cùng giá trị sẽ tự dùng chung bộ ảnh.
                </p>
                <div className="mt-3 space-y-3">
                  {primaryValuesInRows.length ? (
                    primaryValuesInRows.map((value) => (
                      <div
                        key={`primary-image-${value}`}
                        className="min-w-0 overflow-hidden rounded-lg border border-blue-100 bg-white p-3"
                      >
                        <ImagePickerField
                          label={`${primaryAttribute?.name || 'Phân loại 1'}: ${value}`}
                          items={primaryImageGroups[value] || []}
                          onChange={(next) =>
                            setPrimaryImageGroups((prev) => ({
                              ...prev,
                              [value]: next,
                            }))
                          }
                          enableUrlUpload
                          onUploadFromUrl={handleUploadImageFromGoogleDrive}
                          enableDrivePicker
                          onImportFromDriveFiles={handleImportImagesFromDrivePicker}
                        />
                        {PRIMARY_ATTRIBUTE_IMAGES_REQUIRED &&
                        (!primaryImageGroups[value] || primaryImageGroups[value].length === 0) ? (
                          <p className="mt-1 text-xs font-medium text-amber-700">
                            Chưa có ảnh cho nhóm này.
                          </p>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-blue-800">
                      Chưa có dòng biến thể hoàn chỉnh để nhóm ảnh.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
            <div className="mt-3 space-y-3 pb-8 sm:pb-12">
              {variants.map((row, i) => (
                <div
                  key={row._id || `row-${i}`}
                  className={`rounded-lg border p-3 ${
                    variantErrorRow === i
                      ? 'border-red-300 bg-red-50/80'
                      : 'border-gray-200 bg-gray-50/80'
                  }`}
                >
                  <div className="mb-2 grid gap-2 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-0.5 flex items-center text-[11px] font-semibold text-gray-600">
                        Tên dòng (xem nhanh)
                        <QuickGuide text="Chỗ này tự ghép từ các ô phân loại bên dưới để bạn nhìn một phát biết đang là màu/size nào — không cần gõ thêm." />
                      </label>
                      <input
                        readOnly
                        value={displayVariantLabel(row.attributeValues, attributesForVariants)}
                        className="w-full rounded-lg border border-dashed border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900"
                      />
                    </div>
                    {attributesForVariants.map((attr) => (
                      <div key={`${row._id || i}-${attr.key}`}>
                        <label className="mb-0.5 block text-[11px] font-medium text-gray-600">
                          {attr.name || '—'}
                        </label>
                        <input
                          list={`attr-dl-${attr.id}`}
                          placeholder="Chọn tag hoặc gõ tự do"
                          value={row.attributeValues?.[attr.key] ?? ''}
                          onChange={(e) => handleAttributeValueChange(i, attr.key, e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 shadow-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mb-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeVariantRow(i)}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Xóa dòng
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
                    <div className="min-w-0">
                      <label className="mb-1 flex items-center text-[11px] font-semibold text-gray-600">
                        Mã SKU
                        <QuickGuide text="Là mã nội bộ để phân biệt từng loại hàng (in tem, tra kho). Có thể bấm ↻ để máy gợi ý mã từ tên sản phẩm + màu/size — bạn vẫn được sửa tay." />
                      </label>
                      <div className="flex min-w-0 gap-1">
                        <input
                          placeholder="SKU"
                          value={row.sku}
                          onChange={(e) =>
                            updateRow(i, { sku: e.target.value, skuManuallyEdited: true })
                          }
                          className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 shadow-sm"
                        />
                        <button
                          type="button"
                          title="Tạo lại SKU tự động"
                          onClick={() =>
                            updateRow(i, {
                              sku: buildSkuForRow(row),
                              skuManuallyEdited: false,
                            })
                          }
                          className="shrink-0 rounded-lg border border-gray-300 px-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                        >
                          ↻
                        </button>
                      </div>
                    </div>
                    <input
                      type="number"
                      placeholder="Giá gốc"
                      value={row.originalPrice}
                      onChange={(e) => updateRow(i, { originalPrice: e.target.value })}
                      className="min-h-[34px] w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 shadow-sm"
                    />
                    <input
                      type="number"
                      placeholder="Giá *"
                      value={row.price}
                      onChange={(e) => updateRow(i, { price: e.target.value })}
                      className="min-h-[34px] w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 shadow-sm"
                    />
                    <input
                      type="number"
                      placeholder="Không giới hạn số lượng"
                      value={row.stock}
                      onChange={(e) => updateRow(i, { stock: e.target.value })}
                      className="min-h-[34px] w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 shadow-sm"
                      title="Để trống = bán không giới hạn số lượng trong kho"
                    />
                    <label className="flex min-h-[34px] w-full min-w-0 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={row.isAvailable}
                        onChange={(e) => updateRow(i, { isAvailable: e.target.checked })}
                      />
                      Còn hàng
                    </label>
                  </div>
                  <div className="mt-2">
                    {usePrimaryImageGrouping ? (
                      <div className="rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2 text-xs text-gray-600">
                        Ảnh của dòng này lấy theo{' '}
                        <span className="font-semibold">
                          {primaryAttribute?.name || 'Phân loại 1'}
                        </span>
                        :{' '}
                        <span className="font-semibold">
                          {getPrimaryValueFromRow(row, attributesForVariants) || '(chưa chọn)'}
                        </span>
                      </div>
                    ) : (
                      <ImagePickerField
                        label="Ảnh riêng biến thể"
                        items={row.variantImages}
                        onChange={(next) => updateRow(i, { variantImages: next })}
                        enableUrlUpload
                        onUploadFromUrl={handleUploadImageFromGoogleDrive}
                        enableDrivePicker
                        onImportFromDriveFiles={handleImportImagesFromDrivePicker}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>

        {/* Khoảng đệm + thanh lưu dính đáy viewport: tránh nút đỏ che dòng biến thể cuối khi cuộn */}
        <div className="h-16 shrink-0 sm:h-20" aria-hidden />

        <div className="sticky bottom-0 z-20 -mx-6 -mb-6 mt-2 space-y-3 border-t border-gray-200 bg-white/95 px-6 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-4 shadow-[0_-10px_40px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:-mx-6 sm:-mb-6">
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-brand py-3.5 text-sm font-extrabold uppercase text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? submitPhase === 'upload' && uploadProgress
              ? `Đang upload ảnh (${uploadProgress.current}/${uploadProgress.total})…`
              : submitPhase === 'save'
                ? 'Đang lưu sản phẩm…'
                : 'Đang xử lý…'
            : isEdit
              ? 'Cập nhật sản phẩm'
              : 'Lưu sản phẩm'}
        </button>
        </div>
      </form>

      {toast ? (
        <div className="fixed right-4 top-4 z-[120] rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  )
}
