import { formatPrice } from '@/data/products'
import { useShop } from '@/store/ShopContext'

/**
 * Checkout is intentionally informational until a real order/payment
 * integration is available. Never ask for payment card details in React.
 */
export default function CheckoutModal() {
  const { checkoutOpen, setCheckoutOpen, cart, products, subtotal, discount, shipping, total } = useShop()

  if (!checkoutOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center md:items-center md:p-6">
      <div className="drawer-overlay absolute inset-0 bg-espresso/70 backdrop-blur-[2px]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nisrin-checkout-heading"
        className="nice-scroll relative flex max-h-[94vh] w-full max-w-2xl flex-col overflow-y-auto bg-ivory"
      >
        <div className="zellige-band h-8 border-b border-majorelle/25" aria-hidden="true" />
        <button
          type="button"
          onClick={() => setCheckoutOpen(false)}
          aria-label="Lukk kassen"
          className="absolute top-12 right-4 p-1 text-lg hover:text-rust"
        >
          ✕
        </button>
        <div className="px-6 py-8 md:px-10">
          <h2 id="nisrin-checkout-heading" className="font-display text-3xl font-semibold">Handlekurven din</h2>
          <div role="status" className="mt-6 border border-amber-600/35 bg-cream p-5">
            <p className="font-semibold">Bestilling er ikke åpnet ennå</p>
            <p className="mt-2 text-sm leading-relaxed">
              Vi klargjør sikker betaling og ordrehåndtering. Du kan se handlekurven,
              men det er ennå ikke mulig å betale eller sende inn en bestilling.
              Ingen betaling blir belastet, og ingen ordre opprettes.
            </p>
          </div>
          <div className="mt-6 bg-cream/70 p-5">
            <p className="mb-3 text-[11px] font-bold tracking-[0.2em] uppercase">Din handlekurv</p>
            {cart.length === 0 ? (
              <p className="text-sm">Handlekurven er tom.</p>
            ) : (
              cart.map((item) => {
                const product = products.find((p) => p.id === item.productId)
                const variant = product?.variants.find((v) => v.label === item.variantLabel)
                if (!product || !variant) return null
                return (
                  <div key={`${item.productId}-${item.variantLabel}`} className="flex justify-between gap-3 py-2 text-sm">
                    <span>{product.name} · {item.variantLabel} × {item.qty}</span>
                    <span className="shrink-0">{formatPrice(variant.price * item.qty)}</span>
                  </div>
                )
              })
            )}
            <div className="mt-3 space-y-1 border-t border-ink/15 pt-3 text-sm">
              <div className="flex justify-between">
                <span>Delsum</span><span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span>Rabatt</span><span>−{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Foreløpig frakt</span><span>{shipping === 0 ? 'Gratis' : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between border-t border-ink/15 pt-2 font-bold">
                <span>Foreløpig total</span><span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCheckoutOpen(false)}
            className="mt-6 w-full bg-espresso py-4 text-[12px] font-bold tracking-[0.24em] text-ivory uppercase hover:bg-rust"
          >
            Tilbake til nettbutikken
          </button>
        </div>
      </div>
    </div>
  )
}
