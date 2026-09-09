import { useEffect, useState } from 'react'
import { useShop } from '@/store/ShopContext'
import { EightStar, WildRose } from '@/components/patterns'

const NAV = [
  { label: 'Butikk', href: '#butikk' },
  { label: 'Ritualer', href: '#ritualer' },
  { label: 'Ingredienser', href: '#ingredienser' },
  { label: 'Anmeldelser', href: '#anmeldelser' },
  { label: 'Om oss', href: '#om' },
]

const MARQUEE_ITEMS = [
  'Fri frakt på bestillinger over 600 kr',
  'Håndlaget i Marokko — levert i Norge',
  '10 % avslag med koden HAMMAM10',
  'Kaldpresset arganolje fra Agadir',
]

export default function Header() {
  const { cartCount, wishlist, setCartOpen, setWishlistOpen, setSearchOpen } = useShop()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* Kunngjøringslinje */}
      <div className="relative z-50 overflow-hidden border-b border-ivory/20 bg-espresso py-2 text-ivory">
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
              {MARQUEE_ITEMS.map((t, i) => (
                <span key={i} className="flex items-center gap-6 pr-6 text-[11px] font-semibold tracking-[0.18em] uppercase">
                  {t}
                  <EightStar className="h-3 w-3 text-saffron" strokeWidth={2} />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Sticky header */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled ? 'bg-ivory/95 shadow-[0_1px_0_rgba(59,42,30,0.12)] backdrop-blur-sm' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-10">
          {/* Venstre: nav (desktop) / hamburger (mobil) */}
          <nav className="hidden items-center gap-7 md:flex">
            {NAV.slice(0, 3).map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="text-[11px] font-bold tracking-[0.22em] uppercase transition-colors hover:text-rust"
              >
                {n.label}
              </a>
            ))}
          </nav>
          <button
            className="flex flex-col gap-1.5 p-2 md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Meny"
          >
            <span className={`h-px w-6 bg-ink transition-transform ${menuOpen ? 'translate-y-[3.5px] rotate-45' : ''}`} />
            <span className={`h-px w-6 bg-ink transition-transform ${menuOpen ? '-translate-y-[3.5px] -rotate-45' : ''}`} />
          </button>

          {/* Logo */}
          <a href="#topp" className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2.5">
            <WildRose className="h-9 w-9 shrink-0 text-rust" />
            <span className="text-center leading-none">
              <span className="font-display block text-2xl font-semibold tracking-[0.22em] uppercase md:text-[26px]">
                Nisrin
              </span>
              <span className="mt-1 block text-[9px] font-bold tracking-[0.42em] uppercase text-olive">
                Marokkansk hudpleie
              </span>
            </span>
          </a>

          {/* Høyre: verktøy */}
          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 transition-colors hover:text-rust"
              aria-label="Søk"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4-4" />
              </svg>
            </button>
            <button
              onClick={() => setWishlistOpen(true)}
              className="relative p-2 transition-colors hover:text-rust"
              aria-label="Ønskeliste"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
                <path d="M12 21C7 16.5 3 13 3 8.8 3 6 5.2 4 7.8 4c1.7 0 3.2.9 4.2 2.3C13 4.9 14.5 4 16.2 4 18.8 4 21 6 21 8.8c0 4.2-4 7.7-9 12.2z" />
              </svg>
              {wishlist.length > 0 && (
                <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-rust text-[9px] font-bold text-ivory">
                  {wishlist.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 transition-colors hover:text-rust"
              aria-label="Handlekurv"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
                <path d="M6 8h12l1.2 12H4.8L6 8z" />
                <path d="M9 8V6a3 3 0 016 0v2" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-rust text-[9px] font-bold text-ivory">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobilmeny */}
        {menuOpen && (
          <nav className="border-t border-ink/10 bg-ivory px-6 py-4 md:hidden">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setMenuOpen(false)}
                className="block py-3 text-[12px] font-bold tracking-[0.22em] uppercase"
              >
                {n.label}
              </a>
            ))}
          </nav>
        )}
      </header>
    </>
  )
}
