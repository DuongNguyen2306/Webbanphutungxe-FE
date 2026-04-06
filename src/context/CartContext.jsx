/* eslint-disable react-refresh/only-export-components -- Provider + useCart cùng module */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'thaivu_cart'

function loadCart() {
  try {
    const r = localStorage.getItem(STORAGE_KEY)
    if (!r) return []
    const parsed = JSON.parse(r)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = useCallback((payload) => {
    const {
      productId,
      variantId,
      quantity,
      name,
      salePrice,
      image,
      variantLabel = '',
      mongoOk = false,
    } = payload
    const lineId = `${productId}::${variantId}`
    setItems((prev) => {
      const i = prev.findIndex((x) => x.lineId === lineId)
      if (i >= 0) {
        const next = [...prev]
        next[i] = {
          ...next[i],
          quantity: next[i].quantity + quantity,
          mongoOk: next[i].mongoOk || mongoOk,
        }
        return next
      }
      return [
        ...prev,
        {
          lineId,
          productId: String(productId),
          variantId: String(variantId),
          quantity,
          name,
          variantLabel,
          salePrice: Number(salePrice),
          image: image ?? '',
          selected: true,
          mongoOk,
        },
      ]
    })
  }, [])

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

  const setLineQuantity = useCallback((lineId, quantity) => {
    const q = Math.max(1, Number(quantity) || 1)
    setItems((prev) =>
      prev.map((x) => (x.lineId === lineId ? { ...x, quantity: q } : x)),
    )
  }, [])

  const removeLine = useCallback((lineId) => {
    setItems((prev) => prev.filter((x) => x.lineId !== lineId))
  }, [])

  const removeSelectedLines = useCallback(() => {
    setItems((prev) => prev.filter((x) => !x.selected))
  }, [])

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
