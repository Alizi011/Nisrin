import { PRODUCTS, formatPrice } from '@/data/products'
import { useShop } from '@/store/ShopContext'
import { EightStar } from '@/components/patterns'

export default function WishlistDrawer() {
  const { wishlist, wishlistOpen, setWishlistOpen, toggleWishlist, addToCart, openProduct } = useShop()

  const items = PRODUCTS.filter((p) => wishlist.includes(p.id))

  return (
    <div className={`fixed inset-0 z-[100] ${wishlistOpen ? '' : 'pointer-events-none'}`}>
      <div
        className={`drawer-overlay absolute inset-0 bg-espresso/60 backdrop-blur-[2px] ${wishlistOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => setWishlistOpen(false)}
      />
      <aside
        className={`drawer-panel absolute top-0 right-0 flex h-full w-full max-w-md flex-col border-l-4 border-rust bg-ivory ${
          wishlistOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-ink/15 px-6 py-5">
          <h2 className="font-display text-2xl font-semibold">Ønskeliste</h2>
          <button onClick={() => setWishlistOpen(false)} aria-label="Lukk" className="p-1 text-lg hover:text-rust">
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <EightStar className="h-10 w-10 text-rust/50" />
            <p className="font-display mt-4 text-2xl">Ingenting lagret ennå</p>
            <p className="mt-2 text-sm text-ink/55">Trykk på hjertet på et produkt for å lagre det her.</p>
            <button
              onClick={() => setWishlistOpen(false)}
              className="mt-6 bg-espresso px-8 py-3 text-[11px] font-bold tracking-[0.2em] text-ivory uppercase transition-colors hover:bg-rust"
            >
              Utforsk butikken
            </button>
          </div>
        ) : (
          <div className="nice-scroll flex-1 overflow-y-auto px-6 py-2">
            {items.map((p) => (
              <div key={p.id} className="flex gap-4 border-b border-ink/10 py-4">
                <button onClick={() => { setWishlistOpen(false); openProduct(p) }} className="shrink-0">
                  <img src={p.image} alt="" className="h-20 w-20 object-cover" />
                </button>
                <div className="min-w-0 flex-1">
                  <button
                    onClick={() => { setWishlistOpen(false); openProduct(p) }}
                    className="font-display block truncate text-lg leading-tight font-semibold hover:text-rust"
                  >
                    {p.name}
                  </button>
                  <p className="mt-0.5 text-sm font-semibold">{formatPrice(p.price)}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => addToCart(p.id, p.variants[0].label)}
                      className="bg-espresso px-4 py-1.5 text-[10px] font-bold tracking-[0.16em] text-ivory uppercase transition-colors hover:bg-rust"
                    >
                      Legg i kurv
                    </button>
                    <button
                      onClick={() => toggleWishlist(p.id)}
                      className="border border-ink/25 px-4 py-1.5 text-[10px] font-bold tracking-[0.16em] uppercase transition-colors hover:border-rust hover:text-rust"
                    >
                      Fjern
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  )
}
