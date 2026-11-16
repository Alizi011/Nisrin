import test from 'node:test'
import assert from 'node:assert/strict'
import { parseShippingQuote } from '../src/services/nisrinShippingQuote.ts'

const serverResponse = {
  orderDraftId: 42,
  status: 'pending_payment',
  currency: 'NOK',
  subtotalOre: 34900,
  shippingOre: 5900,
  totalOre: 40800,
  expiresAt: 1800000900,
  shippingCountry: 'NO',
  quoteOnly: true,
  paid: false,
  orderConfirmed: false,
  paymentAvailable: false,
}

test('accepts only server total for the exact unpaid draft', () => {
  assert.deepEqual(parseShippingQuote(serverResponse, 42, 34900), serverResponse)
  assert.throws(() => parseShippingQuote(serverResponse, 43, 34900))
  assert.throws(() => parseShippingQuote(serverResponse, 42, 100))
})

test('accepts explicitly free shipping only when server returns it', () => {
  assert.deepEqual(
    parseShippingQuote({ ...serverResponse, shippingOre: 0, totalOre: 34900 }, 42, 34900),
    { ...serverResponse, shippingOre: 0, totalOre: 34900 },
  )
})

test('rejects false paid, confirmed or non-quote states', () => {
  for (const changed of [
    { paid: true }, { orderConfirmed: true }, { paymentAvailable: true },
    { quoteOnly: false }, { status: 'paid' }, { currency: 'USD' },
    { shippingCountry: 'SE' },
  ]) {
    assert.throws(() => parseShippingQuote({ ...serverResponse, ...changed }, 42, 34900))
  }
})

test('rejects inconsistent totals, negative prices and malformed timestamps', () => {
  for (const changed of [
    { totalOre: 0 }, { totalOre: 40000 }, { shippingOre: -1 },
    { shippingOre: 59.5 }, { shippingOre: '5900' }, { subtotalOre: 0 },
    { expiresAt: '1800000900' }, { orderDraftId: '42' },
    { totalOre: 110000001 },
  ]) {
    assert.throws(() => parseShippingQuote({ ...serverResponse, ...changed }, 42, 34900))
  }
})
