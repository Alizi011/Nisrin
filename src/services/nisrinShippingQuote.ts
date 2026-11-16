/**
 * Shipping quote for an existing, server-priced UNPAID draft.
 * This is a development-only preview, not a payable or confirmed order.
 */
export type ShippingQuote = {
  orderDraftId: number
  status: 'pending_payment'
  currency: 'NOK'
  subtotalOre: number
  shippingOre: number
  totalOre: number
  expiresAt: number
  shippingCountry: 'NO'
  quoteOnly: true
  paid: false
  orderConfirmed: false
  paymentAvailable: false
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function validOre(value: unknown, max: number): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= max
}

/** A quote is valid only for the exact draft and subtotal the server reported. */
export function parseShippingQuote(
  response: unknown,
  expectedDraftId: number,
  expectedSubtotalOre: number,
): ShippingQuote {
  if (!isRecord(response) ||
      !Number.isSafeInteger(expectedDraftId) || expectedDraftId < 1 ||
      !Number.isSafeInteger(expectedSubtotalOre) || expectedSubtotalOre < 1 ||
      response.orderDraftId !== expectedDraftId ||
      response.status !== 'pending_payment' || response.currency !== 'NOK' ||
      response.shippingCountry !== 'NO' || response.quoteOnly !== true ||
      response.paid !== false || response.orderConfirmed !== false ||
      response.paymentAvailable !== false ||
      response.subtotalOre !== expectedSubtotalOre ||
      !validOre(response.subtotalOre, 100000000) ||
      !validOre(response.shippingOre, 10000000) ||
      !validOre(response.totalOre, 110000000) ||
      response.totalOre !== response.subtotalOre + response.shippingOre ||
      typeof response.expiresAt !== 'number' ||
      !Number.isSafeInteger(response.expiresAt) || response.expiresAt <= 0) {
    throw new Error('Serverens frakttilbud er ugyldig eller gjelder ikke dette ordreutkastet.')
  }
  return {
    orderDraftId: expectedDraftId,
    status: 'pending_payment',
    currency: 'NOK',
    subtotalOre: response.subtotalOre,
    shippingOre: response.shippingOre,
    totalOre: response.totalOre,
    expiresAt: response.expiresAt,
    shippingCountry: 'NO',
    quoteOnly: true,
    paid: false,
    orderConfirmed: false,
    paymentAvailable: false,
  }
}

export async function fetchShippingQuote(
  email: string,
  requestKey: string,
  postalCode: string,
  draftId: number,
  subtotalOre: number,
  signal?: AbortSignal,
): Promise<ShippingQuote> {
  // Same fail-closed gate as unpaid draft creation/cancellation. This does
  // not enable checkout in Vercel preview or any production-mode build.
  if (!import.meta.env.DEV || import.meta.env.VITE_NISRIN_ENABLE_DRAFT_CHECKOUT !== 'true') {
    throw new Error('Frakttest er ikke aktivert.')
  }
  const normalizedEmail = email.trim().toLowerCase()
  if (normalizedEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey) ||
      !/^[0-9]{4}$/.test(postalCode)) {
    throw new Error('Oppgi en gyldig norsk postkode og e-postadresse.')
  }

  const apiBase = (import.meta.env.VITE_NISRIN_API_URL || 'https://api.nisrin.no').replace(/\/+$/, '')
  const response = await fetch(apiBase + '/shipping/quote', {
    method: 'POST',
    credentials: 'omit',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      email: normalizedEmail,
      requestKey,
      country: 'NO',
      postalCode,
    }),
    signal,
  })
  if (!response.ok) {
    if (response.status === 503) {
      throw new Error('Fraktpris er ikke godkjent eller konfigurert på serveren.')
    }
    if (response.status === 409) {
      throw new Error('Ordreutkastet er ikke lenger aktivt. Oppdater produktkatalogen.')
    }
    throw new Error('Serveren kunne ikke gi et verifisert frakttilbud.')
  }
  return parseShippingQuote(await response.json(), draftId, subtotalOre)
}
