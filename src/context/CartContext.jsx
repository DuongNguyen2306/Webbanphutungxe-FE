/* eslint-disable react-refresh/only-export-components -- Provider + useCart cùng module */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { api } from '../api/client'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)
const STORAGE_KEY = 'thaivu_cart'

function toPositiveInt(value, fallback = 1) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return fallback
  return Math.floor(n)
}

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function toStringOrEmpty(value) {
  return value == null ? '' : String(value)
}

function buildCartLineId(productId, selectedVariant = '') {
  return `${toStringOrEmpty(productId)}::${toStringOrEmpty(selectedVariant)}`
}

function loadGuestCart() {
  try {
    const r = localStorage.getItem(STORAGE_KEY)
    if (!r) return []
    const parsed = JSON.parse(r)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item) => {
        const productId = toStringOrEmpty(item?.productId)
        const selectedVariant = toStringOrEmpty(
          item?.selectedVariant ?? item?.variantId ?? '',
        )
        if (!productId) return null
        return {
          lineId: buildCartLineId(productId, selectedVariant),
          productId,
          selectedVariant,
          variantId: selectedVariant,
          quantity: toPositiveInt(item?.quantity, 1),
          name: toStringOrEmpty(item?.name),
          variantLabel: toStringOrEmpty(item?.variantLabel),
          salePrice: toNumber(item?.salePrice, 0),
          image: toStringOrEmpty(item?.image),
          selected: item?.selected !== false,
          mongoOk: item?.mongoOk !== false,
        }
      })
      .filter(Boolean)
  } catch {
    return []
  }
}

function saveGuestCart(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function clearGuestCart() {
  localStorage.removeItem(STORAGE_KEY)
}

function extractRawCartItems(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.products)) return data.products
  if (Array.isArray(data?.cart?.items)) return data.cart.items
  if (Array.isArray(data?.cart?.products)) return data.cart.products
  if (Array.isArray(data?.data?.items)) return data.data.items
  if (Array.isArray(data?.data?.products)) return data.data.products
  return []
}

function resolveVariantFromProduct(productLike, selectedVariant) {
  const variants = Array.isArray(productLike?.variants) ? productLike.variants : []
  return variants.find((v) => String(v?.id ?? v?._id ?? '') === String(selectedVariant))
}

function mapServerCartToItems(data, prevItems = []) {
  const prevByLine = new Map(prevItems.map((item) => [item.lineId, item]))
  const selectedMap = new Map(prevItems.map((item) => [item.lineId, item.selected !== false]))
  const raws = extractRawCartItems(data)
  return raws
    .map((item) => {
      const productLike =
        (typeof item?.productId === 'object' && item?.productId ? item.productId : null) ||
        (typeof item?.product === 'object' && item?.product ? item.product : null)
      const selectedVariantRaw = item?.selectedVariant
      const selectedVariantObj =
        typeof selectedVariantRaw === 'object' && selectedVariantRaw ? selectedVariantRaw : null
      const productId = toStringOrEmpty(
        productLike?._id ?? productLike?.id ?? item?.productId ?? item?._id,
      )
      if (!productId) return null

      const selectedVariant = toStringOrEmpty(
        selectedVariantObj?._id ??
          selectedVariantObj?.id ??
          item?.selectedVariant ??
          item?.variantId ??
          item?.variant ??
          '',
      )
      const variantData = resolveVariantFromProduct(productLike, selectedVariant)
      const lineId = buildCartLineId(productId, selectedVariant)
      const prevLine = prevByLine.get(lineId)

      return {
        lineId,
        productId,
        selectedVariant,
        variantId: selectedVariant,
        quantity: toPositiveInt(item?.quantity, 1),
        name: toStringOrEmpty(
          item?.name ?? item?.productName ?? productLike?.name ?? prevLine?.name,
        ),
        variantLabel: toStringOrEmpty(
          item?.variantLabel ??
            selectedVariantObj?.label ??
            variantData?.label ??
            prevLine?.variantLabel,
        ),
        salePrice: toNumber(
          item?.salePrice ??
            item?.price ??
            selectedVariantObj?.salePrice ??
            selectedVariantObj?.price ??
            variantData?.salePrice ??
            variantData?.price ??
            productLike?.salePrice ??
            productLike?.price ??
            prevLine?.salePrice,
          0,
        ),
        image: toStringOrEmpty(
          item?.image ??
            item?.thumbnail ??
            selectedVariantObj?.images?.[0] ??
            variantData?.images?.[0] ??
            productLike?.images?.[0] ??
            productLike?.image ??
            prevLine?.image,
        ),
        selected: selectedMap.get(lineId) ?? true,
        mongoOk: prevLine?.mongoOk !== false,
      }
    })
    .filter(Boolean)
}

function guestItemsToMergePayload(items) {
  return items.map((item) => ({
    productId: item.productId,
    quantity: toPositiveInt(item.quantity, 1),
    selectedVariant: item.selectedVariant || '',
  }))
}

function getApiErrorMessage(err, fallback) {
  return err?.response?.data?.message || fallback
}

export function CartProvider({ children }) {
  const { token, user, loading: authLoading, logout } = useAuth()
  const [items, setItems] = useState(loadGuestCart)
  const [hydrating, setHydrating] = useState(false)
  const [cartError, setCartError] = useState('')
  const [mergeError, setMergeError] = useState('')
  const [needsMergeRetry, setNeedsMergeRetry] = useState(false)
  const [cartReady, setCartReady] = useState(false)
  const [lineLoadingMap, setLineLoadingMap] = useState({})
  const itemsRef = useRef(items)
  const prevTokenRef = useRef(token)
  const skipGuestClearOnNextLogoutRef = useRef(false)

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    if (!token && cartReady) {
      saveGuestCart(items)
    }
  }, [items, token, cartReady])

  const isServerMode = Boolean(token)

  const setLineLoading = useCallback((lineId, loading) => {
    setLineLoadingMap((prev) => {
      if (!lineId) return prev
      if (!loading) {
        if (!prev[lineId]) return prev
        const next = { ...prev }
        delete next[lineId]
        return next
      }
      if (prev[lineId]) return prev
      return { ...prev, [lineId]: true }
    })
  }, [])

  const applyServerCart = useCallback((data) => {
    setItems((prev) => mapServerCartToItems(data, prev))
  }, [])

  const handleAuthExpired = useCallback((message) => {
    skipGuestClearOnNextLogoutRef.current = true
    saveGuestCart(itemsRef.current)
    setCartError(message || 'Phiên đăng nhập đã hết hạn.')
    setNeedsMergeRetry(false)
    setMergeError('')
    logout()
  }, [logout])

  const fetchServerCart = useCallback(async () => {
    const { data } = await api.get('/api/cart')
    applyServerCart(data)
  }, [applyServerCart])

  const retryMergeGuestCart = useCallback(async () => {
    if (!token) return true
    const guestItems = loadGuestCart()
    if (!guestItems.length) {
      setNeedsMergeRetry(false)
      setMergeError('')
      await fetchServerCart()
      return true
    }

    setHydrating(true)
    setCartError('')
    try {
      const { data } = await api.post('/api/cart/merge', {
        products: guestItemsToMergePayload(guestItems),
      })
      applyServerCart(data)
      clearGuestCart()
      setNeedsMergeRetry(false)
      setMergeError('')
      return true
    } catch (err) {
      if (err?.response?.status === 401) {
        handleAuthExpired('Phiên đăng nhập đã hết hạn. Đã chuyển về giỏ khách.')
        return false
      }
      setNeedsMergeRetry(true)
      setMergeError(getApiErrorMessage(err, 'Không thể đồng bộ giỏ hàng sau đăng nhập.'))
      return false
    } finally {
      setHydrating(false)
    }
  }, [token, fetchServerCart, applyServerCart, handleAuthExpired])

  useEffect(() => {
    let cancelled = false
    if (authLoading) return undefined

    setLineLoadingMap({})
    setCartError('')
    setMergeError('')
    setCartReady(false)

    if (!token) {
      const wasLoggedIn = Boolean(prevTokenRef.current)
      prevTokenRef.current = token
      setNeedsMergeRetry(false)
      setHydrating(false)
      if (wasLoggedIn && !skipGuestClearOnNextLogoutRef.current) {
        clearGuestCart()
        setItems([])
      } else {
        setItems(loadGuestCart())
      }
      skipGuestClearOnNextLogoutRef.current = false
      setCartReady(true)
      return undefined
    }

    prevTokenRef.current = token
    setItems([])
    ;(async () => {
      setHydrating(true)
      try {
        const guestItems = loadGuestCart()
        if (guestItems.length) {
          try {
            const { data } = await api.post('/api/cart/merge', {
              products: guestItemsToMergePayload(guestItems),
            })
            if (cancelled) return
            applyServerCart(data)
            clearGuestCart()
            setNeedsMergeRetry(false)
            setMergeError('')
          } catch (err) {
            if (cancelled) return
            if (err?.response?.status === 401) {
              handleAuthExpired('Phiên đăng nhập đã hết hạn. Đã chuyển về giỏ khách.')
              return
            }
            setItems(guestItems)
            setNeedsMergeRetry(true)
            setMergeError(getApiErrorMessage(err, 'Không thể đồng bộ giỏ hàng sau đăng nhập.'))
          }
        } else {
          const { data } = await api.get('/api/cart')
          if (cancelled) return
          applyServerCart(data)
          setNeedsMergeRetry(false)
        }
      } catch (err) {
        if (cancelled) return
        const status = err?.response?.status
        if (status === 401) {
          handleAuthExpired('Phiên đăng nhập đã hết hạn. Đã chuyển về giỏ khách.')
          return
        }
        setCartError(getApiErrorMessage(err, 'Không tải được giỏ hàng từ hệ thống.'))
        setItems([])
      } finally {
        if (!cancelled) {
          setHydrating(false)
          setCartReady(true)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authLoading, token, user?._id, applyServerCart, handleAuthExpired])

  const callAuthCartApi = useCallback(
    async ({ lineId, action, fallbackMessage }) => {
      if (!isServerMode) return null

      if (needsMergeRetry) {
        const merged = await retryMergeGuestCart()
        if (!merged) {
          throw new Error(mergeError || 'Giỏ hàng chưa đồng bộ, vui lòng thử lại.')
        }
      }

      setLineLoading(lineId, true)
      setCartError('')
      try {
        const { data } = await action()
        applyServerCart(data)
        return data
      } catch (err) {
        if (err?.response?.status === 401) {
          handleAuthExpired('Phiên đăng nhập đã hết hạn. Đã chuyển về giỏ khách.')
          return null
        }
        throw new Error(getApiErrorMessage(err, fallbackMessage))
      } finally {
        setLineLoading(lineId, false)
      }
    },
    [
      applyServerCart,
      isServerMode,
      mergeError,
      needsMergeRetry,
      retryMergeGuestCart,
      setLineLoading,
      handleAuthExpired,
    ],
  )

  const addItem = useCallback((payload) => {
    const {
      productId,
      selectedVariant,
      variantId,
      quantity,
      name,
      salePrice,
      image,
      variantLabel = '',
      mongoOk = false,
    } = payload
    const variantKey = toStringOrEmpty(selectedVariant ?? variantId ?? '')
    const safeProductId = toStringOrEmpty(productId)
    if (!safeProductId) return Promise.resolve()
    const lineId = buildCartLineId(safeProductId, variantKey)

    if (isServerMode) {
      return callAuthCartApi({
        lineId,
        action: () =>
          api.post('/api/cart/add', {
            productId: safeProductId,
            quantity: toPositiveInt(quantity, 1),
            selectedVariant: variantKey,
          }),
        fallbackMessage: 'Không thêm được sản phẩm vào giỏ hàng.',
      }).catch((err) => {
        setCartError(err.message)
      })
    }

    setItems((prev) => {
      const i = prev.findIndex((x) => x.lineId === lineId)
      if (i >= 0) {
        const next = [...prev]
        next[i] = {
          ...next[i],
          quantity: next[i].quantity + toPositiveInt(quantity, 1),
          mongoOk: next[i].mongoOk || mongoOk,
        }
        return next
      }
      return [
        ...prev,
        {
          lineId,
          productId: safeProductId,
          selectedVariant: variantKey,
          variantId: variantKey,
          quantity: toPositiveInt(quantity, 1),
          name,
          variantLabel,
          salePrice: Number(salePrice),
          image: image ?? '',
          selected: true,
          mongoOk,
        },
      ]
    })
    return Promise.resolve()
  }, [callAuthCartApi, isServerMode])

  const toggleSelect = useCallback((lineId) => {
    setItems((prev) =>
      prev.map((x) =>
        x.lineId === lineId ? { ...x, selected: !x.selected } : x,
      ),
    )
  }, [])

  const toggleSelectAll = useCallback((checked) => {
    setItems((prev) => prev.map((x) => ({ ...x, selected: checked })))
  }, [])

  const setLineQuantity = useCallback(async (lineId, quantity) => {
    const q = Math.max(1, Number(quantity) || 1)
    const line = items.find((x) => x.lineId === lineId)
    if (!line) return

    if (isServerMode) {
      try {
        await callAuthCartApi({
          lineId,
          action: () =>
            api.put('/api/cart/update', {
              productId: line.productId,
              quantity: q,
              selectedVariant: line.selectedVariant || '',
            }),
          fallbackMessage: 'Không cập nhật được số lượng sản phẩm.',
        })
      } catch (err) {
        setCartError(err.message)
      }
      return
    }

    setItems((prev) =>
      prev.map((x) => (x.lineId === lineId ? { ...x, quantity: q } : x)),
    )
  }, [callAuthCartApi, isServerMode, items])

  const removeLine = useCallback(async (lineId) => {
    const line = items.find((x) => x.lineId === lineId)
    if (!line) return

    if (isServerMode) {
      try {
        await callAuthCartApi({
          lineId,
          action: () =>
            api.delete('/api/cart/remove', {
              data: {
                productId: line.productId,
                selectedVariant: line.selectedVariant || '',
              },
            }),
          fallbackMessage: 'Không xóa được sản phẩm khỏi giỏ hàng.',
        })
      } catch (err) {
        setCartError(err.message)
      }
      return
    }

    setItems((prev) => prev.filter((x) => x.lineId !== lineId))
  }, [callAuthCartApi, isServerMode, items])

  const removeSelectedLines = useCallback(async () => {
    const selectedLines = items.filter((x) => x.selected)
    if (!selectedLines.length) return

    if (isServerMode) {
      for (const line of selectedLines) {
        try {
          await callAuthCartApi({
            lineId: line.lineId,
            action: () =>
              api.delete('/api/cart/remove', {
                data: {
                  productId: line.productId,
                  selectedVariant: line.selectedVariant || '',
                },
              }),
            fallbackMessage: 'Không xóa được sản phẩm khỏi giỏ hàng.',
          })
        } catch (err) {
          setCartError(err.message)
          break
        }
      }
      return
    }

    setItems((prev) => prev.filter((x) => !x.selected))
  }, [callAuthCartApi, isServerMode, items])

  const allSelected = useMemo(
    () => items.length > 0 && items.every((x) => x.selected),
    [items],
  )

  const someSelected = useMemo(() => items.some((x) => x.selected), [items])

  const selectedTotal = useMemo(
    () =>
      items
        .filter((x) => x.selected)
        .reduce((s, x) => s + x.salePrice * x.quantity, 0),
    [items],
  )

  const selectedItems = useMemo(
    () => items.filter((x) => x.selected),
    [items],
  )

  const totalQuantity = useMemo(
    () => items.reduce((s, x) => s + x.quantity, 0),
    [items],
  )

  const value = useMemo(
    () => ({
      items,
      addItem,
      toggleSelect,
      toggleSelectAll,
      setLineQuantity,
      removeLine,
      removeSelectedLines,
      lineLoadingMap,
      cartSyncing: hydrating,
      cartReady,
      cartError,
      mergeError,
      needsMergeRetry,
      retryMergeGuestCart,
      allSelected,
      someSelected,
      selectedTotal,
      selectedItems,
      totalQuantity,
    }),
    [
      items,
      addItem,
      toggleSelect,
      toggleSelectAll,
      setLineQuantity,
      removeLine,
      removeSelectedLines,
      lineLoadingMap,
      hydrating,
      cartReady,
      cartError,
      mergeError,
      needsMergeRetry,
      retryMergeGuestCart,
      allSelected,
      someSelected,
      selectedTotal,
      selectedItems,
      totalQuantity,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
