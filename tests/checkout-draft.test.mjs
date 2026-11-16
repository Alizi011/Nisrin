import test from 'node:test'
import assert from 'node:assert/strict'
import { checkoutLines, parseUnpaidDraft, parseUnpaidCancellation } from '../src/services/nisrinCheckoutDraft.ts'

const products = [{
  id: 'db-4',
  variants: [{ label: '30 ml', sku: 'ARGAN-30', price: 349, availableQty: 4 }],
}]

test('uses real SKU and quantity, never browser prices', () => {
  assert.deepEqual(checkoutLines([{ productId: 'db-4', variantLabel: '30 ml', qty: 2 }], products),
    [{ sku: 'ARGAN-30', quantity: 2 }])
})

test('rejects missing, duplicate, excessive or out-of-stock SKU', () => {
  assert.throws(() => checkoutLines([{ productId: 'missing', variantLabel: '30 ml', qty: 1 }], products))
  assert.throws(() => checkoutLines([{ productId: 'db-4', variantLabel: '30 ml', qty: 5 }], products))
  assert.throws(() => checkoutLines([{ productId: 'db-4', variantLabel: '30 ml', qty: 11 }], products))
  assert.throws(() => checkoutLines([
    { productId: 'db-4', variantLabel: '30 ml', qty: 1 },
    { productId: 'db-4', variantLabel: '30 ml', qty: 1 },
  ], products))
})

const unpaid = {
  orderDraftId: 42, status: 'pending_payment', subtotalOre: 69800,
  currency: 'NOK', expiresAt: 1795000000,
  paid: false, orderConfirmed: false, paymentAvailable: false,
}

test('accepts server-confirmed unpaid reservation only', () => {
  assert.deepEqual(parseUnpaidDraft(unpaid), unpaid)
})

test('rejects any paid, confirmed, payment-enabled or invalid quote response', () => {
  for (const mutation of [
    { paid: true }, { orderConfirmed: true }, { paymentAvailable: true },
    { status: 'paid' }, { currency: 'USD' }, { subtotalOre: '69800' },
    { expiresAt: null }, { orderDraftId: -1 },
  ]) {
    assert.throws(() => parseUnpaidDraft({ ...unpaid, ...mutation }))
  }
})


test('accepts only explicit backend cancellation of an unpaid draft', () => {
  assert.deepEqual(
    parseUnpaidCancellation({ cancelled: true, paid: false, orderConfirmed: false }),
    { cancelled: true, paid: false, orderConfirmed: false },
  )
})

test('never treats payment or an incomplete cancellation response as successful', () => {
  for (const response of [
    null, {}, { cancelled: false, paid: false, orderConfirmed: false },
    { cancelled: true, paid: true, orderConfirmed: false },
    { cancelled: true, paid: false, orderConfirmed: true },
    { cancelled: 'true', paid: false, orderConfirmed: false },
  ]) {
    assert.throws(() => parseUnpaidCancellation(response))
  }
})
