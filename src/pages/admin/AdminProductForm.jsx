import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'

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

function splitPreset(raw, presetSet) {
  const s = String(raw || '').toLowerCase()
  if (presetSet.has(s)) return [s, '']
  return [OTHER, String(raw ?? '')]
}

const emptyVariant = () => ({
  _id: '',
  typeName: '',
  color: '',
  size: '',
  price: '',
  originalPrice: '',
  isAvailable: true,
  /** mỗi dòng một URL → gửi API variants[].images */
  variantImages: '',
})

/** Giá trị gửi API: preset hoặc chuỗi nhập khi chọn Khác */
function resolveOther(selectVal, otherVal, label) {
  if (selectVal === OTHER) {
    const t = otherVal.trim()
    if (!t) {
      throw new Error(`Vui lòng nhập ${label} khi chọn "Khác".`)
    }
    return t
  }
  return selectVal
}

export function AdminProductForm() {
  const navigate = useNavigate()
  const { id: editId } = useParams()
  const isEdit = Boolean(editId)

  const [categories, setCategories] = useState([])
  const [categoryInput, setCategoryInput] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState('')
  const [brand, setBrand] = useState('honda')
  const [brandOther, setBrandOther] = useState('')
  const [vehicleType, setVehicleType] = useState('scooter')
  const [vehicleTypeOther, setVehicleTypeOther] = useState('')
  const [partCategory, setPartCategory] = useState('accessories')
  const [partCategoryOther, setPartCategoryOther] = useState('')
  const [homeFeature, setHomeFeature] = useState('')
  const [showOnStorefront, setShowOnStorefront] = useState(true)
  const [variants, setVariants] = useState([emptyVariant()])
  const [basePrice, setBasePrice] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(isEdit)

  useEffect(() => {
    api
      .get('/api/categories')
      .then((r) => setCategories(r.data))
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (!editId) return
    let cancel = false
    setBootstrapping(true)
    setError('')
    api
      .get(`/api/admin/products/${editId}`)
      .then(({ data }) => {
        if (cancel) return
        setName(data.name ?? '')
        setCategoryInput(data.category?.name ?? '')
        setDescription(data.description ?? '')
        setImages(Array.isArray(data.images) ? data.images.join('\n') : '')
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
        setVariants(
          data.variants?.length
            ? data.variants.map((v) => ({
                _id: v._id ? String(v._id) : '',
                typeName: v.typeName ?? '',
                color: v.color ?? '',
                size: v.size ?? '',
                price: String(v.price ?? ''),
                originalPrice:
                  v.originalPrice != null && v.originalPrice !== ''
                    ? String(v.originalPrice)
                    : '',
                isAvailable: v.isAvailable !== false,
                variantImages: Array.isArray(v.images)
                  ? v.images.join('\n')
                  : '',
              }))
            : [emptyVariant()],
        )
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

  function addRow() {
    setVariants((v) => [...v, emptyVariant()])
  }

  function updateRow(i, patch) {
    setVariants((v) => v.map((row, j) => (j === i ? { ...row, ...patch } : row)))
  }

  function removeRow(i) {
    setVariants((v) => v.filter((_, j) => j !== i))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
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
      vehicleTypeFinal = resolveOther(
        vehicleType,
        vehicleTypeOther,
        'loại xe',
      )
      partCategoryFinal = resolveOther(
        partCategory,
        partCategoryOther,
        'nhóm phụ tùng',
      )
    } catch (err) {
      setError(err.message)
      return
    }
    setSaving(true)
    try {
      const imgList = images
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
      const payload = {
        name: name.trim(),
        category: cat,
        description,
        images: imgList,
        brand: brandFinal,
        vehicleType: vehicleTypeFinal,
        partCategory: partCategoryFinal,
        homeFeature: homeFeature || null,
        showOnStorefront,
        basePrice: basePrice ? Number(basePrice) : undefined,
        variants: variants
          .filter((row) => row.price !== '' && Number(row.price) >= 0)
          .map((row) => {
            const o = {
              typeName: row.typeName,
              color: row.color,
              size: row.size,
              price: Number(row.price),
              originalPrice:
                row.originalPrice === ''
                  ? undefined
                  : Number(row.originalPrice),
              isAvailable: row.isAvailable,
              images: String(row.variantImages ?? '')
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean),
            }
            if (row._id) o._id = row._id
            return o
          }),
      }
      if (isEdit) {
        await api.put(`/api/admin/products/${editId}`, payload)
      } else {
        await api.post('/api/admin/products', payload)
      }
      navigate('/admin/products')
    } catch (err) {
      setError(err.response?.data?.message || 'Không lưu được.')
    } finally {
      setSaving(false)
    }
  }

  const field =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20'

  if (bootstrapping) {
    return (
      <div>
        <Link
          to="/admin/products"
          className="text-sm font-semibold text-brand hover:underline"
        >
          ← Danh sách
        </Link>
        <p className="mt-8 text-sm text-gray-600">Đang tải sản phẩm...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link
          to="/admin/products"
          className="text-sm font-semibold text-brand hover:underline"
        >
          ← Danh sách
        </Link>
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
        {isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-gray-600">
        Chỉ tên là bắt buộc. Bật &quot;Hiện trên cửa hàng&quot; để SP xuất hiện ở
        trang chủ / API công khai. Section <strong>Phụ tùng thay thế / Vỏ</strong>{' '}
        chỉ lấy SP có gắn đúng loại ở ô &quot;Section đặc biệt&quot; — không bắt buộc
        để hiện trong danh mục chính.
      </p>

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
              Tắt nếu muốn ẩn khỏi trang chủ và danh sách sản phẩm công khai (vẫn
              quản trị trong admin).
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
        <textarea
          placeholder="URL ảnh (mỗi dòng một link)"
          value={images}
          onChange={(e) => setImages(e.target.value)}
          rows={2}
          className={field}
        />

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Hãng · Loại xe · Nhóm phụ tùng
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            Chọn có sẵn hoặc{' '}
            <span className="font-semibold text-gray-700">Khác — nhập mới</span> bên
            dưới ô tương ứng.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Hãng</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className={field}
              >
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
              <label className="text-xs font-medium text-gray-700">
                Nhóm phụ tùng
              </label>
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

        <select
          value={homeFeature}
          onChange={(e) => setHomeFeature(e.target.value)}
          className={field}
        >
          <option value="">Không gắn section đặc biệt</option>
          <option value="replacement">Phụ tùng thay thế</option>
          <option value="tires">Vỏ / lốp</option>
        </select>

        <div className="border-t border-gray-200 pt-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">
              Biến thể (tuỳ chọn)
            </span>
            <button
              type="button"
              onClick={addRow}
              className="text-xs font-bold uppercase text-brand hover:underline"
            >
              + Dòng
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Để trống tất cả dòng giá: dùng giá gốc bên dưới.
          </p>
          <div className="mt-3 space-y-3">
            {variants.map((row, i) => (
              <div
                key={row._id || `row-${i}`}
                className="rounded-lg border border-gray-200 bg-gray-50/80 p-3"
              >
                <div className="grid gap-2 sm:grid-cols-6">
                  <input
                    placeholder="Tên kiểu"
                    value={row.typeName}
                    onChange={(e) =>
                      updateRow(i, { typeName: e.target.value })
                    }
                    className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 shadow-sm sm:col-span-1"
                  />
                  <input
                    placeholder="Màu"
                    value={row.color}
                    onChange={(e) => updateRow(i, { color: e.target.value })}
                    className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 shadow-sm sm:col-span-1"
                  />
                  <input
                    placeholder="Size"
                    value={row.size}
                    onChange={(e) => updateRow(i, { size: e.target.value })}
                    className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 shadow-sm sm:col-span-1"
                  />
                  <input
                    type="number"
                    placeholder="Giá *"
                    value={row.price}
                    onChange={(e) => updateRow(i, { price: e.target.value })}
                    className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 shadow-sm sm:col-span-1"
                  />
                  <input
                    type="number"
                    placeholder="Giá gốc"
                    value={row.originalPrice}
                    onChange={(e) =>
                      updateRow(i, { originalPrice: e.target.value })
                    }
                    className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 shadow-sm sm:col-span-1"
                  />
                  <div className="flex items-center gap-2 sm:col-span-1">
                    <label className="flex items-center gap-1 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={row.isAvailable}
                        onChange={(e) =>
                          updateRow(i, { isAvailable: e.target.checked })
                        }
                      />
                      Còn hàng
                    </label>
                    {variants.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        className="ml-auto text-xs font-semibold text-red-600 hover:underline"
                      >
                        Xóa
                      </button>
                    ) : null}
                  </div>
                </div>
                <label className="mt-2 block text-xs font-medium text-gray-600">
                  Ảnh riêng biến thể (mỗi dòng một URL)
                </label>
                <textarea
                  value={row.variantImages}
                  onChange={(e) =>
                    updateRow(i, { variantImages: e.target.value })
                  }
                  rows={2}
                  placeholder="https://..."
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 placeholder:text-gray-400"
                />
              </div>
            ))}
          </div>
          <div className="mt-3">
            <label className="text-xs font-medium text-gray-600">
              Giá mặc định (khi không có dòng biến thể hợp lệ)
            </label>
            <input
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className={`mt-1 ${field}`}
              placeholder="0"
            />
          </div>
        </div>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-brand py-3.5 text-sm font-extrabold uppercase text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật sản phẩm' : 'Lưu sản phẩm'}
        </button>
      </form>
    </div>
  )
}
