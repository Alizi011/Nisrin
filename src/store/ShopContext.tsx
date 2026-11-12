import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Product } from '@/data/products'
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '@/data/products'
import { getPublicCatalog } from '@/services/nisrinCatalog'

export interface CartItem {
  productId: string
  variantLabel: string
  qty: number
}

interface ShopState {
  products: Product[]
  catalogLoading: boolean
  catalogError: string | null
  reloadCatalog: () => void
  cart: CartItem[]
  wishlist: string[]
  cartOpen: boolean
  wishlistOpen: boolean
  searchOpen: boolean
  checkoutOpen: boolean
  activeProduct: Product | null
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
  // Separate new API-backed selections from the previous demo localStorage data.
  const [cart, setCart] = useState<CartItem[]>(() => load('nisrin_catalog_cart_v1', []))
  const [wishlist, setWishlist] = useState<string[]>(() => load('nisrin_catalog_wishlist_v1', []))
  const [products, setProducts] = useState<Product[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [catalogVersion, setCatalogVersion] = useState(0)
  const [cartOpen, setCartOpen] = useState(false)
  const [wishlistOpen, setWishlistOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [activeProduct, setActiveProduct] = useState<Product | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const reloadCatalog = useCallback(() => {
    setProducts([])
    setCatalogError(null)
    setCatalogLoading(true)
    setCatalogVersion((version) => version + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    getPublicCatalog(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setProducts(items)
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setProducts([])
          setCatalogError('Produktkatalogen er utilgjengelig. Ingen demoprodukter vises.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCatalogLoading(false)
      })
    return () => controller.abort()
  }, [catalogVersion])

  useEffect(() => localStorage.setItem('nisrin_catalog_cart_v1', JSON.stringify(cart)), [cart])
  useEffect(() => localStorage.setItem('nisrin_catalog_wishlist_v1', JSON.stringify(wishlist)), [wishlist])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2400)
  }, [])

  const validCart = useMemo(() => cart.filter((item) =>
    products.some((p) => p.id === item.productId && p.variants.some((v) => v.label === item.variantLabel)) &&
    Number.isSafeInteger(item.qty) && item.qty > 0 && item.qty <= 99,
  ), [cart, products])

  const addToCart = useCallback((productId: string, variantLabel: string, qty = 1) => {
    const product = products.find((p) => p.id === productId)
    if (!product || !product.variants.some((v) => v.label === variantLabel) ||
        !Number.isSafeInteger(qty) || qty < 1) {
      showToast('Dette produktet er ikke tilgjengelig i katalogen.')
      return
    }
    setCart((prev) => {
      const existing = prev.findIndex((item) => item.productId === productId && item.variantLabel === variantLabel)
      if (existing >= 0) {
        const next = [...prev]
        next[existing] = { ...next[existing], qty: Math.min(99, next[existing].qty + qty) }
        return next
      }
      return [...prev, { productId, variantLabel, qty: Math.min(99, qty) }]
    })
    showToast(`${product.name} lagt i handlekurven (ingen bestilling opprettet)`)
  }, [products, showToast])

  const updateQty = useCallback((productId: string, variantLabel: string, delta: number) => {
    setCart((prev) => prev.map((item) =>
      item.productId === productId && item.variantLabel === variantLabel
        ? { ...item, qty: Math.min(99, item.qty + delta) }
        : item,
    ).filter((item) => item.qty > 0))
  }, [])
  const removeFromCart = useCallback((productId: string, variantLabel: string) => {
    setCart((prev) => prev.filter((item) => !(item.productId === productId && item.variantLabel === variantLabel)))
  }, [])
  const clearCart = useCallback(() => setCart([]), [])
  const toggleWishlist = useCallback((productId: string) => {
    const p = products.find((product) => product.id === productId)
    if (!p) return
    setWishlist((prev) => prev.includes(productId)
      ? prev.filter((id) => id !== productId)
      : [...prev, productId])
  }, [products])

  // Display-only estimate; future checkout must revalidate every SKU, price,
  // discount and shipping cost on the server before accepting a real order.
  const subtotalOre = useMemo(() => validCart.reduce((sum, item) => {
    const p = products.find((product) => product.id === item.productId)
    const variant = p?.variants.find((v) => v.label === item.variantLabel)
    return sum + Math.round((variant?.price ?? 0) * 100) * item.qty
  }, 0), [products, validCart])
  const subtotal = subtotalOre / 100
  const discount = 0 // No unverified browser-side promo discounts.
  const shipping = validCart.length === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
  const total = subtotal + shipping
  const cartCount = validCart.reduce((sum, item) => sum + item.qty, 0)

  const value: ShopState = {
    products, catalogLoading, catalogError, reloadCatalog,
    cart: validCart, wishlist: wishlist.filter((id) => products.some((p) => p.id === id)),
    cartOpen, wishlistOpen, searchOpen, checkoutOpen, activeProduct, toast,
    addToCart, updateQty, removeFromCart, clearCart, toggleWishlist,
    setCartOpen, setWishlistOpen, setSearchOpen, setCheckoutOpen,
    openProduct: setActiveProduct, showToast,
    subtotal, discount, shipping, total, cartCount,
  }

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop(): ShopState {
  const ctx = useContext(ShopContext)
  if (!ctx) throw new Error('useShop must be used inside ShopProvider')
  return ctx
}

export { FREE_SHIPPING_THRESHOLD }
