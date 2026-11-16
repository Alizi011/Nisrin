import type { CartItem } from '@/store/ShopContext'
import type { Product } from '@/data/products'

export type UnpaidDraft = {
  orderDraftId: number
  status: 'pending_payment'
  subtotalOre: number
  currency: 'NOK'
  expiresAt: number
  paid: false
  orderConfirmed: false
  paymentAvailable: false
}

type DraftLine = { sku: string; quantity: number }

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/** Reject stale/unmapped items rather than letting the UI invent SKUs or prices. */
export function checkoutLines(cart: CartItem[], products: Product[]): DraftLine[] {
  if (cart.length < 1 || cart.length > 20) throw new Error('Handlekurven er tom eller for stor.')
  const lines: DraftLine[] = []
  const seen = new Set<string>()
  let quantityTotal = 0
  for (const item of cart) {
    const product = products.find((p) => p.id === item.productId)
    const variant = product?.variants.find((v) => v.label === item.variantLabel)
    const sku = variant?.sku
    if (!sku || !/^[A-Z0-9][A-Z0-9._-]{0,79}$/.test(sku) ||
        !Number.isSafeInteger(item.qty) || item.qty < 1 || item.qty > 10 ||
        !Number.isSafeInteger(variant?.availableQty) ||
        (variant?.availableQty ?? 0) < item.qty || seen.has(sku)) {
      throw new Error('Handlekurven inneholder varer som må kontrolleres på nytt.')
    }
    seen.add(sku)
    quantityTotal += item.qty
    lines.push({ sku, quantity: item.qty })
  }
  if (quantityTotal > 50) throw new Error('For mange varer i handlekurven.')
  return lines.sort((a, b) => a.sku.localeCompare(b.sku, 'en'))
}

/** The backend, not the browser, determines the amount and reserved inventory. */
export function parseUnpaidDraft(value: unknown): UnpaidDraft {
  if (!isRecord(value) || !Number.isSafeInteger(value.orderDraftId) ||
      (value.orderDraftId as number) < 1 ||
      value.status !== 'pending_payment' ||
      !Number.isSafeInteger(value.subtotalOre) ||
      (value.subtotalOre as number) < 1 || (value.subtotalOre as number) > 100000000 ||
      !Number.isSafeInteger(value.expiresAt) ||
      (value.expiresAt as number) <= 0 ||
      value.currency !== 'NOK' ||
      value.paid !== false || value.orderConfirmed !== false ||
      value.paymentAvailable !== false) {
    throw new Error('Serveren returnerte ikke et gyldig ubetalt ordreutkast.')
  }
  return {
    orderDraftId: value.orderDraftId as number,
    status: 'pending_payment',
    subtotalOre: value.subtotalOre as number,
    expiresAt: value.expiresAt as number,
    currency: 'NOK',
    paid: false,
    orderConfirmed: false,
    paymentAvailable: false,
  }
}

export async function createUnpaidDraft(
  email: string,
  lines: DraftLine[],
  requestKey: string,
  signal?: AbortSignal,
): Promise<UnpaidDraft> {
  const normalizedEmail = email.trim().toLowerCase()
  if (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey)) {
    throw new Error('Kontroller e-postadressen før du fortsetter.')
  }
  // This feature is deliberately disabled in all production builds, even if
  // someone sets VITE_NISRIN_ENABLE_DRAFT_CHECKOUT there.
  if (!import.meta.env.DEV || import.meta.env.VITE_NISRIN_ENABLE_DRAFT_CHECKOUT !== 'true') {
    throw new Error('Ordreutkast er ikke aktivert.')
  }
  const apiBase = (import.meta.env.VITE_NISRIN_API_URL || 'https://api.nisrin.no').replace(/\/+$/, '')
  const response = await fetch(`${apiBase}/order-drafts`, {
    method: 'POST',
    credentials: 'omit',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email: normalizedEmail, items: lines, requestKey }),
    signal,
  })
  if (!response.ok) {
    if (response.status === 409) throw new Error('Pris eller lager har endret seg. Oppdater katalogen og prøv igjen.')
    throw new Error('Serveren kunne ikke opprette et ubetalt ordreutkast.')
  }
  return parseUnpaidDraft(await response.json())
}


/**
 * Validate the exact backend response. Cancellation is not a refund,
 * payment, order acceptance or shipment.
 */
export function parseUnpaidCancellation(value: unknown): {
  cancelled: true
  paid: false
  orderConfirmed: false
} {
  if (!isRecord(value) || value.cancelled !== true ||
      value.paid !== false || value.orderConfirmed !== false) {
    throw new Error('Serveren bekreftet ikke kansellering av ubetalt reservasjon.')
  }
  return { cancelled: true, paid: false, orderConfirmed: false }
}

/** Cancel only the original draft using its original key and contact email. */
export async function cancelUnpaidDraft(
  email: string,
  requestKey: string,
  signal?: AbortSignal,
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase()
  if (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey)) {
    throw new Error('Ugyldig forespørsel om kansellering.')
  }
  // Identical development-only gate as draft creation.
  if (!import.meta.env.DEV || import.meta.env.VITE_NISRIN_ENABLE_DRAFT_CHECKOUT !== 'true') {
    throw new Error('Kansellering av testreservasjoner er ikke aktivert.')
  }
  const apiBase = (import.meta.env.VITE_NISRIN_API_URL || 'https://api.nisrin.no').replace(/\/+$/, '')
  const response = await fetch(apiBase + '/order-drafts/cancel', {
    method: 'POST',
    credentials: 'omit',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email: normalizedEmail, requestKey }),
    signal,
  })
  if (!response.ok) {
    if (response.status === 409) {
      throw new Error('Reservasjonen kan ikke lenger avbrytes. Den kan ha utløpt.')
    }
    throw new Error('Serveren kunne ikke kansellere reservasjonen. Prøv igjen.')
  }
  parseUnpaidCancellation(await response.json())
}
