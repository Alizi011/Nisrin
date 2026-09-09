import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Product, Review } from '@/data/products'
import { PRODUCTS, FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '@/data/products'

export interface CartItem {
  productId: string
  variantLabel: string
  qty: number
}

export interface Order {
  id: string
  date: string
  items: { name: string; variantLabel: string; qty: number; price: number }[]
  total: number
  email: string
}

interface ShopState {
  cart: CartItem[]
  wishlist: string[]
  orders: Order[]
  extraReviews: Record<string, Review[]>
  cartOpen: boolean
  wishlistOpen: boolean
  searchOpen: boolean
  checkoutOpen: boolean
  activeProduct: Product | null
  promo: string | null
  toast: string | null
  addToCart: (productId: string, variantLabel: string, qty?: number) => void
  updateQty: (productId: string, variantLabel: string, delta: number) => void
  removeFromCart: (productId: string, variantLabel: string) => void
  clearCart: () => void
  toggleWishlist: (productId: string) => void
  setCartOpen: (v: boolean) => void
  setWishlistOpen: (v: boolean) => void
  setSearchOpen: (v: boolean) => void
  setCheckoutOpen: (v: boolean) => void
  openProduct: (p: Product | null) => void
  applyPromo: (code: string) => boolean
  addReview: (productId: string, review: Omit<Review, 'id' | 'date'>) => void
  placeOrder: (email: string) => Order
  showToast: (msg: string) => void
  subtotal: number
  discount: number
  shipping: number
  total: number
  cartCount: number
}

const ShopContext = createContext<ShopState | null>(null)

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => load('ar_cart', []))
  const [wishlist, setWishlist] = useState<string[]>(() => load('ar_wishlist', []))
  const [orders, setOrders] = useState<Order[]>(() => load('ar_orders', []))
  const [extraReviews, setExtraReviews] = useState<Record<string, Review[]>>(() => load('ar_reviews', {}))
  const [promo, setPromo] = useState<string | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [wishlistOpen, setWishlistOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [activeProduct, setActiveProduct] = useState<Product | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => localStorage.setItem('ar_cart', JSON.stringify(cart)), [cart])
  useEffect(() => localStorage.setItem('ar_wishlist', JSON.stringify(wishlist)), [wishlist])
  useEffect(() => localStorage.setItem('ar_orders', JSON.stringify(orders)), [orders])
  useEffect(() => localStorage.setItem('ar_reviews', JSON.stringify(extraReviews)), [extraReviews])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2400)
  }, [])

  const addToCart = useCallback(
    (productId: string, variantLabel: string, qty = 1) => {
      setCart((prev) => {
        const i = prev.findIndex((it) => it.productId === productId && it.variantLabel === variantLabel)
        if (i >= 0) {
          const next = [...prev]
          next[i] = { ...next[i], qty: next[i].qty + qty }
          return next
        }
        return [...prev, { productId, variantLabel, qty }]
      })
      const p = PRODUCTS.find((x) => x.id === productId)
      showToast(`${p?.name ?? 'Produkt'} lagt i kurven`)
    },
    [showToast],
  )

  const updateQty = useCallback((productId: string, variantLabel: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((it) =>
          it.productId === productId && it.variantLabel === variantLabel ? { ...it, qty: it.qty + delta } : it,
        )
        .filter((it) => it.qty > 0),
    )
  }, [])

  const removeFromCart = useCallback((productId: string, variantLabel: string) => {
    setCart((prev) => prev.filter((it) => !(it.productId === productId && it.variantLabel === variantLabel)))
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  const toggleWishlist = useCallback(
    (productId: string) => {
      setWishlist((prev) => {
        const exists = prev.includes(productId)
        const p = PRODUCTS.find((x) => x.id === productId)
        showToast(exists ? `${p?.name} fjernet fra ønskelisten` : `${p?.name} lagret i ønskelisten`)
        return exists ? prev.filter((id) => id !== productId) : [...prev, productId]
      })
    },
    [showToast],
  )

  const applyPromo = useCallback(
    (code: string) => {
      const normalized = code.trim().toUpperCase()
      if (normalized === 'HAMMAM10') {
        setPromo(normalized)
        showToast('Rabattkode aktivert: 10 % avslag')
        return true
      }
      return false
    },
    [showToast],
  )

  const addReview = useCallback((productId: string, review: Omit<Review, 'id' | 'date'>) => {
    setExtraReviews((prev) => ({
      ...prev,
      [productId]: [
        {
          ...review,
          id: `u-${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
        },
        ...(prev[productId] ?? []),
      ],
    }))
  }, [])

  const subtotal = useMemo(
    () =>
      cart.reduce((sum, it) => {
        const p = PRODUCTS.find((x) => x.id === it.productId)
        const v = p?.variants.find((vv) => vv.label === it.variantLabel)
        return sum + (v?.price ?? 0) * it.qty
      }, 0),
    [cart],
  )
  const discount = promo === 'HAMMAM10' ? Math.round(subtotal * 0.1) : 0
  const shipping = cart.length === 0 || subtotal - discount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
  const total = subtotal - discount + shipping
  const cartCount = cart.reduce((s, it) => s + it.qty, 0)

  const placeOrder = useCallback(
    (email: string) => {
      const order: Order = {
        id: `AR-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toISOString(),
        email,
        total,
        items: cart.map((it) => {
          const p = PRODUCTS.find((x) => x.id === it.productId)!
          const v = p.variants.find((vv) => vv.label === it.variantLabel)!
          return { name: p.name, variantLabel: it.variantLabel, qty: it.qty, price: v.price }
        }),
      }
      setOrders((prev) => [order, ...prev])
      setCart([])
      setPromo(null)
      return order
    },
    [cart, total],
  )

  const value: ShopState = {
    cart,
    wishlist,
    orders,
    extraReviews,
    cartOpen,
    wishlistOpen,
    searchOpen,
    checkoutOpen,
    activeProduct,
    promo,
    toast,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    toggleWishlist,
    setCartOpen,
    setWishlistOpen,
    setSearchOpen,
    setCheckoutOpen,
    openProduct: setActiveProduct,
    applyPromo,
    addReview,
    placeOrder,
    showToast,
    subtotal,
    discount,
    shipping,
    total,
    cartCount,
  }

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop(): ShopState {
  const ctx = useContext(ShopContext)
  if (!ctx) throw new Error('useShop must be used inside ShopProvider')
  return ctx
}

export { FREE_SHIPPING_THRESHOLD }
