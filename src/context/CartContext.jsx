/* eslint-disable react-refresh/only-export-components -- Provider + useCart cùng module */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])

  const addItem = useCallback((payload) => {
    const { productId, variantId, quantity, name, salePrice, image } = payload
    setItems((prev) => {
      const i = prev.findIndex(
        (x) => x.productId === productId && x.variantId === variantId,
      )
      if (i >= 0) {
        const next = [...prev]
        next[i] = {
          ...next[i],
          quantity: next[i].quantity + quantity,
        }
        return next
      }
      return [
        ...prev,
        {
          productId,
          variantId,
          quantity,
          name,
          salePrice,
          image,
        },
      ]
    })
  }, [])

  const totalQuantity = useMemo(
    () => items.reduce((s, x) => s + x.quantity, 0),
    [items],
  )

  const value = useMemo(
    () => ({ items, addItem, totalQuantity }),
    [items, addItem, totalQuantity],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
