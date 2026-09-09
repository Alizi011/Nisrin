import { useMemo, useState } from 'react'
import { formatPrice } from '@/data/products'
import { useShop } from '@/store/ShopContext'
import { Stars } from '@/components/ProductCard'
import { EightStar } from '@/components/patterns'

type Tab = 'beskrivelse' | 'ingredienser' | 'bruk' | 'anmeldelser'

export default function ProductModal() {
  const { activeProduct: p, openProduct, addToCart, toggleWishlist, wishlist, extraReviews, addReview, showToast } = useShop()
  const [variant, setVariant] = useState(0)
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState<Tab>('beskrivelse')
  const [reviewName, setReviewName] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')

  const allReviews = useMemo(() => (p ? [...(extraReviews[p.id] ?? []), ...p.reviews] : []), [p, extraReviews])

  if (!p) return null
  const wished = wishlist.includes(p.id)
  const price = p.variants[variant]?.price ?? p.price

  const close = () => {
    openProduct(null)
    setVariant(0)
    setQty(1)
    setTab('beskrivelse')
    setReviewText('')
    setReviewName('')
    setReviewRating(5)
  }

  const submitReview = () => {
    if (!reviewName.trim() || !reviewText.trim()) return
    addReview(p.id, { author: reviewName.trim(), rating: reviewRating, text: reviewText.trim() })
    setReviewName('')
    setReviewText('')
    setReviewRating(5)
    showToast('Takk for anmeldelsen din!')
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'beskrivelse', label: 'Beskrivelse' },
    { id: 'ingredienser', label: 'Ingredienser' },
    { id: 'bruk', label: 'Bruk' },
    { id: 'anmeldelser', label: `Anmeldelser (${allReviews.length})` },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-center md:p-6">
      <div className="drawer-overlay absolute inset-0 bg-espresso/60 backdrop-blur-[2px]" onClick={close} />
      <div className="nice-scroll relative flex max-h-[94vh] w-full max-w-4xl flex-col overflow-y-auto bg-ivory md:flex-row">
        <button
          onClick={close}
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center bg-ivory/90 text-lg transition-colors hover:bg-rust hover:text-ivory"
          aria-label="Lukk"
        >
          ✕
        </button>

        <div className="relative shrink-0 md:w-1/2">
          <img src={p.image} alt={p.name} className="aspect-square h-full w-full object-cover" />
          {p.badge && (
            <span className="absolute top-3 left-3 bg-rust px-3 py-1 text-[10px] font-bold tracking-[0.18em] text-ivory uppercase">
              {p.badge}
            </span>
          )}
        </div>

        <div className="flex-1 p-6 md:p-8">
          <p className="text-[10px] font-bold tracking-[0.24em] text-olive uppercase">
            {p.category} · {p.subtitle}
          </p>
          <h2 className="font-display mt-2 text-3xl leading-tight font-semibold md:text-4xl">{p.name}</h2>
          <div className="mt-2 flex items-center gap-2">
            <Stars value={p.rating} />
            <span className="text-xs text-ink/55">
              {p.rating.toFixed(1)} · {p.reviewCount} anmeldelser
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-display text-3xl font-semibold">{formatPrice(price)}</span>
            {p.compareAt && <span className="text-ink/40 line-through">{formatPrice(p.compareAt)}</span>}
          </div>

          {/* Varianter */}
          {p.variants.length > 1 && (
            <div className="mt-5">
              <p className="mb-2 text-[10px] font-bold tracking-[0.22em] text-ink/50 uppercase">Størrelse</p>
              <div className="flex gap-2">
                {p.variants.map((v, i) => (
                  <button
                    key={v.label}
                    onClick={() => setVariant(i)}
                    className={`border px-4 py-2 text-[11px] font-bold tracking-[0.1em] uppercase transition-all ${
                      variant === i ? 'border-espresso bg-espresso text-ivory' : 'border-ink/25 hover:border-espresso'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Antall + kjøp */}
          <div className="mt-6 flex gap-3">
            <div className="flex items-center border border-ink/25">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3.5 py-3 text-lg hover:text-rust" aria-label="Færre">
                −
              </button>
              <span className="w-8 text-center text-sm font-bold">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-3.5 py-3 text-lg hover:text-rust" aria-label="Flere">
                +
              </button>
            </div>
            <button
              onClick={() => {
                addToCart(p.id, p.variants[variant].label, qty)
                close()
              }}
              className="flex-1 bg-rust py-3 text-[12px] font-bold tracking-[0.22em] text-ivory uppercase transition-colors hover:bg-espresso"
            >
              Legg i kurv — {formatPrice(price * qty)}
            </button>
            <button
              onClick={() => toggleWishlist(p.id)}
              aria-label="Ønskeliste"
              className={`flex w-12 items-center justify-center border transition-colors ${
                wished ? 'border-rust bg-rust text-ivory' : 'border-ink/25 hover:border-rust hover:text-rust'
              }`}
            >
              <svg viewBox="0 0 24 24" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
                <path d="M12 21C7 16.5 3 13 3 8.8 3 6 5.2 4 7.8 4c1.7 0 3.2.9 4.2 2.3C13 4.9 14.5 4 16.2 4 18.8 4 21 6 21 8.8c0 4.2-4 7.7-9 12.2z" />
              </svg>
            </button>
          </div>

          {/* Faner */}
          <div className="mt-8 border-b border-ink/15">
            <div className="flex gap-5 overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`border-b-2 pb-3 text-[11px] font-bold tracking-[0.16em] whitespace-nowrap uppercase transition-colors ${
                    tab === t.id ? 'border-rust text-rust' : 'border-transparent text-ink/50 hover:text-ink'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="py-5 text-[14px] leading-relaxed text-ink/80">
            {tab === 'beskrivelse' && <p>{p.description}</p>}
            {tab === 'ingredienser' && <p>{p.ingredients}</p>}
            {tab === 'bruk' && <p>{p.usage}</p>}
            {tab === 'anmeldelser' && (
              <div className="space-y-5">
                {allReviews.map((r) => (
                  <div key={r.id} className="border-b border-ink/10 pb-5 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{r.author}</span>
                      <span className="text-[11px] text-ink/45">{r.date}</span>
                    </div>
                    <Stars value={r.rating} className="mt-1 h-3 w-3" />
                    <p className="mt-2">{r.text}</p>
                  </div>
                ))}

                {/* Skriv anmeldelse */}
                <div className="bg-cream/60 p-5">
                  <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase">
                    <EightStar className="h-4 w-4 text-rust" /> Skriv en anmeldelse
                  </p>
                  <div className="mt-3 flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button key={i} onClick={() => setReviewRating(i)} aria-label={`${i} stjerner`}>
                        <svg
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          className={`h-5 w-5 ${i <= reviewRating ? 'fill-saffron text-saffron' : 'fill-none text-ink/30'}`}
                        >
                          <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                  <input
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    placeholder="Navnet ditt"
                    className="input-line mt-3"
                  />
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Hvordan likte du produktet?"
                    rows={3}
                    className="input-line mt-2 resize-none"
                  />
                  <button
                    onClick={submitReview}
                    disabled={!reviewName.trim() || !reviewText.trim()}
                    className="mt-4 bg-espresso px-6 py-2.5 text-[11px] font-bold tracking-[0.2em] text-ivory uppercase transition-colors hover:bg-rust disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Send inn
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
