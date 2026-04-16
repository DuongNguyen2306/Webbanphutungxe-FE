import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import { resolveImageItemsToUrls } from '../../api/productUploadApi'
import {
  ImagePickerField,
  createImageItemsFromUrls,
  getFilesSelectedFromItems,
  getUploadedUrlsFromItems,
  revokePreviewUrls,
} from '../../components/ImagePickerField'

const OTHER = '__other__'

const BRAND_PRESET = new Set(['honda', 'vespa', 'yamaha', 'piaggio'])
const VEHICLE_PRESET = new Set(['scooter', 'underbone', 'sportbike'])
const PART_PRESET = new Set([
  'accessories',
  'shock',
  'lighting',
  'tires_wheels',
  'engine',
])

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
  return normalizeNoAccent(color).replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'NON'
}

function buildSkuSizeCode(size) {
  const parts = normalizeNoAccent(size)
    .split(/[^A-Z0-9]+/)
    .filter(Boolean)
  if (!parts.length) return 'SZ'
  if (parts.length === 1) return parts[0].slice(0, 3)
  return `${parts[0].slice(0, 2)}${parts[1][0] || ''}`.slice(0, 3)
}

function generateSKU(productName, color, size) {
  return `${buildSkuNameCode(productName)}-${buildSkuColorCode(color)}-${buildSkuSizeCode(size)}`
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
    const name = String(row?.name || '').trim()
    const values = uniqueCaseInsensitive(Array.isArray(row?.values) ? row.values : [])
    const base = name || `Thuộc tính ${index + 1}`
    let key = base
    let suffix = 2
    while (usedNames.has(key.toLowerCase())) {
      key = `${base}-${suffix}`
      suffix += 1
    }
    usedNames.add(key.toLowerCase())
    return {
      id: row?.id || nextLocalId('attr'),
      name,
      key,
      values,
      draft: String(row?.draft || ''),
    }
  })
}

function defaultVariantKey(attributeValues, attrs) {
  const raw = attrs.map((attr) => attributeValues?.[attr.key] || '').filter(Boolean).join(' / ')
  return raw || `Biến thể ${Math.random().toString(16).slice(2, 6)}`
}

function attributeValuesToLabel(attributeValues, attrs) {
  const parts = attrs
    .map((attr) => attributeValues?.[attr.key])
    .filter((value) => value != null && String(value).trim() !== '')
  return parts.length ? parts.join(' · ') : 'Mặc định'
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

function countPendingFiles(items = []) {
  return items.filter((it) => it?.file instanceof File).length
}

function buildDefaultAttributes() {
  return [
    { id: nextLocalId('attr'), name: 'Màu sắc', values: [], draft: '' },
    { id: nextLocalId('attr'), name: 'Li', values: [], draft: '' },
  ]
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
  const [brand, setBrand] = useState('honda')
  const [brandOther, setBrandOther] = useState('')
  const [vehicleType, setVehicleType] = useState('scooter')
  const [vehicleTypeOther, setVehicleTypeOther] = useState('')
  const [partCategory, setPartCategory] = useState('accessories')
  const [partCategoryOther, setPartCategoryOther] = useState('')
  const [homeFeature, setHomeFeature] = useState('')
  const [showOnStorefront, setShowOnStorefront] = useState(true)
  const [attributes, setAttributes] = useState(buildDefaultAttributes)
  const [variants, setVariants] = useState([emptyVariant()])
  const [basePrice, setBasePrice] = useState('')
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

  /** Tách từ danh sách slot ảnh sản phẩm (đúng contract: filesSelected + uploadedUrls) */
  const productFilesSelected = useMemo(() => getFilesSelectedFromItems(images), [images])
  const productUploadedUrls = useMemo(() => getUploadedUrlsFromItems(images), [images])

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  useEffect(() => {
    variantsRef.current = variants
  }, [variants])

  useEffect(() => {
    return () => {
      revokePreviewUrls(imagesRef.current)
      variantsRef.current.forEach((row) => revokePreviewUrls(row.variantImages))
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
    setName(data.name ?? '')
    setCategoryInput(data.category?.name ?? '')
    setDescription(data.description ?? '')
    setImages(createImageItemsFromUrls(data.images))
    const [b, bo] = splitPreset(data.brand, BRAND_PRESET)
    setBrand(b)
    setBrandOther(bo)
    const [vt, vto] = splitPreset(data.vehicleType, VEHICLE_PRESET)
    setVehicleType(vt)
    setVehicleTypeOther(vto)
    const [pc, pco] = splitPreset(data.partCategory, PART_PRESET)
    setPartCategory(pc)
    setPartCategoryOther(pco)
    setHomeFeature(data.homeFeature ?? '')
    setShowOnStorefront(data.showOnStorefront !== false)
    setBasePrice('')

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
    const attrsForUI = normalizedAttrs.slice(0, 2)
    while (attrsForUI.length < 2) {
      const defaults = buildDefaultAttributes()
      attrsForUI.push(defaults[attrsForUI.length])
    }
    setAttributes(attrsForUI)

    const attrsForVariant = attrsForUI
    const legacyAttrKeyMap = {
      typeName: attrsForVariant[0]?.key,
      color: attrsForVariant[1]?.key,
      size: attrsForVariant[2]?.key,
    }
    setVariants(
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
        : [emptyVariant()],
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

  function updateRow(i, patch) {
    if (variantErrorRow === i) setVariantErrorRow(-1)
    setVariants((v) => v.map((row, j) => (j === i ? { ...row, ...patch } : row)))
  }

  function buildSkuForRow(row, attrs = activeAttributes) {
    const color = String(row?.attributeValues?.[attrs?.[0]?.key] || '')
    const size = String(row?.attributeValues?.[attrs?.[1]?.key] || '')
    return generateSKU(name, color, size)
  }

  function handleAttributeValueChange(rowIndex, attrKey, value) {
    setVariants((prev) =>
      prev.map((row, idx) => {
        if (idx !== rowIndex) return row
        const nextAttributeValues = {
          ...(row.attributeValues || {}),
          [attrKey]: value,
        }
        const nextRow = { ...row, attributeValues: nextAttributeValues }
        if (row.skuManuallyEdited) return nextRow
        return { ...nextRow, sku: buildSkuForRow(nextRow) }
      }),
    )
  }

  function addManualVariantRow() {
    const baseValues = {}
    activeAttributes.forEach((attr) => {
      baseValues[attr.key] = ''
    })
    setVariants((prev) => [
      ...prev,
      {
        ...emptyVariant(),
        attributeValues: baseValues,
        sku: generateSKU(
          name,
          String(baseValues?.[activeAttributes?.[0]?.key] || ''),
          String(baseValues?.[activeAttributes?.[1]?.key] || ''),
        ),
      },
    ])
  }

  function removeVariantRow(index) {
    setVariants((prev) => {
      const target = prev[index]
      if (target?.variantImages?.length) revokePreviewUrls(target.variantImages)
      return prev.filter((_, i) => i !== index)
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

  function generateVariantRowsFromAttributes() {
    if (!activeAttributes.length) return
    const combos = activeAttributes.reduce(
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
        prev.map((row) => [defaultVariantKey(row.attributeValues || {}, activeAttributes), row]),
      )
      const generatedRows = combos.map((attributeValues) => {
        const comboKey = defaultVariantKey(attributeValues, activeAttributes)
        const existed = byCombo.get(comboKey)
        if (existed) {
          return {
            ...existed,
            attributeValues,
            keyPreview: comboKey,
            sku:
              existed.skuManuallyEdited
                ? existed.sku
                : generateSKU(
                    name,
                    String(attributeValues?.[activeAttributes?.[0]?.key] || ''),
                    String(attributeValues?.[activeAttributes?.[1]?.key] || ''),
                  ),
          }
        }
        return {
          ...emptyVariant(),
          attributeValues,
          keyPreview: comboKey,
          sku: generateSKU(
            name,
            String(attributeValues?.[activeAttributes?.[0]?.key] || ''),
            String(attributeValues?.[activeAttributes?.[1]?.key] || ''),
          ),
        }
      })
      const generatedKeySet = new Set(generatedRows.map((row) => defaultVariantKey(row.attributeValues || {}, activeAttributes)))
      const manualExtras = prev.filter((row) => {
        const key = defaultVariantKey(row.attributeValues || {}, activeAttributes)
        return !generatedKeySet.has(key)
      })
      return [...generatedRows, ...manualExtras]
    })
  }

  const normalizedAttributes = useMemo(
    () => normalizeAttributeSchema(attributes),
    [attributes],
  )

  const activeAttributes = useMemo(
    () => normalizedAttributes.filter((attr) => attr.name && attr.values.length),
    [normalizedAttributes],
  )

  const hasIncompleteAttribute = useMemo(
    () => normalizedAttributes.some((attr) => attr.name.trim() === '' || attr.values.length === 0),
    [normalizedAttributes],
  )

  const axisA = normalizedAttributes[0]
  const axisB = normalizedAttributes[1]

  useEffect(() => {
    const keys = activeAttributes.map((attr) => attr.key)
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
  }, [activeAttributes])

  useEffect(() => {
    if (!name.trim()) return
    setVariants((prev) =>
      prev.map((row) => {
        if (row.skuManuallyEdited) return row
        if (String(row.sku || '').trim()) return row
        return { ...row, sku: buildSkuForRow(row) }
      }),
    )
  }, [name, activeAttributes])

  const duplicatedSkuSet = useMemo(() => {
    const counts = new Map()
    variants.forEach((row) => {
      const sku = String(row.sku || '').trim().toUpperCase()
      if (!sku) return
      counts.set(sku, (counts.get(sku) || 0) + 1)
    })
    return new Set(
      Array.from(counts.entries())
        .filter(([, count]) => count > 1)
        .map(([sku]) => sku),
    )
  }, [variants])

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

    let brandFinal
    let vehicleTypeFinal
    let partCategoryFinal
    try {
      brandFinal = resolveOther(brand, brandOther, 'hãng xe')
      vehicleTypeFinal = resolveOther(vehicleType, vehicleTypeOther, 'loại xe')
      partCategoryFinal = resolveOther(partCategory, partCategoryOther, 'nhóm phụ tùng')
    } catch (err) {
      setError(err.message)
      return
    }

    if (normalizedAttributes.some((attr) => !attr.name.trim())) {
      setError('Thuộc tính có tên trống. Vui lòng nhập đầy đủ tên thuộc tính.')
      return
    }
    if (normalizedAttributes.some((attr) => attr.values.length === 0)) {
      setError('Mỗi thuộc tính cần ít nhất 1 giá trị.')
      return
    }
    if (!variants.length) {
      setError('Chưa có biến thể nào được sinh từ thuộc tính.')
      return
    }
    if (duplicatedSkuSet.size > 0) {
      setError('Có SKU đang bị trùng. Vui lòng kiểm tra lại các dòng biến thể.')
      return
    }

    const variantPayload = []
    const comboSet = new Set()
    for (let idx = 0; idx < variants.length; idx += 1) {
      const row = variants[idx]
      const rowNo = idx + 1
      if (row.price === '' || Number.isNaN(Number(row.price)) || Number(row.price) < 0) {
        setVariantErrorRow(idx)
        setToast(`Biến thể #${rowNo} có giá không hợp lệ.`)
        setError(`Biến thể #${rowNo}: giá không hợp lệ.`)
        return
      }
      if (!String(row.sku || '').trim()) {
        setVariantErrorRow(idx)
        setToast(`Biến thể #${rowNo} đang thiếu SKU.`)
        setError(`Biến thể #${rowNo}: SKU là bắt buộc.`)
        return
      }
      if (
        row.originalPrice !== '' &&
        (Number.isNaN(Number(row.originalPrice)) || Number(row.originalPrice) < 0)
      ) {
        setVariantErrorRow(idx)
        setToast(`Biến thể #${rowNo} có giá gốc không hợp lệ.`)
        setError(`Biến thể #${rowNo}: giá gốc không hợp lệ.`)
        return
      }
      if (row.stock !== '' && (Number.isNaN(Number(row.stock)) || Number(row.stock) < 0)) {
        setVariantErrorRow(idx)
        setToast(`Biến thể #${rowNo} có tồn kho không hợp lệ.`)
        setError(`Biến thể #${rowNo}: tồn kho không hợp lệ.`)
        return
      }
      const attributeValues = {}
      for (const attr of activeAttributes) {
        const value = String(row.attributeValues?.[attr.key] || '').trim()
        if (!value) {
          setVariantErrorRow(idx)
          setToast(`Biến thể #${rowNo} thiếu giá trị thuộc tính "${attr.name}".`)
          setError(`Biến thể #${rowNo}: thiếu giá trị thuộc tính ${attr.name}.`)
          return
        }
        attributeValues[attr.name] = value
      }
      const comboDisplayKey = activeAttributes.map((attr) => attributeValues[attr.name]).join(' / ')
      const comboNormalized = comboDisplayKey.toLowerCase()
      if (comboSet.has(comboNormalized)) {
        setVariantErrorRow(idx)
        setToast(`Biến thể #${rowNo} bị trùng tổ hợp ${comboDisplayKey}.`)
        setError(`Biến thể #${rowNo}: trùng tổ hợp thuộc tính.`)
        return
      }
      comboSet.add(comboNormalized)

      const variant = {
        attributeValues,
        sku: String(row.sku || '').trim(),
        price: Number(row.price),
        originalPrice: row.originalPrice === '' ? undefined : Number(row.originalPrice),
        stock: row.stock === '' ? undefined : Number(row.stock),
        isAvailable: Boolean(row.isAvailable),
        image: '',
        images: undefined,
      }
      if (row._id) variant._id = row._id
      variantPayload.push({ ...variant, __imageItems: row.variantImages })
    }

    setSaving(true)
    setSubmitPhase('upload')

    const totalUploads =
      countPendingFiles(images) +
      variantPayload.reduce((s, v) => s + countPendingFiles(v.__imageItems || []), 0)

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
      const variantsWithImages = await Promise.all(
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

      setUploadProgress(null)
      setSubmitPhase('save')

      const payload = {
        name: name.trim(),
        category: cat,
        description,
        images: productImages,
        brand: brandFinal,
        vehicleType: vehicleTypeFinal,
        partCategory: partCategoryFinal,
        homeFeature: homeFeature || null,
        showOnStorefront,
        basePrice: basePrice ? Number(basePrice) : undefined,
        attributes: activeAttributes.map((attr) => {
          const fromRows = variants
            .map((row) => String(row.attributeValues?.[attr.key] || '').trim())
            .filter(Boolean)
          return {
            name: attr.name,
            values: uniqueCaseInsensitive([...(attr.values || []), ...fromRows]),
          }
        }),
        variants: variantsWithImages,
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
        className="mt-6 space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
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

        <textarea
          placeholder="Mô tả"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={field}
        />
        <ImagePickerField
          label="Ảnh sản phẩm"
          items={images}
          onChange={setImages}
        />
        <p className="text-[11px] text-gray-500">
          Trạng thái: {productUploadedUrls.length} URL đã có · {productFilesSelected.length} file chờ upload
        </p>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Hãng · Loại xe · Nhóm phụ tùng
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
              <label className="text-xs font-medium text-gray-700">Nhóm phụ tùng</label>
              <select
                value={partCategory}
                onChange={(e) => setPartCategory(e.target.value)}
                className={field}
              >
                <option value="accessories">Phụ kiện</option>
                <option value="shock">Giảm xóc</option>
                <option value="lighting">Đèn & điện</option>
                <option value="tires_wheels">Vỏ & mâm</option>
                <option value="engine">Động cơ</option>
                <option value={OTHER}>Khác — nhập mới…</option>
              </select>
              {partCategory === OTHER ? (
                <input
                  value={partCategoryOther}
                  onChange={(e) => setPartCategoryOther(e.target.value)}
                  className={field}
                  placeholder="VD: phanh, nhông xích…"
                />
              ) : null}
            </div>
          </div>
        </div>

        <select value={homeFeature} onChange={(e) => setHomeFeature(e.target.value)} className={field}>
          <option value="">Không gắn section đặc biệt</option>
          <option value="replacement">Phụ tùng thay thế</option>
          <option value="tires">Vỏ / lốp</option>
        </select>

        <div className="border-t border-gray-200 pt-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {[axisA, axisB].map((attr, idx) => (
              <div key={attr?.id || `axis-${idx}`} className="rounded-lg border border-gray-200 bg-gray-50/80 p-3">
                <input
                  placeholder={`Tên thuộc tính ${idx + 1}`}
                  value={attr?.name || ''}
                  onChange={(e) => updateAttribute(attr.id, { name: e.target.value })}
                  className={field}
                />
                <div className="mt-2 flex gap-2">
                  <input
                    placeholder="Nhập giá trị và Enter"
                    value={attr?.draft || ''}
                    onChange={(e) => updateAttribute(attr.id, { draft: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault()
                        pushAttributeValue(attr.id, attr.draft)
                      }
                    }}
                    className={field}
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
                      className="rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                    >
                      {value} ×
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">Biến thể theo tổ hợp</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">{variants.length} dòng</span>
                <button
                  type="button"
                  onClick={generateVariantRowsFromAttributes}
                  className="text-xs font-bold uppercase text-gray-700 hover:underline"
                >
                  SINH TỔ HỢP
                </button>
                <button
                  type="button"
                  onClick={addManualVariantRow}
                  className="text-xs font-bold uppercase text-brand hover:underline"
                >
                  + Dòng
                </button>
              </div>
            </div>
            {hasIncompleteAttribute ? (
              <p className="mt-2 text-xs text-amber-700">
                Hoàn thiện tên và giá trị cho từng thuộc tính để sinh đầy đủ tổ hợp.
              </p>
            ) : null}
            <div className="mt-3 space-y-3">
              {variants.map((row, i) => (
                <div
                  key={row._id || `row-${i}`}
                  className={`rounded-lg border p-3 ${
                    variantErrorRow === i
                      ? 'border-red-300 bg-red-50/80'
                      : 'border-gray-200 bg-gray-50/80'
                  }`}
                >
                  <div className="mb-2 text-xs font-semibold text-gray-700">
                    {attributeValuesToLabel(row.attributeValues, activeAttributes)}
                  </div>
                  <div className="mb-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {activeAttributes.map((attr) => (
                      <select
                        key={`${row._id || i}-${attr.key}`}
                        value={row.attributeValues?.[attr.key] || ''}
                        onChange={(e) => handleAttributeValueChange(i, attr.key, e.target.value)}
                        className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 shadow-sm"
                      >
                        <option value="">-- {attr.name} --</option>
                        {attr.values.map((value) => (
                          <option key={`${attr.id}-${value}`} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    ))}
                  </div>
                  <p className="mb-2 text-[11px] text-gray-500">
                    Key preview: {defaultVariantKey(row.attributeValues || {}, activeAttributes)}
                  </p>
                  <div className="mb-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeVariantRow(i)}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Xóa dòng
                    </button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
                    <div>
                      <label
                        className="mb-1 block text-[11px] font-semibold text-gray-600"
                        title="SKU tự sinh từ: viết tắt tên SP + 3 ký tự màu + mã size."
                      >
                        SKU
                      </label>
                      <div className="flex gap-1">
                        <input
                          placeholder="SKU"
                          value={row.sku}
                          onChange={(e) =>
                            updateRow(i, { sku: e.target.value, skuManuallyEdited: true })
                          }
                          className={`w-full rounded-lg border bg-white px-2 py-1.5 text-xs text-gray-900 shadow-sm ${
                            duplicatedSkuSet.has(String(row.sku || '').trim().toUpperCase())
                              ? 'border-red-400'
                              : 'border-gray-300'
                          }`}
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
                          className="rounded-lg border border-gray-300 px-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                        >
                          ↻
                        </button>
                      </div>
                      {duplicatedSkuSet.has(String(row.sku || '').trim().toUpperCase()) ? (
                        <p className="mt-1 text-[11px] font-medium text-red-600">Mã SKU bị trùng</p>
                      ) : null}
                    </div>
                    <input
                      type="number"
                      placeholder="Giá *"
                      value={row.price}
                      onChange={(e) => updateRow(i, { price: e.target.value })}
                      className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 shadow-sm"
                    />
                    <input
                      type="number"
                      placeholder="Giá gốc"
                      value={row.originalPrice}
                      onChange={(e) => updateRow(i, { originalPrice: e.target.value })}
                      className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 shadow-sm"
                    />
                    <input
                      type="number"
                      placeholder="Tồn kho"
                      value={row.stock}
                      onChange={(e) => updateRow(i, { stock: e.target.value })}
                      className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 shadow-sm"
                    />
                    <label className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={row.isAvailable}
                        onChange={(e) => updateRow(i, { isAvailable: e.target.checked })}
                      />
                      Còn hàng
                    </label>
                  </div>
                  <div className="mt-2">
                    <ImagePickerField
                      label="Ảnh riêng biến thể"
                      items={row.variantImages}
                      onChange={(next) => updateRow(i, { variantImages: next })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

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
      </form>

      {toast ? (
        <div className="fixed right-4 top-4 z-[120] rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  )
}
