import { useMemo, useState } from 'react'
import { CATEGORIES, CONCERNS, PRODUCTS, type Category } from '@/data/products'
import ProductCard from '@/components/ProductCard'
import { StarDivider } from '@/components/patterns'

type Sort = 'populært' | 'pris-lav' | 'pris-høy' | 'nyheter'

export default function ShopSection() {
  const [category, setCategory] = useState<Category | 'Alle'>('Alle')
  const [concern, setConcern] = useState<string>('Alle')
  const [sort, setSort] = useState<Sort>('populært')

  const products = useMemo(() => {
    let list = PRODUCTS.filter(
      (p) => (category === 'Alle' || p.category === category) && (concern === 'Alle' || p.concerns.includes(concern)),
    )
    switch (sort) {
      case 'pris-lav':
        list = [...list].sort((a, b) => a.price - b.price)
        break
      case 'pris-høy':
        list = [...list].sort((a, b) => b.price - a.price)
        break
      case 'nyheter':
        list = [...list].sort((a, b) => (b.badge === 'Nyhet' ? 1 : 0) - (a.badge === 'Nyhet' ? 1 : 0))
        break
      default:
        list = [...list].sort((a, b) => b.reviewCount - a.reviewCount)
    }
    return list
  }, [category, concern, sort])

  return (
    <section id="butikk" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-16 md:px-10 md:py-24">
      <div className="reveal mb-10 text-center">
        <p className="text-[11px] font-bold tracking-[0.34em] text-rust uppercase">Souk&apos;en</p>
        <h2 className="font-display mt-3 text-4xl font-semibold md:text-6xl">Butikken</h2>
        <div className="mx-auto mt-6 max-w-xs">
          <StarDivider />
        </div>
      </div>

      {/* Filterrad */}
      <div className="reveal mb-8 flex flex-col gap-5 border-y border-ink/15 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {(['Alle', ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`border px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] uppercase transition-all ${
                category === c ? 'border-espresso bg-espresso text-ivory' : 'border-ink/25 hover:border-espresso'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase">
            <span className="text-ink/50">Hudtype</span>
            <select
              value={concern}
              onChange={(e) => setConcern(e.target.value)}
              className="cursor-pointer border border-ink/25 bg-transparent px-3 py-1.5 text-[11px] font-bold tracking-[0.1em] uppercase outline-none focus:border-rust"
            >
              <option>Alle</option>
              {CONCERNS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase">
            <span className="text-ink/50">Sorter</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="cursor-pointer border border-ink/25 bg-transparent px-3 py-1.5 text-[11px] font-bold tracking-[0.1em] uppercase outline-none focus:border-rust"
            >
              <option value="populært">Mest populære</option>
              <option value="nyheter">Nyheter</option>
              <option value="pris-lav">Pris: lav til høy</option>
              <option value="pris-høy">Pris: høy til lav</option>
            </select>
          </label>
        </div>
      </div>

      <p className="reveal mb-8 text-[12px] tracking-[0.14em] text-ink/50 uppercase">
        {products.length} {products.length === 1 ? 'produkt' : 'produkter'}
      </p>

      {products.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-display text-2xl">Ingen produkter matcher filtrene dine</p>
          <button
            onClick={() => {
              setCategory('Alle')
              setConcern('Alle')
            }}
            className="mt-4 border border-espresso px-6 py-2.5 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors hover:bg-espresso hover:text-ivory"
          >
            Nullstill filtre
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 md:gap-x-8 lg:grid-cols-4">
          {products.map((p) => (
            <div key={p.id} className="reveal">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
