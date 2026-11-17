import test from 'node:test'
import assert from 'node:assert/strict'
import {
  validateUnpaidDelivery, parseSavedUnpaidDelivery,
} from '../src/services/nisrinUnpaidDelivery.ts'

const address = {
  name: 'Testkunde',
  addressLine1: 'Eksempelgata 1',
  addressLine2: '',
  city: 'Lillestrøm',
  postalCode: '2000',
}
const server = {
  orderDraftId: 42,
  status: 'pending_payment',
  currency: 'NOK',
  subtotalOre: 34900,
  shippingOre: 5900,
  totalOre: 40800,
  expiresAt: 1800000900,
  deliverySaved: true,
  paid: false,
  orderConfirmed: false,
  paymentAvailable: false,
}

test('normalizes valid Norway-only delivery without changing postal code', () => {
  assert.deepEqual(validateUnpaidDelivery({
    ...address, name: ' Testkunde ', addressLine1: ' Eksempelgata 1 ',
  }), address)
  assert.equal(validateUnpaidDelivery({ ...address, postalCode: '0123' }).postalCode, '0123')
})

test('rejects blank names, invalid zip, control chars, and UTF-8 byte overruns', () => {
  for (const changed of [
    { name: ' ' }, { postalCode: '200' }, { postalCode: '12345' },
    { postalCode: 'abcd' }, { postalCode: '2000 ' },
    { city: ' ' }, { addressLine1: 'Example\nStreet' },
    { name: 'Æ'.repeat(61) }, { addressLine2: 'x'.repeat(161) },
    { city: 'æ'.repeat(51) },
  ]) {
    assert.throws(() => validateUnpaidDelivery({ ...address, ...changed }))
  }
})

test('accepts only a server confirmed saved UNPAID delivery with exact draft and total', () => {
  assert.deepEqual(parseSavedUnpaidDelivery(server, 42, 34900, 1800000900), server)
  assert.throws(() => parseSavedUnpaidDelivery(server, 41, 34900, 1800000900))
  assert.throws(() => parseSavedUnpaidDelivery(server, 42, 33900, 1800000900))
  assert.throws(() => parseSavedUnpaidDelivery(server, 42, 34900, 1800000950))
})

test('never misinterpret paid, confirmed, payment-enabled or unsaved response as success', () => {
  for (const changed of [
    { paid: true }, { orderConfirmed: true }, { paymentAvailable: true },
    { deliverySaved: false }, { status: 'paid' }, { currency: 'USD' },
    { orderDraftId: '42' }, { expiresAt: '1800000900' },
    { totalOre: '40800' }, { shippingOre: -1 }, { shippingOre: 5900.5 },
    { totalOre: 40000 }, { subtotalOre: 1000 },
  ]) {
    assert.throws(() => parseSavedUnpaidDelivery({ ...server, ...changed }, 42, 34900, 1800000900))
  }
})

test('accepts a server-confirmed free shipping delivery only when totals agree', () => {
  const noShipping = { ...server, shippingOre: 0, totalOre: 34900 }
  assert.deepEqual(parseSavedUnpaidDelivery(noShipping, 42, 34900, 1800000900), noShipping)
})
