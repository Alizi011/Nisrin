import { useState } from 'react'
import { PRODUCTS, formatPrice, FREE_SHIPPING_THRESHOLD } from '@/data/products'
import { useShop } from '@/store/ShopContext'
import { EightStar } from '@/components/patterns'

export default function CartDrawer() {
  const {
    cart,
    cartOpen,
    setCartOpen,
    updateQty,
    removeFromCart,
    subtotal,
    discount,
    shipping,
    total,
    promo,
    applyPromo,
    setCheckoutOpen,
  } = useShop()
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState(false)

  const progress = Math.min(1, (subtotal - discount) / FREE_SHIPPING_THRESHOLD)

  const tryPromo = () => {
    if (!code.trim()) return
    const ok = applyPromo(code)
    setCodeError(!ok)
    if (ok) setCode('')
  }

  return (
    <div className={`fixed inset-0 z-[100] ${cartOpen ? '' : 'pointer-events-none'}`}>
      <div
        className={`drawer-overlay absolute inset-0 bg-espresso/60 backdrop-blur-[2px] ${cartOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => setCartOpen(false)}
      />
      <aside
        className={`drawer-panel absolute top-0 right-0 flex h-full w-full max-w-md flex-col border-l-4 border-majorelle bg-ivory ${
          cartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-ink/15 px-6 py-5">
          <h2 className="font-display text-2xl font-semibold">Handlekurv</h2>
          <button onClick={() => setCartOpen(false)} aria-label="Lukk" className="p-1 text-lg hover:text-rust">
            ✕
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <EightStar className="h-10 w-10 text-majorelle/60" />
            <p className="font-display mt-4 text-2xl">Kurven din er tom</p>
            <p className="mt-2 text-sm text-ink/55">Fyll den med skjønnhet fra Atlasfjellene.</p>
            <button
              onClick={() => setCartOpen(false)}
              className="mt-6 bg-espresso px-8 py-3 text-[11px] font-bold tracking-[0.2em] text-ivory uppercase transition-colors hover:bg-rust"
            >
              Fortsett å handle
            </button>
          </div>
        ) : (
          <>
            {/* Fri frakt-fremdrift */}
            <div className="border-b border-ink/15 px-6 py-4">
              {subtotal - discount >= FREE_SHIPPING_THRESHOLD ? (
                <p className="text-center text-[12px] font-bold tracking-[0.12em] text-rust uppercase">
                  Du har fått fri frakt!
                </p>
              ) : (
                <p className="text-center text-[12px] tracking-[0.06em]">
                  Du er <strong>{formatPrice(FREE_SHIPPING_THRESHOLD - (subtotal - discount))}</strong> unna fri frakt
                </p>
              )}
              <div className="mt-2 h-1.5 w-full bg-sand">
                <div className="h-full bg-majorelle transition-all duration-500" style={{ width: `${progress * 100}%` }} />
              </div>
            </div>

            <div className="nice-scroll flex-1 overflow-y-auto px-6">
              {cart.map((it) => {
                const p = PRODUCTS.find((x) => x.id === it.productId)!
                const v = p.variants.find((vv) => vv.label === it.variantLabel)!
                return (
                  <div key={`${it.productId}-${it.variantLabel}`} className="flex gap-4 border-b border-ink/10 py-4">
                    <img src={p.image} alt="" className="h-20 w-20 shrink-0 object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="font-display truncate text-lg leading-tight font-semibold">{p.name}</p>
                      <p className="mt-0.5 text-[11px] tracking-[0.1em] text-ink/50 uppercase">{it.variantLabel}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center border border-ink/25">
                          <button onClick={() => updateQty(it.productId, it.variantLabel, -1)} className="px-2.5 py-1 hover:text-rust">
                            −
                          </button>
                          <span className="w-7 text-center text-xs font-bold">{it.qty}</span>
                          <button onClick={() => updateQty(it.productId, it.variantLabel, 1)} className="px-2.5 py-1 hover:text-rust">
                            +
                          </button>
                        </div>
                        <span className="text-sm font-semibold">{formatPrice(v.price * it.qty)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(it.productId, it.variantLabel)}
                      className="self-start p-1 text-ink/40 hover:text-rust"
                      aria-label="Fjern"
                    >
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-ink/15 px-6 py-5">
              {/* Rabattkode */}
              {promo ? (
                <p className="mb-3 flex items-center gap-2 text-[12px] font-bold tracking-[0.1em] text-rust uppercase">
                  <EightStar className="h-4 w-4" /> Kode {promo} aktivert — 10 % avslag
                </p>
              ) : (
                <div className="mb-3">
                  <div className="flex gap-2">
                    <input
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value)
                        setCodeError(false)
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && tryPromo()}
                      placeholder="Rabattkode (prøv HAMMAM10)"
                      className="input-line !py-2 text-xs"
                    />
                    <button
                      onClick={tryPromo}
                      className="shrink-0 border border-espresso px-4 text-[11px] font-bold tracking-[0.16em] uppercase transition-colors hover:bg-espresso hover:text-ivory"
                    >
                      Bruk
                    </button>
                  </div>
                  {codeError && <p className="mt-1 text-[11px] text-rust">Ugyldig kode — prøv HAMMAM10</p>}
                </div>
              )}

              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-ink/70">
                  <span>Delsum</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-rust">
                    <span>Rabatt</span>
                    <span>−{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-ink/70">
                  <span>Frakt</span>
                  <span>{shipping === 0 ? 'Gratis' : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between border-t border-ink/15 pt-2 text-base font-bold">
                  <span>Totalt</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setCartOpen(false)
                  setCheckoutOpen(true)
                }}
                className="mt-4 w-full bg-rust py-4 text-[12px] font-bold tracking-[0.24em] text-ivory uppercase transition-colors hover:bg-espresso"
              >
                Til kassen
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
