import { useState } from 'react'
import { formatPrice } from '@/data/products'
import { useShop } from '@/store/ShopContext'

type Tab = 'beskrivelse' | 'ingredienser' | 'bruk'

export default function ProductModal() {
  const { activeProduct: product, openProduct, addToCart, toggleWishlist, wishlist } = useShop()
  const [variantIndex, setVariantIndex] = useState(0)
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState<Tab>('beskrivelse')

  if (!product) return null
  const variant = product.variants[variantIndex] ?? product.variants[0]
  const wished = wishlist.includes(product.id)
  const available = variant.availableQty ?? 0

  const close = () => {
    openProduct(null)
    setVariantIndex(0)
    setQty(1)
    setTab('beskrivelse')
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-center md:p-6">
      <div className="drawer-overlay absolute inset-0 bg-espresso/60 backdrop-blur-[2px]" onClick={close} />
      <div role="dialog" aria-modal="true" aria-label={product.name}
        className="nice-scroll relative flex max-h-[94vh] w-full max-w-4xl flex-col overflow-y-auto bg-ivory md:flex-row">
        <button onClick={close} aria-label="Lukk" className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center bg-ivory/90 text-lg hover:bg-rust hover:text-ivory">
          ✕
        </button>
        <div className="relative shrink-0 md:w-1/2">
          {product.image ? (
            <img src={product.image} alt={product.name} className="aspect-square h-full w-full object-cover" />
          ) : (
            <div className="flex aspect-square items-center justify-center bg-sand text-sm text-ink/50">Produktbilde ikke tilgjengelig</div>
          )}
        </div>
        <div className="flex-1 p-6 md:p-8">
          <p className="text-[10px] font-bold tracking-[0.24em] text-olive uppercase">{product.category} · {product.subtitle}</p>
          <h2 className="font-display mt-2 text-3xl leading-tight font-semibold md:text-4xl">{product.name}</h2>
          <p className="font-display mt-4 text-3xl font-semibold">{formatPrice(variant.price)}</p>

          {product.variants.length > 1 && (
            <div className="mt-5">
              <p className="mb-2 text-[10px] font-bold tracking-[0.22em] text-ink/50 uppercase">Variant</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v, index) => (
                  <button key={v.sku ?? v.label} onClick={() => { setVariantIndex(index); setQty(1) }}
                    className={`border px-4 py-2 text-[11px] font-bold uppercase ${
                      variantIndex === index ? 'border-espresso bg-espresso text-ivory' : 'border-ink/25'
                    }`}>
                    {v.label} · {formatPrice(v.price)}{(v.availableQty ?? 0) === 0 ? ' · Utsolgt' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="flex items-center border border-ink/25">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3.5 py-3 text-lg" aria-label="Færre">−</button>
              <span className="w-8 text-center text-sm font-bold">{qty}</span>
              <button onClick={() => setQty(Math.min(99, available, qty + 1))} disabled={qty >= available} className="px-3.5 py-3 text-lg disabled:opacity-40" aria-label="Flere">+</button>
            </div>
            <button disabled={available < qty || available === 0} onClick={() => { addToCart(product.id, variant.label, qty); close() }}
              className="flex-1 bg-rust px-5 py-3 text-[12px] font-bold tracking-[0.16em] text-ivory uppercase hover:bg-espresso disabled:opacity-50">
              {available > 0 ? `Legg i handlekurv · ${formatPrice(variant.price * qty)}` : 'Utsolgt'}
            </button>
            <button onClick={() => toggleWishlist(product.id)} aria-label="Ønskeliste"
              className={`border px-4 ${
                wished ? 'border-rust bg-rust text-ivory' : 'border-ink/25 hover:border-rust'
              }`}>{wished ? '♥' : '♡'}</button>
          </div>
          <p className="mt-3 text-xs text-ink/55">Bestilling og betaling er ennå ikke åpnet. Prisene er veiledende fram til servervalidert kasse er klar.</p>

          <div className="mt-8 flex gap-5 overflow-x-auto border-b border-ink/15">
            {([
              ['beskrivelse', 'Beskrivelse'],
              ['ingredienser', 'Ingredienser'],
              ['bruk', 'Bruk'],
            ] as const).map(([value, label]) => (
              <button key={value} onClick={() => setTab(value)}
                className={`border-b-2 pb-3 text-xs font-bold uppercase ${
                  tab === value ? 'border-rust text-rust' : 'border-transparent text-ink/50'
                }`}>{label}</button>
            ))}
          </div>
          <p className="py-5 text-[14px] leading-relaxed text-ink/80">
            {tab === 'beskrivelse' ? product.description :
              tab === 'ingredienser' ? product.ingredients : product.usage}
          </p>
        </div>
      </div>
    </div>
  )
}
