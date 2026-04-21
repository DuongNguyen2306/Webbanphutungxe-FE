import { api } from './client'
import { isGoogleDriveUrl } from '../utils/googleDrive'

function toList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.results)) return data.results
  return []
}

function toSafeNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function normalizeTextLayers(raw) {
  const fromRawArray = Array.isArray(raw) ? raw : []
  const normalized = fromRawArray
    .map((layer, index) => ({
      level: String(layer?.level || 'body').toLowerCase(),
      text: String(layer?.text || '').trim(),
      order: toSafeNumber(layer?.order, index + 1),
      isActive: layer?.isActive !== false,
      style: {
        color: String(layer?.style?.color || '').trim() || undefined,
        fontSize: String(layer?.style?.fontSize || '').trim() || undefined,
        fontWeight: String(layer?.style?.fontWeight || '').trim() || undefined,
        align: String(layer?.style?.align || '').trim() || undefined,
        x: String(layer?.style?.x || '').trim() || undefined,
        y: String(layer?.style?.y || '').trim() || undefined,
        maxWidth: String(layer?.style?.maxWidth || '').trim() || undefined,
      },
    }))
    .filter((layer) => layer.text)

  if (normalized.length) return normalized.sort((a, b) => a.order - b.order)

  // Backward compatibility: map các field textH1/textH2/... cũ về textLayers mới
  const legacy = [
    { level: 'h1', text: raw?.textH1 },
    { level: 'h2', text: raw?.textH2 },
    { level: 'h3', text: raw?.textH3 },
    { level: 'body', text: raw?.textBody || raw?.description },
    { level: 'cta', text: raw?.textCta || raw?.ctaText },
  ]
    .map((layer, index) => ({
      ...layer,
      text: String(layer.text || '').trim(),
      order: index + 1,
      isActive: Boolean(String(layer.text || '').trim()),
      style: {},
    }))
    .filter((layer) => layer.text)

  return legacy
}

function sanitizeTextLayers(layers = []) {
  const safeArray = Array.isArray(layers) ? layers : []
  return safeArray
    .map((layer, index) => ({
      level: ['h1', 'h2', 'h3', 'body', 'cta'].includes(String(layer?.level || '').toLowerCase())
        ? String(layer.level).toLowerCase()
        : 'body',
      text: String(layer?.text || '').trim(),
      order: toSafeNumber(layer?.order, index + 1),
      isActive: layer?.isActive !== false,
      style: {
        color: String(layer?.style?.color || '').trim() || undefined,
        fontSize: String(layer?.style?.fontSize || '').trim() || undefined,
        fontWeight: String(layer?.style?.fontWeight || '').trim() || undefined,
        align: String(layer?.style?.align || '').trim() || undefined,
        x: String(layer?.style?.x || '').trim() || undefined,
        y: String(layer?.style?.y || '').trim() || undefined,
        maxWidth: String(layer?.style?.maxWidth || '').trim() || undefined,
      },
    }))
    .filter((layer) => layer.text)
    .sort((a, b) => a.order - b.order)
}

function mapBanner(raw) {
  const textLayers = normalizeTextLayers(raw?.textLayers?.length ? raw.textLayers : raw)
  return {
    id: String(raw?._id || raw?.id || ''),
    imageUrl: String(raw?.imageUrl || raw?.image || raw?.thumbnail || '').trim(),
    linkTo: String(raw?.linkTo || raw?.link || raw?.url || '').trim(),
    order: Number(raw?.order ?? raw?.sortOrder ?? 0) || 0,
    isActive: raw?.isActive !== false,
    textLayers,
  }
}

function mapArticle(raw) {
  return {
    id: String(raw?._id || raw?.id || ''),
    title: String(raw?.title || '').trim(),
    type: String(raw?.type || 'guide').toLowerCase(),
    content: String(raw?.content || raw?.html || '').trim(),
    author: String(raw?.author || '').trim(),
    createdAt: raw?.createdAt || '',
    updatedAt: raw?.updatedAt || raw?.createdAt || '',
  }
}

/**
 * @typedef {Object} Article
 * @property {string} id
 * @property {string} title
 * @property {string} type
 * @property {string} content
 * @property {string} author
 * @property {string} createdAt
 * @property {string} updatedAt
 */

async function requestFirstSuccess(paths, config) {
  let lastError
  for (const path of paths) {
    try {
      const res = await api.get(path, config)
      return res.data
    } catch (err) {
      lastError = err
    }
  }
  throw lastError
}

export async function getAdminBanners() {
  const { data } = await api.get('/api/admin/banners')
  return toList(data).map(mapBanner).sort((a, b) => a.order - b.order)
}

export async function createBanner({
  imageFile,
  imageFiles,
  imageItems,
  googleDriveUrls: inputGoogleDriveUrls = [],
  imageUrls: directImageUrls = [],
  linkTo,
  order,
  isActive,
  textLayers,
}) {
  const files = []
  if (imageFile) files.push(imageFile)
  if (Array.isArray(imageFiles)) {
    imageFiles.forEach((file) => {
      if (file) files.push(file)
    })
  }
  if (Array.isArray(imageItems)) {
    imageItems.forEach((item) => {
      if (item?.file) files.push(item.file)
    })
  }

  const rawUrls = Array.isArray(imageItems)
    ? imageItems
        .map((item) => String(item?.remoteUrl || '').trim())
        .filter(Boolean)
    : []
  const mergedUrls = Array.from(
    new Set(
      [...rawUrls, ...inputGoogleDriveUrls, ...directImageUrls]
        .map((u) => String(u || '').trim())
        .filter(Boolean),
    ),
  )
  const normalizedGoogleDriveUrls = mergedUrls.filter((url) => isGoogleDriveUrl(url))
  const imageUrls = mergedUrls.filter((url) => !isGoogleDriveUrl(url))

  const normalizedTextLayers = sanitizeTextLayers(textLayers)
  const payloadBase = {
    linkTo: String(linkTo || '').trim(),
    order: Number(order) || 0,
    isActive: isActive !== false,
    textLayers: normalizedTextLayers,
  }
  let data
  if (files.length > 0) {
    const formData = new FormData()
    files.forEach((file, index) => {
      if (index === 0) formData.append('image', file)
      formData.append('images', file)
    })
    formData.append('linkTo', payloadBase.linkTo)
    formData.append('order', String(payloadBase.order))
    formData.append('isActive', String(payloadBase.isActive))
    formData.append('textLayers', JSON.stringify(payloadBase.textLayers))
    normalizedGoogleDriveUrls.forEach((url) => formData.append('googleDriveUrls', url))
    imageUrls.forEach((url) => formData.append('imageUrls', url))
    const res = await api.post('/api/banners', formData)
    data = res.data
  } else {
    const body = { ...payloadBase }
    if (normalizedGoogleDriveUrls.length === 1) body.googleDriveUrl = normalizedGoogleDriveUrls[0]
    if (normalizedGoogleDriveUrls.length > 1) body.googleDriveUrls = normalizedGoogleDriveUrls
    if (imageUrls.length === 1) body.imageUrl = imageUrls[0]
    if (imageUrls.length > 1) body.imageUrls = imageUrls
    const res = await api.post('/api/banners', body)
    data = res.data
  }
  return mapBanner(data?.item || data?.data || data)
}

export async function updateBanner(id, payload) {
  const body = { ...payload }
  if (body.textLayers) {
    body.textLayers = sanitizeTextLayers(body.textLayers)
  }
  let data
  if (body.imageFile instanceof File) {
    const formData = new FormData()
    formData.append('image', body.imageFile)
    if (body.linkTo != null) formData.append('linkTo', String(body.linkTo || '').trim())
    if (body.order != null) formData.append('order', String(Number(body.order) || 0))
    if (body.isActive != null) formData.append('isActive', String(body.isActive !== false))
    if (body.textLayers) formData.append('textLayers', JSON.stringify(body.textLayers))
    if (body.imageUrl) formData.append('imageUrl', String(body.imageUrl).trim())
    if (body.googleDriveUrl) formData.append('googleDriveUrl', String(body.googleDriveUrl).trim())
    const res = await api.put(`/api/banners/${id}`, formData)
    data = res.data
  } else {
    const cleanBody = { ...body }
    delete cleanBody.imageFile
    const res = await api.put(`/api/banners/${id}`, cleanBody)
    data = res.data
  }
  return mapBanner(data?.item || data?.data || data)
}

export async function removeBanner(id) {
  await api.delete(`/api/admin/banners/${id}`)
}

export async function reorderBanners(items) {
  const { data } = await api.put('/api/admin/banners/reorder', { items })
  return toList(data).map(mapBanner)
}

export async function getPublicBanners() {
  const { data } = await api.get('/api/banners')
  return toList(data)
    .map(mapBanner)
    .filter((x) => x.isActive)
    .sort((a, b) => a.order - b.order)
}

export async function getAdminArticles(type) {
  const data = await requestFirstSuccess(
    [
      '/api/admin/articles',
      '/api/admin/article',
      '/api/admin/content/articles',
      '/api/admin/content/article',
    ],
    {
      params: type ? { type } : undefined,
    },
  )
  return toList(data).map(mapArticle)
}

export async function createArticle(payload) {
  const { data } = await api.post('/api/admin/articles', payload)
  return mapArticle(data?.item || data?.data || data)
}

export async function updateArticle(id, payload) {
  const { data } = await api.put(`/api/admin/articles/${id}`, payload)
  return mapArticle(data?.item || data?.data || data)
}

export async function removeArticle(id) {
  await api.delete(`/api/admin/articles/${id}`)
}

export async function getLatestIntro() {
  const data = await requestFirstSuccess(
    ['/api/articles', '/api/article', '/api/content/articles', '/api/content/article'],
    { params: { type: 'intro' } },
  )
  const list = toList(data).map(mapArticle)
  if (list.length > 0) return list[0]
  return mapArticle(data?.item || data?.data || data)
}

export async function getGuides() {
  const data = await requestFirstSuccess(
    ['/api/articles', '/api/article', '/api/content/articles', '/api/content/article'],
    { params: { type: 'guide' } },
  )
  return toList(data).map(mapArticle)
}

export async function getNewsArticles() {
  const { data } = await api.get('/api/articles', {
    params: { type: 'news' },
  })
  return toList(data)
    .map(mapArticle)
    .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0))
}

export async function createNewsArticle(payload) {
  const body = {
    title: String(payload?.title || '').trim(),
    content: String(payload?.content || '').trim(),
    type: 'news',
  }
  if (payload?.author != null && String(payload.author).trim()) {
    body.author = String(payload.author).trim()
  }
  const { data } = await api.post('/api/articles', body)
  return mapArticle(data?.item || data?.data || data)
}

export async function updateNewsArticle(id, payload) {
  const body = {
    title: String(payload?.title || '').trim(),
    content: String(payload?.content || '').trim(),
    type: 'news',
  }
  if (payload?.author != null && String(payload.author).trim()) {
    body.author = String(payload.author).trim()
  } else {
    body.author = ''
  }
  const { data } = await api.put(`/api/articles/${id}`, body)
  return mapArticle(data?.item || data?.data || data)
}

export async function deleteNewsArticle(id) {
  await api.delete(`/api/articles/${id}`)
}
