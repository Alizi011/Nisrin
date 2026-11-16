/**
 * Strict decoder for NISRIN's admin-only, read-only UNPAID order drafts.
 * No fallback to demo orders; unknown status or payment claims fail closed.
 */
export type NisrinOrderDraftLine = {
  sku: string
  quantity: number
  unitPriceOre: number
  lineTotalOre: number
}

export type NisrinOrderDraft = {
  orderDraftId: number
  contactEmail: string
  status: 'pending_payment' | 'expired'
  subtotalOre: number
  currency: 'NOK'
  expiresAt: number
  items: NisrinOrderDraftLine[]
  paid: false
  orderConfirmed: false
  paymentAvailable: false
}

export type NisrinOrderDraftPage = {
  drafts: NisrinOrderDraft[]
  nextBefore: number | null
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function positiveInt(value: unknown, max = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value <= max
}

export function parseAdminOrderDrafts(payload: unknown): NisrinOrderDraftPage {
  if (!isObject(payload) || !Array.isArray(payload.drafts) ||
      payload.drafts.length > 50 ||
      (payload.nextBefore !== null && !positiveInt(payload.nextBefore))) {
    throw new Error('Ugyldig liste over ubetalte ordreutkast fra NISRIN-API.')
  }

  let previousId = Number.MAX_SAFE_INTEGER
  const drafts: NisrinOrderDraft[] = payload.drafts.map((entry: unknown) => {
    if (!isObject(entry) || !positiveInt(entry.orderDraftId) ||
        entry.orderDraftId >= previousId ||
        typeof entry.contactEmail !== 'string' || entry.contactEmail.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.contactEmail) ||
        (entry.status !== 'pending_payment' && entry.status !== 'expired') ||
        entry.currency !== 'NOK' || !positiveInt(entry.subtotalOre, 100000000) ||
        !positiveInt(entry.expiresAt, 9999999999) ||
        entry.paid !== false || entry.orderConfirmed !== false ||
        entry.paymentAvailable !== false ||
        !Array.isArray(entry.items) || entry.items.length < 1 || entry.items.length > 20) {
      throw new Error('Ordreutkastet har ugyldig serverstatus eller mangler prisdata.')
    }

    previousId = entry.orderDraftId
    let sum = 0
    const skus = new Set<string>()
    const items: NisrinOrderDraftLine[] = entry.items.map((line: unknown) => {
      if (!isObject(line) || typeof line.sku !== 'string' ||
          !/^[A-Z0-9][A-Z0-9._-]{0,79}$/.test(line.sku) ||
          skus.has(line.sku) ||
          !positiveInt(line.quantity, 10) ||
          !positiveInt(line.unitPriceOre, 100000000) ||
          !positiveInt(line.lineTotalOre, 100000000) ||
          line.lineTotalOre !== line.quantity * line.unitPriceOre) {
        throw new Error('Ordreutkastet inneholder ugyldige serverprislinjer.')
      }
      skus.add(line.sku)
      sum += line.lineTotalOre
      return {
        sku: line.sku,
        quantity: line.quantity,
        unitPriceOre: line.unitPriceOre,
        lineTotalOre: line.lineTotalOre,
      }
    })
    if (sum !== entry.subtotalOre) {
      throw new Error('Ordreutkastets subtotal stemmer ikke med serverprisene.')
    }
    return {
      orderDraftId: entry.orderDraftId,
      contactEmail: entry.contactEmail,
      status: entry.status,
      currency: 'NOK',
      subtotalOre: entry.subtotalOre,
      expiresAt: entry.expiresAt,
      items,
      paid: false,
      orderConfirmed: false,
      paymentAvailable: false,
    }
  })

  if (payload.nextBefore !== null &&
      (drafts.length !== 50 || payload.nextBefore !== previousId)) {
    throw new Error('Ugyldig paginering av ordreutkast fra serveren.')
  }
  return { drafts, nextBefore: payload.nextBefore as number | null }
}
