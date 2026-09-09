import { useEffect, useMemo, useState } from 'react'
import { PRODUCTS, formatPrice } from '@/data/products'
import { useShop } from '@/store/ShopContext'
import { Stars } from '@/components/ProductCard'

export default function SearchOverlay() {
  const { searchOpen, setSearchOpen, openProduct } = useShop()
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (searchOpen) setQuery('')
  }, [searchOpen])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.concerns.some((c) => c.toLowerCase().includes(q)) ||
        p.description.toLowerCase().includes(q),
    )
  }, [query])

  if (!searchOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-ivory">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-4 px-6 pt-16 md:pt-24">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6 shrink-0 text-rust">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4-4" />
        </svg>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Søk etter arganolje, leirmaske, rosvann …"
          className="input-line font-display !text-2xl md:!text-3xl"
          onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
        />
        <button
          onClick={() => setSearchOpen(false)}
          className="shrink-0 p-2 text-[11px] font-bold tracking-[0.2em] uppercase hover:text-rust"
        >
          Lukk
        </button>
      </div>

      <div className="nice-scroll mx-auto mt-10 w-full max-w-3xl flex-1 overflow-y-auto px-6 pb-16">
        {query.trim() === '' ? (
          <div>
            <p className="text-[11px] font-bold tracking-[0.24em] text-ink/50 uppercase">Populære søk</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {['Arganolje', 'Rosvann', 'Maske', 'Tørr hud', 'Gavesett', 'Safran'].map((s) => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="border border-ink/25 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] uppercase transition-colors hover:border-espresso hover:bg-espresso hover:text-ivory"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : results.length === 0 ? (
          <p className="font-display text-2xl text-ink/60">Ingen treff på «{query}» — prøv et annet ord.</p>
        ) : (
          <div className="space-y-1">
            <p className="mb-4 text-[11px] font-bold tracking-[0.24em] text-ink/50 uppercase">
              {results.length} {results.length === 1 ? 'treff' : 'treff'}
            </p>
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSearchOpen(false)
                  openProduct(p)
                }}
                className="group flex w-full items-center gap-5 border-b border-ink/10 py-4 text-left transition-colors hover:bg-cream/60"
              >
                <img src={p.image} alt="" className="h-16 w-16 shrink-0 object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold tracking-[0.22em] text-olive uppercase">{p.category}</p>
                  <p className="font-display truncate text-xl font-semibold group-hover:text-rust">{p.name}</p>
                  <Stars value={p.rating} className="h-3 w-3" />
                </div>
                <span className="shrink-0 text-sm font-semibold">{formatPrice(p.price)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
