import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import {
  createBanner,
  getAdminBanners,
  removeBanner,
  updateBanner,
} from '../../api/contentApi'

const LAYER_LEVEL_OPTIONS = ['h1', 'h2', 'h3', 'body', 'cta']
const LAYER_LEVEL_LABELS = {
  h1: 'Tiêu đề lớn',
  h2: 'Tiêu đề phụ',
  h3: 'Dòng nhấn mạnh',
  body: 'Mô tả',
  cta: 'Nút kêu gọi',
}

function createEmptyLayer(order = 1) {
  return {
    level: 'h2',
    text: '',
    order,
    isActive: true,
    style: {
      color: '#ffffff',
      fontSize: '',
      fontWeight: '',
      align: '',
      x: '',
      y: '',
      maxWidth: '',
    },
  }
}

function normalizeLayers(layers = []) {
  const safe = Array.isArray(layers) ? layers : []
  return safe
    .map((layer, index) => ({
      level: LAYER_LEVEL_OPTIONS.includes(layer?.level) ? layer.level : 'body',
      text: String(layer?.text || '').trim(),
      order: Number(layer?.order ?? index + 1) || index + 1,
      isActive: layer?.isActive !== false,
      style: {
        color: String(layer?.style?.color || '').trim(),
        fontSize: String(layer?.style?.fontSize || '').trim(),
        fontWeight: String(layer?.style?.fontWeight || '').trim(),
        align: String(layer?.style?.align || '').trim(),
        x: String(layer?.style?.x || '').trim(),
        y: String(layer?.style?.y || '').trim(),
        maxWidth: String(layer?.style?.maxWidth || '').trim(),
      },
    }))
    .filter((layer) => layer.text)
    .sort((a, b) => a.order - b.order)
}

export function AdminBanners() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    imageFile: null,
    linkTo: '',
    order: 1,
    isActive: true,
    textLayers: [createEmptyLayer(1)],
  })

  const sortedBanners = useMemo(
    () => [...banners].sort((a, b) => a.order - b.order),
    [banners],
  )

  async function load() {
    setLoading(true)
    setError('')
    try {
      const list = await getAdminBanners()
      setBanners(list)
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được danh sách banner.')
      setBanners([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.imageFile) {
      setError('Vui lòng chọn ảnh banner.')
      return
    }
    const textLayers = normalizeLayers(form.textLayers)
    setSaving(true)
    setError('')
    try {
      await createBanner({ ...form, textLayers })
      setForm({
        imageFile: null,
        linkTo: '',
        order: Math.max(1, banners.length + 1),
        isActive: true,
        textLayers: [createEmptyLayer(1)],
      })
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Không tạo được banner.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(item) {
    try {
      const updated = await updateBanner(item.id, { isActive: !item.isActive })
      setBanners((prev) => prev.map((x) => (x.id === item.id ? updated : x)))
    } catch (err) {
      setError(err.response?.data?.message || 'Không cập nhật trạng thái banner.')
    }
  }

  function updateFormLayer(index, patch) {
    setForm((prev) => ({
      ...prev,
      textLayers: prev.textLayers.map((layer, i) =>
        i === index
          ? {
              ...layer,
              ...patch,
              style: patch?.style ? { ...layer.style, ...patch.style } : layer.style,
            }
          : layer,
      ),
    }))
  }

  function moveFormLayer(index, direction) {
    setForm((prev) => {
      const next = [...prev.textLayers]
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= next.length) return prev
      const temp = next[index]
      next[index] = next[target]
      next[target] = temp
      return {
        ...prev,
        textLayers: next.map((layer, i) => ({ ...layer, order: i + 1 })),
      }
    })
  }

  function removeFormLayer(index) {
    setForm((prev) => {
      const next = prev.textLayers.filter((_, i) => i !== index)
      return {
        ...prev,
        textLayers: next.length ? next.map((layer, i) => ({ ...layer, order: i + 1 })) : [createEmptyLayer(1)],
      }
    })
  }

  function updateItemLayer(itemId, index, patch) {
    setBanners((prev) =>
      prev.map((banner) => {
        if (banner.id !== itemId) return banner
        const layers = Array.isArray(banner.textLayers) ? banner.textLayers : []
        return {
          ...banner,
          textLayers: layers.map((layer, i) =>
            i === index
              ? {
                  ...layer,
                  ...patch,
                  style: patch?.style ? { ...layer.style, ...patch.style } : layer.style,
                }
              : layer,
          ),
        }
      }),
    )
  }

  function moveItemLayer(itemId, index, direction) {
    setBanners((prev) =>
      prev.map((banner) => {
        if (banner.id !== itemId) return banner
        const layers = Array.isArray(banner.textLayers) ? [...banner.textLayers] : []
        const target = direction === 'up' ? index - 1 : index + 1
        if (target < 0 || target >= layers.length) return banner
        const temp = layers[index]
        layers[index] = layers[target]
        layers[target] = temp
        return {
          ...banner,
          textLayers: layers.map((layer, i) => ({ ...layer, order: i + 1 })),
        }
      }),
    )
  }

  function removeItemLayer(itemId, index) {
    setBanners((prev) =>
      prev.map((banner) => {
        if (banner.id !== itemId) return banner
        const next = (banner.textLayers || []).filter((_, i) => i !== index)
        return {
          ...banner,
          textLayers: next.map((layer, i) => ({ ...layer, order: i + 1 })),
        }
      }),
    )
  }

  async function handleSaveItem(item) {
    try {
      const updated = await updateBanner(item.id, {
        linkTo: item.linkTo,
        order: item.order,
        isActive: item.isActive,
        textLayers: normalizeLayers(item.textLayers),
      })
      setBanners((prev) => prev.map((x) => (x.id === item.id ? updated : x)))
    } catch (err) {
      setError(err.response?.data?.message || 'Không lưu được banner.')
    }
  }

  async function handleDelete(item) {
    if (!window.confirm('Xóa banner này?')) return
    try {
      await removeBanner(item.id)
      setBanners((prev) => prev.filter((x) => x.id !== item.id))
    } catch (err) {
      setError(err.response?.data?.message || 'Không xóa được banner.')
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">
          Quản lý ảnh chạy đầu trang
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Thêm ảnh, nhập nội dung hiển thị và sắp xếp thứ tự xuất hiện.
        </p>
      </header>

      <form onSubmit={handleCreate} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-semibold text-gray-700">
            Ảnh banner
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setForm((prev) => ({ ...prev, imageFile: e.target.files?.[0] || null }))
              }
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-semibold text-gray-700">
            Đường dẫn khi bấm vào banner
            <input
              value={form.linkTo}
              onChange={(e) => setForm((prev) => ({ ...prev, linkTo: e.target.value }))}
              placeholder="Ví dụ: /shop?category=Vo%20xe"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-semibold text-gray-700">
            Thứ tự
            <input
              type="number"
              value={form.order}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, order: Number(e.target.value) || 0 }))
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-end gap-2 pb-1 text-sm font-semibold text-gray-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
            />
            Hiển thị ngay
          </label>
        </div>

        <div className="overflow-visible rounded-lg border border-gray-200 bg-gray-50/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold text-gray-800">Các dòng chữ trên banner</p>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  textLayers: [...prev.textLayers, createEmptyLayer(prev.textLayers.length + 1)],
                }))
              }
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              <Plus className="size-3.5" />
              Thêm dòng chữ
            </button>
          </div>
          <p className="mb-3 text-xs text-gray-500">
            Mẹo: dùng "Tiêu đề lớn" cho dòng chính, "Mô tả" cho nội dung ngắn, "Nút kêu gọi" cho chữ trên nút.
          </p>
          <div className="space-y-3 overflow-visible">
            {form.textLayers.map((layer, index) => (
              <div
                key={`new-layer-${index}`}
                className="relative z-0 min-w-0 overflow-visible rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
              >
                <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end lg:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_minmax(0,4.5rem)_auto] lg:gap-x-3">
                  <div className="min-w-0">
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                      Kiểu dòng
                    </label>
                    <select
                      value={layer.level}
                      onChange={(e) => updateFormLayer(index, { level: e.target.value })}
                      className="h-9 w-full min-w-0 max-w-full rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-900 shadow-sm"
                    >
                      {LAYER_LEVEL_OPTIONS.map((lv) => (
                        <option key={lv} value={lv}>
                          {LAYER_LEVEL_LABELS[lv]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="min-w-0">
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                      Nội dung
                    </label>
                    <input
                      value={layer.text}
                      onChange={(e) => updateFormLayer(index, { text: e.target.value })}
                      placeholder="Nội dung text"
                      className="h-9 w-full min-w-0 max-w-full rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-900 shadow-sm"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                      Thứ tự
                    </label>
                    <input
                      type="number"
                      value={layer.order}
                      onChange={(e) =>
                        updateFormLayer(index, { order: Number(e.target.value) || index + 1 })
                      }
                      className="h-9 w-full min-w-0 max-w-full rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-900 shadow-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                      Hiển thị
                    </span>
                    <label className="flex h-9 w-full min-w-0 max-w-full cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 shadow-sm">
                      <input
                        type="checkbox"
                        checked={layer.isActive}
                        onChange={(e) => updateFormLayer(index, { isActive: e.target.checked })}
                      />
                      <span className="min-w-0 truncate">Hiện dòng này</span>
                    </label>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
                  <div className="min-w-0">
                    <label className="mb-1 block text-[10px] font-semibold text-gray-600">Màu chữ</label>
                    <input
                      value={layer.style.color}
                      onChange={(e) => updateFormLayer(index, { style: { color: e.target.value } })}
                      placeholder="#ffffff"
                      className="h-9 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 shadow-sm"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="mb-1 block text-[10px] font-semibold text-gray-600">Cỡ chữ</label>
                    <input
                      value={layer.style.fontSize}
                      onChange={(e) => updateFormLayer(index, { style: { fontSize: e.target.value } })}
                      placeholder="48px"
                      className="h-9 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 shadow-sm"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="mb-1 block text-[10px] font-semibold text-gray-600">Độ đậm</label>
                    <input
                      value={layer.style.fontWeight}
                      onChange={(e) => updateFormLayer(index, { style: { fontWeight: e.target.value } })}
                      placeholder="700"
                      className="h-9 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 shadow-sm"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="mb-1 block text-[10px] font-semibold text-gray-600">Canh lề</label>
                    <input
                      value={layer.style.align}
                      onChange={(e) => updateFormLayer(index, { style: { align: e.target.value } })}
                      placeholder="left / center"
                      className="h-9 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 shadow-sm"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="mb-1 block text-[10px] font-semibold text-gray-600">Lề trái / X</label>
                    <input
                      value={layer.style.x}
                      onChange={(e) => updateFormLayer(index, { style: { x: e.target.value } })}
                      placeholder="8%"
                      className="h-9 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 shadow-sm"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="mb-1 block text-[10px] font-semibold text-gray-600">Lề trên / Y</label>
                    <input
                      value={layer.style.y}
                      onChange={(e) => updateFormLayer(index, { style: { y: e.target.value } })}
                      placeholder="20%"
                      className="h-9 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 shadow-sm"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="mb-1 block text-[10px] font-semibold text-gray-600">Rộng tối đa</label>
                    <input
                      value={layer.style.maxWidth}
                      onChange={(e) => updateFormLayer(index, { style: { maxWidth: e.target.value } })}
                      placeholder="580px"
                      className="h-9 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 shadow-sm"
                    />
                  </div>
                </div>
                <div className="mt-2 flex justify-end gap-1">
                  <button type="button" onClick={() => moveFormLayer(index, 'up')} className="rounded border border-gray-300 p-1 text-gray-700 hover:bg-gray-50">
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => moveFormLayer(index, 'down')} className="rounded border border-gray-300 p-1 text-gray-700 hover:bg-gray-50">
                    <ArrowDown className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => removeFormLayer(index)} className="rounded border border-red-200 p-1 text-red-600 hover:bg-red-50">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          Lưu banner mới
        </button>
      </form>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-gray-500">Đang tải banner...</p>
      ) : (
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sortedBanners.map((item) => (
            <article
              key={item.id}
              className="min-w-0 rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
            >
              <div className="aspect-[16/7] overflow-hidden rounded-lg bg-gray-100">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <label className="block">
                  <span className="font-semibold text-gray-700">Link</span>
                  <input
                    value={item.linkTo}
                    onChange={(e) =>
                      setBanners((prev) =>
                        prev.map((x) =>
                          x.id === item.id ? { ...x, linkTo: e.target.value } : x,
                        ),
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </label>
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <label>
                    <span className="font-semibold text-gray-700">Thứ tự</span>
                    <input
                      type="number"
                      min={1}
                      value={item.order}
                      onChange={(e) =>
                        setBanners((prev) =>
                          prev.map((x) =>
                            x.id === item.id
                              ? { ...x, order: Math.max(1, Number(e.target.value) || 1) }
                              : x,
                          ),
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </label>
                  <div className="flex items-end justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggle(item)}
                      className={`rounded-full px-3 py-2 text-xs font-bold uppercase ${
                        item.isActive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {item.isActive ? 'Đang hiển thị' : 'Đang ẩn'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setBanners((prev) =>
                          prev.map((x) =>
                            x.id === item.id
                              ? {
                                  ...x,
                                  textLayers: [
                                    ...(Array.isArray(x.textLayers) ? x.textLayers : []),
                                    createEmptyLayer((x.textLayers?.length || 0) + 1),
                                  ],
                                }
                              : x,
                          ),
                        )
                      }
                      className="rounded-lg border border-gray-300 px-2 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                      title="Thêm dòng chữ"
                    >
                      <Plus className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveItem(item)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                    >
                      Lưu
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-3 overflow-visible rounded-lg border border-gray-200 bg-gray-50 p-2">
                  {(item.textLayers || []).map((layer, index) => (
                    <div
                      key={`${item.id}-layer-${index}`}
                      className="relative z-0 min-w-0 overflow-visible rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
                    >
                      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end lg:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_minmax(0,4.5rem)_auto] lg:gap-x-3">
                        <div className="min-w-0">
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                            Kiểu dòng
                          </label>
                          <select
                            value={layer.level}
                            onChange={(e) => updateItemLayer(item.id, index, { level: e.target.value })}
                            className="h-9 w-full min-w-0 max-w-full rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 shadow-sm"
                          >
                            {LAYER_LEVEL_OPTIONS.map((lv) => (
                              <option key={lv} value={lv}>
                                {LAYER_LEVEL_LABELS[lv]}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="min-w-0">
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                            Nội dung
                          </label>
                          <input
                            value={layer.text}
                            onChange={(e) => updateItemLayer(item.id, index, { text: e.target.value })}
                            className="h-9 w-full min-w-0 max-w-full rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 shadow-sm"
                          />
                        </div>
                        <div className="min-w-0">
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                            Thứ tự
                          </label>
                          <input
                            type="number"
                            value={layer.order}
                            onChange={(e) =>
                              updateItemLayer(item.id, index, {
                                order: Number(e.target.value) || index + 1,
                              })
                            }
                            className="h-9 w-full min-w-0 max-w-full rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 shadow-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                            Hiển thị
                          </span>
                          <label className="flex h-9 w-full min-w-0 max-w-full cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 shadow-sm">
                            <input
                              type="checkbox"
                              checked={layer.isActive}
                              onChange={(e) =>
                                updateItemLayer(item.id, index, { isActive: e.target.checked })
                              }
                            />
                            <span className="min-w-0 truncate">Hiện</span>
                          </label>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
                        <div className="min-w-0">
                          <label className="mb-1 block text-[10px] font-semibold text-gray-600">Màu chữ</label>
                          <input
                            value={layer.style?.color || ''}
                            onChange={(e) =>
                              updateItemLayer(item.id, index, { style: { color: e.target.value } })
                            }
                            placeholder="#fff"
                            className="h-9 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 shadow-sm"
                          />
                        </div>
                        <div className="min-w-0">
                          <label className="mb-1 block text-[10px] font-semibold text-gray-600">Cỡ chữ</label>
                          <input
                            value={layer.style?.fontSize || ''}
                            onChange={(e) =>
                              updateItemLayer(item.id, index, { style: { fontSize: e.target.value } })
                            }
                            placeholder="48px"
                            className="h-9 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 shadow-sm"
                          />
                        </div>
                        <div className="min-w-0">
                          <label className="mb-1 block text-[10px] font-semibold text-gray-600">Độ đậm</label>
                          <input
                            value={layer.style?.fontWeight || ''}
                            onChange={(e) =>
                              updateItemLayer(item.id, index, { style: { fontWeight: e.target.value } })
                            }
                            placeholder="700"
                            className="h-9 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 shadow-sm"
                          />
                        </div>
                        <div className="min-w-0">
                          <label className="mb-1 block text-[10px] font-semibold text-gray-600">Canh lề</label>
                          <input
                            value={layer.style?.align || ''}
                            onChange={(e) =>
                              updateItemLayer(item.id, index, { style: { align: e.target.value } })
                            }
                            placeholder="center"
                            className="h-9 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 shadow-sm"
                          />
                        </div>
                        <div className="min-w-0">
                          <label className="mb-1 block text-[10px] font-semibold text-gray-600">Lề trái / X</label>
                          <input
                            value={layer.style?.x || ''}
                            onChange={(e) =>
                              updateItemLayer(item.id, index, { style: { x: e.target.value } })
                            }
                            placeholder="8%"
                            className="h-9 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 shadow-sm"
                          />
                        </div>
                        <div className="min-w-0">
                          <label className="mb-1 block text-[10px] font-semibold text-gray-600">Lề trên / Y</label>
                          <input
                            value={layer.style?.y || ''}
                            onChange={(e) =>
                              updateItemLayer(item.id, index, { style: { y: e.target.value } })
                            }
                            placeholder="20%"
                            className="h-9 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 shadow-sm"
                          />
                        </div>
                        <div className="min-w-0">
                          <label className="mb-1 block text-[10px] font-semibold text-gray-600">Rộng tối đa</label>
                          <input
                            value={layer.style?.maxWidth || ''}
                            onChange={(e) =>
                              updateItemLayer(item.id, index, { style: { maxWidth: e.target.value } })
                            }
                            placeholder="580px"
                            className="h-9 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 shadow-sm"
                          />
                        </div>
                      </div>
                      <div className="mt-2 flex justify-end gap-1">
                        <button type="button" onClick={() => moveItemLayer(item.id, index, 'up')} className="rounded border border-gray-300 p-1 text-gray-700 hover:bg-gray-50">
                          <ArrowUp className="size-3.5" />
                        </button>
                        <button type="button" onClick={() => moveItemLayer(item.id, index, 'down')} className="rounded border border-gray-300 p-1 text-gray-700 hover:bg-gray-50">
                          <ArrowDown className="size-3.5" />
                        </button>
                        <button type="button" onClick={() => removeItemLayer(item.id, index)} className="rounded border border-red-200 p-1 text-red-600 hover:bg-red-50">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
