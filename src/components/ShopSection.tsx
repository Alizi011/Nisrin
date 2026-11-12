import { useMemo, useState } from 'react'
import { type Category } from '@/data/products'
import { useShop } from '@/store/ShopContext'
import ProductCard from '@/components/ProductCard'
import { StarDivider } from '@/components/patterns'

type Sort = 'navn' | 'pris-lav' | 'pris-høy'

export default function ShopSection() {
  const { products: catalog, catalogLoading, catalogError, reloadCatalog } = useShop()
  const [category, setCategory] = useState<Category | 'Alle'>('Alle')
  const [sort, setSort] = useState<Sort>('navn')
  const categories = useMemo(() => [...new Set(catalog.map((p) => p.category))].sort(), [catalog])
  const products = useMemo(() => {
    const list = catalog.filter((p) => category === 'Alle' || p.category === category)
    if (sort === 'pris-lav') return [...list].sort((a, b) => a.price - b.price)
    if (sort === 'pris-høy') return [...list].sort((a, b) => b.price - a.price)
    return [...list].sort((a, b) => a.name.localeCompare(b.name, 'nb'))
  }, [catalog, category, sort])

  return (
    <section id="butikk" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-16 md:px-10 md:py-24">
      <div className="reveal mb-10 text-center">
        <p className="text-[11px] font-bold tracking-[0.34em] text-rust uppercase">Souk&apos;en</p>
        <h2 className="font-display mt-3 text-4xl font-semibold md:text-6xl">Butikken</h2>
        <div className="mx-auto mt-6 max-w-xs"><StarDivider /></div>
      </div>

      {catalogLoading ? (
        <p role="status" className="py-16 text-center text-sm">Henter godkjente produkter fra NISRIN …</p>
      ) : catalogError ? (
        <div role="alert" className="py-16 text-center">
          <p className="font-display text-2xl">{catalogError}</p>
          <button onClick={reloadCatalog} className="mt-5 border border-espresso px-6 py-2.5 text-xs font-bold uppercase">
            Prøv igjen
          </button>
        </div>
      ) : catalog.length === 0 ? (
        <p role="status" className="py-16 text-center text-sm">
          Ingen godkjente produkter er tilgjengelige for salg ennå.
        </p>
      ) : (
        <>
          <div className="reveal mb-8 flex flex-col gap-5 border-y border-ink/15 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {['Alle', ...categories].map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`border px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] uppercase transition-all ${
                    category === c ? 'border-espresso bg-espresso text-ivory' : 'border-ink/25 hover:border-espresso'
                  }`}
                >{c}</button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase">
              <span className="text-ink/50">Sorter</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="cursor-pointer border border-ink/25 bg-transparent px-3 py-1.5 text-[11px] font-bold tracking-[0.1em] uppercase outline-none focus:border-rust"
              >
                <option value="navn">Navn</option>
                <option value="pris-lav">Pris: lav til høy</option>
                <option value="pris-høy">Pris: høy til lav</option>
              </select>
            </label>
          </div>
          <p className="reveal mb-8 text-[12px] tracking-[0.14em] text-ink/50 uppercase">
            {products.length} {products.length === 1 ? 'produkt' : 'produkter'}
          </p>
          {products.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-display text-2xl">Ingen produkter matcher filteret.</p>
              <button onClick={() => setCategory('Alle')} className="mt-4 border border-espresso px-6 py-2.5 text-xs font-bold uppercase">
                Vis alle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 md:gap-x-8 lg:grid-cols-4">
              {products.map((p) => <div key={p.id} className="reveal"><ProductCard product={p} /></div>)}
            </div>
          )}
        </>
      )}
    </section>
  )
}
