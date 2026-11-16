import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseAdminOrderDrafts } from '../src/services/nisrinOrderDrafts.ts'

const item = { sku: 'ARG-30', quantity: 2, unitPriceOre: 14900, lineTotalOre: 29800 }
const draft = {
  orderDraftId: 52,
  contactEmail: 'customer@example.org',
  status: 'pending_payment',
  subtotalOre: 29800,
  currency: 'NOK',
  expiresAt: 1800000900,
  items: [item],
  paid: false,
  orderConfirmed: false,
  paymentAvailable: false,
}

test('admin list parses server priced, explicitly unpaid order drafts', () => {
  const result = parseAdminOrderDrafts({ drafts: [draft], nextBefore: null })
  assert.equal(result.drafts[0].orderDraftId, 52)
  assert.equal(result.drafts[0].subtotalOre, 29800)
  assert.equal(result.drafts[0].items[0].unitPriceOre, 14900)
  assert.equal(result.drafts[0].paid, false)
  assert.equal(result.drafts[0].orderConfirmed, false)
  assert.equal(result.drafts[0].paymentAvailable, false)
})

test('empty list stays empty; no sample sales or fake receipts', () => {
  assert.deepEqual(parseAdminOrderDrafts({ drafts: [], nextBefore: null }), {
    drafts: [], nextBefore: null,
  })
})

test('expired drafts remain unpaid, never a completed order', () => {
  const result = parseAdminOrderDrafts({
    drafts: [{ ...draft, status: 'expired' }], nextBefore: null,
  })
  assert.equal(result.drafts[0].status, 'expired')
  assert.equal(result.drafts[0].paid, false)
})

test('paid/confirmed/available claims and unexpected statuses fail closed', () => {
  for (const changed of [
    { paid: true }, { orderConfirmed: true }, { paymentAvailable: true },
    { status: 'paid' }, { status: 'confirmed' }, { status: 'reserving' },
    { currency: 'USD' }, { expiresAt: 'tomorrow' }, { contactEmail: null },
  ]) {
    assert.throws(() => parseAdminOrderDrafts({
      drafts: [{ ...draft, ...changed }], nextBefore: null,
    }))
  }
})

test('tampered quantities, prices, duplicates and subtotal fail closed', () => {
  for (const changed of [
    { subtotalOre: 1 },
    { items: [{ ...item, lineTotalOre: 1 }] },
    { items: [{ ...item, quantity: 11 }] },
    { items: [{ ...item, unitPriceOre: 0 }] },
    { items: [item, item] },
    { items: [] },
  ]) {
    assert.throws(() => parseAdminOrderDrafts({
      drafts: [{ ...draft, ...changed }], nextBefore: null,
    }))
  }
})

test('pagination is bounded, sorted, and cursor matches last returned ID', () => {
  const drafts = Array.from({ length: 50 }, (_, i) => ({
    ...draft, orderDraftId: 100 - i,
  }))
  const page = parseAdminOrderDrafts({ drafts, nextBefore: 51 })
  assert.equal(page.nextBefore, 51)
  assert.equal(page.drafts.length, 50)
  for (const invalid of [
    { drafts, nextBefore: 50 },
    { drafts: [draft], nextBefore: 52 },
    { drafts: [draft, draft], nextBefore: null },
    { drafts: [...drafts, draft], nextBefore: null },
    { drafts: [], nextBefore: 1 },
    { drafts: [draft] },
  ]) {
    assert.throws(() => parseAdminOrderDrafts(invalid))
  }
})
