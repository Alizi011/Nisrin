import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const endpoints = [
  'nisrinCheckoutDraft.ts',
  'nisrinShippingQuote.ts',
  'nisrinUnpaidDelivery.ts',
]

test('every order-related browser request carries existing customer session', () => {
  for (const path of endpoints) {
    const source = readFileSync(new URL('../src/services/' + path, import.meta.url), 'utf8')
    assert.ok(source.includes("credentials: 'include'"), path + ' omits customer cookies')
    assert.ok(!source.includes("credentials: 'omit'"), path + ' explicitly omits customer cookies')
    assert.ok(source.includes('import.meta.env.DEV'), path + ' lost development-only guard')
    assert.ok(source.includes("VITE_NISRIN_ENABLE_DRAFT_CHECKOUT"), path + ' lost checkout feature gate')
  }
})

test('product browsing remains public, unauthenticated and read-only', () => {
  const source = readFileSync(new URL('../src/services/nisrinCatalog.ts', import.meta.url), 'utf8')
  assert.match(source, /credentials: 'omit'/)
  assert.match(source, /method: 'GET'/)
})
