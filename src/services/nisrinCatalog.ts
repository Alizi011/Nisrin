import type { Product, Variant } from '@/data/products'

type JsonRecord = Record<string, unknown>

function record(value: unknown): JsonRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Ugyldig produktdata fra NISRIN-API.')
  }
  return value as JsonRecord
}

function textField(value: unknown, maxLength: number, required = false): string {
  if (value == null && !required) return ''
  if (typeof value !== 'string' || value.length > maxLength) {
    throw new Error('Ugyldig produktinformasjon fra NISRIN-API.')
  }
  const text = value.trim()
  if (required && !text) throw new Error('Produktet mangler obligatorisk informasjon.')
  return text
}

function safeImage(value: unknown, apiBase: string): string {
  if (typeof value !== 'string' || !value.trim()) return ''
  try {
    const origin = new URL(apiBase)
    const url = new URL(value.trim(), origin.origin + '/')
    // Images must be served from the configured API origin. Never trust arbitrary
    // image URLs from the database (including data:, javascript: and external hosts).
    return url.origin === origin.origin && ['https:', 'http:'].includes(url.protocol)
      ? url.href
      : ''
  } catch {
    return ''
  }
}

/**
 * Read only approved/active products returned by the public /products backend.
 * Missing/invalid data fails closed; there is deliberately no demo fallback.
 * Database ID is stable and separate from the historical "legacy_id".
 */
export function parsePublicCatalog(payload: unknown, apiBase: string): Product[] {
  const result = record(payload)
  if (!Array.isArray(result.products) || result.products.length > 500) {
    throw new Error('Ugyldig produktkatalog fra NISRIN-API.')
  }

  const seenIds = new Set<string>()
  const seenSkus = new Set<string>()
  return result.products.map((entry) => {
    const product = record(entry)
    let id: string
    if (Number.isSafeInteger(product.dbId) && (product.dbId as number) > 0) {
      id = `db-${product.dbId}`
    } else if (typeof product.id === 'string' && product.id.trim() && product.id.length <= 120) {
      // Compatibility with the older public backend before dbId was added.
      id = `legacy-${product.id.trim()}`
    } else {
      throw new Error('Produktkatalogen mangler en stabil produkt-ID.')
    }
    if (seenIds.has(id)) throw new Error('Duplikatprodukt i NISRIN-katalogen.')
    seenIds.add(id)

    if (!Array.isArray(product.variants) || product.variants.length === 0 ||
        product.variants.length > 50) {
      throw new Error('Produktet mangler gyldige varianter.')
    }
    const labels = new Set<string>()
    const variants: Variant[] = product.variants.map((entry) => {
      const variant = record(entry)
      const sku = textField(variant.sku, 80, true)
      const label = textField(variant.label, 120, true)
      const ore = variant.priceOre
      if (!Number.isSafeInteger(ore) || (ore as number) < 1 || (ore as number) > 100000000 ||
          labels.has(label) || seenSkus.has(sku)) {
        throw new Error('Ugyldig SKU, variantnavn eller pris i produktkatalogen.')
      }
      labels.add(label)
      seenSkus.add(sku)
      return { sku, label, price: (ore as number) / 100 }
    })

    const name = textField(product.name, 160, true)
    const category = textField(product.category, 80) || 'Annet'
    return {
      id,
      name,
      subtitle: textField(product.subtitle, 255),
      category,
      concerns: [],
      price: Math.min(...variants.map((variant) => variant.price)),
      image: safeImage(product.image, apiBase),
      rating: 0,
      reviewCount: 0,
      description: textField(product.description, 5000),
      ingredients: textField(product.ingredients, 5000),
      usage: textField(product.usage, 5000),
      variants,
      reviews: [],
    }
  })
}

/** Public GET; never sends admin cookies or silently substitutes sample products. */
export async function getPublicCatalog(signal?: AbortSignal): Promise<Product[]> {
  const apiBase = (import.meta.env.VITE_NISRIN_API_URL || 'https://api.nisrin.no').replace(/\\/+$/, '')
  const response = await fetch(`${apiBase}/products`, {
    method: 'GET',
    credentials: 'omit',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
    signal,
  })
  if (!response.ok) throw new Error('Produktkatalogen er midlertidig utilgjengelig.')
  return parsePublicCatalog(await response.json(), apiBase)
}
