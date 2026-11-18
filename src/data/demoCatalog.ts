import { PRODUCTS, type Product } from '@/data/products'

/**
 * Explicit display-only examples. No real merchandise, inventory, reviews,
 * order creation, promotion claims or verified product specifications.
 * These are bundled local images, not database items or sale offers.
 */
export function getDemoCatalog(): Product[] {
  return PRODUCTS.map((product) => ({
    ...product,
    id: `demo-${product.id}`,
    isDemo: true,
    badge: undefined,
    compareAt: undefined,
    rating: 0,
    reviewCount: 0,
    reviews: [],
    description: 'Dette er en illustrasjon av et mulig produkt i den fremtidige NISRIN-butikken. Produktet er ikke tilgjengelig for kjøp. Innhold, opprinnelse og egenskaper er ikke bekreftet.',
    ingredients: 'Ikke fastsatt – demoprodukt.',
    usage: 'Ikke fastsatt – demoprodukt.',
    variants: product.variants.map((variant) => ({
      ...variant,
      sku: undefined,
      availableQty: 0,
    })),
  }))
}
