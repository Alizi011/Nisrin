import type { Product } from '@/data/products'
import { formatPrice } from '@/data/products'
import { useShop } from '@/store/ShopContext'

export function Stars({ value, className = 'h-3.5 w-3.5' }: { value: number; className?: string }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} av 5 stjerner`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={`${className} ${i <= Math.round(value) ? 'fill-saffron text-saffron' : 'fill-none text-ink/30'}`}
          stroke="currentColor"
          strokeWidth="1.4"
        >
          <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2z" />
        </svg>
      ))}
    </div>
  )
}

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, wishlist, openProduct } = useShop()
  const wished = wishlist.includes(product.id)

  return (
    <article className="group relative">
      <div className="relative overflow-hidden bg-sand">
        <button onClick={() => openProduct(product)} className="block w-full cursor-pointer" aria-label={`Se ${product.name}`}>
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="aspect-[4/5] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
        </button>

        {product.badge && (
          <span
            className={`absolute top-3 left-3 px-3 py-1 text-[10px] font-bold tracking-[0.18em] uppercase ${
              product.badge === 'Kun noen få igjen' ? 'bg-rust text-ivory' : 'bg-ivory/95 text-ink'
            }`}
          >
            {product.badge}
          </span>
        )}
        {product.compareAt && (
          <span className="absolute top-3 right-3 bg-majorelle px-3 py-1 text-[10px] font-bold tracking-[0.18em] text-ivory uppercase">
            Spar {formatPrice(product.compareAt - product.price)}
          </span>
        )}

        {/* Hurtighandlinger */}
        <div className="absolute inset-x-3 bottom-3 flex translate-y-14 gap-2 transition-transform duration-400 ease-out group-hover:translate-y-0">
          <button
            onClick={() => addToCart(product.id, product.variants[0].label)}
            className="flex-1 bg-espresso/95 py-3 text-[11px] font-bold tracking-[0.2em] text-ivory uppercase backdrop-blur transition-colors hover:bg-rust"
          >
            Legg i kurv
          </button>
          <button
            onClick={() => toggleWishlist(product.id)}
            aria-label="Legg til i ønskeliste"
            className={`flex w-11 items-center justify-center backdrop-blur transition-colors ${
              wished ? 'bg-rust text-ivory' : 'bg-ivory/95 text-ink hover:text-rust'
            }`}
          >
            <svg viewBox="0 0 24 24" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" className="h-4.5 w-4.5">
              <path d="M12 21C7 16.5 3 13 3 8.8 3 6 5.2 4 7.8 4c1.7 0 3.2.9 4.2 2.3C13 4.9 14.5 4 16.2 4 18.8 4 21 6 21 8.8c0 4.2-4 7.7-9 12.2z" />
            </svg>
          </button>
        </div>
      </div>

      <button onClick={() => openProduct(product)} className="mt-4 block w-full text-left">
        <p className="text-[10px] font-bold tracking-[0.24em] text-olive uppercase">{product.subtitle}</p>
        <h3 className="font-display mt-1 text-[22px] leading-tight font-semibold transition-colors group-hover:text-rust">
          {product.name}
        </h3>
        <div className="mt-1.5 flex items-center justify-between">
          <Stars value={product.rating} />
          <div className="text-[14px] font-semibold">
            {product.compareAt && <span className="mr-2 text-ink/40 line-through">{formatPrice(product.compareAt)}</span>}
            <span>{formatPrice(product.price)}</span>
          </div>
        </div>
        <p className="mt-0.5 text-[11px] text-ink/50">{product.reviewCount} anmeldelser</p>
      </button>
    </article>
  )
}
