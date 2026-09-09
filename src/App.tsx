import { useEffect } from 'react'
import { ShopProvider, useShop } from '@/store/ShopContext'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import ShopSection from '@/components/ShopSection'
import { RitualSection, IngredientsSection } from '@/components/Editorial'
import { ReviewsSection, NewsletterSection, AboutSection, Footer } from '@/components/Sections'
import ProductModal from '@/components/ProductModal'
import CartDrawer from '@/components/CartDrawer'
import WishlistDrawer from '@/components/WishlistDrawer'
import SearchOverlay from '@/components/SearchOverlay'
import CheckoutModal from '@/components/CheckoutModal'
import { EightStar } from '@/components/patterns'

function Toast() {
  const { toast } = useShop()
  if (!toast) return null
  return (
    <div className="fixed bottom-6 left-1/2 z-[120] flex -translate-x-1/2 items-center gap-3 border border-majorelle/40 bg-espresso px-6 py-3.5 text-ivory shadow-xl">
      <EightStar className="h-4 w-4 shrink-0 text-saffron" />
      <span className="text-[12px] font-bold tracking-[0.14em] uppercase">{toast}</span>
    </div>
  )
}

function useRevealObserver() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible')
            observer.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12 },
    )
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

function Page() {
  useRevealObserver()
  return (
    <div className="min-h-screen">
      <div className="viewport-frame" aria-hidden="true" />
      <Header />
      <main>
        <Hero />
        <ShopSection />
        <RitualSection />
        <IngredientsSection />
        <ReviewsSection />
        <NewsletterSection />
        <AboutSection />
      </main>
      <Footer />
      <ProductModal />
      <CartDrawer />
      <WishlistDrawer />
      <SearchOverlay />
      <CheckoutModal />
      <Toast />
    </div>
  )
}

export default function App() {
  return (
    <ShopProvider>
      <Page />
    </ShopProvider>
  )
}
