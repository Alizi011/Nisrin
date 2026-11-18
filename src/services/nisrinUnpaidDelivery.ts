/** 
 * Development-only persistence of delivery details against an existing
 * unpaid inventory reservation. No order acceptance or payment is possible.
 */
export type DeliveryDetails = {
  name: string
  addressLine1: string
  addressLine2: string
  city: string
  postalCode: string
}

export type SavedUnpaidDelivery = {
  orderDraftId: number
  status: 'pending_payment'
  currency: 'NOK'
  subtotalOre: number
  shippingOre: number
  totalOre: number
  expiresAt: number
  deliverySaved: true
  paid: false
  orderConfirmed: false
  paymentAvailable: false
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const requestKeyPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function boundedText(value: string, minBytes: number, maxBytes: number): boolean {
  if (typeof value !== 'string' || value.length > maxBytes) return false
  for (const character of value) {
    const code = character.codePointAt(0)
    if (code !== undefined && (code < 32 || code === 127)) return false
  }
  const size = new TextEncoder().encode(value.trim()).length
  return size >= minBytes && size <= maxBytes
}

/** Align client input limits with PHP's byte-length and key validation. */
export function validateUnpaidDelivery(
  details: DeliveryDetails,
): DeliveryDetails {
  if (!/^[0-9]{4}$/.test(details.postalCode) ||
      !boundedText(details.name, 1, 120) ||
      !boundedText(details.addressLine1, 1, 160) ||
      !boundedText(details.addressLine2, 0, 160) ||
      !boundedText(details.city, 1, 100)) {
    throw new Error('Kontroller navn, gateadresse, postnummer og poststed.')
  }
  return {
    name: details.name.trim(),
    addressLine1: details.addressLine1.trim(),
    addressLine2: details.addressLine2.trim(),
    city: details.city.trim(),
    postalCode: details.postalCode,
  }
}

/** Parse ONLY the backend's unpaid-delivery acknowledgment. */
export function parseSavedUnpaidDelivery(
  response: unknown,
  expectedDraftId: number,
  expectedSubtotalOre: number,
  expectedExpiresAt: number,
): SavedUnpaidDelivery {
  if (!isRecord(response) ||
      !Number.isSafeInteger(expectedDraftId) || expectedDraftId < 1 ||
      !Number.isSafeInteger(expectedSubtotalOre) || expectedSubtotalOre < 1 ||
      !Number.isSafeInteger(expectedExpiresAt) || expectedExpiresAt <= 0 ||
      response.orderDraftId !== expectedDraftId ||
      response.status !== 'pending_payment' || response.currency !== 'NOK' ||
      response.subtotalOre !== expectedSubtotalOre ||
      response.expiresAt !== expectedExpiresAt ||
      response.deliverySaved !== true ||
      response.paid !== false || response.orderConfirmed !== false ||
      response.paymentAvailable !== false ||
      typeof response.shippingOre !== 'number' ||
      !Number.isSafeInteger(response.shippingOre) || response.shippingOre < 0 ||
      response.shippingOre > 10000000 ||
      typeof response.totalOre !== 'number' ||
      !Number.isSafeInteger(response.totalOre) ||
      response.totalOre !== expectedSubtotalOre + response.shippingOre ||
      response.totalOre > 110000000) {
    throw new Error('Serveren bekreftet ikke lagring av leveringsopplysningene.')
  }
  return {
    orderDraftId: expectedDraftId,
    status: 'pending_payment',
    currency: 'NOK',
    subtotalOre: expectedSubtotalOre,
    shippingOre: response.shippingOre,
    totalOre: response.totalOre,
    expiresAt: expectedExpiresAt,
    deliverySaved: true,
    paid: false,
    orderConfirmed: false,
    paymentAvailable: false,
  }
}

export async function saveUnpaidDelivery(
  email: string,
  requestKey: string,
  details: DeliveryDetails,
  expectedDraftId: number,
  expectedSubtotalOre: number,
  expectedExpiresAt: number,
  signal?: AbortSignal,
): Promise<SavedUnpaidDelivery> {
  if (!import.meta.env.DEV ||
      import.meta.env.VITE_NISRIN_ENABLE_DRAFT_CHECKOUT !== 'true') {
    throw new Error('Leveringsskjemaet er ikke aktivert.')
  }
  const normalizedEmail = email.trim().toLowerCase()
  if (normalizedEmail.length > 254 || !emailPattern.test(normalizedEmail) ||
      !requestKeyPattern.test(requestKey)) {
    throw new Error('Ugyldig ubetalt testordre.')
  }
  const normalized = validateUnpaidDelivery(details)
  const apiBase = (import.meta.env.VITE_NISRIN_API_URL || 'https://api.nisrin.no').replace(/\/+$/, '')
  const response = await fetch(apiBase + '/order-drafts/delivery', {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      requestKey,
      email: normalizedEmail,
      country: 'NO',
      ...normalized,
    }),
    signal,
  })
  if (!response.ok) {
    if (response.status === 503) {
      throw new Error('Leveringstjenesten er ikke konfigurert eller tilgjengelig.')
    }
    if (response.status === 409) {
      throw new Error('Ordreutkastet er utløpt eller ikke lenger aktivt.')
    }
    throw new Error('Leveringsopplysningene kunne ikke lagres.')
  }
  return parseSavedUnpaidDelivery(
    await response.json(), expectedDraftId, expectedSubtotalOre, expectedExpiresAt,
  )
}
