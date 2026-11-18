import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { isCustomer, parseCustomerRegistration } from '../src/services/customerAccountValidation.ts'

test('customer role has no staff privileges', () => {
  assert.equal(isCustomer({ id: 1, name: 'Buyer', email: 'b@example.org', roles: ['customer'] }), true)
  assert.equal(isCustomer({ id: 2, name: 'Staff', email: 's@example.org', roles: ['seller'] }), false)
  assert.equal(isCustomer({ id: 3, name: 'Mixed', email: 'm@example.org', roles: ['admin', 'customer'] }), false)
  assert.equal(isCustomer(null), false)
})

const created = {
  created: true, emailVerified: false, checkoutAvailable: false,
  user: { id: 5, name: 'Customer', email: 'c@example.org', roles: ['customer'] },
}
test('registration requires explicit server account result and no checkout', () => {
  assert.deepEqual(parseCustomerRegistration(created), {
    created: true, emailVerified: false, checkoutAvailable: false,
  })
  for (const bad of [
    { ...created, checkoutAvailable: true },
    { ...created, emailVerified: true },
    { ...created, created: false },
    { ...created, user: { ...created.user, roles: ['admin'] } },
    { ...created, user: { ...created.user, roles: ['admin', 'customer'] } },
  ]) {
    assert.throws(() => parseCustomerRegistration(bad))
  }
})

test('customer and staff account routes stay separate', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
  const page = readFileSync(new URL('../src/pages/CustomerAccount.tsx', import.meta.url), 'utf8')
  const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'))
  assert.match(app, /pathname === '\/konto'/)
  assert.match(app, /pathname === '\/admin'/)
  assert.match(page, /Gå til ansattinnlogging/)
  assert.match(page, /Alle kan utforske NISRIN uten konto/)
  assert.ok(vercel.rewrites.some((r) => r.source === '/konto'))
  assert.ok(vercel.rewrites.some((r) => r.source === '/konto/:path*'))
})
